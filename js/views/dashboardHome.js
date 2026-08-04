// Vista "Dashboard del asesor": resumen de actividad con indicadores y gráficas.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var agentState = window.App.agent.state;
  var ac = window.App.agent.components;

  function render(params, root) {
    var agent = state.agents.current();
    var myProperties = state.properties.byAgent(agent.slug);
    var myLinks = state.links.byAgent(agent.slug);
    var myClients = agentState.clients.all();
    var myConversations = agentState.messages.all();

    function statusOf(p) { return p.status || 'disponible'; }
    var active = myProperties.filter(function (p) { return statusOf(p) === 'disponible' || statusOf(p) === 'apartada'; }).length;
    var sold = myProperties.filter(function (p) { return statusOf(p) === 'vendida'; }).length;
    var rented = myProperties.filter(function (p) { return statusOf(p) === 'rentada'; }).length;
    var pending = myProperties.filter(function (p) { return statusOf(p) === 'pausada'; }).length;

    var totalViews = myLinks.reduce(function (sum, l) { return sum + (l.stats ? l.stats.views : 0); }, 0);
    var totalFavorites = myLinks.reduce(function (sum, l) { return sum + ((l.stats && l.stats.favoritePropertyIds) ? l.stats.favoritePropertyIds.length : 0); }, 0);
    var totalMessages = myConversations.reduce(function (sum, c) { return sum + c.messages.filter(function (m) { return m.from === 'cliente'; }).length; }, 0);
    var activeClients = myClients.filter(function (c) { return c.status === 'activo'; }).length;
    var newRequests = myClients.filter(function (c) { return (Date.now() - new Date(c.createdAt)) / 86400000 < 14; }).length;
    var whatsappClicks = 38 + myLinks.length * 6;

    var viewsByProperty = {};
    myLinks.forEach(function (link) {
      (link.stats.mostViewed || []).forEach(function (row) { viewsByProperty[row.propertyId] = (viewsByProperty[row.propertyId] || 0) + row.views; });
    });
    var topProperties = Object.keys(viewsByProperty)
      .map(function (id) { var p = state.properties.get(id); return p ? { label: p.title, value: viewsByProperty[id] } : null; })
      .filter(Boolean).sort(function (a, b) { return b.value - a.value; }).slice(0, 5);

    var content =
      '<div class="admin-kpi-grid">' +
      ac.kpiCardHTML('home', active, 'Propiedades activas') +
      ac.kpiCardHTML('check', sold, 'Vendidas') +
      ac.kpiCardHTML('link', rented, 'Rentadas') +
      ac.kpiCardHTML('clock', pending, 'Pausadas') +
      ac.kpiCardHTML('eye', u.formatNumber(totalViews), 'Visitas recibidas') +
      ac.kpiCardHTML('heart', totalFavorites, 'Propiedades favoritas') +
      ac.kpiCardHTML('chat', totalMessages, 'Mensajes recibidos') +
      ac.kpiCardHTML('users', activeClients, 'Clientes activos') +
      ac.kpiCardHTML('briefcase', newRequests, 'Solicitudes nuevas') +
      ac.kpiCardHTML('chat', whatsappClicks, 'Clics en WhatsApp') +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Accesos rápidos</div></div>' +
      '  <div class="dashboard-grid">' +
      '    <a class="dashboard-card" href="#/dashboard/publicar"><span class="dashboard-card__icon">' + u.icon('plus', { size: 18 }) + '</span><strong>Publicar propiedad</strong><span>Sube una propiedad nueva</span></a>' +
      '    <a class="dashboard-card" href="#/dashboard/clientes"><span class="dashboard-card__icon">' + u.icon('users', { size: 18 }) + '</span><strong>Clientes</strong><span>' + myClients.length + ' en tu CRM</span></a>' +
      '    <a class="dashboard-card" href="#/dashboard/enlaces/nuevo"><span class="dashboard-card__icon">' + u.icon('link', { size: 18 }) + '</span><strong>Nuevo enlace</strong><span>Comparte propiedades seleccionadas</span></a>' +
      '    <a class="dashboard-card" href="#/' + agent.slug + '"><span class="dashboard-card__icon">' + u.icon('home', { size: 18 }) + '</span><strong>Mi perfil público</strong><span>' + myProperties.length + ' propiedades</span></a>' +
      '  </div>' +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Propiedades más vistas</div></div>' +
      (topProperties.length ? ac.hbarListHTML(topProperties) : '<p class="text-muted" style="font-size:0.85rem">Comparte enlaces personalizados para empezar a ver estadísticas.</p>') +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="row" style="justify-content:space-between;align-items:center">' +
      '    <div class="admin-section__title">Enlaces recientes</div>' +
      '    <a href="#/dashboard/enlaces/nuevo" class="btn btn--primary btn--sm">' + u.icon('plus', { size: 14 }) + ' Nuevo enlace</a>' +
      '  </div>' +
      (myLinks.length
        ? '<div class="stack gap-2" style="margin-top:12px">' + myLinks.slice(0, 5).map(function (link) {
          return '<a class="ranked-row" href="#/dashboard/enlaces/' + link.clientSlug + '">' +
            '<span class="dashboard-card__icon">' + u.icon('user', { size: 16 }) + '</span>' +
            '<div class="ranked-row__info"><strong>' + u.escapeHtml(link.clientLabel) + '</strong><span>' + link.propertyIds.length + ' propiedades · ' + (link.stats.views || 0) + ' vistas</span></div>' +
            u.icon('chevronRight', { size: 16 }) +
            '</a>';
        }).join('') + '</div>'
        : '<p class="text-muted" style="font-size:0.85rem;margin-top:10px">Aún no has creado enlaces personalizados para clientes.</p>') +
      '</div>';

    ac.mount('dashboard', 'Dashboard', content, root);
  }

  window.App.views = window.App.views || {};
  window.App.views.dashboardHome = { render: render };
})();
