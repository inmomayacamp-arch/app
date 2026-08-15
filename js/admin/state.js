// Estado del panel de administración: solo datos reales (Supabase), sin
// overlays de prueba. El registro de auditoría vive en localStorage porque
// hoy el acceso admin es una sola contraseña compartida, sin backend propio
// para eso todavía.
(function () {
  "use strict";

  var utils = window.App.utils;

  var AUDIT_KEY = "inmomap:admin:audit";

  function readJSON(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* no-op */ }
  }

  var audit = readJSON(AUDIT_KEY, []);

  // Registro mínimo de inicios de sesión, solo en este navegador (hoy el
  // acceso admin es una sola contraseña compartida, sin identidad por
  // persona, así que no hay panel de auditoría todavía — esto solo evita
  // perder el dato si se agrega uno más adelante).
  function logAction(action, target) {
    audit = [{ id: utils.uid("log"), actor: "Admin", action: action, target: target, timestamp: new Date().toISOString() }].concat(audit).slice(0, 200);
    writeJSON(AUDIT_KEY, audit);
  }

  // --- Autenticación (Supabase Auth real, requiere perfil con role = "admin") ---
  // Además de la contraseña, si la cuenta tiene activada la verificación en
  // dos pasos (TOTP) hay que completar ese segundo paso antes de dar acceso
  // real: mfaSatisfied se queda en false hasta que challengeAndVerify()
  // confirma el código, así que isAuthed() (usada por el router para
  // bloquear /admin/*) no deja pasar con solo la contraseña.
  var mfaSatisfied = false;

  function isAuthed() {
    var agent = window.App.state.agents.current();
    return !!agent && agent.role === "admin" && mfaSatisfied;
  }

  async function mfaLevel() {
    if (!window.App.supabase) return { currentLevel: null, nextLevel: null };
    var result = await window.App.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return result.data || { currentLevel: null, nextLevel: null };
  }

  async function mfaListFactors() {
    var result = await window.App.supabase.auth.mfa.listFactors();
    if (result.error) throw result.error;
    return (result.data && result.data.totp) || [];
  }

  async function mfaEnroll() {
    var result = await window.App.supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "InmoMaps Admin" });
    if (result.error) throw result.error;
    return result.data;
  }

  async function mfaConfirm(factorId, code) {
    var result = await window.App.supabase.auth.mfa.challengeAndVerify({ factorId: factorId, code: code });
    if (result.error) throw result.error;
    mfaSatisfied = true;
    return true;
  }

  async function mfaUnenroll(factorId) {
    var result = await window.App.supabase.auth.mfa.unenroll({ factorId: factorId });
    if (result.error) throw result.error;
    return true;
  }

  // Al recargar la página, Supabase restaura la sesión guardada tal cual
  // quedó (incluyendo su nivel aal). Si ya se había completado el segundo
  // paso en este navegador, sigue contando como satisfecho; si no, se cierra
  // la sesión para forzar contraseña + código de nuevo la próxima vez que
  // entren a /admin (en vez de dejar una sesión a medias).
  async function checkMfaOnBoot() {
    var agent = window.App.state.agents.current();
    if (!agent || agent.role !== "admin") return;
    try {
      var level = await mfaLevel();
      if (level.nextLevel === "aal2" && level.currentLevel !== "aal2") {
        await window.App.state.agents.logout();
        return;
      }
      mfaSatisfied = true;
    } catch (e) { /* si falla la verificación, se queda sin autenticar */ }
  }

  async function login(email, password) {
    mfaSatisfied = false;
    var agent = await window.App.state.agents.login(email, password);
    if (!agent || agent.role !== "admin") {
      if (agent) await window.App.state.agents.logout(); // no es admin: no dejar sesión de agente a medias
      return { ok: false };
    }
    var level = await mfaLevel();
    if (level.nextLevel === "aal2" && level.currentLevel !== "aal2") {
      var factors = await mfaListFactors();
      var verified = factors.filter(function (f) { return f.status === "verified"; })[0];
      if (verified) return { ok: true, needsMfa: true, factorId: verified.id };
    }
    mfaSatisfied = true;
    await window.App.state.leads.bootstrap();
    await window.App.state.providers.bootstrap();
    logAction("Inicio de sesión", email);
    return { ok: true, needsMfa: false };
  }

  async function completeMfaLogin(factorId, code, email) {
    await mfaConfirm(factorId, code);
    await window.App.state.leads.bootstrap();
    await window.App.state.providers.bootstrap();
    logAction("Inicio de sesión (verificación en dos pasos)", email);
  }

  async function logout() { mfaSatisfied = false; await window.App.state.agents.logout(); }

  // --- Agentes y propietarios ---
  // "role" en Supabase solo distingue "agent" (cualquier cuenta con perfil)
  // de "admin"; quién es asesor y quién es propietario particular se guarda
  // en "plan" ("asesor" vs "propietario"), asignado al registrarse. Se
  // excluyen las cuentas admin/staff (su "plan" es un valor por defecto del
  // registro, no un plan real que deba listarse).
  function allAgents() {
    return window.App.data.getAllAgents().filter(function (a) { return a.plan === 'asesor' && a.role !== 'admin'; });
  }
  function allOwners() {
    return window.App.data.getAllAgents().filter(function (a) { return a.plan === 'propietario' && a.role !== 'admin'; });
  }

  // --- Propiedades (tabla real "properties") ---
  function allProperties() {
    return window.App.state.properties.all();
  }

  // --- Pagos reales (tabla "payments"; el admin puede leerlos todos) ---
  async function allPayments() {
    var result = await window.App.supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(200);
    return result.data || [];
  }

  // --- Casos raros: se cobró pero la cuenta no se pudo crear ---
  async function unresolvedSignupIssues() {
    var result = await window.App.supabase.from('signup_issues').select('*').eq('resolved', false).order('created_at', { ascending: false });
    return result.data || [];
  }
  async function resolveSignupIssue(id) {
    var result = await window.App.supabase.from('signup_issues').update({ resolved: true }).eq('id', id);
    if (result.error) throw result.error;
  }
  // Vuelve a intentar crear la cuenta y conectarla con la suscripción real
  // que Stripe ya cobró (no una cuenta de cortesía aparte).
  async function retrySignupIssue(issueId) {
    var sessionResult = await window.App.supabase.auth.getSession();
    var session = sessionResult && sessionResult.data && sessionResult.data.session;
    if (!session) throw new Error("Debes iniciar sesión");
    var url = window.APP_CONFIG.SUPABASE_URL + "/functions/v1/admin-retry-signup";
    var response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session.access_token },
      body: JSON.stringify({ issueId: issueId })
    });
    var data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo reintentar el registro");
    return data;
  }

  // --- Crear cuenta activa sin pasar por Stripe (cortesía, uso propio) ---
  async function createFreeAccount(fields) {
    var sessionResult = await window.App.supabase.auth.getSession();
    var session = sessionResult && sessionResult.data && sessionResult.data.session;
    if (!session) throw new Error("Debes iniciar sesión");
    var url = window.APP_CONFIG.SUPABASE_URL + "/functions/v1/admin-create-account";
    var response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session.access_token },
      body: JSON.stringify(fields)
    });
    var data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo crear la cuenta");
    logAction("Cuenta creada sin pago (" + fields.plan + ")", fields.email);
    return data;
  }

  // --- Errores de JavaScript reportados por el cliente (tabla client_errors) ---
  async function allClientErrors() {
    var result = await window.App.supabase.from('client_errors').select('*').order('last_seen', { ascending: false }).limit(200);
    return result.data || [];
  }
  async function deleteClientError(id) {
    var result = await window.App.supabase.from('client_errors').delete().eq('id', id);
    if (result.error) throw result.error;
  }

  // --- KPIs del dashboard (solo con datos reales) ---
  function computeKPIs() {
    var agents = allAgents();
    var owners = allOwners();
    var properties = allProperties();

    return {
      totalAgents: agents.length,
      totalOwners: owners.length,
      totalProperties: properties.length,
      forSale: properties.filter(function (p) { return p.operation === 'venta'; }).length,
      forRent: properties.filter(function (p) { return p.operation === 'renta'; }).length,
      featured: properties.filter(function (p) { return p.featured; }).length
    };
  }

  window.App.admin = window.App.admin || {};
  window.App.admin.state = {
    auth: { isAuthed: isAuthed, login: login, logout: logout, completeMfaLogin: completeMfaLogin, checkMfaOnBoot: checkMfaOnBoot },
    mfa: { listFactors: mfaListFactors, enroll: mfaEnroll, confirm: mfaConfirm, unenroll: mfaUnenroll, level: mfaLevel },
    agents: { all: allAgents, createFree: createFreeAccount },
    owners: { all: allOwners },
    properties: { all: allProperties },
    payments: { all: allPayments },
    signupIssues: { unresolved: unresolvedSignupIssues, resolve: resolveSignupIssue, retry: retrySignupIssue },
    clientErrors: { all: allClientErrors, remove: deleteClientError },
    kpis: computeKPIs
  };
})();
