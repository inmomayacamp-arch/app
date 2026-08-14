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
  function isAuthed() {
    var agent = window.App.state.agents.current();
    return !!agent && agent.role === "admin";
  }
  async function login(email, password) {
    var agent = await window.App.state.agents.login(email, password);
    if (agent && agent.role === "admin") {
      await window.App.state.leads.bootstrap();
      await window.App.state.providers.bootstrap();
      logAction("Inicio de sesión", email);
      return true;
    }
    if (agent) await window.App.state.agents.logout(); // no es admin: no dejar sesión de agente a medias
    return false;
  }
  async function logout() { await window.App.state.agents.logout(); }

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
    auth: { isAuthed: isAuthed, login: login, logout: logout },
    agents: { all: allAgents },
    owners: { all: allOwners },
    properties: { all: allProperties },
    kpis: computeKPIs
  };
})();
