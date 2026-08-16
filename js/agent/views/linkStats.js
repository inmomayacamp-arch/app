// Vista "Estadísticas del enlace": qué tanto interés mostró un cliente en su selección.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var ac = window.App.agent.components;

  function render(params, root) {
    var agent = state.agents.current();
    var link = state.links.get(agent.slug, params.clientSlug);

    if (!link) {
      ac.mount('enlaces', 'Enlace no encontrado', '<div class="empty-state"><h3>Enlace no encontrado</h3><a class="btn btn--primary" href="#/dashboard/enlaces">Volver a enlaces</a></div>', root);
      return;
    }

    var url = window.location.origin + window.location.pathname + '#/' + agent.slug + '/' + link.clientSlug;
    var stats = state.tracking.statsForLink(link.id);
    var properties = link.propertyIds.map(function (id) { return state.properties.get(id); }).filter(Boolean);
    var mostViewed = (stats.mostViewed || []).map(function (row) {
      var p = state.properties.get(row.propertyId);
      return p ? { property: p, views: row.views } : null;
    }).filter(Boolean);
    var favorites = (stats.favoritePropertyIds || []).map(function (id) { return state.properties.get(id); }).filter(Boolean);

    var content =
      '  <p class="text-secondary" style="margin-bottom:2px">Selección para <strong>' + u.escapeHtml(link.clientLabel) + '</strong></p>' +
      (link.clientPhone || link.clientEmail
        ? '<p class="text-muted" style="font-size:0.82rem;margin-bottom:10px">' + [link.clientPhone, link.clientEmail].filter(Boolean).map(u.escapeHtml).join(' · ') + '</p>'
        : '') +
      c.shareBarHTML(url) +
      '  <div class="row gap-2" style="margin-top:10px">' +
      (link.clientPhone
        ? '<a class="btn btn--whatsapp btn--sm" target="_blank" rel="noopener" href="' + u.whatsappLink(link.clientPhone, '¡Hola ' + link.clientLabel + '! 👋 Aquí está tu selección de propiedades en InmoMaps: ' + url) + '">' + u.icon('chat', { size: 15 }) + ' Enviar por WhatsApp</a>'
        : '') +
      (link.clientEmail ? '<a class="btn btn--outline btn--sm" href="mailto:' + u.escapeHtml(link.clientEmail) + '">' + u.icon('mail', { size: 15 }) + ' Enviar por correo</a>' : '') +
      '  </div>' +

      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Últimos 7 días</div></div>' +
      '  <div class="stat-grid">' +
      c.statCardHTML('Vistas del enlace', u.formatNumber(stats.views || 0), stats.viewsDelta) +
      c.statCardHTML('Tiempo promedio', (stats.avgTimeMinutes || 0).toFixed ? stats.avgTimeMinutes.toFixed(2) + ' min' : (stats.avgTimeMinutes || 0) + ' min', stats.avgTimeDelta) +
      c.statCardHTML('Propiedades vistas', u.formatNumber(stats.propertiesViewed || 0), stats.propertiesViewedDelta) +
      c.statCardHTML('Contactos', u.formatNumber(stats.contacts || 0), stats.contactsDelta) +
      '  </div></div>' +

      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Propiedades más vistas</div></div>' +
      (mostViewed.length
        ? '<div class="ranked-list">' + mostViewed.map(function (row) {
          return '<div class="ranked-row"><img src="' + u.thumbUrl(row.property.photos[0], 100, 100) + '" alt="" loading="lazy" />' +
            '<div class="ranked-row__info"><strong>' + u.escapeHtml(row.property.title) + '</strong><span>' + row.views + ' vistas</span></div></div>';
        }).join('') + '</div>'
        : '<p class="text-muted" style="font-size:0.85rem">Aún no hay suficientes visitas para mostrar un ranking. Comparte el enlace con tu cliente para empezar a ver estadísticas.</p>') +
      '</div>' +

      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Favoritas del cliente</div><div class="admin-section__subtitle">Propiedades que marcó como favorita dentro de este enlace</div></div>' +
      (favorites.length
        ? '<div class="stack gap-2">' + favorites.map(function (p) { return c.propertyCardHTML(p, { variant: 'row', showFavorite: false }); }).join('') + '</div>'
        : '<p class="text-muted" style="font-size:0.85rem">Tu cliente aún no ha marcado propiedades como favoritas.</p>') +
      '</div>' +

      '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Propiedades incluidas (' + properties.length + ')</div></div>' +
      '  <div class="stack gap-2">' + properties.map(function (p) { return c.propertyCardHTML(p, { variant: 'row', showFavorite: false }); }).join('') + '</div>' +
      '  <p class="text-muted" style="font-size:0.76rem;margin-top:14px">' +
      (stats.lastVisit ? 'Última visita: ' + u.relativeTime(stats.lastVisit) + ' · ' : '') +
      'Regresó ' + (stats.returningVisits || 0) + ' veces' +
      '  </p>' +
      '</div>';

    ac.mount('enlaces', 'Estadísticas: ' + link.clientLabel, content, root);
    c.bindCopyButtons(root);
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.linkStats = { render: render };
})();
