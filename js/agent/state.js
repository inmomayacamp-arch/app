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
    conversations: "inmomap:agent:conversations"
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
    }
  };
})();
