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

  var TYPE_ICONS = { casa: "home", departamento: "layers", terreno: "map", local: "store", oficina: "briefcase" };
  var PRICE_ZOOM_THRESHOLD = 15;

  function priceBubbleEl(property, opts) {
    opts = opts || {};
    var colorVar = utils.typeColorVar(property.type, property.operation);
    var el = document.createElement('button');
    el.type = 'button';
    el.style.setProperty('--pin-color', 'var(' + colorVar + ')');
    var label = property.operation === 'renta'
      ? utils.formatPrice(property.price) + '/mes'
      : utils.formatPrice(property.price);
    var showPrice = !opts.compact && opts.mode !== 'icon';
    el.className = 'map-pin' + (showPrice ? '' : ' map-pin--icon') + (opts.selected ? ' map-pin--selected' : '');
    el.innerHTML = opts.compact
      ? '<span class="map-pin__dot"></span>'
      : showPrice
        ? '<span class="map-pin__label">' + utils.escapeHtml(opts.short ? utils.formatCompact(property.price) : label) + '</span>'
        : '<span class="map-pin__icon">' + utils.icon(TYPE_ICONS[property.type] || 'home', { size: 14 }) + '</span>';
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
    // En pantallas táctiles, mover el mapa con un dedo compite con el scroll de la
    // página. Con dos dedos se evita esa trampa; en mouse/escritorio no se toca nada.
    var isTouchDevice = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var map = new mapboxgl.Map({
      container: container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: opts.center || window.APP_CONFIG.DEFAULT_CENTER,
      zoom: opts.zoom || window.APP_CONFIG.DEFAULT_ZOOM,
      attributionControl: true,
      cooperativeGestures: isTouchDevice
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    var markers = [];
    var lastProperties = [];
    var lastOnSelect = null;

    function clearMarkers() {
      markers.forEach(function (m) { m.remove(); });
      markers = [];
    }

    function pinMode() {
      if (opts.compactPins) return 'compact';
      return map.getZoom() >= PRICE_ZOOM_THRESHOLD ? 'price' : 'icon';
    }

    function setMarkers(properties, onSelect) {
      lastProperties = properties;
      lastOnSelect = onSelect;
      clearMarkers();
      var mode = pinMode();
      properties.forEach(function (property) {
        if (!property.coords) return;
        var el = priceBubbleEl(property, { compact: opts.compactPins, mode: mode });
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

    // Al cruzar el umbral de zoom, los pines cambian de ícono a precio (o viceversa).
    var currentMode = pinMode();
    map.on('zoomend', function () {
      var mode = pinMode();
      if (mode !== currentMode) {
        currentMode = mode;
        if (lastProperties.length) setMarkers(lastProperties, lastOnSelect);
      }
    });

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
