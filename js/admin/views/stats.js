// Vista "Estadísticas" avanzadas del admin.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;
  var data = window.App.data;

  var MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  function render(params, root) {
    var users = s.users.all();
    var agents = s.agents.all();
    var k = s.kpis();

    var byMonth = {};
    users.forEach(function (usr) {
      var d = new Date(usr.createdAt);
      var key = MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    var monthData = Object.keys(byMonth).map(function (key) { return { label: key, value: byMonth[key] }; });

    var byCity = {};
    agents.forEach(function (a) { byCity[a.city] = (byCity[a.city] || 0) + 1; });
    var agentCityData = Object.keys(byCity).map(function (city) { return { label: city, value: byCity[city] }; });

    var links = data.AGENTS.reduce(function (arr, a) { return arr.concat(window.App.state.links.byAgent(a.slug)); }, []);
    var viewsByProperty = {};
    links.forEach(function (link) {
      (link.stats.mostViewed || []).forEach(function (row) {
        viewsByProperty[row.propertyId] = (viewsByProperty[row.propertyId] || 0) + row.views;
      });
    });
    var topProperties = Object.keys(viewsByProperty)
      .map(function (id) { var p = window.App.state.properties.get(id); return p ? { label: p.title, value: viewsByProperty[id] } : null; })
      .filter(Boolean)
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 6);

    var agentVisits = agents.map(function (a) { return { label: a.name, value: Math.round(a.reviews * 3.4 + a.rating * 20) }; })
      .sort(function (a, b) { return b.value - a.value; });

    var totalContacts = links.reduce(function (sum, l) { return sum + (l.stats.contacts || 0); }, 0);
    var conversion = k.visitsMonth ? ((totalContacts / k.visitsMonth) * 100).toFixed(1) : 0;

    var content =
      '<div class="admin-kpi-grid">' +
      ac.kpiCardHTML('chat', '312', 'Clics en WhatsApp (mes)') +
      ac.kpiCardHTML('clock', '5.2 min', 'Tiempo promedio en la plataforma') +
      ac.kpiCardHTML('chart', conversion + '%', 'Conversión visitas → contactos') +
      ac.kpiCardHTML('heart', u.formatNumber(topProperties.reduce(function (s2, p) { return s2 + p.value; }, 0)), 'Vistas en enlaces personalizados') +
      '</div>' +

      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Usuarios registrados por mes</div></div>' + ac.hbarListHTML(monthData) + '</div>' +
      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Agentes registrados por ciudad</div></div>' + ac.hbarListHTML(agentCityData) + '</div>' +
      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Propiedades más vistas</div><div class="admin-section__subtitle">Según enlaces personalizados compartidos con clientes</div></div>' +
      (topProperties.length ? ac.hbarListHTML(topProperties) : '<p class="text-muted" style="font-size:0.85rem">Aún no hay suficientes datos.</p>') + '</div>' +
      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Agentes con más visitas a su perfil</div></div>' + ac.hbarListHTML(agentVisits) + '</div>';

    ac.mount('estadisticas', 'Estadísticas', content, root);
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.stats = { render: render };
})();
