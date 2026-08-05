// Estado del panel del asesor: clientes (CRM), calendario, notificaciones y bolsa
// compartida (Supabase real, con caché en memoria poblada en el arranque / al iniciar sesión).
(function () {
  "use strict";

  var supabaseClient = window.App.supabase;

  function currentAgent() { return window.App.state.agents.current(); }
  function currentSlug() { return window.App.state.agents.currentSlug(); }

  // --- Clientes (CRM) ---
  var cachedClients = [];

  function mapClientRow(row) {
    return {
      id: row.id, agentSlug: row.agent_slug, name: row.name, phone: row.phone || "", email: row.email || "",
      budget: row.budget, notes: row.notes || "", status: row.status,
      activity: row.activity || [], linkedClientSlug: row.linked_client_slug || null, createdAt: row.created_at
    };
  }
  function clientFieldsToRow(fields) {
    var map = {
      name: "name", phone: "phone", email: "email", budget: "budget", notes: "notes",
      status: "status", activity: "activity", linkedClientSlug: "linked_client_slug"
    };
    var row = {};
    Object.keys(fields).forEach(function (key) { if (map[key]) row[map[key]] = fields[key]; });
    return row;
  }
  async function bootstrapClients() {
    if (!supabaseClient) return;
    try {
      var result = await supabaseClient.from("crm_clients").select("*").order("created_at", { ascending: false });
      if (result.data) cachedClients = result.data.map(mapClientRow);
    } catch (e) { console.error("No se pudieron cargar los clientes", e); }
  }
  function myClients() { return cachedClients; }
  function getClient(id) { return cachedClients.filter(function (c) { return c.id === id; })[0] || null; }
  async function createClient(fields) {
    var agent = currentAgent();
    if (!agent) throw new Error("Debes iniciar sesión como asesor.");
    var row = Object.assign(clientFieldsToRow(fields), { agent_id: agent.id, agent_slug: agent.slug });
    var result = await supabaseClient.from("crm_clients").insert(row).select().single();
    if (result.error) throw result.error;
    var client = mapClientRow(result.data);
    cachedClients = [client].concat(cachedClients);
    return client;
  }
  async function updateClient(id, fields) {
    var result = await supabaseClient.from("crm_clients").update(clientFieldsToRow(fields)).eq("id", id).select().single();
    if (result.error) throw result.error;
    var client = mapClientRow(result.data);
    cachedClients = cachedClients.map(function (c) { return c.id === id ? client : c; });
    return client;
  }
  async function removeClient(id) {
    var result = await supabaseClient.from("crm_clients").delete().eq("id", id);
    if (result.error) throw result.error;
    cachedClients = cachedClients.filter(function (c) { return c.id !== id; });
  }
  async function addClientActivity(id, entry) {
    var client = getClient(id);
    if (!client) return;
    var activity = [Object.assign({ date: new Date().toISOString() }, entry)].concat(client.activity || []);
    return await updateClient(id, { activity: activity });
  }

  // --- Calendario ---
  var cachedCalendarEvents = [];

  function mapCalendarRow(row) {
    return { id: row.id, agentSlug: row.agent_slug, type: row.type, title: row.title, date: row.date, clientId: row.client_id, done: !!row.done, createdAt: row.created_at };
  }
  async function bootstrapCalendar() {
    if (!supabaseClient) return;
    try {
      var result = await supabaseClient.from("calendar_events").select("*").order("date", { ascending: true });
      if (result.data) cachedCalendarEvents = result.data.map(mapCalendarRow);
    } catch (e) { console.error("No se pudo cargar el calendario", e); }
  }
  function myEvents() {
    return cachedCalendarEvents.slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
  }
  async function createEvent(fields) {
    var agent = currentAgent();
    if (!agent) throw new Error("Debes iniciar sesión como asesor.");
    var row = {
      agent_id: agent.id, agent_slug: agent.slug, type: fields.type, title: fields.title,
      date: fields.date, client_id: fields.clientId || null, done: false
    };
    var result = await supabaseClient.from("calendar_events").insert(row).select().single();
    if (result.error) throw result.error;
    var event = mapCalendarRow(result.data);
    cachedCalendarEvents = cachedCalendarEvents.concat([event]);
    return event;
  }
  async function toggleEventDone(id) {
    var ev = cachedCalendarEvents.filter(function (e) { return e.id === id; })[0];
    if (!ev) return;
    var result = await supabaseClient.from("calendar_events").update({ done: !ev.done }).eq("id", id).select().single();
    if (result.error) throw result.error;
    var updated = mapCalendarRow(result.data);
    cachedCalendarEvents = cachedCalendarEvents.map(function (e) { return e.id === id ? updated : e; });
  }
  async function removeEvent(id) {
    var result = await supabaseClient.from("calendar_events").delete().eq("id", id);
    if (result.error) throw result.error;
    cachedCalendarEvents = cachedCalendarEvents.filter(function (e) { return e.id !== id; });
  }

  // --- Notificaciones (creadas automáticamente por el flujo de seguimiento en js/state.js) ---
  var cachedNotifications = [];

  function mapNotificationRow(row) {
    return { id: row.id, agentSlug: row.agent_slug, type: row.type, text: row.text, read: !!row.read, createdAt: row.created_at };
  }
  async function bootstrapNotifications() {
    if (!supabaseClient) return;
    try {
      var result = await supabaseClient.from("agent_notifications").select("*").order("created_at", { ascending: false });
      if (result.data) cachedNotifications = result.data.map(mapNotificationRow);
    } catch (e) { console.error("No se pudieron cargar las notificaciones", e); }
  }
  function myNotifications() { return cachedNotifications; }
  function unreadCount() { return cachedNotifications.filter(function (n) { return !n.read; }).length; }
  async function markNotificationRead(id) {
    var result = await supabaseClient.from("agent_notifications").update({ read: true }).eq("id", id).select().single();
    if (result.error) throw result.error;
    var n = mapNotificationRow(result.data);
    cachedNotifications = cachedNotifications.map(function (x) { return x.id === id ? n : x; });
  }
  async function markAllNotificationsRead() {
    var unread = cachedNotifications.filter(function (n) { return !n.read; });
    if (!unread.length) return;
    var agent = currentAgent();
    var result = await supabaseClient.from("agent_notifications").update({ read: true }).eq("agent_id", agent.id).eq("read", false);
    if (result.error) throw result.error;
    cachedNotifications = cachedNotifications.map(function (n) { return Object.assign({}, n, { read: true }); });
  }

  // --- Bolsa Inmobiliaria Compartida (solo Plan Profesional) ---
  var cachedCollaborations = [];
  var cachedShareRequests = [];
  var cachedSettlements = [];

  function mapCollabRow(row) {
    return {
      id: row.id, propertyId: row.property_id, ownerId: row.owner_id, ownerSlug: row.owner_slug,
      collaboratorId: row.collaborator_id, collaboratorSlug: row.collaborator_slug,
      status: row.status, requestStatus: row.request_status, clientId: row.client_id,
      sentCount: row.sent_count, viewsCount: row.views_count, contactsCount: row.contacts_count, visitsScheduled: row.visits_scheduled,
      history: row.history || [], createdAt: row.created_at
    };
  }
  function mapShareRequestRow(row) {
    return {
      id: row.id, propertyId: row.property_id, ownerId: row.owner_id, ownerSlug: row.owner_slug,
      requesterId: row.requester_id, requesterSlug: row.requester_slug,
      collaborationId: row.collaboration_id, status: row.status, createdAt: row.created_at
    };
  }
  function mapSettlementRow(row) {
    return {
      id: row.id, propertyId: row.property_id, collaborationId: row.collaboration_id,
      ownerId: row.owner_id, ownerSlug: row.owner_slug, collaboratorId: row.collaborator_id, collaboratorSlug: row.collaborator_slug,
      totalCommission: row.total_commission, ownerAmount: row.owner_amount, collaboratorAmount: row.collaborator_amount,
      paymentStatus: row.payment_status, paymentDate: row.payment_date, createdAt: row.created_at
    };
  }
  async function bootstrapSharedPool() {
    if (!supabaseClient) return;
    try {
      var results = await Promise.all([
        supabaseClient.from("pool_collaborations").select("*"),
        supabaseClient.from("pool_share_requests").select("*"),
        supabaseClient.from("pool_settlements").select("*")
      ]);
      if (results[0].data) cachedCollaborations = results[0].data.map(mapCollabRow);
      if (results[1].data) cachedShareRequests = results[1].data.map(mapShareRequestRow);
      if (results[2].data) cachedSettlements = results[2].data.map(mapSettlementRow);
    } catch (e) { console.error("No se pudo cargar la bolsa compartida", e); }
  }

  function isPremium(slug) {
    var info = window.App.admin.state.agents.all().filter(function (a) { return a.slug === slug; })[0];
    return !info || info.plan === 'profesional';
  }
  function isExpired(sharing) {
    return sharing.expiresAt && new Date(sharing.expiresAt) < new Date();
  }
  function visibleToAgent(property, viewerSlug) {
    var s = property.sharing;
    if (!s || !s.enabled || isExpired(s)) return false;
    if (property.agentSlug === viewerSlug) return false;
    if (s.visibility === 'todos') return true;
    if (s.visibility === 'seleccionados') return (s.selectedAgentSlugs || []).indexOf(viewerSlug) !== -1;
    if (s.visibility === 'inmobiliaria') {
      var owner = window.App.data.getAgent(property.agentSlug);
      var viewer = window.App.data.getAgent(viewerSlug);
      return !!(owner && viewer && owner.company && viewer.company && owner.company.trim().toLowerCase() === viewer.company.trim().toLowerCase());
    }
    if (s.visibility === 'invitacion') return true; // visible en la bolsa, pero requiere solicitud para agregarse
    return false;
  }
  function requiresRequest(property) {
    return property.sharing && property.sharing.visibility === 'invitacion';
  }
  function poolResults(filters) {
    filters = filters || {};
    var viewerSlug = currentSlug();
    var all = window.App.state.properties.all().filter(function (p) { return visibleToAgent(p, viewerSlug); });
    if (filters.city) all = all.filter(function (p) { return p.city === filters.city; });
    if (filters.type) all = all.filter(function (p) { return p.type === filters.type; });
    if (filters.operation) all = all.filter(function (p) { return p.operation === filters.operation; });
    if (filters.neighborhood) {
      var q = filters.neighborhood.trim().toLowerCase();
      all = all.filter(function (p) { return p.neighborhood.toLowerCase().indexOf(q) !== -1; });
    }
    if (filters.minCommission) all = all.filter(function (p) { return (p.sharing.totalCommission || 0) >= filters.minCommission; });
    if (filters.priceMax) all = all.filter(function (p) { return p.price <= filters.priceMax; });
    return all;
  }
  function mySharedProperties() {
    var slug = currentSlug();
    return window.App.state.properties.byAgent(slug).filter(function (p) { return p.sharing && p.sharing.enabled; });
  }
  async function setSharing(propertyId, sharingFields) {
    var prop = window.App.state.properties.get(propertyId);
    var sharing = Object.assign({
      enabled: false, totalCommission: 5, collaboratorCommission: 50, fixedAmount: null,
      conditions: '', expiresAt: null, visibility: 'todos', selectedAgentSlugs: []
    }, prop.sharing, sharingFields);
    await window.App.state.properties.update(propertyId, { sharing: sharing });
    return sharing;
  }

  function collaborationsForOwnedProperty(propertyId) {
    return cachedCollaborations.filter(function (c) { return c.propertyId === propertyId && c.status === 'activa'; });
  }
  function collaboratorsForMyProperties() {
    var slug = currentSlug();
    var myPropertyIds = window.App.state.properties.byAgent(slug).map(function (p) { return p.id; });
    return cachedCollaborations.filter(function (c) { return myPropertyIds.indexOf(c.propertyId) !== -1 && c.status === 'activa'; });
  }
  function myCatalogCollaborations() {
    var slug = currentSlug();
    return cachedCollaborations.filter(function (c) { return c.collaboratorSlug === slug && c.status === 'activa'; });
  }
  function myCatalog() {
    return myCatalogCollaborations().map(function (c) {
      return { collaboration: c, property: window.App.state.properties.get(c.propertyId) };
    }).filter(function (row) { return row.property; });
  }
  function isInMyCatalog(propertyId) {
    var slug = currentSlug();
    return cachedCollaborations.some(function (c) { return c.propertyId === propertyId && c.collaboratorSlug === slug && c.status === 'activa'; });
  }

  async function addToCatalog(propertyId) {
    var agent = currentAgent();
    var property = window.App.state.properties.get(propertyId);
    if (!agent || !property) throw new Error("No se pudo agregar la propiedad al catálogo.");
    var owner = window.App.data.getAgent(property.agentSlug);
    if (!owner) throw new Error("No se encontró al asesor dueño de esta propiedad.");
    var needsRequest = requiresRequest(property);
    var row = {
      property_id: propertyId, owner_id: owner.id, owner_slug: property.agentSlug,
      collaborator_id: agent.id, collaborator_slug: agent.slug,
      status: needsRequest ? "pendiente" : "activa", request_status: needsRequest ? "pendiente" : "aprobada",
      history: [{ action: needsRequest ? "Solicitud enviada" : "Agregada al catálogo", date: new Date().toISOString() }]
    };
    var result = await supabaseClient.from("pool_collaborations").insert(row).select().single();
    if (result.error) throw result.error;
    var collab = mapCollabRow(result.data);
    cachedCollaborations = cachedCollaborations.concat([collab]);

    if (needsRequest) {
      var reqRow = {
        property_id: propertyId, owner_id: owner.id, owner_slug: property.agentSlug,
        requester_id: agent.id, requester_slug: agent.slug, collaboration_id: collab.id, status: "pendiente"
      };
      var reqResult = await supabaseClient.from("pool_share_requests").insert(reqRow).select().single();
      if (!reqResult.error) cachedShareRequests = cachedShareRequests.concat([mapShareRequestRow(reqResult.data)]);
    }
    return collab;
  }
  async function removeFromCatalog(collaborationId) {
    var existing = cachedCollaborations.filter(function (c) { return c.id === collaborationId; })[0];
    var history = (existing ? existing.history : []).concat([{ action: "Retirada del catálogo", date: new Date().toISOString() }]);
    var result = await supabaseClient.from("pool_collaborations").update({ status: "retirada", history: history }).eq("id", collaborationId).select().single();
    if (result.error) throw result.error;
    var updated = mapCollabRow(result.data);
    cachedCollaborations = cachedCollaborations.map(function (c) { return c.id === collaborationId ? updated : c; });
  }

  function pendingRequestsForMe() {
    var slug = currentSlug();
    return cachedShareRequests.filter(function (r) { return r.ownerSlug === slug && r.status === 'pendiente'; });
  }
  async function resolveRequest(requestId, approve) {
    var request = cachedShareRequests.filter(function (r) { return r.id === requestId; })[0];
    if (!request) return;
    var reqResult = await supabaseClient.from("pool_share_requests").update({ status: approve ? 'aprobada' : 'rechazada' }).eq("id", requestId).select().single();
    if (reqResult.error) throw reqResult.error;
    cachedShareRequests = cachedShareRequests.map(function (r) { return r.id === requestId ? mapShareRequestRow(reqResult.data) : r; });

    var collab = cachedCollaborations.filter(function (c) { return c.id === request.collaborationId; })[0];
    var history = (collab ? collab.history : []).concat([{ action: approve ? 'Solicitud aprobada' : 'Solicitud rechazada', date: new Date().toISOString() }]);
    var collabResult = await supabaseClient.from("pool_collaborations").update({
      status: approve ? 'activa' : 'retirada', request_status: approve ? 'aprobada' : 'rechazada', history: history
    }).eq("id", request.collaborationId).select().single();
    if (collabResult.error) throw collabResult.error;
    cachedCollaborations = cachedCollaborations.map(function (c) { return c.id === request.collaborationId ? mapCollabRow(collabResult.data) : c; });
  }

  function mySettlements() {
    var slug = currentSlug();
    return cachedSettlements.filter(function (s) { return s.ownerSlug === slug || s.collaboratorSlug === slug; });
  }
  async function createSettlement(fields) {
    var agent = currentAgent();
    var collaborator = window.App.data.getAgent(fields.collaboratorSlug);
    var row = {
      property_id: fields.propertyId, collaboration_id: fields.collaborationId,
      owner_id: agent.id, owner_slug: fields.ownerSlug,
      collaborator_id: collaborator ? collaborator.id : null, collaborator_slug: fields.collaboratorSlug,
      total_commission: fields.totalCommission, owner_amount: fields.ownerAmount, collaborator_amount: fields.collaboratorAmount
    };
    var result = await supabaseClient.from("pool_settlements").insert(row).select().single();
    if (result.error) throw result.error;
    var settlement = mapSettlementRow(result.data);
    cachedSettlements = cachedSettlements.concat([settlement]);
    return settlement;
  }
  async function markSettlementPaid(id) {
    var result = await supabaseClient.from("pool_settlements").update({ payment_status: 'pagada', payment_date: new Date().toISOString() }).eq("id", id).select().single();
    if (result.error) throw result.error;
    var updated = mapSettlementRow(result.data);
    cachedSettlements = cachedSettlements.map(function (s) { return s.id === id ? updated : s; });
  }

  function clearCaches() {
    cachedClients = [];
    cachedCalendarEvents = [];
    cachedNotifications = [];
    cachedCollaborations = [];
    cachedShareRequests = [];
    cachedSettlements = [];
  }

  window.App.agent = window.App.agent || {};
  window.App.agent.state = {
    clearCaches: clearCaches,
    clients: {
      bootstrap: bootstrapClients,
      all: myClients, get: getClient, create: createClient, update: updateClient,
      remove: removeClient, addActivity: addClientActivity
    },
    calendar: {
      bootstrap: bootstrapCalendar,
      all: myEvents, create: createEvent, toggleDone: toggleEventDone, remove: removeEvent
    },
    notifications: {
      bootstrap: bootstrapNotifications,
      all: myNotifications, unreadCount: unreadCount,
      markRead: markNotificationRead, markAllRead: markAllNotificationsRead
    },
    sharedPool: {
      bootstrap: bootstrapSharedPool,
      isPremium: isPremium,
      search: poolResults,
      mine: mySharedProperties,
      setSharing: setSharing,
      collaboratorsFor: collaborationsForOwnedProperty,
      collaboratorsForMyProperties: collaboratorsForMyProperties,
      catalog: myCatalog,
      isInCatalog: isInMyCatalog,
      addToCatalog: addToCatalog,
      removeFromCatalog: removeFromCatalog,
      pendingRequests: pendingRequestsForMe,
      resolveRequest: resolveRequest,
      requiresRequest: requiresRequest,
      settlements: mySettlements,
      createSettlement: createSettlement,
      markSettlementPaid: markSettlementPaid
    }
  };
})();
