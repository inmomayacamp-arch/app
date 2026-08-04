// Estado de la aplicación: favoritos, cuentas de asesor, propiedades y enlaces.
// Persistido en localStorage para simular un backend real sin necesitar servidor.
(function () {
  "use strict";

  var utils = window.App.utils;
  var data = window.App.data;

  var KEYS = {
    favorites: "inmomap:favorites",
    properties: "inmomap:properties",
    propertyOverrides: "inmomap:propertyOverrides",
    links: "inmomap:links",
    registeredAgents: "inmomap:registeredAgents",
    agentCredentials: "inmomap:agentCredentials",
    currentAgentSlug: "inmomap:currentAgentSlug",
    agentProfileOverrides: "inmomap:agentProfileOverrides"
  };

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* almacenamiento no disponible: se ignora en el prototipo */ }
  }

  // --- Emisor de eventos simple para que las vistas reaccionen a cambios de estado ---
  var listeners = {};
  function on(event, cb) {
    listeners[event] = listeners[event] || [];
    listeners[event].push(cb);
    return function off() {
      listeners[event] = listeners[event].filter(function (fn) { return fn !== cb; });
    };
  }
  function emit(event, payload) {
    (listeners[event] || []).forEach(function (fn) { fn(payload); });
  }

  // --- Favoritos ---
  var favoriteIds = readJSON(KEYS.favorites, []);

  function isFavorite(id) { return favoriteIds.indexOf(id) !== -1; }
  function toggleFavorite(id) {
    if (isFavorite(id)) {
      favoriteIds = favoriteIds.filter(function (f) { return f !== id; });
    } else {
      favoriteIds = favoriteIds.concat([id]);
    }
    writeJSON(KEYS.favorites, favoriteIds);
    emit("favorites:change", favoriteIds);
    return isFavorite(id);
  }
  function favoriteCount() { return favoriteIds.length; }
  function favoriteProperties() {
    return favoriteIds
      .map(function (id) { return getProperty(id); })
      .filter(Boolean);
  }

  // --- Cuentas de asesor: registro, inicio de sesión, sesión activa ---
  var registeredAgents = readJSON(KEYS.registeredAgents, []);
  var agentCredentials = readJSON(KEYS.agentCredentials, {});

  var DEMO_AGENT_CREDENTIALS = { email: "oswaldo@inmomap.mx", password: "asesor123", slug: "oswaldochable" };

  function registeredAgentsList() { return registeredAgents; }

  function uniqueSlug(base) {
    var slug = base || utils.uid("asesor");
    var all = data.AGENTS.map(function (a) { return a.slug; }).concat(registeredAgents.map(function (a) { return a.slug; }));
    var candidate = slug, i = 2;
    while (all.indexOf(candidate) !== -1) { candidate = slug + "-" + i; i++; }
    return candidate;
  }

  function registerAgent(fields) {
    var slug = uniqueSlug(utils.slugify(fields.name));
    var agent = {
      slug: slug,
      name: fields.name,
      photo: "https://i.pravatar.cc/160?u=" + slug,
      title: fields.title || "Asesor inmobiliario",
      bio: fields.bio || "",
      whatsapp: fields.phone || "",
      phone: fields.phone || "",
      city: fields.city || "",
      rating: 5,
      reviews: 0,
      yearsExperience: 0,
      clientsCount: 0,
      social: { facebook: "", instagram: "" }
    };
    registeredAgents = registeredAgents.concat([agent]);
    writeJSON(KEYS.registeredAgents, registeredAgents);

    agentCredentials[fields.email.trim().toLowerCase()] = { password: fields.password, slug: slug };
    writeJSON(KEYS.agentCredentials, agentCredentials);

    setCurrentAgentSlug(slug);
    emit("agents:change", registeredAgents);
    return agent;
  }

  var agentProfileOverrides = readJSON(KEYS.agentProfileOverrides, {});
  function updateAgentProfile(slug, fields) {
    agentProfileOverrides[slug] = Object.assign({}, agentProfileOverrides[slug], fields);
    writeJSON(KEYS.agentProfileOverrides, agentProfileOverrides);
    emit("agents:change", agentProfileOverrides);
  }
  function applyAgentProfileOverride(agent) {
    var o = agentProfileOverrides[agent.slug];
    return o ? Object.assign({}, agent, o, { social: Object.assign({}, agent.social, o.social) }) : agent;
  }

  function loginAgent(email, password) {
    var key = (email || "").trim().toLowerCase();
    if (key === DEMO_AGENT_CREDENTIALS.email && password === DEMO_AGENT_CREDENTIALS.password) {
      setCurrentAgentSlug(DEMO_AGENT_CREDENTIALS.slug);
      return data.getAgent(DEMO_AGENT_CREDENTIALS.slug);
    }
    var cred = agentCredentials[key];
    if (cred && cred.password === password) {
      setCurrentAgentSlug(cred.slug);
      return data.getAgent(cred.slug);
    }
    return null;
  }

  function setCurrentAgentSlug(slug) {
    try { localStorage.setItem(KEYS.currentAgentSlug, slug); } catch (e) { /* no-op */ }
  }
  function currentAgentSlug() {
    try { return localStorage.getItem(KEYS.currentAgentSlug); } catch (e) { return null; }
  }
  function isAgentLoggedIn() { return !!currentAgentSlug(); }
  function currentAgent() {
    var slug = currentAgentSlug();
    return slug ? data.getAgent(slug) : null;
  }
  function logoutAgent() {
    try { localStorage.removeItem(KEYS.currentAgentSlug); } catch (e) { /* no-op */ }
  }

  // --- Propiedades (mock + publicadas/editadas por el asesor) ---
  var customProperties = readJSON(KEYS.properties, []);
  var propertyOverrides = readJSON(KEYS.propertyOverrides, {});

  function mergeOverride(p) {
    var o = propertyOverrides[p.id];
    return o ? Object.assign({}, p, o) : p;
  }
  function allProperties() {
    return data.PROPERTIES.concat(customProperties)
      .map(mergeOverride)
      .filter(function (p) { return !p.deleted; });
  }
  function getProperty(id) {
    return allProperties().filter(function (p) { return p.id === id; })[0] || null;
  }
  function propertiesByAgent(slug) {
    return allProperties().filter(function (p) { return p.agentSlug === slug; });
  }
  function publishProperty(payload) {
    var property = Object.assign({
      id: utils.uid("p"),
      agentSlug: currentAgentSlug() || window.APP_CONFIG.CURRENT_AGENT_SLUG,
      createdAt: new Date().toISOString(),
      status: "disponible",
      featured: false,
      photos: payload.photos && payload.photos.length ? payload.photos : ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"],
      features: []
    }, payload);
    customProperties = customProperties.concat([property]);
    writeJSON(KEYS.properties, customProperties);
    emit("properties:change", customProperties);
    return property;
  }
  function updateProperty(id, fields) {
    propertyOverrides[id] = Object.assign({}, propertyOverrides[id], fields);
    writeJSON(KEYS.propertyOverrides, propertyOverrides);
    emit("properties:change", propertyOverrides);
  }
  function removeProperty(id) {
    updateProperty(id, { deleted: true });
  }
  function duplicateProperty(id) {
    var original = getProperty(id);
    if (!original) return null;
    var copy = Object.assign({}, original, {
      id: utils.uid("p"),
      title: original.title + " (copia)",
      createdAt: new Date().toISOString(),
      status: "disponible",
      featured: false
    });
    delete copy.deleted;
    customProperties = customProperties.concat([copy]);
    writeJSON(KEYS.properties, customProperties);
    emit("properties:change", customProperties);
    return copy;
  }

  // --- Enlaces personalizados (mock + creados por el asesor) ---
  var customLinks = readJSON(KEYS.links, []);

  function allLinks() { return data.CLIENT_LINKS.concat(customLinks); }
  function linksByAgent(slug) {
    return allLinks().filter(function (l) { return l.agentSlug === slug; });
  }
  function getLink(agentSlug, clientSlug) {
    return allLinks().filter(function (l) { return l.agentSlug === agentSlug && l.clientSlug === clientSlug; })[0] || null;
  }
  function createLink(payload) {
    var clientSlug = utils.slugify(payload.clientLabel) || utils.uid("cliente");
    var link = {
      agentSlug: currentAgentSlug() || window.APP_CONFIG.CURRENT_AGENT_SLUG,
      clientSlug: clientSlug,
      clientLabel: payload.clientLabel,
      message: payload.message || "",
      propertyIds: payload.propertyIds,
      createdAt: new Date().toISOString(),
      stats: {
        views: 0, viewsDelta: 0,
        avgTimeMinutes: 0, avgTimeDelta: 0,
        propertiesViewed: 0, propertiesViewedDelta: 0,
        contacts: 0, contactsDelta: 0,
        lastVisit: null,
        returningVisits: 0,
        mostViewed: [],
        favoritePropertyIds: []
      }
    };
    customLinks = customLinks.concat([link]);
    writeJSON(KEYS.links, customLinks);
    emit("links:change", customLinks);
    return link;
  }

  window.App.state = {
    on: on,
    emit: emit,
    favorites: {
      has: isFavorite,
      toggle: toggleFavorite,
      count: favoriteCount,
      list: favoriteProperties
    },
    agents: {
      registered: registeredAgentsList,
      register: registerAgent,
      updateProfile: updateAgentProfile,
      applyProfileOverride: applyAgentProfileOverride,
      login: loginAgent,
      logout: logoutAgent,
      isLoggedIn: isAgentLoggedIn,
      currentSlug: currentAgentSlug,
      current: currentAgent,
      demoCredentials: DEMO_AGENT_CREDENTIALS
    },
    properties: {
      all: allProperties,
      get: getProperty,
      byAgent: propertiesByAgent,
      publish: publishProperty,
      update: updateProperty,
      remove: removeProperty,
      duplicate: duplicateProperty
    },
    links: {
      all: allLinks,
      byAgent: linksByAgent,
      get: getLink,
      create: createLink
    }
  };
})();
