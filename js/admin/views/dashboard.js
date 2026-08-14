// Vista "Dashboard" del admin: KPIs reales + tarjetas de acceso a cada
// sección, igual que la pantalla de inicio del panel del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function render(params, root) {
    var k = s.kpis();
    var properties = s.properties.all();

    var byCity = {};
    properties.forEach(function (p) { byCity[p.city] = (byCity[p.city] || 0) + 1; });
    var cityData = Object.keys(byCity).map(function (city) { return { label: city, value: byCity[city] }; });

    var byType = {};
    properties.forEach(function (p) { byType[u.propertyTypeLabel(p.type)] = (byType[u.propertyTypeLabel(p.type)] || 0) + 1; });
    var typeData = Object.keys(byType).map(function (type) { return { label: type, value: byType[type] }; });

    var tiles = ac.NAV.filter(function (item) { return item.route !== 'dashboard'; }).map(function (item) {
      return '<a class="dashboard-card" href="' + item.href + '"><span class="dashboard-card__icon">' + u.icon(item.icon, { size: 26 }) + '</span><strong>' + item.label + '</strong></a>';
    }).join('');

    var content =
      '<div class="admin-kpi-grid">' +
      ac.kpiCardHTML('briefcase', u.formatNumber(k.totalAgents), 'Agentes inmobiliarios') +
      ac.kpiCardHTML('home', u.formatNumber(k.totalOwners), 'Propietarios particulares') +
      ac.kpiCardHTML('map', u.formatNumber(k.totalProperties), 'Propiedades publicadas') +
      ac.kpiCardHTML('chart', u.formatNumber(k.forSale), 'En venta') +
      ac.kpiCardHTML('chart', u.formatNumber(k.forRent), 'En renta') +
      ac.kpiCardHTML('starFilled', u.formatNumber(k.featured), 'Destacadas') +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Secciones</div></div>' +
      '  <div class="dashboard-grid">' + tiles + '</div>' +
      '</div>' +

      (cityData.length ?
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Propiedades por ciudad</div></div>' +
        ac.hbarListHTML(cityData) +
        '</div>' : '') +

      (typeData.length ?
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Propiedades por tipo</div></div>' +
        ac.hbarListHTML(typeData) +
        '</div>' : '');

    ac.mount('dashboard', 'Dashboard', content, root);
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.dashboard = { render: render };
})();
