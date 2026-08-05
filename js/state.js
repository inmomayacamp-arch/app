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
    links: "inmomap:links"
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

  // --- Cuentas de asesor: registro, inicio de sesión, sesión activa (Supabase Auth real) ---
  var supabaseClient = window.App.supabase;
  var cachedProfiles = [];
  var cachedCurrentProfile = null;
  var DEMO_AGENT_CREDENTIALS = { email: "oswaldo@inmomap.mx", password: "asesor123", slug: "oswaldochable" };

  function uniqueSlug(base) {
    var slug = base || utils.uid("asesor");
    var all = data.AGENTS.map(function (a) { return a.slug; }).concat(cachedProfiles.map(function (a) { return a.slug; }));
    var candidate = slug, i = 2;
    while (all.indexOf(candidate) !== -1) { candidate = slug + "-" + i; i++; }
    return candidate;
  }

  function mapProfileRow(row) {
    return {
      id: row.id,
      role: row.role,
      slug: row.slug,
      name: row.name,
      email: row.email,
      photo: row.photo || "",
      title: row.title || "Asesor inmobiliario",
      bio: row.bio || "",
      whatsapp: row.whatsapp || "",
      phone: row.phone || "",
      city: row.city || "",
      company: row.company || "",
      specialty: row.specialty || "",
      schedule: row.schedule || "",
      social: row.social || {},
      rating: row.rating,
      reviews: row.reviews,
      yearsExperience: row.years_experience,
      clientsCount: row.clients_count,
      plan: row.plan,
      status: row.status,
      planExpiresAt: row.plan_expires_at,
      createdAt: row.created_at
    };
  }

  function agentFieldsToRow(fields) {
    var map = {
      photo: "photo", logoUrl: "logo_url", name: "name", company: "company", specialty: "specialty",
      city: "city", bio: "bio", whatsapp: "whatsapp", phone: "phone", schedule: "schedule", social: "social",
      plan: "plan", status: "status", planExpiresAt: "plan_expires_at"
    };
    var row = {};
    Object.keys(fields).forEach(function (key) {
      if (map[key]) row[map[key]] = fields[key];
    });
    return row;
  }

  function registeredAgentsList() { return cachedProfiles; }

  async function bootstrapAgents() {
    if (!supabaseClient) return;
    try {
      var sessionResult = await supabaseClient.auth.getSession();
      var session = sessionResult && sessionResult.data && sessionResult.data.session;
      if (session) {
        var profileResult = await supabaseClient.from("profiles").select("*").eq("id", session.user.id).single();
        if (profileResult.data) cachedCurrentProfile = mapProfileRow(profileResult.data);
      }
      var allResult = await supabaseClient.from("profiles").select("*");
      if (allResult.data) cachedProfiles = allResult.data.map(mapProfileRow);
    } catch (e) {
      console.error("No se pudo inicializar la sesión de Supabase", e);
    }
  }

  async function registerAgent(fields) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var email = fields.email.trim().toLowerCase();
    var slug = uniqueSlug(utils.slugify(fields.name));
    var signUpResult = await supabaseClient.auth.signUp({ email: email, password: fields.password });
    if (signUpResult.error) throw signUpResult.error;
    if (!signUpResult.data.session) throw new Error("Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.");

    var row = {
      id: signUpResult.data.user.id, role: "agent", slug: slug, name: fields.name, email: email,
      photo: "https://i.pravatar.cc/160?u=" + slug, whatsapp: fields.phone || "", phone: fields.phone || "", city: fields.city || ""
    };
    var insertResult = await supabaseClient.from("profiles").insert(row).select().single();
    if (insertResult.error) throw insertResult.error;

    var agent = mapProfileRow(insertResult.data);
    cachedCurrentProfile = agent;
    cachedProfiles = cachedProfiles.concat([agent]);
    emit("agents:change", cachedProfiles);
    return agent;
  }

  async function updateAgentProfile(slug, fields) {
    if (!supabaseClient || !cachedCurrentProfile || cachedCurrentProfile.slug !== slug) return;
    var updateResult = await supabaseClient.from("profiles").update(agentFieldsToRow(fields)).eq("id", cachedCurrentProfile.id).select().single();
    if (updateResult.error) throw updateResult.error;
    var agent = mapProfileRow(updateResult.data);
    cachedCurrentProfile = agent;
    cachedProfiles = cachedProfiles.map(function (a) { return a.slug === slug ? agent : a; });
    emit("agents:change", cachedProfiles);
  }

  async function loginAgent(email, password) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var signInResult = await supabaseClient.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: password });
    if (signInResult.error) return null;
    var profileResult = await supabaseClient.from("profiles").select("*").eq("id", signInResult.data.user.id).single();
    if (profileResult.error || !profileResult.data) return null;
    var agent = mapProfileRow(profileResult.data);
    cachedCurrentProfile = agent;
    if (!cachedProfiles.some(function (a) { return a.slug === agent.slug; })) cachedProfiles = cachedProfiles.concat([agent]);
    return agent;
  }

  function currentAgentSlug() { return cachedCurrentProfile ? cachedCurrentProfile.slug : null; }
  function isAgentLoggedIn() { return !!cachedCurrentProfile; }
  function currentAgent() { return cachedCurrentProfile; }
  async function logoutAgent() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    cachedCurrentProfile = null;
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
      bootstrap: bootstrapAgents,
      registered: registeredAgentsList,
      register: registerAgent,
      updateProfile: updateAgentProfile,
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
