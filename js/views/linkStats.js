// Vista "Estadísticas del enlace": qué tanto interés mostró un cliente en su selección.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var data = window.App.data;

  function render(params, root) {
    var agent = data.getAgent(window.APP_CONFIG.CURRENT_AGENT_SLUG);
    var link = state.links.get(agent.slug, params.clientSlug);

    if (!link) {
      root.innerHTML = '<div class="empty-state"><h3>Enlace no encontrado</h3><a class="btn btn--primary" href="#/dashboard/enlaces">Volver a enlaces</a></div>';
      c.mountChrome('dashboard');
      return;
    }

    var url = window.location.origin + window.location.pathname + '#/' + agent.slug + '/' + link.clientSlug;
    var stats = link.stats || {};
    var properties = link.propertyIds.map(function (id) { return state.properties.get(id); }).filter(Boolean);
    var mostViewed = (stats.mostViewed || []).map(function (row) {
      var p = state.properties.get(row.propertyId);
      return p ? { property: p, views: row.views } : null;
    }).filter(Boolean);

    root.innerHTML =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/dashboard/enlaces" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Estadísticas del enlace</h1>' +
      '</div>' +
      '<div class="page-wrap">' +
      '  <p class="text-secondary" style="margin-bottom:10px">Selección para <strong>' + u.escapeHtml(link.clientLabel) + '</strong></p>' +
      c.shareBarHTML(url) +
      '  <h2 class="section-title">Últimos 7 días</h2>' +
      '  <div class="stat-grid">' +
      c.statCardHTML('Vistas del enlace', u.formatNumber(stats.views || 0), stats.viewsDelta) +
      c.statCardHTML('Tiempo promedio', (stats.avgTimeMinutes || 0).toFixed ? stats.avgTimeMinutes.toFixed(2) + ' min' : (stats.avgTimeMinutes || 0) + ' min', stats.avgTimeDelta) +
      c.statCardHTML('Propiedades vistas', u.formatNumber(stats.propertiesViewed || 0), stats.propertiesViewedDelta) +
      c.statCardHTML('Contactos', u.formatNumber(stats.contacts || 0), stats.contactsDelta) +
      '  </div>' +

      '  <h2 class="section-title">Propiedades más vistas</h2>' +
      (mostViewed.length
        ? '<div class="ranked-list">' + mostViewed.map(function (row) {
          return '<div class="ranked-row"><img src="' + row.property.photos[0] + '" alt="" />' +
            '<div class="ranked-row__info"><strong>' + u.escapeHtml(row.property.title) + '</strong><span>' + row.views + ' vistas</span></div></div>';
        }).join('') + '</div>'
        : '<p class="text-muted" style="font-size:0.85rem">Aún no hay suficientes visitas para mostrar un ranking. Comparte el enlace con tu cliente para empezar a ver estadísticas.</p>') +

      '  <h2 class="section-title">Propiedades incluidas (' + properties.length + ')</h2>' +
      '  <div class="stack gap-2">' + properties.map(function (p) { return c.propertyCardHTML(p, { variant: 'row', showFavorite: false }); }).join('') + '</div>' +
      '  <p class="text-muted" style="font-size:0.76rem;margin-top:14px">' +
      (stats.lastVisit ? 'Última visita: ' + u.relativeTime(stats.lastVisit) + ' · ' : '') +
      'Regresó ' + (stats.returningVisits || 0) + ' veces' +
      '  </p>' +
      '</div>';

    c.mountChrome('dashboard');
    document.title = 'Estadísticas: ' + link.clientLabel + ' — InmoMap';
    c.bindCopyButtons(root);
  }

  window.App.views = window.App.views || {};
  window.App.views.linkStats = { render: render };
})();
