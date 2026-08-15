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

  function LocateControl() {}
  LocateControl.prototype.onAdd = function (map) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mapboxgl-ctrl-icon';
    btn.setAttribute('aria-label', 'Usar mi ubicación');
    btn.innerHTML = utils.icon('locate', { size: 18 });
    btn.addEventListener('click', function () {
      if (!navigator.geolocation) { utils.toast('Tu navegador no soporta geolocalización.'); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 14, essential: true });
      }, function () {
        utils.toast('No pudimos acceder a tu ubicación.');
      });
    });
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this._container.appendChild(btn);
    return this._container;
  };
  LocateControl.prototype.onRemove = function () {
    if (this._container.parentNode) this._container.parentNode.removeChild(this._container);
  };

  // En el mapa, "venta" usa el rojo de marca (no el verde de las etiquetas de
  // propiedad) para que coincida con el chip "Todos"; "renta" conserva su azul.
  function pinColorVar(operation) {
    return operation === 'renta' ? '--color-renta' : '--color-primary';
  }

  function priceBubbleEl(property, opts) {
    opts = opts || {};
    var colorVar = pinColorVar(property.operation);
    var el = document.createElement('button');
    el.type = 'button';
    el.style.setProperty('--pin-color', 'var(' + colorVar + ')');
    var label = property.operation === 'renta'
      ? utils.formatPrice(utils.effectivePrice(property)) + '/mes'
      : utils.formatPrice(utils.effectivePrice(property));
    el.className = 'map-pin' + (opts.compact ? ' map-pin--compact' : '') + (opts.selected ? ' map-pin--selected' : '');
    el.innerHTML = opts.compact
      ? '<span class="map-pin__dot"></span>'
      : '<span class="map-pin__badge">' + utils.brandMark({ size: 13, style: 'color:#fff' }) + '</span>' +
        '<span class="map-pin__price">' + utils.escapeHtml(label) + '</span>';
    el.setAttribute('aria-label', property.title + ', ' + label);
    return el;
  }

  // Pin de proveedor del directorio: un círculo chico con el ícono de su
  // categoría (no una burbuja de precio), para que se lea como una capa
  // distinta a las propiedades sobre el mismo mapa.
  function providerPinEl(provider) {
    var cat = utils.SERVICE_CATEGORIES.filter(function (c) { return c.key === provider.category; })[0] || utils.SERVICE_CATEGORIES[0];
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'map-pin map-pin--provider';
    el.style.setProperty('--pin-color', cat.color);
    el.style.setProperty('--pin-bg', cat.bg);
    el.innerHTML = utils.icon(cat.icon, { size: 15 });
    el.setAttribute('aria-label', provider.name);
    return el;
  }

  function create(container, opts) {
    opts = opts || {};
    if (!isConfigured()) {
      renderFallback(container);
      return {
        ready: false,
        setMarkers: function () {},
        setProviderMarkers: function () {},
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
      attributionControl: true,
      logoPosition: 'bottom-right'
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    if (opts.showLocate) map.addControl(new LocateControl(), 'bottom-right');

    var markers = [];
    var providerMarkers = [];
    var activePopup = null;

    function clearMarkers() {
      markers.forEach(function (m) { m.remove(); });
      markers = [];
    }

    function clearProviderMarkers() {
      providerMarkers.forEach(function (m) { m.remove(); });
      providerMarkers = [];
    }

    function closePeek() {
      if (activePopup) { activePopup.remove(); activePopup = null; }
    }

    // Primer toque en un pin: mini-ficha flotando justo ahí, con la misma
    // tarjeta que se usa en el resto de la app. Tocar la tarjeta (segundo
    // toque) es lo que dispara onSelect y navega a la ficha completa; así
    // cada vista conserva su propia lógica de navegación (p. ej. el enlace
    // de cliente, que agrega su propio parámetro ?from= a la ruta).
    function openPeek(property, onSelect) {
      closePeek();
      var wrap = document.createElement('div');
      wrap.innerHTML = window.App.components.propertyCardHTML(property, { showFavorite: false });
      var cardEl = wrap.firstElementChild;
      cardEl.addEventListener('click', function (e) {
        e.preventDefault();
        closePeek();
        if (onSelect) onSelect(property);
      });
      activePopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 22, maxWidth: '230px', className: 'map-peek-popup' })
        .setLngLat(property.coords)
        .setDOMContent(cardEl)
        .addTo(map);
    }

    // Igual que openPeek, pero con la mini-ficha del directorio (mismo patrón
    // de "primer toque = mini-ficha, tocar la tarjeta = ir a la ficha completa").
    function openProviderPeek(provider, onSelect) {
      closePeek();
      var cat = utils.SERVICE_CATEGORIES.filter(function (c) { return c.key === provider.category; })[0] || utils.SERVICE_CATEGORIES[0];
      var wrap = document.createElement('div');
      wrap.innerHTML = window.App.components.providerCardHTML(provider, cat);
      var cardEl = wrap.firstElementChild;
      cardEl.addEventListener('click', function (e) {
        e.preventDefault();
        closePeek();
        if (onSelect) onSelect(provider);
      });
      activePopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 22, maxWidth: '230px', className: 'map-peek-popup' })
        .setLngLat(provider.coords)
        .setDOMContent(cardEl)
        .addTo(map);
    }

    map.on('click', closePeek);

    function setProviderMarkers(providers, onSelect) {
      clearProviderMarkers();
      providers.forEach(function (provider) {
        if (!provider.coords) return;
        var el = providerPinEl(provider);
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          if (onSelect) openProviderPeek(provider, onSelect);
        });
        var marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(provider.coords)
          .addTo(map);
        providerMarkers.push(marker);
      });
    }

    function setMarkers(properties, onSelect) {
      clearMarkers();
      properties.forEach(function (property) {
        if (!property.coords) return;
        var el = priceBubbleEl(property, { compact: opts.compactPins });
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          if (onSelect) openPeek(property, onSelect);
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
      setProviderMarkers: setProviderMarkers,
      flyTo: flyTo,
      fitToProperties: fitToProperties,
      destroy: function () { closePeek(); clearMarkers(); clearProviderMarkers(); map.remove(); }
    };
  }

  window.App.map = {
    isConfigured: isConfigured,
    create: create
  };
})();
