// Envoltorio sobre Mapbox GL JS: crea el mapa, dibuja pines de precio y maneja el estado
// de "sin token configurado" mostrando una alternativa clara en vez de romper la app.
(function () {
  "use strict";

  var utils = window.App.utils;

  function isConfigured() {
    return !!(window.APP_CONFIG.MAPBOX_TOKEN && window.APP_CONFIG.MAPBOX_TOKEN.trim());
  }

  function renderFallback(container) {
    container.innerHTML =
      '<div class="map-fallback">' +
      '  <div class="map-fallback__icon">' + utils.icon('map', { size: 32 }) + '</div>' +
      '  <h3>Configura tu token de Mapbox</h3>' +
      '  <p>Para ver el mapa interactivo, crea una cuenta gratuita en <strong>mapbox.com</strong> y pega tu token público en <code>js/config.js</code> (campo <code>MAPBOX_TOKEN</code>).</p>' +
      '  <p class="map-fallback__hint">Mientras tanto, el resto de la app funciona con normalidad usando las listas de propiedades.</p>' +
      '</div>';
  }

  function priceBubbleEl(property, opts) {
    opts = opts || {};
    var colorVar = utils.typeColorVar(property.type, property.operation);
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'map-pin' + (opts.selected ? ' map-pin--selected' : '');
    el.style.setProperty('--pin-color', 'var(' + colorVar + ')');
    var label = property.operation === 'renta'
      ? utils.formatPrice(property.price) + '/mes'
      : utils.formatPrice(property.price);
    el.innerHTML = opts.compact
      ? '<span class="map-pin__dot"></span>'
      : '<span class="map-pin__label">' + utils.escapeHtml(opts.short ? utils.formatCompact(property.price) : label) + '</span>';
    el.setAttribute('aria-label', property.title + ', ' + label);
    return el;
  }

  function create(container, opts) {
    opts = opts || {};
    if (!isConfigured()) {
      renderFallback(container);
      return {
        ready: false,
        setMarkers: function () {},
        flyTo: function () {},
        fitToProperties: function () {},
        destroy: function () {}
      };
    }

    mapboxgl.accessToken = window.APP_CONFIG.MAPBOX_TOKEN;
    var map = new mapboxgl.Map({
      container: container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: opts.center || window.APP_CONFIG.DEFAULT_CENTER,
      zoom: opts.zoom || window.APP_CONFIG.DEFAULT_ZOOM,
      attributionControl: true
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    var markers = [];

    function clearMarkers() {
      markers.forEach(function (m) { m.remove(); });
      markers = [];
    }

    function setMarkers(properties, onSelect) {
      clearMarkers();
      properties.forEach(function (property) {
        if (!property.coords) return;
        var el = priceBubbleEl(property, { compact: opts.compactPins });
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          if (onSelect) onSelect(property);
        });
        var marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(property.coords)
          .addTo(map);
        markers.push(marker);
      });
    }

    function flyTo(coords, zoom) {
      map.flyTo({ center: coords, zoom: zoom || 15, essential: true });
    }

    function fitToProperties(properties) {
      var coords = properties.filter(function (p) { return p.coords; }).map(function (p) { return p.coords; });
      if (!coords.length) return;
      if (coords.length === 1) {
        flyTo(coords[0], 14);
        return;
      }
      var bounds = coords.reduce(function (b, c) { return b.extend(c); }, new mapboxgl.LngLatBounds(coords[0], coords[0]));
      map.fitBounds(bounds, { padding: 64, maxZoom: 15, duration: 0 });
    }

    return {
      ready: true,
      map: map,
      setMarkers: setMarkers,
      flyTo: flyTo,
      fitToProperties: fitToProperties,
      destroy: function () { clearMarkers(); map.remove(); }
    };
  }

  window.App.map = {
    isConfigured: isConfigured,
    create: create
  };
})();
