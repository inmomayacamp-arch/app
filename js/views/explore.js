// Vista "Explorar": mapa a pantalla completa como eje central de la navegación.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var data = window.App.data;

  // Directorio de servicios inmobiliarios (notario, valuadores, etc.): todavía
  // no existe un directorio real detrás de estas categorías, así que por ahora
  // solo avisan que viene pronto. Cuando se construya esa sección, este es el
  // lugar para cambiar el handler de "data-service" por una navegación real.
  // Radio máximo (km) para asumir que alguien "está" en una de las 3 ciudades
  // soportadas, tanto por geolocalización real como por arrastrar el mapa.
  // Fuera de ese radio no se fuerza ninguna ciudad.
  var AUTO_CITY_RADIUS_KM = 60;

  var SERVICE_CATEGORIES = [
    { key: "notario", label: "Notario", icon: "award", color: "var(--color-otro)", bg: "var(--color-otro-bg)" },
    { key: "valuadores", label: "Valuadores", icon: "clipboard", color: "var(--color-terreno)", bg: "var(--color-terreno-bg)" },
    { key: "arquitectos", label: "Arquitectos", icon: "penTool", color: "var(--color-renta)", bg: "var(--color-renta-bg)" },
    { key: "servicios", label: "Servicios", icon: "tool", color: "var(--color-venta)", bg: "var(--color-venta-bg)" },
    { key: "sofom", label: "SOFOM", icon: "dollar", color: "var(--color-primary)", bg: "var(--color-primary-light)" }
  ];

  function render(params, root) {
    var filters = u.defaultFilters();
    filters.city = state.city.get();
    var mapCtrl = null;
    var boundsOnly = false;
    var cityCenters = window.APP_CONFIG.CITY_CENTERS;

    function visibleProperties() {
      var base = state.properties.publicList();
      var filtered = u.applyFilters(base, filters);
      if (filters.searchText && filters.searchText.trim()) {
        var q = filters.searchText.trim().toLowerCase();
        filtered = filtered.filter(function (p) {
          return (p.title + ' ' + p.neighborhood + ' ' + p.city).toLowerCase().indexOf(q) !== -1;
        });
      }
      if (boundsOnly && mapCtrl && mapCtrl.ready) {
        var bounds = mapCtrl.map.getBounds();
        filtered = filtered.filter(function (p) { return p.coords && bounds.contains(p.coords); });
      }
      return filtered;
    }

    root.innerHTML =
      '<div class="explore-layout">' +
      '  <div class="explore-map">' +
      '    <div class="map-canvas" data-map></div>' +
      '    <div class="map-top-overlay">' +
      '      <div class="row" style="justify-content:space-between;align-items:center;width:100%">' +
      '        <div class="map-brand-badge">' + u.logoHTML() + '</div>' +
      '        <select class="city-chip" data-city-select aria-label="Ciudad">' +
      '          <option value="">Ciudad</option>' +
      Object.keys(cityCenters).map(function (key) {
        return '<option value="' + key + '"' + (filters.city === key ? ' selected' : '') + '>' + u.escapeHtml(cityCenters[key].label) + '</option>';
      }).join('') +
      '        </select>' +
      '      </div>' +
      '      <div class="map-chip-overlay">' +
      '        <div class="chip-row" data-quick-ops style="flex:1;min-width:0">' +
      c.quickFilterChipsHTML() +
      '        </div>' +
      '        <button type="button" class="btn btn--icon" data-open-filters aria-label="Buscar y filtrar">' + u.icon('sliders', { size: 18 }) + '</button>' +
      '      </div>' +
      '    </div>' +
      '    <button type="button" class="search-this-area" data-search-area hidden>' + u.icon('search', { size: 14 }) + ' Buscar en esta área</button>' +
      '    <div class="map-legend">' +
      '      <span class="map-legend__item"><span class="map-legend__dot" style="background:var(--color-primary)"></span>Venta</span>' +
      '      <span class="map-legend__item"><span class="map-legend__dot" style="background:var(--color-renta)"></span>Renta</span>' +
      '    </div>' +
      '  </div>' +
      '  <div class="explore-list">' +
      '    <div class="explore-list__inner">' +
      '      <div class="row" style="justify-content:space-between;align-items:center;margin-top:4px">' +
      '        <h2 class="section-title" style="margin:0">Propiedades destacadas (<span data-count>0</span>)</h2>' +
      '        <a href="#/propiedades" class="text-muted" style="font-weight:700;font-size:0.85rem">Ver todas</a>' +
      '      </div>' +
      '      <div class="property-scroller" data-list></div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="explore-discover">' +
      '    <div class="container">' +
      '      <h2 class="section-title" style="margin-top:20px">Explorar por categoría</h2>' +
      '      <div class="category-grid" data-categories>' +
      '        <button type="button" class="category-card" data-all-properties style="--cat-color:var(--color-primary);--cat-bg:var(--color-primary-light)">' +
      '          <span class="category-card__icon">' + u.icon('home', { size: 22 }) + '</span><strong>Ver todas las casas</strong></button>' +
      SERVICE_CATEGORIES.map(function (cat) {
        return '<button type="button" class="category-card" data-service="' + cat.key + '" style="--cat-color:' + cat.color + ';--cat-bg:' + cat.bg + '">' +
          '<span class="category-card__icon">' + u.icon(cat.icon, { size: 22 }) + '</span><strong>' + cat.label + '</strong></button>';
      }).join('') +
      '      </div>' +

      '      <div class="promo-card" style="margin-top:20px">' +
      '        <span class="promo-card__icon">' + u.icon('search', { size: 28 }) + '</span>' +
      '        <div class="promo-card__body">' +
      '          <strong>¿No encontraste la propiedad que buscabas?</strong>' +
      '          <p>Cuéntanos qué necesitas y te avisamos en cuanto se publique algo parecido.</p>' +
      '          <a class="btn btn--primary btn--sm" href="#/solicitud">' + u.icon('chat', { size: 14 }) + ' Dejar mi solicitud</a>' +
      '        </div>' +
      '      </div>' +

      '      <p class="explore-discover__support">' + u.icon('flag', { size: 13 }) + ' ¿Necesitas ayuda o quieres reportar un problema? <a href="#/soporte">Contactar al administrador</a></p>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    c.mountChrome('explore');
    document.title = 'InmoMaps — Explorar propiedades en el mapa';

    var initialCity = filters.city && cityCenters[filters.city];
    mapCtrl = window.App.map.create(u.qs('[data-map]', root), Object.assign({ showLocate: true }, initialCity ? { center: initialCity.center, zoom: initialCity.zoom } : {}));

    function onSelectProperty(property) {
      window.location.hash = '#/propiedad/' + property.id;
    }

    function refreshList() {
      // El mapa siempre muestra todas las propiedades disponibles que cumplen los filtros:
      // el mapa es el elemento visual principal de la app.
      var mapList = visibleProperties();
      if (mapCtrl.ready) mapCtrl.setMarkers(mapList, onSelectProperty);

      // La lista de abajo solo muestra una selección curada (destacadas), máximo 10,
      // para mantener el foco en el mapa.
      var featuredList = mapList.filter(function (p) { return p.featured; }).slice(0, 10);
      u.qs('[data-count]', root).textContent = featuredList.length;
      u.qs('[data-list]', root).innerHTML = featuredList.length
        ? featuredList.map(function (p) { return c.propertyCardHTML(p, { variant: 'grid' }); }).join('')
        : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('search', { size: 32 }) + '</span><h3>Sin destacadas para estos filtros</h3><p>Ajusta los filtros o revisa el mapa para ver todas las propiedades disponibles.</p></div>';
    }

    // Encuentra la ciudad soportada más cercana a un punto [lng, lat]; null si
    // ninguna está dentro de AUTO_CITY_RADIUS_KM (evita forzar una ciudad a
    // alguien que está lejos de las 3, por geolocalización o por el mapa).
    function nearestCityKey(coords) {
      var best = null, bestDist = Infinity;
      Object.keys(cityCenters).forEach(function (k) {
        var d = u.distanceKm(coords, cityCenters[k].center);
        if (d < bestDist) { bestDist = d; best = k; }
      });
      return bestDist <= AUTO_CITY_RADIUS_KM ? best : null;
    }

    // Fuente única de verdad para activar una ciudad: la usan el <select>, el
    // arrastre del mapa y la geolocalización inicial, para no repetir el
    // mismo bloque tres veces.
    function applyCity(key) {
      state.city.set(key);
      filters.city = key;
      var select = u.qs('[data-city-select]', root);
      if (select) select.value = key || '';
      refreshList();
    }

    refreshList();

    // Chips rápidos de operación / tipo
    c.bindQuickFilterChips(root, filters, refreshList);

    // Búsqueda y filtros avanzados
    u.qs('[data-open-filters]', root).addEventListener('click', function () {
      c.openFilterSheet(filters, state.properties.publicList(), function (applied) {
        filters = applied;
        refreshList();
      });
    });

    // Ciudad: filtra las propiedades disponibles y mueve el mapa a esa ciudad
    u.qs('[data-city-select]', root).addEventListener('change', function (e) {
      var key = e.target.value || null;
      applyCity(key);
      if (key && mapCtrl.ready) mapCtrl.flyTo(cityCenters[key].center, cityCenters[key].zoom);
    });

    // Categorías
    var allPropertiesBtn = u.qs('[data-all-properties]', root);
    if (allPropertiesBtn) allPropertiesBtn.addEventListener('click', function () {
      filters.types = [];
      filters.operation = 'todas';
      refreshList();
      u.qs('.explore-map', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    u.qsa('[data-service]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = SERVICE_CATEGORIES.filter(function (c) { return c.key === btn.getAttribute('data-service'); })[0];
        u.toast((cat ? cat.label : 'Este directorio') + ': muy pronto disponible.');
      });
    });

    // Buscar en esta área (al mover el mapa)
    var searchAreaBtn = u.qs('[data-search-area]', root);
    if (mapCtrl.ready) {
      mapCtrl.map.on('dragend', function () { searchAreaBtn.hidden = false; });
      mapCtrl.map.on('zoomend', function () { searchAreaBtn.hidden = false; });
      // Si al soltar el mapa quedó cerca de otra de las 3 ciudades soportadas,
      // el chip "Ciudad" y el filtro la siguen solos — sin volver a centrar el
      // mapa, porque el usuario ya está viendo esa zona.
      mapCtrl.map.on('moveend', function () {
        var center = mapCtrl.map.getCenter();
        var key = nearestCityKey([center.lng, center.lat]);
        if (key && key !== filters.city) applyCity(key);
      });
    }
    searchAreaBtn.addEventListener('click', function () {
      boundsOnly = true;
      searchAreaBtn.hidden = true;
      refreshList();
    });

    // Al entrar sin ninguna ciudad activa, se detecta la ubicación real para
    // arrancar ya filtrado ahí. Silencioso si se niega el permiso o no hay
    // soporte: es una detección en segundo plano, no una acción que el
    // usuario pidió a propósito (a diferencia del antiguo botón "Cerca de
    // ti"). Si ya había una ciudad activa, no se vuelve a preguntar — no se
    // le pisa la elección solo por volver a entrar a la página.
    if (!filters.city && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (pos) {
        var key = nearestCityKey([pos.coords.longitude, pos.coords.latitude]);
        if (key) {
          applyCity(key);
          if (mapCtrl.ready) mapCtrl.flyTo(cityCenters[key].center, cityCenters[key].zoom);
          u.toast('Te mostramos propiedades en ' + cityCenters[key].label + ' según tu ubicación.');
        }
      }, function () { /* permiso denegado o error: sin aviso, queda como estaba */ });
    }
  }

  window.App.views = window.App.views || {};
  window.App.views.explore = { render: render };
})();
