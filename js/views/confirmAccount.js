// Vista "Confirmar cuenta": a donde lleva el enlace del correo de bienvenida
// (agentes y propietarios). A propósito NO usa el enlace que da Supabase por
// default ({{ .ConfirmationURL }}, que muestra el dominio *.supabase.co antes
// de rebotar aquí) — la plantilla de correo apunta directo a esta pantalla
// con el token, y aquí se confirma con verifyOtp. Así el enlace que ve la
// persona siempre es de inmomaps.com.mx, no de un dominio ajeno.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var supabase = window.App.supabase;

  function shell(bodyHtml) {
    return '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Confirmar cuenta</h1>' +
      '</div>' +
      '<div class="page-wrap" style="max-width:560px">' +
      '  <div class="empty-state" style="padding-top:24px">' + bodyHtml + '</div>' +
      '</div>';
  }

  function renderState(root, icon, color, title, message, cta) {
    root.innerHTML = shell(
      '<span class="empty-state__icon" style="color:' + color + '">' + u.icon(icon, { size: 40 }) + '</span>' +
      '<h3>' + u.escapeHtml(title) + '</h3>' +
      '<p>' + message + '</p>' +
      (cta || '<a class="btn btn--primary" href="#/">Volver al mapa</a>')
    );
  }

  async function render(params, root) {
    document.title = 'Confirmar cuenta — InmoMaps';
    c.mountChrome('explore');
    root.innerHTML = shell('<span class="spinner"></span><p>Confirmando tu cuenta…</p>');

    var query = params.query || {};
    var tokenHash = query.token_hash;
    var type = query.type || 'signup';

    if (!supabase || !tokenHash) {
      renderState(root, 'alert', 'var(--color-renta)', 'Enlace incompleto',
        'Este enlace no trae la información necesaria para confirmar tu cuenta. Ábrelo directo desde el correo que te mandamos.');
      return;
    }

    var result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type });
    if (result.error) {
      renderState(root, 'alert', 'var(--color-renta)', 'Este enlace ya no es válido',
        'Puede que ya lo hayas usado o que haya caducado. Intenta iniciar sesión — si tu cuenta ya está confirmada, va a funcionar directo.',
        '<a class="btn btn--primary" href="#/dashboard/login">Iniciar sesión</a>');
      return;
    }

    await state.agents.bootstrap();
    u.toast('¡Cuenta confirmada!', { tone: 'success' });

    var agent = state.agents.current();
    // Un asesor recién confirmado y que todavía no pagó: mandarlo directo
    // a completar el pago en vez de al panel, igual que cuando la sesión
    // ya estaba activa al momento de registrarse (registerPlan.js).
    if (agent && agent.plan === 'asesor' && agent.status !== 'activo') {
      try {
        var billing = 'mensual';
        try { billing = localStorage.getItem('inmomap:pendingBilling') || 'mensual'; localStorage.removeItem('inmomap:pendingBilling'); } catch (e) { /* no-op */ }
        await state.agents.updateProfile(agent.slug, { status: 'pendiente_pago' });
        await state.payments.startCheckout('plan', { billing: billing });
        return;
      } catch (err) {
        // Si algo falla al iniciar el pago, no dejamos a la persona
        // atorada: la mandamos al panel, donde "Suscripción" le va a
        // seguir ofreciendo pagar.
      }
    }

    window.location.hash = '#/dashboard';
    window.location.reload();
  }

  window.App.views = window.App.views || {};
  window.App.views.confirmAccount = { render: render };
})();
