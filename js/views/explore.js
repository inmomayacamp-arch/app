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
      '      <div class="map-brand-badge">' + u.logoHTML() + '</div>' +
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
      '        <button type="button" class="category-card" data-nearby style="--cat-color:var(--color-primary);--cat-bg:var(--color-primary-light)">' +
      '          <span class="category-card__icon">' + u.icon('locate', { size: 22 }) + '</span><strong>Cerca de ti</strong></button>' +
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
    document.title = 'InmoMaps — Explorar propiedades en el mapa';

    mapCtrl = window.App.map.create(u.qs('[data-map]', root), { showLocate: true });

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

    // Categorías
    u.qsa('[data-category]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.types = [btn.getAttribute('data-category')];
        filters.operation = 'todas';
        refreshList();
        u.qs('.explore-map', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    var nearbyBtn = u.qs('[data-nearby]', root);
    if (nearbyBtn) nearbyBtn.addEventListener('click', function () {
      if (!navigator.geolocation) { u.toast('Tu navegador no soporta geolocalización.'); return; }
      nearbyBtn.disabled = true;
      navigator.geolocation.getCurrentPosition(function (pos) {
        window.location.hash = '#/propiedades?near=' + pos.coords.longitude + ',' + pos.coords.latitude;
      }, function () {
        nearbyBtn.disabled = false;
        u.toast('No pudimos acceder a tu ubicación.');
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

  }

  window.App.views = window.App.views || {};
  window.App.views.explore = { render: render };
})();
