// Vista "Propiedades": listado completo con orden y filtros.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  var SORTERS = {
    recientes: { label: "Más recientes", fn: function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); } },
    precioAsc: { label: "Precio: menor a mayor", fn: function (a, b) { return a.price - b.price; } },
    precioDesc: { label: "Precio: mayor a menor", fn: function (a, b) { return b.price - a.price; } }
  };

  function render(params, root) {
    var filters = u.defaultFilters();
    var sortKey = "recientes";

    root.innerHTML =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/" aria-label="Volver al mapa">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Propiedades (<span data-total>0</span>)</h1>' +
      '  <a class="btn btn--outline btn--sm" href="#/">' + u.icon('map', { size: 15 }) + ' Mapa</a>' +
      '</div>' +
      '<div class="page-wrap">' +
      '  <div class="row gap-2" style="justify-content:space-between;flex-wrap:wrap;margin-bottom:14px">' +
      '    <select data-sort aria-label="Ordenar por" style="border:1px solid var(--color-border-strong);border-radius:var(--radius-full);padding:9px 14px;font-weight:700;font-size:0.85rem;background:var(--color-surface)">' +
      Object.keys(SORTERS).map(function (key) { return '<option value="' + key + '">' + SORTERS[key].label + '</option>'; }).join('') +
      '    </select>' +
      '    <button type="button" class="btn btn--outline btn--sm" data-open-filters>' + u.icon('sliders', { size: 15 }) + ' Filtros</button>' +
      '  </div>' +
      '  <div class="stack gap-2" data-list></div>' +
      '</div>';

    c.mountChrome('properties');
    document.title = 'InmoMap — Propiedades';

    function refresh() {
      var list = u.applyFilters(state.properties.publicList(), filters).sort(SORTERS[sortKey].fn);
      u.qs('[data-total]', root).textContent = list.length;
      u.qs('[data-list]', root).innerHTML = list.length
        ? list.map(function (p) { return c.propertyCardHTML(p, { variant: 'row' }); }).join('')
        : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('search', { size: 32 }) + '</span><h3>Sin resultados</h3><p>Prueba con otros filtros para ver más propiedades.</p></div>';
    }

    refresh();

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
