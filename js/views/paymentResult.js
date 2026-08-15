// Vistas de regreso desde el Checkout de Stripe (success_url / cancel_url).
// Stripe ya confirmó (o no) el pago del lado de ellos, pero el webhook que
// activa la cuenta llega por separado y puede tardar uno o dos segundos más
// que el redireccionamiento del navegador — así que aquí no basta con
// refrescar una sola vez: hay que reintentar hasta ver el cambio reflejado,
// o la persona puede llegar a "Publicar" con datos viejos que todavía
// digan que le falta pagar.
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

  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  async function renderSuccess(params, root) {
    document.title = 'Pago confirmado — InmoMaps';
    c.mountChrome('explore');

    if (!state.agents.isLoggedIn()) {
      root.innerHTML = shell('check', 'var(--color-venta)', '¡Pago recibido!', 'Ya puedes ir a tu panel.', '#/dashboard', 'Ir a mi panel');
      return;
    }

    root.innerHTML = '<div class="page-wrap" style="max-width:560px"><div class="empty-state" style="padding-top:24px"><span class="spinner"></span><h3>Confirmando tu pago…</h3><p>Esto tarda solo unos segundos.</p></div></div>';

    var wasPending = state.agents.current().status !== 'activo';
    var confirmed = !wasPending;
    for (var i = 0; i < 6 && !confirmed; i++) {
      await sleep(1500);
      await state.agents.bootstrap();
      if (state.agents.current().status === 'activo') confirmed = true;
    }

    root.innerHTML = confirmed
      ? shell('check', 'var(--color-venta)', '¡Cuenta activada!', 'Tu pago se confirmó y tu cuenta ya está activa. Ya puedes publicar propiedades.', '#/dashboard', 'Ir a mi panel')
      : shell('clock', 'var(--color-otro)', 'Tu pago está en proceso', 'Stripe ya lo recibió, pero está tardando un poco más de lo normal en reflejarse. Entra a "Suscripción" en tu panel en un minuto para confirmar — si sigue sin activarse, escríbenos a Soporte.', '#/dashboard/suscripcion', 'Ver mi suscripción');
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
