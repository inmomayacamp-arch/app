// Estado mutable del panel de administración: todo persistido en localStorage
// para simular un backend real sin necesitar servidor.
(function () {
  "use strict";

  var utils = window.App.utils;
  var d = window.App.admin.data;

  var KEYS = {
    userOverrides: "inmomap:admin:userOverrides",
    agentOverrides: "inmomap:admin:agentOverrides",
    pendingAgents: "inmomap:admin:pendingAgents",
    pendingProperties: "inmomap:admin:pendingProperties",
    propertyMod: "inmomap:admin:propertyMod",
    plans: "inmomap:admin:plans",
    coupons: "inmomap:admin:coupons",
    cities: "inmomap:admin:cities",
    reports: "inmomap:admin:reports",
    ads: "inmomap:admin:ads",
    notifications: "inmomap:admin:notifications",
    settings: "inmomap:admin:settings",
    audit: "inmomap:admin:audit"
  };

  function readJSON(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* no-op */ }
  }

  var userOverrides = readJSON(KEYS.userOverrides, {});
  var agentOverrides = readJSON(KEYS.agentOverrides, {});
  var pendingAgents = readJSON(KEYS.pendingAgents, d.PENDING_AGENTS);
  var pendingProperties = readJSON(KEYS.pendingProperties, d.PENDING_PROPERTIES);
  var propertyMod = readJSON(KEYS.propertyMod, {});
  var plans = readJSON(KEYS.plans, d.PLANS);
  var coupons = readJSON(KEYS.coupons, d.COUPONS);
  var cities = readJSON(KEYS.cities, d.CITIES);
  var reports = readJSON(KEYS.reports, d.REPORTS);
  var ads = readJSON(KEYS.ads, d.ADS);
  var notifications = readJSON(KEYS.notifications, d.NOTIFICATIONS_LOG);
  var settings = readJSON(KEYS.settings, d.DEFAULT_SETTINGS);
  var audit = readJSON(KEYS.audit, []);

  // Hoy el acceso al panel admin es una sola contraseña compartida (sin
  // identidad por persona), así que no hay un "quién" real que registrar
  // todavía — "Admin" es honesto; el dominio viejo ya no existe.
  function logAction(action, target) {
    audit = [{ id: utils.uid("log"), actor: "Admin", action: action, target: target, timestamp: new Date().toISOString() }].concat(audit).slice(0, 200);
    writeJSON(KEYS.audit, audit);
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
      logAction("Inicio de sesión", email);
      return true;
    }
    if (agent) await window.App.state.agents.logout(); // no es admin: no dejar sesión de agente a medias
    return false;
  }
  async function logout() { await window.App.state.agents.logout(); }

  // --- Usuarios ---
  function allUsers() {
    return d.USERS.map(function (u) { return Object.assign({}, u, userOverrides[u.id] || {}); })
      .filter(function (u) { return !u.deleted; });
  }
  function setUserStatus(id, status) {
    userOverrides[id] = Object.assign({}, userOverrides[id], { status: status });
    writeJSON(KEYS.userOverrides, userOverrides);
    logAction("Cambio de estado de usuario a " + status, id);
  }
  function updateUser(id, fields) {
    userOverrides[id] = Object.assign({}, userOverrides[id], fields);
    writeJSON(KEYS.userOverrides, userOverrides);
    logAction("Información de usuario editada", id);
  }
  function removeUser(id) {
    userOverrides[id] = Object.assign({}, userOverrides[id], { deleted: true });
    writeJSON(KEYS.userOverrides, userOverrides);
    logAction("Usuario eliminado", id);
  }

  // --- Agentes ---
  function defaultAgentInfo() {
    var expires = new Date();
    expires.setDate(expires.getDate() + 30);
    return { status: "activo", plan: "basico", planExpiresAt: expires.toISOString(), documentsSubmitted: true, joinedAt: new Date().toISOString() };
  }
  function allAgents() {
    return window.App.data.getAllAgents().map(function (a) {
      var hasRealPlanInfo = !!(a.plan && a.status);
      var base = hasRealPlanInfo
        ? { plan: a.plan, status: a.status, planExpiresAt: a.planExpiresAt, documentsSubmitted: true, joinedAt: a.createdAt || new Date().toISOString() }
        : Object.assign({}, defaultAgentInfo(), d.AGENT_ADMIN_INFO[a.slug]);
      var info = Object.assign({}, base, agentOverrides[a.slug]);
      return Object.assign({}, a, info);
    });
  }
  function setAgentField(slug, fields) {
    agentOverrides[slug] = Object.assign({}, agentOverrides[slug], fields);
    writeJSON(KEYS.agentOverrides, agentOverrides);
    logAction("Actualización de agente (" + Object.keys(fields).join(", ") + ")", slug);
  }
  function pendingAgentsList() { return pendingAgents; }
  function approvePendingAgent(slug) {
    pendingAgents = pendingAgents.filter(function (p) { return p.slug !== slug; });
    writeJSON(KEYS.pendingAgents, pendingAgents);
    logAction("Agente aprobado", slug);
  }
  function rejectPendingAgent(slug) {
    pendingAgents = pendingAgents.filter(function (p) { return p.slug !== slug; });
    writeJSON(KEYS.pendingAgents, pendingAgents);
    logAction("Solicitud de agente rechazada", slug);
  }

  // --- Propiedades (moderación) ---
  function modFor(id) {
    var base = window.App.state.properties.get(id);
    var baseFeatured = !!(base && base.featured);
    return Object.assign({ status: "aprobada", featured: baseFeatured, removed: false }, propertyMod[id]);
  }
  function allPropertiesWithMod() {
    return window.App.state.properties.all()
      .map(function (p) { return Object.assign({}, p, modFor(p.id)); })
      .filter(function (p) { return !p.removed; });
  }
  function setPropertyMod(id, fields) {
    propertyMod[id] = Object.assign({}, modFor(id), fields);
    writeJSON(KEYS.propertyMod, propertyMod);
    logAction("Propiedad actualizada (" + Object.keys(fields).join(", ") + ")", id);
  }
  function pendingPropertiesList() { return pendingProperties; }
  async function approvePendingProperty(id) {
    var item = pendingProperties.filter(function (p) { return p.id === id; })[0];
    if (!item) return null;
    var published = await window.App.state.properties.publish({
      title: item.title, type: item.type, operation: item.operation, price: item.price,
      city: item.city, neighborhood: item.neighborhood, agentSlug: item.agentSlug, photos: item.photos
    });
    pendingProperties = pendingProperties.filter(function (p) { return p.id !== id; });
    writeJSON(KEYS.pendingProperties, pendingProperties);
    logAction("Propiedad aprobada y publicada", item.title);
    return published;
  }
  function rejectPendingProperty(id) {
    pendingProperties = pendingProperties.filter(function (p) { return p.id !== id; });
    writeJSON(KEYS.pendingProperties, pendingProperties);
    logAction("Propiedad rechazada", id);
  }

  // --- Ciudades / zonas ---
  function allCities() { return cities; }
  function addCity(name, state) {
    cities = cities.concat([{ id: utils.slugify(name), name: name, state: state, active: true, zones: [] }]);
    writeJSON(KEYS.cities, cities);
    logAction("Ciudad creada", name);
  }
  function toggleCity(id) {
    cities = cities.map(function (c) { return c.id === id ? Object.assign({}, c, { active: !c.active }) : c; });
    writeJSON(KEYS.cities, cities);
    logAction("Ciudad activada/desactivada", id);
  }
  function addZone(cityId, zoneName) {
    cities = cities.map(function (c) { return c.id === cityId ? Object.assign({}, c, { zones: c.zones.concat([zoneName]) }) : c; });
    writeJSON(KEYS.cities, cities);
    logAction("Zona agregada a " + cityId, zoneName);
  }

  // --- Suscripciones / cupones ---
  function allPlans() { return plans; }
  function updatePlan(id, fields) {
    plans = plans.map(function (p) { return p.id === id ? Object.assign({}, p, fields) : p; });
    writeJSON(KEYS.plans, plans);
    logAction("Plan actualizado", id);
  }
  function allCoupons() { return coupons; }
  function addCoupon(coupon) {
    coupons = coupons.concat([coupon]);
    writeJSON(KEYS.coupons, coupons);
    logAction("Cupón creado", coupon.code);
  }
  function toggleCoupon(code) {
    coupons = coupons.map(function (c) { return c.code === code ? Object.assign({}, c, { active: !c.active }) : c; });
    writeJSON(KEYS.coupons, coupons);
    logAction("Cupón activado/desactivado", code);
  }

  // --- Pagos ---
  function allPayments() { return d.PAYMENTS; }

  // --- Reportes de moderación ---
  function allReports() { return reports; }
  function resolveReport(id, status) {
    reports = reports.map(function (r) { return r.id === id ? Object.assign({}, r, { status: status }) : r; });
    writeJSON(KEYS.reports, reports);
    logAction("Reporte marcado como " + status, id);
  }

  // --- Publicidad ---
  function allAds() { return ads; }
  function addAd(ad) {
    ads = [Object.assign({ id: utils.uid("ad") }, ad)].concat(ads);
    writeJSON(KEYS.ads, ads);
    logAction("Anuncio creado", ad.title);
  }
  function toggleAd(id) {
    ads = ads.map(function (a) { return a.id === id ? Object.assign({}, a, { active: !a.active }) : a; });
    writeJSON(KEYS.ads, ads);
    logAction("Anuncio activado/desactivado", id);
  }
  function removeAd(id) {
    ads = ads.filter(function (a) { return a.id !== id; });
    writeJSON(KEYS.ads, ads);
    logAction("Anuncio eliminado", id);
  }

  // --- Notificaciones ---
  function notificationsLog() { return notifications; }
  function sendNotification(payload) {
    var entry = Object.assign({ id: utils.uid("n"), sentAt: new Date().toISOString() }, payload);
    notifications = [entry].concat(notifications);
    writeJSON(KEYS.notifications, notifications);
    logAction("Notificación enviada a " + payload.audience, payload.subject);
    return entry;
  }

  // --- Configuración general ---
  function getSettings() { return settings; }
  function updateSettings(fields) {
    settings = Object.assign({}, settings, fields);
    writeJSON(KEYS.settings, settings);
    logAction("Configuración general actualizada", Object.keys(fields).join(", "));
  }

  // --- Auditoría ---
  function auditLog() { return audit; }

  // --- KPIs del dashboard ---
  function computeKPIs() {
    var users = allUsers();
    var agents = allAgents();
    var properties = allPropertiesWithMod();
    var today = new Date();

    var payments = allPayments();
    var monthKey = today.toISOString().slice(0, 7);
    var monthlyRevenue = payments.filter(function (p) { return p.status === 'pagado' && p.date.slice(0, 7) === monthKey; })
      .reduce(function (sum, p) { return sum + p.amount; }, 0);
    var annualRevenue = payments.filter(function (p) { return p.status === 'pagado' && p.date.slice(0, 4) === String(today.getFullYear()); })
      .reduce(function (sum, p) { return sum + p.amount; }, 0);

    var activeSubs = agents.filter(function (a) { return a.status === 'activo' && new Date(a.planExpiresAt) >= today; }).length;
    var expiredSubs = agents.filter(function (a) { return new Date(a.planExpiresAt) < today; }).length;

    return {
      totalUsers: users.length,
      totalAgents: agents.length,
      totalOwners: users.filter(function (u) { return u.role === 'propietario'; }).length,
      totalProperties: properties.length,
      forSale: properties.filter(function (p) { return p.operation === 'venta'; }).length,
      forRent: properties.filter(function (p) { return p.operation === 'renta'; }).length,
      featured: properties.filter(function (p) { return p.featured; }).length,
      pendingProperties: pendingPropertiesList().length,
      rejectedProperties: properties.filter(function (p) { return p.status === 'rechazada'; }).length,
      newUsers: users.filter(function (u) { return (today - new Date(u.createdAt)) / 86400000 < 30; }).length,
      newAgents: pendingAgentsList().length,
      monthlyRevenue: monthlyRevenue,
      annualRevenue: annualRevenue,
      activeSubscriptions: activeSubs,
      expiredSubscriptions: expiredSubs
    };
  }

  window.App.admin.state = {
    auth: { isAuthed: isAuthed, login: login, logout: logout },
    users: { all: allUsers, setStatus: setUserStatus, update: updateUser, remove: removeUser },
    agents: {
      all: allAgents, setField: setAgentField,
      pending: pendingAgentsList, approvePending: approvePendingAgent, rejectPending: rejectPendingAgent
    },
    properties: {
      all: allPropertiesWithMod, setMod: setPropertyMod,
      pending: pendingPropertiesList, approvePending: approvePendingProperty, rejectPending: rejectPendingProperty
    },
    cities: { all: allCities, add: addCity, toggle: toggleCity, addZone: addZone },
    plans: { all: allPlans, update: updatePlan },
    coupons: { all: allCoupons, add: addCoupon, toggle: toggleCoupon },
    payments: { all: allPayments },
    reports: { all: allReports, resolve: resolveReport },
    ads: { all: allAds, add: addAd, toggle: toggleAd, remove: removeAd },
    notifications: { log: notificationsLog, send: sendNotification },
    settings: { get: getSettings, update: updateSettings },
    audit: { log: auditLog },
    kpis: computeKPIs
  };
})();
