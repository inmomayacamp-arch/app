// Vista "Dashboard principal" del admin.
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

    var content =
      '<div class="admin-kpi-grid">' +
      ac.kpiCardHTML('users', u.formatNumber(k.totalUsers), 'Usuarios registrados') +
      ac.kpiCardHTML('briefcase', u.formatNumber(k.totalAgents), 'Agentes inmobiliarios') +
      ac.kpiCardHTML('home', u.formatNumber(k.totalOwners), 'Propietarios particulares') +
      ac.kpiCardHTML('map', u.formatNumber(k.totalProperties), 'Propiedades publicadas') +
      ac.kpiCardHTML('chart', u.formatNumber(k.forSale), 'En venta') +
      ac.kpiCardHTML('chart', u.formatNumber(k.forRent), 'En renta') +
      ac.kpiCardHTML('starFilled', u.formatNumber(k.featured), 'Destacadas') +
      ac.kpiCardHTML('flag', u.formatNumber(k.pendingProperties), 'Pendientes de aprobación') +
      ac.kpiCardHTML('x', u.formatNumber(k.rejectedProperties), 'Rechazadas') +
      ac.kpiCardHTML('users', u.formatNumber(k.newUsers), 'Usuarios nuevos (30 días)') +
      ac.kpiCardHTML('briefcase', u.formatNumber(k.newAgents), 'Solicitudes de agente') +
      ac.kpiCardHTML('dollar', u.formatPrice(k.monthlyRevenue), 'Ingresos del mes') +
      ac.kpiCardHTML('dollar', u.formatPrice(k.annualRevenue), 'Ingresos del año') +
      ac.kpiCardHTML('link', u.formatNumber(k.activeSubscriptions), 'Suscripciones activas') +
      ac.kpiCardHTML('clock', u.formatNumber(k.expiredSubscriptions), 'Suscripciones vencidas') +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div><div class="admin-section__title">Acciones pendientes</div><div class="admin-section__subtitle">Elementos que necesitan tu revisión</div></div></div>' +
      '  <div class="admin-kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">' +
      '    <a class="dashboard-card" href="#/admin/agentes"><span class="dashboard-card__icon">' + u.icon('briefcase', { size: 26 }) + '</span><strong>' + s.agents.pending().length + ' solicitudes de agente</strong><span>Revisar y aprobar</span></a>' +
      '    <a class="dashboard-card" href="#/admin/propiedades"><span class="dashboard-card__icon">' + u.icon('flag', { size: 26 }) + '</span><strong>' + s.properties.pending().length + ' propiedades por aprobar</strong><span>Revisar publicaciones nuevas</span></a>' +
      '    <a class="dashboard-card" href="#/admin/moderacion"><span class="dashboard-card__icon">' + u.icon('flag', { size: 26 }) + '</span><strong>' + s.reports.all().filter(function (r) { return r.status === 'pendiente'; }).length + ' reportes sin resolver</strong><span>Contenido reportado</span></a>' +
      '    <a class="dashboard-card" href="#/admin/pagos"><span class="dashboard-card__icon">' + u.icon('dollar', { size: 26 }) + '</span><strong>' + s.payments.all().filter(function (p) { return p.status === 'pendiente'; }).length + ' pagos pendientes</strong><span>Ver detalle de pagos</span></a>' +
      '  </div>' +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Propiedades por ciudad</div></div>' +
      ac.hbarListHTML(cityData) +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Propiedades por tipo</div></div>' +
      ac.hbarListHTML(typeData) +
      '</div>';

    ac.mount('dashboard', 'Dashboard', content, root);
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.dashboard = { render: render };
})();
