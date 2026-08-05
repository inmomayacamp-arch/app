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
  function toggleFavorite(id, opts) {
    if (isFavorite(id)) {
      favoriteIds = favoriteIds.filter(function (f) { return f !== id; });
    } else {
      favoriteIds = favoriteIds.concat([id]);
    }
    writeJSON(KEYS.favorites, favoriteIds);
    emit("favorites:change", favoriteIds);
    var nowActive = isFavorite(id);
    if (nowActive) logFavorite(id, opts && opts.linkId);
    return nowActive;
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

  function uniqueSlug(base) {
    var slug = base || utils.uid("asesor");
    var all = cachedProfiles.map(function (a) { return a.slug; });
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
      logoUrl: row.logo_url || "",
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
      plan: (fields.plan === "profesional" || fields.plan === "propietario") ? fields.plan : "basico"
    };
    var insertResult = await supabaseClient.from("profiles").insert(row).select().single();
    if (insertResult.error) throw insertResult.error;

    var agent = mapProfileRow(insertResult.data);
    cachedCurrentProfile = agent;
    cachedProfiles = cachedProfiles.concat([agent]);
    emit("agents:change", cachedProfiles);
    emit("agent:session", agent);
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
    emit("agent:session", agent);
    return agent;
  }

  function currentAgentSlug() { return cachedCurrentProfile ? cachedCurrentProfile.slug : null; }
  function isAgentLoggedIn() { return !!cachedCurrentProfile; }
  function currentAgent() { return cachedCurrentProfile; }
  async function logoutAgent() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    cachedCurrentProfile = null;
    emit("agent:session", null);
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
      priceRent: row.price_rent,
      currency: row.currency || "MXN",
      creditsAccepted: row.credits_accepted || [],
      city: row.city || "",
      neighborhood: row.neighborhood || "",
      addressNote: row.address_note || "",
      state: row.state || "",
      municipality: row.municipality || "",
      street: row.street || "",
      extNumber: row.ext_number || "",
      postalCode: row.postal_code || "",
      locationPrivacy: row.location_privacy || "exacta",
      coords: row.coords || window.APP_CONFIG.DEFAULT_CENTER,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      halfBathrooms: row.half_bathrooms,
      hasLivingRoom: !!row.has_living_room,
      hasLibrary: !!row.has_library,
      levels: row.levels,
      age: row.age,
      builtArea: row.built_area,
      lotArea: row.lot_area,
      frontage: row.frontage,
      depth: row.depth,
      parking: row.parking,
      description: row.description || "",
      privateNotes: row.private_notes || "",
      features: row.features || [],
      photos: row.photos && row.photos.length ? row.photos : [FALLBACK_PHOTO],
      videoUrl: row.video_url || "",
      virtualTourUrl: row.virtual_tour_url || "",
      tags: row.tags || [],
      featured: !!row.featured,
      status: row.status || "disponible",
      publishStatus: row.publish_status || "publicada",
      scheduledAt: row.scheduled_at || null,
      sharing: row.sharing || null,
      createdAt: row.created_at
    };
  }

  function propertyFieldsToRow(fields) {
    var map = {
      title: "title", type: "type", operation: "operation", price: "price", priceRent: "price_rent",
      currency: "currency", creditsAccepted: "credits_accepted", city: "city",
      neighborhood: "neighborhood", addressNote: "address_note", state: "state", municipality: "municipality",
      street: "street", extNumber: "ext_number", postalCode: "postal_code", locationPrivacy: "location_privacy",
      coords: "coords", bedrooms: "bedrooms", bathrooms: "bathrooms", halfBathrooms: "half_bathrooms",
      hasLivingRoom: "has_living_room", hasLibrary: "has_library", levels: "levels", age: "age",
      builtArea: "built_area", lotArea: "lot_area", frontage: "frontage", depth: "depth",
      parking: "parking", description: "description", privateNotes: "private_notes",
      features: "features", photos: "photos", videoUrl: "video_url", virtualTourUrl: "virtual_tour_url",
      tags: "tags", featured: "featured", status: "status", publishStatus: "publish_status",
      scheduledAt: "scheduled_at", sharing: "sharing"
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
    return cachedProperties;
  }
  function getProperty(id) {
    return allProperties().filter(function (p) { return p.id === id; })[0] || null;
  }
  function propertiesByAgent(slug) {
    return allProperties().filter(function (p) { return p.agentSlug === slug; });
  }
  function isPubliclyVisible(p) {
    var status = p.publishStatus || "publicada";
    if (status === "borrador" || status === "oculta") return false;
    if (status === "programada") return !!p.scheduledAt && new Date(p.scheduledAt) <= new Date();
    return true;
  }
  function publicProperties() {
    return allProperties().filter(isPubliclyVisible);
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
      featured: !!payload.featured,
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
    return cachedLinks;
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
      current: currentAgent
    },
    properties: {
      bootstrap: bootstrapProperties,
      all: allProperties,
      publicList: publicProperties,
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
    },
    leads: {
      bootstrap: bootstrapLeads,
      all: allLeads,
      create: createLead,
      updateStatus: updateLeadStatus
    },
    tracking: {
      bootstrap: bootstrapTracking,
      clear: clearTracking,
      logLinkVisit: logLinkVisit,
      logPropertyView: logPropertyView,
      logFavorite: logFavorite,
      logContactClick: logContactClick,
      statsForLink: statsForLink,
      viewsForProperty: viewsForProperty,
      topPropertiesForAgent: topPropertiesForAgent,
      contactsForAgent: contactsForAgent,
      dailyViewsForAgent: dailyViewsForAgent,
      weeklyTrendForAgent: weeklyTrendForAgent
    }
  };

  // --- Solicitudes de propiedad y mensajes de soporte (leads) ---
  // Cualquier visitante puede crear uno (sin cuenta); solo el admin puede leerlos y actualizarlos.
  var cachedLeads = [];

  function mapLeadRow(row) {
    return {
      id: row.id, kind: row.kind, name: row.name, phone: row.phone || "", email: row.email || "",
      message: row.message || "", details: row.details || {}, status: row.status || "nuevo", createdAt: row.created_at
    };
  }

  async function bootstrapLeads() {
    if (!supabaseClient) return;
    try {
      var result = await supabaseClient.from("leads").select("*").order("created_at", { ascending: false });
      if (result.data) cachedLeads = result.data.map(mapLeadRow);
    } catch (e) {
      console.error("No se pudieron cargar las solicitudes", e);
    }
  }

  function allLeads() { return cachedLeads; }

  async function createLead(payload) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var row = {
      kind: payload.kind, name: payload.name, phone: payload.phone || "", email: payload.email || "",
      message: payload.message || "", details: payload.details || {}
    };
    // No se encadena .select() porque quien envía la solicitud (visitante anónimo)
    // no tiene permiso de lectura sobre la tabla: solo el administrador puede leerla.
    var insertResult = await supabaseClient.from("leads").insert(row);
    if (insertResult.error) throw insertResult.error;
    return true;
  }

  async function updateLeadStatus(id, status) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var updateResult = await supabaseClient.from("leads").update({ status: status }).eq("id", id).select().single();
    if (updateResult.error) throw updateResult.error;
    var lead = mapLeadRow(updateResult.data);
    cachedLeads = cachedLeads.map(function (l) { return l.id === id ? lead : l; });
    return lead;
  }

  // --- Seguimiento real de vistas, contactos y favoritos (link_events) ---
  // Cualquier visitante puede insertar un evento (sin cuenta); solo el asesor dueño puede leerlos.
  var cachedEvents = [];
  var VISITOR_KEY = "inmomap:visitor";

  function visitorSessionId() {
    var id = null;
    try { id = localStorage.getItem(VISITOR_KEY); } catch (e) { /* almacenamiento no disponible */ }
    if (!id) {
      id = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : utils.uid("v");
      try { localStorage.setItem(VISITOR_KEY, id); } catch (e) { /* almacenamiento no disponible */ }
    }
    return id;
  }

  function mapEventRow(row) {
    return {
      id: row.id, eventType: row.event_type, propertyId: row.property_id, linkId: row.link_id,
      agentId: row.agent_id, sessionId: row.session_id, meta: row.meta || {}, createdAt: row.created_at
    };
  }

  async function bootstrapTracking() {
    if (!supabaseClient) return;
    try {
      var result = await supabaseClient.from("link_events").select("*");
      if (result.data) cachedEvents = result.data.map(mapEventRow);
    } catch (e) {
      console.error("No se pudieron cargar los eventos de seguimiento", e);
    }
  }
  function clearTracking() { cachedEvents = []; }

  function agentIdForSlug(slug) {
    var agent = cachedProfiles.filter(function (a) { return a.slug === slug; })[0];
    return agent ? agent.id : null;
  }
  function contextFromLink(linkId) {
    var link = cachedLinks.filter(function (l) { return l.id === linkId; })[0];
    if (!link) return null;
    return { agentId: agentIdForSlug(link.agentSlug), agentSlug: link.agentSlug, label: link.clientLabel };
  }
  function contextFromProperty(propertyId) {
    var p = getProperty(propertyId);
    if (!p) return null;
    return { agentId: agentIdForSlug(p.agentSlug), agentSlug: p.agentSlug, label: p.title };
  }

  function notificationTextFor(eventType, fields) {
    var label = fields.label || "";
    if (eventType === "link_visit") return "Tu cliente abrió tu enlace personalizado" + (label ? ' "' + label + '"' : "");
    if (eventType === "favorite") return "Un cliente marcó como favorita: " + (label || "una propiedad");
    if (eventType === "contact_click") {
      var channel = (fields.meta && fields.meta.channel === "call") ? " por llamada" : " por WhatsApp";
      return "Nuevo contacto" + channel + (label ? " · " + label : "");
    }
    return "";
  }

  async function logEvent(eventType, fields) {
    if (!supabaseClient) return;
    var agentId = fields.agentId || null;
    // Evita que un asesor infle sus propias estadísticas al previsualizar su anuncio.
    if (agentId && cachedCurrentProfile && cachedCurrentProfile.id === agentId) return;

    var row = {
      event_type: eventType,
      property_id: fields.propertyId || null,
      link_id: fields.linkId || null,
      agent_id: agentId,
      session_id: visitorSessionId(),
      meta: fields.meta || {}
    };
    try {
      // Sin .select(): quien inserta (visitante anónimo) no tiene permiso de lectura.
      await supabaseClient.from("link_events").insert(row);
    } catch (e) { /* no debe bloquear la navegación del visitante */ }

    if (agentId && (eventType === "link_visit" || eventType === "favorite" || eventType === "contact_click")) {
      try {
        await supabaseClient.from("agent_notifications").insert({
          agent_id: agentId,
          agent_slug: fields.agentSlug || "",
          type: eventType === "link_visit" ? "visita" : eventType === "favorite" ? "favorito" : "whatsapp",
          text: notificationTextFor(eventType, fields)
        });
      } catch (e) { /* idem */ }
    }
  }

  async function logLinkVisit(linkId) {
    var ctx = contextFromLink(linkId);
    if (!ctx) return;
    await logEvent("link_visit", { linkId: linkId, agentId: ctx.agentId, agentSlug: ctx.agentSlug, label: ctx.label });
  }
  async function logPropertyView(propertyId, linkId) {
    var ctx = contextFromProperty(propertyId);
    if (!ctx) return;
    await logEvent("property_view", { propertyId: propertyId, linkId: linkId || null, agentId: ctx.agentId, agentSlug: ctx.agentSlug, label: ctx.label });
  }
  async function logFavorite(propertyId, linkId) {
    var ctx = contextFromProperty(propertyId);
    if (!ctx) return;
    await logEvent("favorite", { propertyId: propertyId, linkId: linkId || null, agentId: ctx.agentId, agentSlug: ctx.agentSlug, label: ctx.label });
  }
  async function logContactClick(opts) {
    opts = opts || {};
    var ctx = null;
    if (opts.linkId) ctx = contextFromLink(opts.linkId);
    else if (opts.propertyId) ctx = contextFromProperty(opts.propertyId);
    else if (opts.agentId) {
      var agent = cachedProfiles.filter(function (a) { return a.id === opts.agentId; })[0];
      ctx = agent ? { agentId: agent.id, agentSlug: agent.slug, label: agent.name } : null;
    }
    if (!ctx) return;
    await logEvent("contact_click", {
      propertyId: opts.propertyId || null, linkId: opts.linkId || null,
      agentId: ctx.agentId, agentSlug: ctx.agentSlug, label: ctx.label,
      meta: { channel: opts.channel || "whatsapp" }
    });
  }

  function eventsForLink(linkId) { return cachedEvents.filter(function (e) { return e.linkId === linkId; }); }

  function statsForLink(linkId) {
    var now = Date.now();
    var weekMs = 7 * 24 * 60 * 60 * 1000;
    var events = eventsForLink(linkId);
    var visits = events.filter(function (e) { return e.eventType === 'link_visit'; });
    var views = events.filter(function (e) { return e.eventType === 'property_view'; });
    var contacts = events.filter(function (e) { return e.eventType === 'contact_click'; });
    var favorites = events.filter(function (e) { return e.eventType === 'favorite'; });

    function inWindow(list, fromMs, toMs) {
      return list.filter(function (e) { var t = new Date(e.createdAt).getTime(); return t >= fromMs && t < toMs; });
    }
    var last7 = inWindow(visits, now - weekMs, now).length;
    var prev7 = inWindow(visits, now - 2 * weekMs, now - weekMs).length;
    var contactsLast7 = inWindow(contacts, now - weekMs, now).length;
    var contactsPrev7 = inWindow(contacts, now - 2 * weekMs, now - weekMs).length;

    var sessionCounts = {};
    visits.forEach(function (e) { sessionCounts[e.sessionId] = (sessionCounts[e.sessionId] || 0) + 1; });
    var uniqueSessions = Object.keys(sessionCounts).length;
    var returning = visits.length - uniqueSessions;

    var bySession = {};
    events.forEach(function (e) {
      if (e.eventType !== 'link_visit' && e.eventType !== 'property_view') return;
      var t = new Date(e.createdAt).getTime();
      if (!bySession[e.sessionId]) bySession[e.sessionId] = { min: t, max: t };
      else { bySession[e.sessionId].min = Math.min(bySession[e.sessionId].min, t); bySession[e.sessionId].max = Math.max(bySession[e.sessionId].max, t); }
    });
    var durations = Object.keys(bySession).map(function (k) { return (bySession[k].max - bySession[k].min) / 60000; }).filter(function (m) { return m > 0; });
    var avgTimeMinutes = durations.length ? (durations.reduce(function (a, b) { return a + b; }, 0) / durations.length) : 0;

    var mostViewedMap = {};
    views.forEach(function (e) { if (e.propertyId) mostViewedMap[e.propertyId] = (mostViewedMap[e.propertyId] || 0) + 1; });
    var mostViewed = Object.keys(mostViewedMap).map(function (id) { return { propertyId: id, views: mostViewedMap[id] }; })
      .sort(function (a, b) { return b.views - a.views; });

    var favoritePropertyIds = Array.from(new Set(favorites.map(function (e) { return e.propertyId; }).filter(Boolean)));
    var lastVisit = visits.length ? visits.reduce(function (max, e) { return e.createdAt > max ? e.createdAt : max; }, visits[0].createdAt) : null;

    return {
      views: visits.length,
      viewsDelta: prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : (last7 ? 100 : 0),
      avgTimeMinutes: avgTimeMinutes,
      avgTimeDelta: 0,
      propertiesViewed: views.length,
      propertiesViewedDelta: 0,
      contacts: contacts.length,
      contactsDelta: contactsPrev7 ? Math.round(((contactsLast7 - contactsPrev7) / contactsPrev7) * 100) : (contactsLast7 ? 100 : 0),
      lastVisit: lastVisit,
      returningVisits: returning,
      mostViewed: mostViewed,
      favoritePropertyIds: favoritePropertyIds
    };
  }

  function viewsForProperty(propertyId) {
    return cachedEvents.filter(function (e) { return e.eventType === 'property_view' && e.propertyId === propertyId; }).length;
  }

  function topPropertiesForAgent(slug, limit) {
    var agentId = agentIdForSlug(slug);
    var views = cachedEvents.filter(function (e) { return e.eventType === 'property_view' && e.agentId === agentId; });
    var map = {};
    views.forEach(function (e) { map[e.propertyId] = (map[e.propertyId] || 0) + 1; });
    return Object.keys(map).map(function (id) {
      var p = getProperty(id);
      return p ? { label: p.title, value: map[id] } : null;
    }).filter(Boolean).sort(function (a, b) { return b.value - a.value; }).slice(0, limit || 5);
  }

  function contactsForAgent(slug) {
    var agentId = agentIdForSlug(slug);
    var contacts = cachedEvents.filter(function (e) { return e.eventType === 'contact_click' && e.agentId === agentId; });
    var whatsapp = contacts.filter(function (e) { return !e.meta || e.meta.channel !== 'call'; }).length;
    var call = contacts.filter(function (e) { return e.meta && e.meta.channel === 'call'; }).length;
    return { whatsapp: whatsapp, call: call, total: contacts.length };
  }

  function weeklyTrendForAgent(slug) {
    var agentId = agentIdForSlug(slug);
    var now = Date.now();
    var weekMs = 7 * 24 * 60 * 60 * 1000;
    function countInWindow(list, fromMs, toMs) {
      return list.filter(function (e) { var t = new Date(e.createdAt).getTime(); return t >= fromMs && t < toMs; }).length;
    }
    var views = cachedEvents.filter(function (e) { return e.eventType === 'property_view' && e.agentId === agentId; });
    var contacts = cachedEvents.filter(function (e) { return e.eventType === 'contact_click' && e.agentId === agentId; });
    var viewsThisWeek = countInWindow(views, now - weekMs, now);
    var viewsPrevWeek = countInWindow(views, now - 2 * weekMs, now - weekMs);
    var contactsThisWeek = countInWindow(contacts, now - weekMs, now);
    var contactsPrevWeek = countInWindow(contacts, now - 2 * weekMs, now - weekMs);
    function delta(curr, prev) { return prev ? Math.round(((curr - prev) / prev) * 100) : (curr ? 100 : 0); }
    return {
      viewsThisWeek: viewsThisWeek, viewsDelta: delta(viewsThisWeek, viewsPrevWeek),
      contactsThisWeek: contactsThisWeek, contactsDelta: delta(contactsThisWeek, contactsPrevWeek)
    };
  }

  function dailyViewsForAgent(slug, days) {
    var agentId = agentIdForSlug(slug);
    var views = cachedEvents.filter(function (e) { return e.eventType === 'property_view' && e.agentId === agentId; });
    var counts = {};
    views.forEach(function (e) {
      var d = new Date(e.createdAt);
      var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      counts[key] = (counts[key] || 0) + 1;
    });
    var out = [];
    var now = new Date();
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      out.push({ label: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }), shortLabel: String(d.getDate()), value: counts[key] || 0 });
    }
    return out;
  }
})();
