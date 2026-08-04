// Vista "Gestión de Suscripción": plan contratado, pagos y beneficios del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var ac = window.App.agent.components;

  function render(params, root) {
    var agent = state.agents.current();

    function refresh() {
      var adminInfo = window.App.admin.state.agents.all().filter(function (a) { return a.slug === agent.slug; })[0];
      var plans = window.App.admin.data.PLANS;
      var currentPlan = plans.filter(function (p) { return p.id === adminInfo.plan; })[0] || plans[0];
      var payments = window.App.admin.state.payments.all().filter(function (p) { return p.agentSlug === agent.slug; });

      var planCards = plans.map(function (p) {
        var isCurrent = p.id === adminInfo.plan;
        return '<div class="dashboard-card" style="align-items:flex-start;' + (isCurrent ? 'border-color:var(--color-primary)' : '') + '">' +
          (isCurrent ? '<span class="badge badge--venta">Plan actual</span>' : '') +
          '<strong>' + u.escapeHtml(p.name) + '</strong>' +
          '<span style="font-size:1.2rem;font-weight:800">' + u.formatPrice(p.price) + ' <span style="font-size:0.7rem;font-weight:600;color:var(--color-ink-muted)">MXN/' + p.period + '</span></span>' +
          '<ul style="margin:6px 0 10px;padding-left:16px;font-size:0.78rem;color:var(--color-ink-secondary)">' + p.features.map(function (f) { return '<li>' + u.escapeHtml(f) + '</li>'; }).join('') + '</ul>' +
          (isCurrent ? '' : '<button type="button" class="btn btn--primary btn--sm" data-choose="' + p.id + '">Cambiar a este plan</button>') +
          '</div>';
      }).join('');

      var paymentRows = payments.map(function (p) {
        return '<tr><td>' + new Date(p.date).toLocaleDateString('es-MX') + '</td><td>' + p.plan + '</td><td>' + u.formatPrice(p.amount) + '</td><td>' + p.method + '</td><td>' + window.App.admin.components.statusPill(p.status) + '</td></tr>';
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Tu plan</div>' +
        '  <div class="admin-section__subtitle">Renovación: ' + new Date(adminInfo.planExpiresAt).toLocaleDateString('es-MX') + ' · Estado: ' + adminInfo.status + '</div></div></div>' +
        '  <div class="dashboard-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">' + planCards + '</div>' +
        '  <button type="button" class="btn btn--outline" data-cancel style="margin-top:16px;color:var(--color-primary);border-color:var(--color-primary)">Cancelar suscripción</button>' +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Historial de pagos</div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Fecha</th><th>Plan</th><th>Monto</th><th>Método</th><th>Estado</th></tr></thead>' +
        '  <tbody>' + (paymentRows || '<tr><td colspan="5" class="admin-table__meta">Sin pagos registrados</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('suscripcion', 'Suscripción', content, root);

      u.qsa('[data-choose]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          window.App.admin.state.agents.setField(agent.slug, { plan: btn.getAttribute('data-choose') });
          u.toast('Plan actualizado', { tone: 'success' });
          refresh();
        });
      });
      u.qs('[data-cancel]', root).addEventListener('click', function () {
        if (!window.confirm('¿Cancelar tu suscripción? Perderás los beneficios de tu plan actual.')) return;
        window.App.admin.state.agents.setField(agent.slug, { status: 'inactivo' });
        u.toast('Suscripción cancelada');
        refresh();
      });
    }

    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.subscription = { render: render };
})();
