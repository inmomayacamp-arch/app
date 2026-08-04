// Estado de la aplicación: favoritos, propiedades publicadas y enlaces creados por el asesor.
// Persistido en localStorage para simular un backend real sin necesitar servidor.
(function () {
  "use strict";

  var utils = window.App.utils;
  var data = window.App.data;

  var KEYS = {
    favorites: "inmomap:favorites",
    properties: "inmomap:properties",
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

  // --- Propiedades (mock + publicadas por el usuario) ---
  var customProperties = readJSON(KEYS.properties, []);

  function allProperties() { return data.PROPERTIES.concat(customProperties); }
  function getProperty(id) {
    return allProperties().filter(function (p) { return p.id === id; })[0] || null;
  }
  function propertiesByAgent(slug) {
    return allProperties().filter(function (p) { return p.agentSlug === slug; });
  }
  function publishProperty(payload) {
    var property = Object.assign({
      id: utils.uid("p"),
      agentSlug: window.APP_CONFIG.CURRENT_AGENT_SLUG,
      createdAt: new Date().toISOString(),
      photos: payload.photos && payload.photos.length ? payload.photos : ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"],
      features: []
    }, payload);
    customProperties = customProperties.concat([property]);
    writeJSON(KEYS.properties, customProperties);
    emit("properties:change", customProperties);
    return property;
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
      agentSlug: window.APP_CONFIG.CURRENT_AGENT_SLUG,
      clientSlug: clientSlug,
      clientLabel: payload.clientLabel,
      propertyIds: payload.propertyIds,
      createdAt: new Date().toISOString(),
      stats: {
        views: 0, viewsDelta: 0,
        avgTimeMinutes: 0, avgTimeDelta: 0,
        propertiesViewed: 0, propertiesViewedDelta: 0,
        contacts: 0, contactsDelta: 0,
        lastVisit: null,
        returningVisits: 0,
        mostViewed: []
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
    properties: {
      all: allProperties,
      get: getProperty,
      byAgent: propertiesByAgent,
      publish: publishProperty
    },
    links: {
      all: allLinks,
      byAgent: linksByAgent,
      get: getLink,
      create: createLink
    }
  };
})();
