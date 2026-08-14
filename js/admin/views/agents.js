// Vista "Agentes": lista de solo lectura de las cuentas de asesor reales.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;
  var d = window.App.admin.data;

  function render(params, root) {
    var agents = s.agents.all();

    var rows = agents.map(function (a) {
      var planName = (d.PLANS.filter(function (p) { return p.id === a.plan; })[0] || {}).name || a.plan || '—';
      var propsCount = window.App.state.properties.byAgent(a.slug).length;
      return (
        '<div class="admin-row-card">' +
        '  <div class="admin-row-card__main">' +
        '    <img class="admin-row-card__avatar" src="' + u.thumbUrl(a.photo, 88, 88) + '" alt="" loading="lazy" />' +
        '    <div class="admin-row-card__body">' +
        '      <strong>' + u.escapeHtml(a.name) + '</strong>' +
        '      <span class="admin-row-card__meta">' + u.escapeHtml(a.city || 'Sin ciudad') + ' · ' + u.escapeHtml(planName) + '</span>' +
        '      <span class="admin-row-card__meta">' + propsCount + ' propiedad' + (propsCount === 1 ? '' : 'es') +
        (a.planExpiresAt ? ' · vence ' + new Date(a.planExpiresAt).toLocaleDateString('es-MX') : '') + '</span>' +
        '    </div>' +
        '  </div>' +
        '  <div class="admin-row-card__foot">' +
        (a.status ? ac.statusPill(a.status) : '<span></span>') +
        '    <a class="btn btn--sm btn--outline" href="#/' + a.slug + '" target="_blank" rel="noopener">Ver perfil</a>' +
        '  </div>' +
        '</div>'
      );
    }).join('');

    var content =
      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Agentes activos (' + agents.length + ')</div></div>' +
      '  <div class="admin-row-list">' + (rows || '<p class="text-muted" style="font-size:0.85rem">Aún no hay agentes registrados.</p>') + '</div>' +
      '</div>';

    ac.mount('agentes', 'Agentes', content, root);
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.agents = { render: render };
})();
