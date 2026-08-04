// Vista "Panel del asesor": resumen y accesos rápidos a publicar, enlaces y estadísticas.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var data = window.App.data;

  function render(params, root) {
    var agent = data.getAgent(window.APP_CONFIG.CURRENT_AGENT_SLUG);
    var myProperties = state.properties.byAgent(agent.slug);
    var myLinks = state.links.byAgent(agent.slug);
    var totalViews = myLinks.reduce(function (sum, l) { return sum + (l.stats ? l.stats.views : 0); }, 0);

    var CARDS = [
      { href: "#/dashboard/publicar", icon: "plus", title: "Publicar propiedad", desc: "Sube una propiedad nueva" },
      { href: "#/" + agent.slug, icon: "home", title: "Mi perfil público", desc: myProperties.length + " propiedades" },
      { href: "#/dashboard/enlaces", icon: "link", title: "Enlaces para clientes", desc: myLinks.length + " enlaces creados" },
      { href: "#/dashboard/enlaces", icon: "eye", title: "Estadísticas", desc: totalViews + " vistas totales" }
    ];

    root.innerHTML =
      '<div class="page-header"><h1 class="page-header__title">Panel del asesor</h1></div>' +
      '<div class="page-wrap">' +
      '  <a class="agent-card" href="#/' + agent.slug + '">' +
      '    <img class="avatar" src="' + agent.photo + '" width="52" height="52" alt="" />' +
      '    <div class="agent-card__info">' +
      '      <div class="agent-card__name">' + u.escapeHtml(agent.name) + '</div>' +
      '      <span class="text-secondary" style="font-size:0.82rem">Ver mi perfil público</span>' +
      '    </div>' +
      '    <span class="btn btn--icon">' + u.icon('chevronRight', { size: 16 }) + '</span>' +
      '  </a>' +
      '  <div class="dashboard-grid">' +
      CARDS.map(function (card) {
        return '<a class="dashboard-card" href="' + card.href + '">' +
          '<span class="dashboard-card__icon">' + u.icon(card.icon, { size: 18 }) + '</span>' +
          '<strong>' + card.title + '</strong><span>' + card.desc + '</span></a>';
      }).join('') +
      '  </div>' +

      '  <div class="row" style="justify-content:space-between;align-items:center">' +
      '    <h2 class="section-title">Enlaces recientes</h2>' +
      '    <a href="#/dashboard/enlaces/nuevo" class="btn btn--primary btn--sm">' + u.icon('plus', { size: 14 }) + ' Nuevo enlace</a>' +
      '  </div>' +
      (myLinks.length
        ? '<div class="stack gap-2">' + myLinks.slice(0, 5).map(function (link) {
          return '<a class="ranked-row" href="#/dashboard/enlaces/' + link.clientSlug + '">' +
            '<span class="dashboard-card__icon">' + u.icon('user', { size: 16 }) + '</span>' +
            '<div class="ranked-row__info"><strong>' + u.escapeHtml(link.clientLabel) + '</strong><span>' + link.propertyIds.length + ' propiedades · ' + (link.stats.views || 0) + ' vistas</span></div>' +
            u.icon('chevronRight', { size: 16 }) +
            '</a>';
        }).join('') + '</div>'
        : '<div class="empty-state"><p>Aún no has creado enlaces personalizados para clientes.</p></div>') +
      '</div>';

    c.mountChrome('dashboard');
    document.title = 'Panel del asesor — InmoMap';
  }

  window.App.views = window.App.views || {};
  window.App.views.dashboardHome = { render: render };
})();
