// Vista "Estadísticas personales" del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var agentState = window.App.agent.state;
  var ac = window.App.agent.components;

  function render(params, root) {
    var agent = state.agents.current();
    var myLinks = state.links.byAgent(agent.slug);
    var myClients = agentState.clients.all();

    var linkStats = myLinks.map(function (l) { return state.tracking.statsForLink(l.id); });
    var totalViews = linkStats.reduce(function (sum, s) { return sum + s.views; }, 0);
    var totalContacts = linkStats.reduce(function (sum, s) { return sum + s.contacts; }, 0);
    var avgTime = linkStats.length ? (linkStats.reduce(function (sum, s) { return sum + s.avgTimeMinutes; }, 0) / linkStats.length) : 0;
    var conversion = totalViews ? ((totalContacts / totalViews) * 100).toFixed(1) : 0;
    var whatsappClicks = state.tracking.contactsForAgent(agent.slug).whatsapp;

    var topProperties = state.tracking.topPropertiesForAgent(agent.slug, 6);
    var dailyViews = state.tracking.dailyViewsForAgent(agent.slug, 14);
    var hasAnyView = dailyViews.some(function (d) { return d.value > 0; });

    var sharedByLink = myLinks.map(function (l) { return { label: l.clientLabel, value: l.propertyIds.length }; });

    var content =
      '<div class="admin-section"><div class="admin-section__head"><div><div class="admin-section__title">Vistas de propiedades</div><div class="admin-section__subtitle">Últimos 14 días</div></div></div>' +
      (hasAnyView ? ac.barChartHTML(dailyViews) : '<p class="text-muted" style="font-size:0.85rem">Aún no hay vistas registradas en este periodo.</p>') +
      '</div>' +

      '<div class="admin-kpi-grid" style="margin-top:20px">' +
      ac.kpiCardHTML('eye', u.formatNumber(totalViews), 'Número de visitas') +
      ac.kpiCardHTML('link', myLinks.length, 'Propiedades compartidas (enlaces)') +
      ac.kpiCardHTML('users', myClients.length, 'Número de clientes') +
      ac.kpiCardHTML('chat', u.formatNumber(totalContacts), 'Contactos recibidos') +
      ac.kpiCardHTML('chat', whatsappClicks, 'Clics en WhatsApp') +
      ac.kpiCardHTML('clock', avgTime.toFixed(1) + ' min', 'Tiempo promedio de navegación') +
      ac.kpiCardHTML('chart', conversion + '%', 'Conversión visitas → contactos') +
      '</div>' +

      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Propiedades más vistas</div></div>' +
      (topProperties.length ? ac.hbarListHTML(topProperties) : '<p class="text-muted" style="font-size:0.85rem">Comparte enlaces para ver tus propiedades más vistas.</p>') +
      '</div>' +

      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Propiedades compartidas por enlace</div></div>' +
      (sharedByLink.length ? ac.hbarListHTML(sharedByLink) : '<p class="text-muted" style="font-size:0.85rem">Aún no has creado enlaces personalizados.</p>') +
      '</div>';

    ac.mount('estadisticas', 'Estadísticas personales', content, root);
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.stats = { render: render };
})();
