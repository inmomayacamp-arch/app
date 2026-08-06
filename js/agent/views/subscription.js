// Vista "Gestión de Suscripción": plan contratado, pagos y beneficios del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var ac = window.App.agent.components;

  function render(params, root) {
    function refresh() {
      var agent = state.agents.current();
      var plans = window.App.admin.data.PLANS;
      var payments = window.App.admin.state.payments.all().filter(function (p) { return p.agentSlug === agent.slug; });

      var planCards = plans.map(function (p) {
        var isCurrent = p.id === agent.plan;
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
        '  <div class="admin-section__subtitle">' + (agent.planExpiresAt ? 'Renovación: ' + new Date(agent.planExpiresAt).toLocaleDateString('es-MX') + ' · ' : '') + 'Estado: ' + (agent.status === 'inactivo' ? 'Inactivo' : 'Activo') + '</div></div></div>' +
        '  <div class="dashboard-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">' + planCards + '</div>' +
        (agent.plan !== 'basico' ? '<button type="button" class="btn btn--outline" data-cancel style="margin-top:16px;color:var(--color-primary);border-color:var(--color-primary)">Cancelar suscripción</button>' : '') +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Historial de pagos</div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Fecha</th><th>Plan</th><th>Monto</th><th>Método</th><th>Estado</th></tr></thead>' +
        '  <tbody>' + (paymentRows || '<tr><td colspan="5" class="admin-table__meta">Sin pagos registrados</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('suscripcion', 'Suscripción', content, root);

      u.qsa('[data-choose]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var expires = new Date();
          expires.setDate(expires.getDate() + 30);
          btn.disabled = true;
          try {
            await state.agents.updateProfile(agent.slug, { plan: btn.getAttribute('data-choose'), status: 'activo', planExpiresAt: expires.toISOString() });
            u.toast('Plan actualizado', { tone: 'success' });
            refresh();
          } catch (err) {
            btn.disabled = false;
            u.toast(err.message || 'No se pudo actualizar el plan');
          }
        });
      });
      var cancelBtn = u.qs('[data-cancel]', root);
      if (cancelBtn) cancelBtn.addEventListener('click', async function () {
        if (!window.confirm('¿Cancelar tu suscripción? Perderás los beneficios de tu plan actual.')) return;
        try {
          await state.agents.updateProfile(agent.slug, { plan: 'basico', status: 'inactivo' });
          u.toast('Suscripción cancelada');
          refresh();
        } catch (err) {
          u.toast(err.message || 'No se pudo cancelar la suscripción');
        }
      });
    }

    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.subscription = { render: render };
})();
