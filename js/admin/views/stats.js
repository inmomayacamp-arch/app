// Vista "Estadísticas": solo métricas calculadas con datos reales.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function render(params, root) {
    var agents = s.agents.all();

    var byCity = {};
    agents.forEach(function (a) { byCity[a.city] = (byCity[a.city] || 0) + 1; });
    var agentCityData = Object.keys(byCity).map(function (city) { return { label: city, value: byCity[city] }; });

    var links = agents.reduce(function (arr, a) { return arr.concat(window.App.state.links.byAgent(a.slug)); }, []);
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

    var content =
      (agentCityData.length ?
        '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Agentes registrados por ciudad</div></div>' + ac.hbarListHTML(agentCityData) + '</div>' :
        '<p class="text-muted" style="font-size:0.85rem">Aún no hay suficientes datos.</p>') +
      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Propiedades más vistas</div><div class="admin-section__subtitle">Según enlaces personalizados compartidos con clientes</div></div>' +
      (topProperties.length ? ac.hbarListHTML(topProperties) : '<p class="text-muted" style="font-size:0.85rem">Aún no hay suficientes datos.</p>') + '</div>';

    ac.mount('estadisticas', 'Estadísticas', content, root);
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.stats = { render: render };
})();
