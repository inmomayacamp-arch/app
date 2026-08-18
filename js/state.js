// Estado de la aplicación: favoritos (localStorage), y cuentas de asesor, propiedades
// y enlaces personalizados (Supabase real, con caché en memoria poblada en el arranque).
(function () {
  "use strict";

  var utils = window.App.utils;
  var data = window.App.data;

  var KEYS = {
    favorites: "inmomap:favorites",
    location: "inmomap:location"
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

  // --- Traspaso de filtros entre páginas: al aplicar el filtro en Explorar,
  // "Ver X propiedades" navega a Propiedades y le pasa el filtro elegido por
  // aquí. Es de un solo uso (take() lo consume) y no se persiste en
  // localStorage: es estado de navegación, no una preferencia duradera. ---
  var pendingFilters = null;
  function setPendingFilters(f) { pendingFilters = f; }
  function takePendingFilters() { var f = pendingFilters; pendingFilters = null; return f; }

  // --- Estado/ciudad seleccionados: filtra propiedades en todas las vistas que los lean ---
  var selectedLocation = readJSON(KEYS.location, { stateKey: null, cityKey: null });
  function getLocation() { return selectedLocation; }
  function setLocation(stateKey, cityKey) {
    selectedLocation = { stateKey: stateKey || null, cityKey: (stateKey && cityKey) || null };
    writeJSON(KEYS.location, selectedLocation);
    emit("location:change", selectedLocation);
  }

  // --- Cuentas de asesor: registro, inicio de sesión, sesión activa (Supabase Auth real) ---
  var supabaseClient = window.App.supabase;
  var cachedProfiles = [];
  var cachedCurrentProfile = null;

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
        var profileResult = await supabaseClient.from("profiles_public").select("*").eq("id", session.user.id).single();
        if (profileResult.data) cachedCurrentProfile = mapProfileRow(profileResult.data);
      }
      var allResult = await supabaseClient.from("profiles_public").select("*");
      if (allResult.data) cachedProfiles = allResult.data.map(mapProfileRow);
    } catch (e) {
      console.error("No se pudo inicializar la sesión de Supabase", e);
    }
  }

  // El perfil ya NO se inserta desde aquí: lo crea un trigger en Supabase
  // (handle_new_user, sobre auth.users) en cuanto se registra la cuenta,
  // usando los datos que mandamos como metadata en options.data. Esto
  // importa porque con "Confirm email" activo, signUp() no da una sesión
  // hasta que confirman su correo — si el perfil dependiera de un insert
  // hecho por este cliente después de signUp(), nunca se llegaría a crear
  // para nadie que aún no confirma.
  async function registerAgent(fields) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var email = fields.email.trim().toLowerCase();
    var plan = fields.plan === "propietario" ? "propietario" : "asesor";
    var signUpResult = await supabaseClient.auth.signUp({
      email: email,
      password: fields.password,
      options: { data: { name: fields.name, phone: fields.phone || "", city: fields.city || "", plan: plan, photo: fields.photo || "" } }
    });
    if (signUpResult.error) {
      // Supabase no deja ver el detalle real del error de Postgres (por
      // seguridad) cuando falla el trigger que crea el perfil — solo manda
      // este mensaje genérico. En la práctica casi siempre es que el
      // teléfono (o el correo) ya está registrado con otra cuenta.
      if (/profiles_phone_unique|duplicate key.*phone/i.test(signUpResult.error.message || "")) {
        throw new Error("Ya existe una cuenta registrada con ese número de teléfono.");
      }
      if (/database error saving new user/i.test(signUpResult.error.message || "")) {
        throw new Error("Ya existe una cuenta registrada con ese correo o teléfono. Intenta iniciar sesión, o usa otro número/correo.");
      }
      throw signUpResult.error;
    }
    if (!signUpResult.data.session) throw new Error("Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.");

    var profileResult = await supabaseClient.from("profiles_public").select("*").eq("id", signUpResult.data.user.id).single();
    if (profileResult.error || !profileResult.data) throw new Error("Tu cuenta se creó pero no se pudo cargar tu perfil. Intenta iniciar sesión de nuevo en unos segundos.");

    var agent = mapProfileRow(profileResult.data);
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
    var profileResult = await supabaseClient.from("profiles_public").select("*").eq("id", signInResult.data.user.id).single();
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
    // El destacado de pago vence a los 30 días (featured_expires_at); el
    // incluido gratis en el plan no tiene fecha, así que nunca vence solo.
    // "featured" ya sale evaluado así en todos lados; featuredExpiresAt
    // queda aparte solo para mostrar "vence en X días" donde haga falta.
    var featuredExpiresAt = row.featured_expires_at || null;
    var featuredActive = !!row.featured && (!featuredExpiresAt || new Date(featuredExpiresAt) > new Date());
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
      rentalDeposit: row.rental_deposit || "",
      rentalMinContract: row.rental_min_contract,
      rentalFurnished: row.rental_furnished || "",
      rentalGuarantees: row.rental_guarantees || [],
      rentalServicesIncluded: row.rental_services_included || [],
      rentalAvailableFrom: row.rental_available_from || "",
      ownerName: row.owner_name || "",
      ownerPhone: row.owner_phone || "",
      ownerEmail: row.owner_email || "",
      tags: row.tags || [],
      featured: featuredActive,
      featuredExpiresAt: featuredExpiresAt,
      status: row.status || "disponible",
      publishStatus: row.publish_status || "publicada",
      scheduledAt: row.scheduled_at || null,
      expiresAt: row.expires_at || null,
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
      rentalDeposit: "rental_deposit", rentalMinContract: "rental_min_contract", rentalFurnished: "rental_furnished",
      rentalGuarantees: "rental_guarantees", rentalServicesIncluded: "rental_services_included", rentalAvailableFrom: "rental_available_from",
      ownerName: "owner_name", ownerPhone: "owner_phone", ownerEmail: "owner_email",
      tags: "tags", status: "status", publishStatus: "publish_status",
      scheduledAt: "scheduled_at", expiresAt: "expires_at", sharing: "sharing"
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
    if (p.expiresAt && new Date(p.expiresAt) <= new Date()) return false;
    // Si el asesor/propietario dueño ya no aparece en profiles_public
    // (suspendido, o inactivo por falta de pago), su propiedad tampoco
    // debe verse en el mapa ni en las búsquedas.
    if (p.agentSlug && !cachedProfiles.some(function (a) { return a.slug === p.agentSlug; })) return false;
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
  // Destacar/quitar destacado GRATIS (el incluido en el plan, 1 por cuenta):
  // antes se escribía "featured" directo desde el cliente y el límite de
  // "solo 1 gratis" solo se revisaba en JavaScript -- se podía saltar desde
  // la consola del navegador. Ahora pasa por una Edge Function que valida
  // el límite del lado del servidor. Destacar MÁS de una sigue yendo por
  // Stripe (startPaymentCheckout("featured", ...)), eso no cambia.
  async function toggleFreeFeature(propertyId) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var sessionResult = await supabaseClient.auth.getSession();
    var session = sessionResult && sessionResult.data && sessionResult.data.session;
    if (!session) throw new Error("Debes iniciar sesión");
    var url = window.APP_CONFIG.SUPABASE_URL + "/functions/v1/toggle-featured";
    var response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session.access_token },
      body: JSON.stringify({ propertyId: propertyId })
    });
    var data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo actualizar la propiedad");
    var property = mapPropertyRow(data.property);
    cachedProperties = cachedProperties.map(function (p) { return p.id === propertyId ? property : p; });
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
      clientPhone: row.client_phone || "",
      clientEmail: row.client_email || "",
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
  // Para la página pública del enlace (#/:agentSlug/:clientSlug): NO usa el
  // caché de arriba (ese solo trae los enlaces del propio asesor con
  // sesión iniciada, a propósito — la tabla ya no es de lectura abierta).
  // Esta llama a una función en Supabase que regresa nada más el enlace
  // exacto que se pide, sin exponer los enlaces de los demás clientes.
  async function getClientLinkPublic(agentSlug, clientSlug) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var result = await supabaseClient.rpc("get_client_link", { p_agent_slug: agentSlug, p_client_slug: clientSlug });
    if (result.error) throw result.error;
    // Cuando no hay un enlace que coincida, la función de Supabase regresa
    // igual una fila (con todas las columnas en null) en vez de un valor
    // nulo desnudo -- hay que detectarlo por el id, si no, se trata como un
    // enlace real vacío en vez de "no existe".
    return (result.data && result.data.id) ? mapLinkRow(result.data) : null;
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
      client_phone: payload.clientPhone || "",
      client_email: payload.clientEmail || "",
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
  async function removeLink(id) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var result = await supabaseClient.from("client_links").delete().eq("id", id);
    if (result.error) throw result.error;
    cachedLinks = cachedLinks.filter(function (l) { return l.id !== id; });
    emit("links:change", cachedLinks);
  }

  // --- Pagos con Stripe: crea la Sesión (Checkout o Portal) en el backend
  // (Supabase Edge Function, la única pieza con la clave secreta de Stripe)
  // y redirige. kind: "plan" | "featured" | "portal".
  async function startPaymentCheckout(kind, extra) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var sessionResult = await supabaseClient.auth.getSession();
    var session = sessionResult && sessionResult.data && sessionResult.data.session;
    if (!session) throw new Error("Debes iniciar sesión");
    var url = window.APP_CONFIG.SUPABASE_URL + "/functions/v1/create-checkout-session";
    var body = Object.assign({ kind: kind }, extra || {});
    var response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session.access_token },
      body: JSON.stringify(body)
    });
    var data = await response.json();
    if (!response.ok || !data.url) throw new Error(data.error || "No se pudo iniciar el pago");
    window.location.href = data.url;
  }

  // Registro de asesor con pago primero: todavía no hay cuenta ni sesión,
  // así que esto no manda token — el webhook crea la cuenta al confirmar
  // el pago. Se guarda el correo/contraseña para el primer inicio de
  // sesión automático al volver de Stripe (ver paymentResult.js).
  async function startSignupCheckout(fields) {
    try { sessionStorage.setItem("inmomap:pendingLogin", JSON.stringify({ email: fields.email, password: fields.password })); } catch (e) { /* no-op */ }
    var url = window.APP_CONFIG.SUPABASE_URL + "/functions/v1/create-checkout-session";
    var body = {
      kind: "signup", name: fields.name, email: fields.email,
      phone: fields.phone, city: fields.city, password: fields.password, billing: fields.billing,
      // "asesor" si no se manda nada (no rompe el registro de asesor que ya
      // existe); "proveedor" viene del registro del directorio de servicios,
      // junto con la categoría elegida.
      accountType: fields.accountType || "asesor", category: fields.category || null
    };
    var response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    var data = await response.json();
    if (!response.ok || !data.url) {
      try { sessionStorage.removeItem("inmomap:pendingLogin"); } catch (e) { /* no-op */ }
      throw new Error(data.error || "No se pudo iniciar el pago");
    }
    window.location.href = data.url;
  }

  window.App.state = {
    on: on,
    emit: emit,
    payments: {
      startCheckout: startPaymentCheckout,
      startSignupCheckout: startSignupCheckout
    },
    favorites: {
      has: isFavorite,
      toggle: toggleFavorite,
      count: favoriteCount,
      list: favoriteProperties
    },
    location: {
      get: getLocation,
      set: setLocation
    },
    filters: {
      set: setPendingFilters,
      take: takePendingFilters
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
      toggleFreeFeature: toggleFreeFeature,
      remove: removeProperty,
      duplicate: duplicateProperty
    },
    links: {
      bootstrap: bootstrapLinks,
      all: allLinks,
      getPublic: getClientLinkPublic,
      byAgent: linksByAgent,
      get: getLink,
      create: createLink,
      remove: removeLink
    },
    leads: {
      bootstrap: bootstrapLeads,
      all: allLeads,
      create: createLead,
      updateStatus: updateLeadStatus
    },
    providers: {
      bootstrap: bootstrapProviders,
      all: allProviders,
      publicList: publicProviders,
      get: getProvider,
      create: createProvider,
      update: updateProvider,
      remove: removeProvider
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
      recentContactsForAgent: recentContactsForAgent,
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

  // Pasa por una Edge Function (en vez de insertar directo) para que el
  // límite de intentos por IP y el honeypot anti-bot funcionen — insertar
  // directo desde el cliente no se puede frenar del lado del servidor.
  async function createLead(payload) {
    var url = window.APP_CONFIG.SUPABASE_URL + "/functions/v1/create-lead";
    var response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: payload.kind, name: payload.name, phone: payload.phone || "", email: payload.email || "",
        message: payload.message || "", details: payload.details || {}, website: payload.website || ""
      })
    });
    var data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo enviar tu mensaje");
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

  // --- Directorio de proveedores de servicios (notario, valuadores, arquitectos,
  // servicios, sofom): cualquiera puede leer los activos (RLS: active = true);
  // solo el admin (perfil role = 'admin') puede crear/editar/borrar y ver los
  // inactivos — por eso, igual que "leads", el admin vuelve a llamar bootstrap()
  // justo después de iniciar sesión, para refrescar el caché con permisos plenos. ---
  var cachedProviders = [];

  function mapProviderRow(row) {
    var photos = row.photos && row.photos.length ? row.photos : (row.photo ? [row.photo] : []);
    return {
      id: row.id, category: row.category, name: row.name, description: row.description || "",
      phone: row.phone || "", whatsapp: row.whatsapp || "", photo: row.photo || "", photos: photos,
      coords: row.coords || null, profileId: row.profile_id || null,
      state: row.state || "", city: row.city || "", active: !!row.active, createdAt: row.created_at
    };
  }

  function providerFieldsToRow(fields) {
    var map = {
      category: "category", name: "name", description: "description", phone: "phone",
      whatsapp: "whatsapp", photo: "photo", photos: "photos", coords: "coords", profileId: "profile_id",
      state: "state", city: "city", active: "active"
    };
    var row = {};
    Object.keys(fields).forEach(function (key) {
      if (map[key] && fields[key] !== undefined) row[map[key]] = fields[key];
    });
    return row;
  }

  async function bootstrapProviders() {
    if (!supabaseClient) return;
    try {
      var result = await supabaseClient.from("service_providers").select("*").order("created_at", { ascending: false });
      if (result.data) cachedProviders = result.data.map(mapProviderRow);
    } catch (e) {
      console.error("No se pudieron cargar los proveedores del directorio", e);
    }
  }

  function allProviders() { return cachedProviders; }
  function getProvider(id) { return cachedProviders.filter(function (p) { return p.id === id; })[0] || null; }

  // stateLabel/cityLabel vienen resueltos desde MEXICO_STATES (el mismo picker
  // que usa el admin al capturar al proveedor), así que la comparación es
  // exacta contra texto limpio — no hace falta matching difuso como en propiedades.
  function publicProviders(category, stateLabel, cityLabel) {
    return cachedProviders.filter(function (p) {
      if (!p.active) return false;
      if (category && p.category !== category) return false;
      // p.state puede venir vacío (ficha creada con solo la ciudad en texto
      // libre, sin pasar por el selector de estado+ciudad) -- se resuelve
      // el estado real a partir de la ciudad antes de comparar, para que un
      // dato incompleto no la esconda de quien filtra por estado.
      if (stateLabel && (p.state || utils.stateLabelForCity(p.city)) !== stateLabel) return false;
      if (cityLabel && p.city && p.city !== cityLabel) return false;
      // Si la ficha tiene dueño (cuenta de proveedor de pago) y ese dueño ya
      // no aparece en profiles_public (suspendido, o inactivo por falta de
      // pago), tampoco debe verse aquí — mismo criterio que ya se usa para
      // las propiedades de un asesor suspendido.
      if (p.profileId && !cachedProfiles.some(function (a) { return a.id === p.profileId; })) return false;
      return true;
    });
  }

  async function createProvider(payload) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var row = Object.assign(providerFieldsToRow(payload), { active: payload.active !== false });
    var insertResult = await supabaseClient.from("service_providers").insert(row).select().single();
    if (insertResult.error) throw insertResult.error;
    var provider = mapProviderRow(insertResult.data);
    cachedProviders = [provider].concat(cachedProviders);
    return provider;
  }

  async function updateProvider(id, fields) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var updateResult = await supabaseClient.from("service_providers").update(providerFieldsToRow(fields)).eq("id", id).select().single();
    if (updateResult.error) throw updateResult.error;
    var provider = mapProviderRow(updateResult.data);
    cachedProviders = cachedProviders.map(function (p) { return p.id === id ? provider : p; });
    return provider;
  }

  async function removeProvider(id) {
    if (!supabaseClient) throw new Error("Supabase no está configurado");
    var deleteResult = await supabaseClient.from("service_providers").delete().eq("id", id);
    if (deleteResult.error) throw deleteResult.error;
    cachedProviders = cachedProviders.filter(function (p) { return p.id !== id; });
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

    // Espeja el mismo evento hacia Google Analytics -- link_events (Supabase)
    // es la fuente de verdad para las estadísticas que ve cada asesor en su
    // panel, pero así también quedan visibles en Analytics (con desglose de
    // origen de tráfico, dispositivo, etc.) los momentos que de verdad
    // importan: contacto por WhatsApp/llamada, favoritos y visitas a enlaces.
    if (typeof window.gtag === "function") {
      window.gtag("event", eventType, {
        property_id: fields.propertyId || undefined,
        link_id: fields.linkId || undefined,
        agent_slug: fields.agentSlug || undefined,
        channel: (fields.meta && fields.meta.channel) || undefined
      });
    }

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

  // ctx (opcional) trae el contexto ya resuelto por quien llama (la página
  // del enlace público ya sabe el agente y el cliente de sobra) -- si no se
  // manda, cae en contextFromLink(), que solo funciona con la caché del
  // propio asesor con sesión iniciada y por eso nunca resolvía nada para un
  // cliente real viendo su enlace sin sesión.
  async function logLinkVisit(linkId, ctx) {
    ctx = ctx || contextFromLink(linkId);
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
    // propertyId y agentId se resuelven contra datos públicos (propiedades y
    // profiles_public, disponibles para cualquier visitante); linkId depende
    // de la caché de enlaces del propio asesor con sesión iniciada, así que
    // se intenta al final -- si un botón trae los tres, mejor no depender
    // del que solo funciona para el asesor viendo su propio enlace.
    var ctx = null;
    if (opts.propertyId) ctx = contextFromProperty(opts.propertyId);
    else if (opts.agentId) {
      var agent = cachedProfiles.filter(function (a) { return a.id === opts.agentId; })[0];
      ctx = agent ? { agentId: agent.id, agentSlug: agent.slug, label: agent.name } : null;
    }
    if (!ctx && opts.linkId) ctx = contextFromLink(opts.linkId);
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

  // Lista (no solo el conteo) de los contactos más recientes, para la
  // tarjeta "Contactos recientes" del panel de agente — la señal de "alguien
  // te contactó" es lo que más pesa en por qué un agente sigue pagando una
  // herramienta como esta (velocidad de respuesta).
  function recentContactsForAgent(slug, limit) {
    var agentId = agentIdForSlug(slug);
    return cachedEvents
      .filter(function (e) { return e.eventType === 'contact_click' && e.agentId === agentId; })
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
      .slice(0, limit || 5)
      .map(function (e) {
        var property = e.propertyId ? getProperty(e.propertyId) : null;
        var link = e.linkId ? cachedLinks.filter(function (l) { return l.id === e.linkId; })[0] : null;
        return {
          channel: (e.meta && e.meta.channel) || 'whatsapp',
          propertyTitle: property ? property.title : null,
          clientLabel: link ? link.clientLabel : null,
          createdAt: e.createdAt
        };
      });
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
