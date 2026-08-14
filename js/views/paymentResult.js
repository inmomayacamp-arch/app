// Vistas de regreso desde el Checkout de Stripe (success_url / cancel_url).
// Stripe ya confirmó (o no) el pago del lado de ellos; el estado real de la
// cuenta lo actualiza el webhook por separado, así que aquí solo se avisa y
// se regresa al panel — no hay nada que verificar en el cliente.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  function shell(icon, color, title, message, ctaHref, ctaLabel) {
    return '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/dashboard" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">' + u.escapeHtml(title) + '</h1>' +
      '</div>' +
      '<div class="page-wrap" style="max-width:560px">' +
      '  <div class="empty-state" style="padding-top:24px">' +
      '    <span class="empty-state__icon" style="color:' + color + '">' + u.icon(icon, { size: 40 }) + '</span>' +
      '    <h3>' + u.escapeHtml(title) + '</h3>' +
      '    <p>' + message + '</p>' +
      '    <a class="btn btn--primary" href="' + ctaHref + '">' + ctaLabel + '</a>' +
      '  </div>' +
      '</div>';
  }

  async function renderSuccess(params, root) {
    document.title = 'Pago confirmado — InmoMaps';
    c.mountChrome('explore');
    root.innerHTML = shell('check', 'var(--color-venta)', '¡Pago recibido!',
      'Puede tardar unos segundos en reflejarse en tu cuenta. Si no ves el cambio de inmediato, entra de nuevo a tu panel en un momento.',
      '#/dashboard', 'Ir a mi panel');
    if (state.agents.isLoggedIn()) await state.agents.bootstrap();
  }

  function renderCancel(params, root) {
    document.title = 'Pago cancelado — InmoMaps';
    c.mountChrome('explore');
    root.innerHTML = shell('alert', 'var(--color-renta)', 'Pago cancelado',
      'No se realizó ningún cobro. Puedes intentarlo de nuevo cuando quieras desde tu panel.',
      state.agents.isLoggedIn() ? '#/dashboard/suscripcion' : '#/planes', 'Volver a intentar');
  }

  window.App.views = window.App.views || {};
  window.App.views.paymentResult = { renderSuccess: renderSuccess, renderCancel: renderCancel };
})();
