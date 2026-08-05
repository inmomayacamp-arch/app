// Estado de la aplicación: favoritos (localStorage), y cuentas de asesor, propiedades
// y enlaces personalizados (Supabase real, con caché en memoria poblada en el arranque).
(function () {
  "use strict";

  var utils = window.App.utils;
  var data = window.App.data;

  var KEYS = {
    favorites: "inmomap:favorites"
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
      photo: "https://i.pravatar.cc/160?u=" + slug, whatsapp: fields.phone || "", phone: fields.phone || "", city: fields.city || "",
      plan: fields.plan === "profesional" ? "profesional" : "basico"
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

  // --- Propiedades (Supabase real; las de agentes aún no registrados quedan como demo) ---
  var FALLBACK_PHOTO = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80";
  var cachedProperties = [];

  function mapPropertyRow(row) {
    return {
      id: row.id,
      agentSlug: row.agent_slug,
      title: row.title,
      type: row.type,
      operation: row.operation,
      price: row.price,
      city: row.city || "",
      neighborhood: row.neighborhood || "",
      addressNote: row.address_note || "",
      coords: row.coords || window.APP_CONFIG.DEFAULT_CENTER,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      builtArea: row.built_area,
      lotArea: row.lot_area,
      parking: row.parking,
      description: row.description || "",
      privateNotes: row.private_notes || "",
      features: row.features || [],
      photos: row.photos && row.photos.length ? row.photos : [FALLBACK_PHOTO],
      featured: !!row.featured,
      status: row.status || "disponible",
      sharing: row.sharing || null,
      createdAt: row.created_at
    };
  }

  function propertyFieldsToRow(fields) {
    var map = {
      title: "title", type: "type", operation: "operation", price: "price", city: "city",
      neighborhood: "neighborhood", addressNote: "address_note", coords: "coords",
      bedrooms: "bedrooms", bathrooms: "bathrooms", builtArea: "built_area", lotArea: "lot_area",
      parking: "parking", description: "description", privateNotes: "private_notes",
      features: "features", photos: "photos", featured: "featured", status: "status", sharing: "sharing"
    };
    var row = {};
    Object.keys(fields).forEach(function (key) {
      if (map[key]) row[map[key]] = fields[key];
    });
    return row;
  }

  async function bootstrapProperties() {
    if (!supabaseClient) return;
    try {
      var result = await supabaseClient.from("properties").select("*");
      if (result.data) cachedProperties = result.data.map(mapPropertyRow);
    } catch (e) {
      console.error("No se pudieron cargar las propiedades de Supabase", e);
    }
  }

  function allProperties() {
    var registeredSlugs = cachedProfiles.map(function (a) { return a.slug; });
    var staticOnes = data.PROPERTIES.filter(function (p) { return registeredSlugs.indexOf(p.agentSlug) === -1; });
    return staticOnes.concat(cachedProperties);
  }
  function getProperty(id) {
    return allProperties().filter(function (p) { return p.id === id; })[0] || null;
  }
  function propertiesByAgent(slug) {
    return allProperties().filter(function (p) { return p.agentSlug === slug; });
  }
  async function publishProperty(payload) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var current = cachedCurrentProfile;
    var targetAgent = (payload.agentSlug && (!current || payload.agentSlug !== current.slug))
      ? cachedProfiles.filter(function (a) { return a.slug === payload.agentSlug; })[0]
      : current;
    if (!targetAgent) throw new Error("No se encontró una cuenta de asesor registrada para publicar esta propiedad.");
    var row = Object.assign(propertyFieldsToRow(payload), {
      agent_id: targetAgent.id,
      agent_slug: targetAgent.slug,
      featured: false,
      status: "disponible",
      photos: payload.photos && payload.photos.length ? payload.photos : [FALLBACK_PHOTO],
      features: payload.features || []
    });
    var insertResult = await supabaseClient.from("properties").insert(row).select().single();
    if (insertResult.error) throw insertResult.error;
    var property = mapPropertyRow(insertResult.data);
    cachedProperties = cachedProperties.concat([property]);
    emit("properties:change", cachedProperties);
    return property;
  }
  async function updateProperty(id, fields) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var updateResult = await supabaseClient.from("properties").update(propertyFieldsToRow(fields)).eq("id", id).select().single();
    if (updateResult.error) throw updateResult.error;
    var property = mapPropertyRow(updateResult.data);
    cachedProperties = cachedProperties.map(function (p) { return p.id === id ? property : p; });
    emit("properties:change", cachedProperties);
    return property;
  }
  async function removeProperty(id) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var deleteResult = await supabaseClient.from("properties").delete().eq("id", id);
    if (deleteResult.error) throw deleteResult.error;
    cachedProperties = cachedProperties.filter(function (p) { return p.id !== id; });
    emit("properties:change", cachedProperties);
  }
  async function duplicateProperty(id) {
    var original = getProperty(id);
    if (!original) return null;
    var copy = Object.assign({}, original, { title: original.title + " (copia)" });
    delete copy.id;
    delete copy.createdAt;
    delete copy.agentSlug;
    return await publishProperty(copy);
  }

  // --- Enlaces personalizados (Supabase real; mock solo para agentes aún no registrados) ---
  var cachedLinks = [];

  function mapLinkRow(row) {
    return {
      id: row.id,
      agentSlug: row.agent_slug,
      clientSlug: row.client_slug,
      clientLabel: row.client_label,
      message: row.message || "",
      propertyIds: row.property_ids || [],
      stats: row.stats || {},
      createdAt: row.created_at
    };
  }

  async function bootstrapLinks() {
    if (!supabaseClient) return;
    try {
      var result = await supabaseClient.from("client_links").select("*");
      if (result.data) cachedLinks = result.data.map(mapLinkRow);
    } catch (e) {
      console.error("No se pudieron cargar los enlaces de Supabase", e);
    }
  }

  function allLinks() {
    var registeredSlugs = cachedProfiles.map(function (a) { return a.slug; });
    var staticOnes = data.CLIENT_LINKS.filter(function (l) { return registeredSlugs.indexOf(l.agentSlug) === -1; });
    return staticOnes.concat(cachedLinks);
  }
  function linksByAgent(slug) {
    return allLinks().filter(function (l) { return l.agentSlug === slug; });
  }
  function getLink(agentSlug, clientSlug) {
    return allLinks().filter(function (l) { return l.agentSlug === agentSlug && l.clientSlug === clientSlug; })[0] || null;
  }
  async function createLink(payload) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    if (!cachedCurrentProfile) throw new Error("Debes iniciar sesión como asesor para crear un enlace.");
    var clientSlug = utils.slugify(payload.clientLabel) || utils.uid("cliente");
    var row = {
      agent_id: cachedCurrentProfile.id,
      agent_slug: cachedCurrentProfile.slug,
      client_slug: clientSlug,
      client_label: payload.clientLabel,
      message: payload.message || "",
      property_ids: payload.propertyIds,
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
    var insertResult = await supabaseClient.from("client_links").insert(row).select().single();
    if (insertResult.error) throw insertResult.error;
    var link = mapLinkRow(insertResult.data);
    cachedLinks = cachedLinks.concat([link]);
    emit("links:change", cachedLinks);
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
      bootstrap: bootstrapProperties,
      all: allProperties,
      get: getProperty,
      byAgent: propertiesByAgent,
      publish: publishProperty,
      update: updateProperty,
      remove: removeProperty,
      duplicate: duplicateProperty
    },
    links: {
      bootstrap: bootstrapLinks,
      all: allLinks,
      byAgent: linksByAgent,
      get: getLink,
      create: createLink
    }
  };
})();
