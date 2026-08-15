// Vista "Pagos": historial real de cobros de Stripe (tabla payments).
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  var KIND_LABELS = { suscripcion_asesor: "Suscripción asesor", destacar_propiedad: "Destacar propiedad" };

  function render(params, root) {
    ac.mount('pagos', 'Pagos', '<div class="empty-state" style="padding-top:40px"><span class="spinner"></span></div>', root);

    s.payments.all().then(function (payments) {
      var agentsBySlugId = {};
      window.App.data.getAllAgents().forEach(function (a) { agentsBySlugId[a.id] = a; });

      var pagados = payments.filter(function (p) { return p.status === 'pagado'; });
      var total = pagados.reduce(function (sum, p) { return sum + p.amount; }, 0) / 100;
      var monthKey = new Date().toISOString().slice(0, 7);
      var totalMes = pagados.filter(function (p) { return (p.created_at || '').slice(0, 7) === monthKey; })
        .reduce(function (sum, p) { return sum + p.amount; }, 0) / 100;

      var rows = payments.map(function (p) {
        var person = agentsBySlugId[p.profile_id];
        return (
          '<div class="admin-row-card">' +
          '  <div class="admin-row-card__main">' +
          '    <span class="admin-row-card__avatar admin-row-card__avatar--round admin-row-card__avatar--icon">' + u.icon(p.kind === 'destacar_propiedad' ? 'starFilled' : 'dollar', { size: 18 }) + '</span>' +
          '    <div class="admin-row-card__body">' +
          '      <strong>' + u.formatPrice(p.amount / 100) + ' ' + (p.currency || 'mxn').toUpperCase() + '</strong>' +
          '      <span class="admin-row-card__meta">' + (KIND_LABELS[p.kind] || p.kind) + (person ? ' · ' + u.escapeHtml(person.name) : '') + '</span>' +
          '      <span class="admin-row-card__meta">' + u.relativeTime(p.created_at) + '</span>' +
          '    </div>' +
          '  </div>' +
          '  <div class="admin-row-card__foot">' +
          ac.statusPill(p.status === 'pagado' ? 'activo' : p.status) +
          (person ? '<a class="btn btn--sm btn--outline" href="#/' + person.slug + '" target="_blank" rel="noopener">Ver perfil</a>' : '<span></span>') +
          '  </div>' +
          '</div>'
        );
      }).join('');

      var content =
        '<div class="admin-kpi-grid">' +
        ac.kpiCardHTML('dollar', u.formatPrice(total), 'Total cobrado') +
        ac.kpiCardHTML('dollar', u.formatPrice(totalMes), 'Cobrado este mes') +
        ac.kpiCardHTML('chart', u.formatNumber(pagados.length), 'Pagos exitosos') +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Historial (' + payments.length + ')</div></div>' +
        '  <div class="admin-row-list">' + (rows || '<p class="text-muted" style="font-size:0.85rem">Aún no hay pagos registrados.</p>') + '</div>' +
        '</div>';

      ac.mount('pagos', 'Pagos', content, root);
    }).catch(function (err) {
      ac.mount('pagos', 'Pagos', '<div class="empty-state"><h3>No se pudo cargar</h3><p>' + u.escapeHtml(err.message || '') + '</p></div>', root);
    });
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.payments = { render: render };
})();
