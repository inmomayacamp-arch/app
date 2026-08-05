// Vista "Explorar": mapa a pantalla completa como eje central de la navegación.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var data = window.App.data;

  var CATEGORIES = [
    { type: "casa", label: "Casas", icon: "home", color: "var(--color-primary)", bg: "var(--color-primary-light)" },
    { type: "departamento", label: "Deptos.", icon: "layers", color: "var(--color-renta)", bg: "var(--color-renta-bg)" },
    { type: "terreno", label: "Terrenos", icon: "map", color: "var(--color-terreno)", bg: "var(--color-terreno-bg)" },
    { type: "local", label: "Locales", icon: "store", color: "var(--color-otro)", bg: "var(--color-otro-bg)" },
    { type: "oficina", label: "Oficinas", icon: "briefcase", color: "var(--color-venta)", bg: "var(--color-venta-bg)" }
  ];

  function render(params, root) {
    var filters = u.defaultFilters();
    var mapCtrl = null;
    var boundsOnly = false;

    function visibleProperties() {
      var base = state.properties.all();
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
      '  <div class="explore-search">' +
      '    <div class="row gap-2" style="align-items:center">' +
      '    <div class="chip-row" data-quick-ops style="flex:1;min-width:0">' +
      '      <button type="button" class="chip is-active" data-op="todas">Todos</button>' +
      '      <button type="button" class="chip" data-op="venta"><span class="map-legend__dot" style="background:var(--color-venta)"></span>Venta</button>' +
      '      <button type="button" class="chip" data-op="renta"><span class="map-legend__dot" style="background:var(--color-renta)"></span>Renta</button>' +
      '      <button type="button" class="chip" data-type-quick="terreno"><span class="map-legend__dot" style="background:var(--color-terreno)"></span>Terrenos</button>' +
      '      <button type="button" class="chip" data-type-quick="local"><span class="map-legend__dot" style="background:var(--color-otro)"></span>Locales</button>' +
      '    </div>' +
      '    <button type="button" class="btn btn--icon" data-open-filters aria-label="Buscar y filtrar">' + u.icon('sliders', { size: 18 }) + '</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="explore-map">' +
      '    <div class="map-canvas" data-map></div>' +
      '    <button type="button" class="search-this-area" data-search-area hidden>' + u.icon('search', { size: 14 }) + ' Buscar en esta área</button>' +
      '    <div class="map-legend">' +
      '      <span class="map-legend__item"><span class="map-legend__dot" style="background:var(--color-venta)"></span>Venta</span>' +
      '      <span class="map-legend__item"><span class="map-legend__dot" style="background:var(--color-renta)"></span>Renta</span>' +
      '      <span class="map-legend__item"><span class="map-legend__dot" style="background:var(--color-terreno)"></span>Terreno</span>' +
      '      <span class="map-legend__item"><span class="map-legend__dot" style="background:var(--color-otro)"></span>Otro</span>' +
      '    </div>' +
      '    <div class="map-controls"><button type="button" class="btn btn--icon" data-locate aria-label="Usar mi ubicación">' + u.icon('locate', { size: 18 }) + '</button></div>' +
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
      CATEGORIES.map(function (cat) {
        return '<button type="button" class="category-card" data-category="' + cat.type + '" style="--cat-color:' + cat.color + ';--cat-bg:' + cat.bg + '">' +
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
    document.title = 'InmoMap — Explorar propiedades en el mapa';

    mapCtrl = window.App.map.create(u.qs('[data-map]', root), {});

    function isDesktop() { return window.matchMedia('(min-width: 900px)').matches; }

    function onSelectProperty(property) {
      if (isDesktop()) {
        var card = u.qs('.property-card[data-property-id="' + property.id + '"]', root);
        if (card) {
          u.qsa('.property-card.is-highlighted', root).forEach(function (el) { el.classList.remove('is-highlighted'); });
          card.classList.add('is-highlighted');
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        c.openPropertyPeek(property);
      }
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

    refreshList();

    // Chips rápidos de operación / tipo
    u.qsa('[data-op]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.operation = btn.getAttribute('data-op');
        filters.types = [];
        u.qsa('[data-op]', root).forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        u.qsa('[data-type-quick]', root).forEach(function (b) { b.classList.remove('is-active'); });
        refreshList();
      });
    });
    u.qsa('[data-type-quick]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var type = btn.getAttribute('data-type-quick');
        var active = btn.classList.toggle('is-active');
        filters.types = active ? [type] : [];
        u.qsa('[data-op]', root).forEach(function (b) { b.classList.remove('is-active'); });
        if (!active) u.qs('[data-op="todas"]', root).classList.add('is-active');
        refreshList();
      });
    });

    // Búsqueda y filtros avanzados
    u.qs('[data-open-filters]', root).addEventListener('click', function () {
      c.openFilterSheet(filters, state.properties.all(), function (applied) {
        filters = applied;
        refreshList();
      });
    });

    // Categorías
    u.qsa('[data-category]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.types = [btn.getAttribute('data-category')];
        filters.operation = 'todas';
        refreshList();
        u.qs('.explore-map', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Buscar en esta área (al mover el mapa)
    var searchAreaBtn = u.qs('[data-search-area]', root);
    if (mapCtrl.ready) {
      mapCtrl.map.on('dragend', function () { searchAreaBtn.hidden = false; });
      mapCtrl.map.on('zoomend', function () { searchAreaBtn.hidden = false; });
    }
    searchAreaBtn.addEventListener('click', function () {
      boundsOnly = true;
      searchAreaBtn.hidden = true;
      refreshList();
    });

    // Ubicación del usuario
    u.qs('[data-locate]', root).addEventListener('click', function () {
      if (!mapCtrl.ready) { u.toast('Configura tu token de Mapbox para usar la ubicación.'); return; }
      if (!navigator.geolocation) { u.toast('Tu navegador no soporta geolocalización.'); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        mapCtrl.flyTo([pos.coords.longitude, pos.coords.latitude], 14);
      }, function () {
        u.toast('No pudimos acceder a tu ubicación.');
      });
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.explore = { render: render };
})();
