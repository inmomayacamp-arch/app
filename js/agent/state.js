// Estado del panel del asesor: clientes (CRM), calendario, notificaciones y mensajes.
// Todo persistido en localStorage, sembrado con datos de ejemplo para la cuenta demo.
(function () {
  "use strict";

  var utils = window.App.utils;
  var d = window.App.agent.data;

  var KEYS = {
    clients: "inmomap:agent:clients",
    calendar: "inmomap:agent:calendar",
    notifications: "inmomap:agent:notifications",
    conversations: "inmomap:agent:conversations",
    collaborations: "inmomap:agent:collaborations",
    shareRequests: "inmomap:agent:shareRequests",
    settlements: "inmomap:agent:settlements"
  };

  function readJSON(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* no-op */ }
  }
  function currentSlug() { return window.App.state.agents.currentSlug(); }

  var clients = readJSON(KEYS.clients, d.CLIENTS);
  var calendarEvents = readJSON(KEYS.calendar, d.CALENDAR_EVENTS);
  var notifications = readJSON(KEYS.notifications, d.NOTIFICATIONS);
  var conversations = readJSON(KEYS.conversations, d.CONVERSATIONS);
  var collaborations = readJSON(KEYS.collaborations, d.COLLABORATIONS);
  var shareRequests = readJSON(KEYS.shareRequests, d.SHARE_REQUESTS);
  var settlements = readJSON(KEYS.settlements, d.SETTLEMENTS);

  // --- Clientes (CRM) ---
  function myClients() {
    var slug = currentSlug();
    return clients.filter(function (c) { return c.agentSlug === slug; });
  }
  function getClient(id) { return clients.filter(function (c) { return c.id === id; })[0] || null; }
  function createClient(fields) {
    var client = Object.assign({
      id: utils.uid("c"),
      agentSlug: currentSlug(),
      status: "activo",
      createdAt: new Date().toISOString(),
      activity: [],
      linkedClientSlug: null
    }, fields);
    clients = clients.concat([client]);
    writeJSON(KEYS.clients, clients);
    return client;
  }
  function updateClient(id, fields) {
    clients = clients.map(function (c) { return c.id === id ? Object.assign({}, c, fields) : c; });
    writeJSON(KEYS.clients, clients);
  }
  function removeClient(id) {
    clients = clients.filter(function (c) { return c.id !== id; });
    writeJSON(KEYS.clients, clients);
  }
  function addClientActivity(id, entry) {
    clients = clients.map(function (c) {
      if (c.id !== id) return c;
      var activity = [Object.assign({ date: new Date().toISOString() }, entry)].concat(c.activity || []);
      return Object.assign({}, c, { activity: activity });
    });
    writeJSON(KEYS.clients, clients);
  }

  // --- Calendario ---
  function myEvents() {
    var slug = currentSlug();
    return calendarEvents.filter(function (e) { return e.agentSlug === slug; })
      .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
  }
  function createEvent(fields) {
    var event = Object.assign({ id: utils.uid("ev"), agentSlug: currentSlug(), done: false }, fields);
    calendarEvents = calendarEvents.concat([event]);
    writeJSON(KEYS.calendar, calendarEvents);
    return event;
  }
  function toggleEventDone(id) {
    calendarEvents = calendarEvents.map(function (e) { return e.id === id ? Object.assign({}, e, { done: !e.done }) : e; });
    writeJSON(KEYS.calendar, calendarEvents);
  }
  function removeEvent(id) {
    calendarEvents = calendarEvents.filter(function (e) { return e.id !== id; });
    writeJSON(KEYS.calendar, calendarEvents);
  }

  // --- Notificaciones ---
  function myNotifications() {
    var slug = currentSlug();
    return notifications.filter(function (n) { return n.agentSlug === slug; })
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  }
  function unreadCount() { return myNotifications().filter(function (n) { return !n.read; }).length; }
  function markNotificationRead(id) {
    notifications = notifications.map(function (n) { return n.id === id ? Object.assign({}, n, { read: true }) : n; });
    writeJSON(KEYS.notifications, notifications);
  }
  function markAllNotificationsRead() {
    var slug = currentSlug();
    notifications = notifications.map(function (n) { return n.agentSlug === slug ? Object.assign({}, n, { read: true }) : n; });
    writeJSON(KEYS.notifications, notifications);
  }

  // --- Mensajería (mock local, sin backend real) ---
  function myConversations() {
    var slug = currentSlug();
    return conversations.filter(function (c) { return c.agentSlug === slug; });
  }
  function getOrCreateConversation(clientId, clientName) {
    var slug = currentSlug();
    var existing = conversations.filter(function (c) { return c.agentSlug === slug && c.clientId === clientId; })[0];
    if (existing) return existing;
    var conv = { id: utils.uid("conv"), agentSlug: slug, clientId: clientId, clientName: clientName, messages: [] };
    conversations = conversations.concat([conv]);
    writeJSON(KEYS.conversations, conversations);
    return conv;
  }
  function sendMessage(conversationId, from, text) {
    conversations = conversations.map(function (c) {
      if (c.id !== conversationId) return c;
      return Object.assign({}, c, { messages: c.messages.concat([{ from: from, text: text, at: new Date().toISOString() }]) });
    });
    writeJSON(KEYS.conversations, conversations);
  }

  // --- Bolsa Inmobiliaria Compartida (solo Plan Profesional) ---
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

  function setSharing(propertyId, sharingFields) {
    var prop = window.App.state.properties.get(propertyId);
    var sharing = Object.assign({
      enabled: false, totalCommission: 5, collaboratorCommission: 50, fixedAmount: null,
      conditions: '', expiresAt: null, visibility: 'todos', selectedAgentSlugs: []
    }, prop.sharing, sharingFields);
    window.App.state.properties.update(propertyId, { sharing: sharing });
    return sharing;
  }

  function collaborationsForOwnedProperty(propertyId) {
    return collaborations.filter(function (c) { return c.propertyId === propertyId && c.status === 'activa'; });
  }
  function collaboratorsForMyProperties() {
    var slug = currentSlug();
    var myPropertyIds = window.App.state.properties.byAgent(slug).map(function (p) { return p.id; });
    return collaborations.filter(function (c) { return myPropertyIds.indexOf(c.propertyId) !== -1 && c.status === 'activa'; });
  }

  function myCatalogCollaborations() {
    var slug = currentSlug();
    return collaborations.filter(function (c) { return c.collaboratorSlug === slug && c.status === 'activa'; });
  }
  function myCatalog() {
    return myCatalogCollaborations().map(function (c) {
      return { collaboration: c, property: window.App.state.properties.get(c.propertyId) };
    }).filter(function (row) { return row.property; });
  }
  function isInMyCatalog(propertyId) {
    var slug = currentSlug();
    return collaborations.some(function (c) { return c.propertyId === propertyId && c.collaboratorSlug === slug && c.status === 'activa'; });
  }

  function addToCatalog(propertyId) {
    var slug = currentSlug();
    var property = window.App.state.properties.get(propertyId);
    var collab = {
      id: utils.uid("col"), propertyId: propertyId, ownerSlug: property.agentSlug, collaboratorSlug: slug,
      status: requiresRequest(property) ? "pendiente" : "activa",
      requestStatus: requiresRequest(property) ? "pendiente" : "aprobada",
      clientId: null, createdAt: new Date().toISOString(),
      sentCount: 0, viewsCount: 0, contactsCount: 0, visitsScheduled: 0,
      history: [{ action: requiresRequest(property) ? "Solicitud enviada" : "Agregada al catálogo", date: new Date().toISOString() }]
    };
    collaborations = collaborations.concat([collab]);
    writeJSON(KEYS.collaborations, collaborations);

    if (requiresRequest(property)) {
      shareRequests = shareRequests.concat([{
        id: utils.uid("req"), propertyId: propertyId, ownerSlug: property.agentSlug, requesterSlug: slug,
        collaborationId: collab.id, status: "pendiente", createdAt: new Date().toISOString()
      }]);
      writeJSON(KEYS.shareRequests, shareRequests);
    }
    return collab;
  }

  function removeFromCatalog(collaborationId) {
    collaborations = collaborations.map(function (c) {
      return c.id === collaborationId
        ? Object.assign({}, c, { status: "retirada", history: c.history.concat([{ action: "Retirada del catálogo", date: new Date().toISOString() }]) })
        : c;
    });
    writeJSON(KEYS.collaborations, collaborations);
  }

  function pendingRequestsForMe() {
    var slug = currentSlug();
    return shareRequests.filter(function (r) { return r.ownerSlug === slug && r.status === 'pendiente'; });
  }
  function resolveRequest(requestId, approve) {
    var request = shareRequests.filter(function (r) { return r.id === requestId; })[0];
    if (!request) return;
    shareRequests = shareRequests.map(function (r) { return r.id === requestId ? Object.assign({}, r, { status: approve ? 'aprobada' : 'rechazada' }) : r; });
    writeJSON(KEYS.shareRequests, shareRequests);
    collaborations = collaborations.map(function (c) {
      if (c.id !== request.collaborationId) return c;
      return Object.assign({}, c, {
        status: approve ? 'activa' : 'retirada',
        requestStatus: approve ? 'aprobada' : 'rechazada',
        history: c.history.concat([{ action: approve ? 'Solicitud aprobada' : 'Solicitud rechazada', date: new Date().toISOString() }])
      });
    });
    writeJSON(KEYS.collaborations, collaborations);
  }

  function mySettlements() {
    var slug = currentSlug();
    return settlements.filter(function (s) { return s.ownerSlug === slug || s.collaboratorSlug === slug; });
  }
  function createSettlement(fields) {
    var settlement = Object.assign({
      id: utils.uid("liq"), paymentStatus: "pendiente", paymentDate: null, createdAt: new Date().toISOString()
    }, fields);
    settlements = settlements.concat([settlement]);
    writeJSON(KEYS.settlements, settlements);
    return settlement;
  }
  function markSettlementPaid(id) {
    settlements = settlements.map(function (s) { return s.id === id ? Object.assign({}, s, { paymentStatus: 'pagada', paymentDate: new Date().toISOString() }) : s; });
    writeJSON(KEYS.settlements, settlements);
  }

  window.App.agent.state = {
    clients: {
      all: myClients, get: getClient, create: createClient, update: updateClient,
      remove: removeClient, addActivity: addClientActivity
    },
    calendar: {
      all: myEvents, create: createEvent, toggleDone: toggleEventDone, remove: removeEvent
    },
    notifications: {
      all: myNotifications, unreadCount: unreadCount,
      markRead: markNotificationRead, markAllRead: markAllNotificationsRead
    },
    messages: {
      all: myConversations, getOrCreate: getOrCreateConversation, send: sendMessage
    },
    sharedPool: {
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
