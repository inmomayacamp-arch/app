// Vista "Gestión de Suscripción": plan contratado y acceso al pago real
// (Checkout de Stripe si falta pagar, Portal de Stripe para gestionarlo).
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var ac = window.App.agent.components;

  var STATUS_LABELS = {
    activo: "Activa", pendiente_pago: "Pendiente de pago", inactivo: "Inactiva", suspendido: "Suspendida"
  };

  function render(params, root) {
    function refresh() {
      var agent = state.agents.current();
      var plan = window.App.admin.data.PLANS[0];
      var isActive = agent.status === 'activo';

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Tu plan</div>' +
        '  <div class="admin-section__subtitle">' + (agent.planExpiresAt ? (isActive ? 'Renovación: ' : 'Venció: ') + new Date(agent.planExpiresAt).toLocaleDateString('es-MX') + ' · ' : '') + 'Estado: ' + (STATUS_LABELS[agent.status] || agent.status) + '</div></div></div>' +

        '  <div class="dashboard-card" style="align-items:flex-start;max-width:340px;' + (isActive ? 'border-color:var(--color-primary)' : '') + '">' +
        (isActive ? '<span class="badge badge--venta">Activo</span>' : '') +
        '  <strong>' + u.escapeHtml(plan.name) + '</strong>' +
        '  <span style="font-size:1.2rem;font-weight:800">' + u.formatPrice(plan.price) + ' <span style="font-size:0.7rem;font-weight:600;color:var(--color-ink-muted)">MXN/mes</span></span>' +
        '  <ul style="margin:6px 0 10px;padding-left:16px;font-size:0.78rem;color:var(--color-ink-secondary)">' + plan.features.slice(0, 5).map(function (f) { return '<li>' + u.escapeHtml(f) + '</li>'; }).join('') + '</ul>' +
        '  </div>' +

        (isActive
          ? '<button type="button" class="btn btn--outline" data-portal style="margin-top:16px">' + u.icon('dollar', { size: 15 }) + ' Gestionar pago y facturas</button>'
          : '<button type="button" class="btn btn--primary" data-pay style="margin-top:16px">' + u.icon('dollar', { size: 15 }) + ' Pagar y activar mi cuenta</button>') +
        '</div>';

      ac.mount('suscripcion', 'Suscripción', content, root);

      var payBtn = u.qs('[data-pay]', root);
      if (payBtn) payBtn.addEventListener('click', async function () {
        payBtn.disabled = true;
        try {
          await state.payments.startCheckout('plan', { billing: 'mensual' });
        } catch (err) {
          payBtn.disabled = false;
          u.toast(err.message || 'No se pudo iniciar el pago');
        }
      });

      var portalBtn = u.qs('[data-portal]', root);
      if (portalBtn) portalBtn.addEventListener('click', async function () {
        portalBtn.disabled = true;
        try {
          await state.payments.startCheckout('portal');
        } catch (err) {
          portalBtn.disabled = false;
          u.toast(err.message || 'No se pudo abrir la gestión de pago');
        }
      });
    }

    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.subscription = { render: render };
})();
