// Vista "Propiedades": listado completo con orden y filtros.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  var SORTERS = {
    cercanas: { label: "Más cercanas", fn: function (a, b) { return (a._dist == null ? Infinity : a._dist) - (b._dist == null ? Infinity : b._dist); } },
    recientes: { label: "Más recientes", fn: function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); } },
    precioAsc: { label: "Precio: menor a mayor", fn: function (a, b) { return a.price - b.price; } },
    precioDesc: { label: "Precio: mayor a menor", fn: function (a, b) { return b.price - a.price; } }
  };

  function render(params, root) {
    var handoff = state.filters.take();
    var filters = handoff || u.defaultFilters();
    if (!handoff) filters.city = state.city.get();
    var mapCtrl = null;
    var nearCoords = null;
    if (params && params.query && params.query.near) {
      var parts = params.query.near.split(',').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) nearCoords = parts;
    }
    var sortKey = nearCoords ? "cercanas" : "recientes";
    var sortKeys = nearCoords ? Object.keys(SORTERS) : Object.keys(SORTERS).filter(function (k) { return k !== 'cercanas'; });

    root.innerHTML =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/" aria-label="Volver al mapa">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Propiedades (<span data-total>0</span>)</h1>' +
      '  <a class="btn btn--outline btn--sm" href="#/">' + u.icon('map', { size: 15 }) + ' Mapa</a>' +
      '</div>' +
      '<div class="explore-layout" style="grid-template-areas:\'map\' \'list\'">' +
      '  <div class="explore-map"><div class="map-canvas" data-map></div></div>' +
      '  <div class="explore-list"><div class="page-wrap">' +
      (nearCoords ? '<p class="text-muted" style="font-size:0.82rem;margin:-4px 0 12px">' + u.icon('locate', { size: 13 }) + ' Ordenadas por cercanía a tu ubicación</p>' : '') +
      '  <div class="row gap-2" style="margin-bottom:10px">' +
      '    <select class="city-chip" data-city-select aria-label="Ciudad">' +
      '      <option value="">Ciudad</option>' +
      Object.keys(window.APP_CONFIG.CITY_CENTERS).map(function (k) {
        return '<option value="' + k + '"' + (filters.city === k ? ' selected' : '') + '>' + u.escapeHtml(window.APP_CONFIG.CITY_CENTERS[k].label) + '</option>';
      }).join('') +
      '    </select>' +
      '  </div>' +
      '  <div class="chip-row" style="margin-bottom:12px">' + c.quickFilterChipsHTML(filters.operation) + '</div>' +
      '  <div class="row gap-2" style="justify-content:space-between;flex-wrap:wrap;margin-bottom:14px">' +
      '    <select data-sort aria-label="Ordenar por" style="border:1px solid var(--color-border-strong);border-radius:var(--radius-full);padding:9px 14px;font-weight:700;font-size:0.85rem;background:var(--color-surface)">' +
      sortKeys.map(function (key) { return '<option value="' + key + '"' + (key === sortKey ? ' selected' : '') + '>' + SORTERS[key].label + '</option>'; }).join('') +
      '    </select>' +
      '    <button type="button" class="btn btn--outline btn--sm" data-open-filters>' + u.icon('sliders', { size: 15 }) + ' Filtros</button>' +
      '  </div>' +
      '  <div class="stack gap-2" data-list></div>' +
      '  </div></div>' +
      '</div>';

    c.mountChrome('properties');
    document.title = 'InmoMaps — Propiedades';

    function onSelectProperty(property) {
      window.location.hash = '#/propiedad/' + property.id;
    }

    mapCtrl = window.App.map.create(u.qs('[data-map]', root), {});
    window.App.router.onLeave(function () { mapCtrl.destroy(); });

    function refresh() {
      var list = u.applyFilters(state.properties.publicList(), filters);
      if (nearCoords) {
        list = list.map(function (p) { return Object.assign({}, p, { _dist: p.coords ? u.distanceKm(nearCoords, p.coords) : null }); });
      }
      list = list.sort(SORTERS[sortKey].fn);
      u.qs('[data-total]', root).textContent = list.length;
      u.qs('[data-list]', root).innerHTML = list.length
        ? list.map(function (p) { return c.propertyCardHTML(p, { variant: 'row' }); }).join('')
        : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('search', { size: 32 }) + '</span><h3>Sin resultados</h3><p>Prueba con otros filtros para ver más propiedades.</p></div>';
      if (mapCtrl.ready) {
        mapCtrl.setMarkers(list, onSelectProperty);
        mapCtrl.fitToProperties(list);
      }
    }

    refresh();
    c.bindQuickFilterChips(root, filters, refresh);

    u.qs('[data-city-select]', root).addEventListener('change', function (e) {
      var key = e.target.value || null;
      state.city.set(key);
      filters.city = key;
      refresh();
    });

    u.qs('[data-sort]', root).addEventListener('change', function (e) {
      sortKey = e.target.value;
      refresh();
    });

    u.qs('[data-open-filters]', root).addEventListener('click', function () {
      c.openFilterSheet(filters, state.properties.publicList(), function (applied) {
        filters = applied;
        refresh();
      });
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.propertyList = { render: render };
})();
