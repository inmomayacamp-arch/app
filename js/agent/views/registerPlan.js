// Vista "Registro de asesor": paso de checkout tras elegir mensual/anual en
// /planes. Muestra el resumen del plan (único, todo incluido), crea la
// cuenta y manda directo al Checkout real de Stripe para pagarlo.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;

  function render(params, root) {
    document.body.classList.add('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';

    if (state.agents.isLoggedIn()) {
      window.location.hash = '#/dashboard';
      return;
    }

    var plan = window.App.admin.data.PLANS[0];
    var billing = params.billing === 'anual' ? 'anual' : 'mensual';
    var price = billing === 'anual' ? plan.priceAnnual : plan.price;
    var priceLabel = billing === 'anual' ? '/año' : '/mes';
    document.title = 'Crear cuenta de asesor — InmoMaps';

    root.innerHTML =
      '<div class="signup-checkout">' +
      '  <div class="signup-checkout__card">' +
      '    <a class="signup-checkout__back" href="#/planes">' + u.icon('chevronLeft', { size: 16 }) + ' Volver</a>' +

      '    <div class="plan-summary">' +
      '      <div class="plan-summary__head">' +
      '        <div><span class="plan-summary__label">' + u.escapeHtml(plan.name) + ' · ' + (billing === 'anual' ? 'Anual' : 'Mensual') + '</span>' +
      '        <strong class="plan-summary__name">Todo incluido</strong></div>' +
      '        <div class="plan-summary__price">$' + price + '<span>' + priceLabel + '</span></div>' +
      '      </div>' +
      '      <ul class="plan-summary__features">' +
      plan.features.slice(0, 4).map(function (f) { return '<li>' + u.icon('check', { size: 12 }) + u.escapeHtml(f) + '</li>'; }).join('') +
      '      </ul>' +
      '      <a class="plan-summary__change" href="#/planes">Cambiar forma de pago</a>' +
      '    </div>' +

      '    <h1 class="signup-checkout__title">Crea tu cuenta de asesor</h1>' +
      '    <p class="signup-checkout__subtitle">Al crear tu cuenta obtienes acceso inmediato a tu panel: propiedades, clientes, enlaces y estadísticas.</p>' +

      '    <div class="form-field"><label>Nombre completo</label><input type="text" data-name placeholder="Tu nombre" /></div>' +
      '    <div class="form-row">' +
      '    <div class="form-field"><label>Correo</label><input type="email" data-email placeholder="tu@correo.com" /></div>' +
      '    <div class="form-field"><label>Teléfono</label><input type="text" data-phone placeholder="9811234567" /></div>' +
      '    </div>' +
      '    <div class="form-field"><label>Ciudad</label><input type="text" data-city placeholder="Campeche" /></div>' +
      '    <div class="form-field"><label>Contraseña</label>' + u.passwordFieldHTML('password', 'Crea una contraseña', 'new-password') + '</div>' +

      '    <div class="payment-section">' +
      '      <div class="payment-section__title">' + u.icon('shield', { size: 15 }) + ' Pago seguro con Stripe</div>' +
      '      <p class="payment-section__note">Al continuar te llevamos a la página segura de pago para activar tu cuenta. Aceptamos tarjeta, transferencia y OXXO.</p>' +
      '    </div>' +

      '    <p class="text-muted" style="font-size:0.76rem;margin:2px 0 12px">Al crear tu cuenta aceptas los <a href="#/terminos" style="color:var(--color-primary);font-weight:700">Términos y condiciones</a> y el <a href="#/privacidad" style="color:var(--color-primary);font-weight:700">Aviso de privacidad</a> de InmoMaps.</p>' +
      '    <button type="button" class="btn btn--primary btn--block" data-register>Crear mi cuenta y pagar</button>' +
      '    <p class="signup-checkout__footer">¿Ya tienes cuenta? <a href="#/dashboard/login">Inicia sesión</a></p>' +
      '  </div>' +
      '</div>';

    u.wirePasswordToggles(root);
    var registerBtn = u.qs('[data-register]', root);
    registerBtn.addEventListener('click', async function () {
      var name = u.qs('[data-name]', root).value.trim();
      var email = u.qs('[data-email]', root).value.trim();
      var phone = u.qs('[data-phone]', root).value.trim();
      var city = u.qs('[data-city]', root).value.trim();
      var password = u.qs('[data-password]', root).value;
      if (!name || !email || !password) { u.toast('Completa nombre, correo y contraseña'); return; }
      if (password.length < 6) { u.toast('La contraseña debe tener al menos 6 caracteres'); return; }
      registerBtn.disabled = true;
      try {
        // Si Supabase pide confirmar el correo antes de dar sesión, no hay
        // forma de iniciar el pago todavía; se retoma en confirmAccount.js
        // con este dato guardado, para no perder si eligió mensual o anual.
        try { localStorage.setItem('inmomap:pendingBilling', billing); } catch (e) { /* no-op */ }
        var agent = await state.agents.register({ name: name, email: email, phone: phone, city: city, password: password, plan: 'asesor' });
        // Recién creada, sin pago todavía: no cuenta como "activo" hasta
        // que el webhook de Stripe confirme el cobro.
        await state.agents.updateProfile(agent.slug, { status: 'pendiente_pago' });
        await state.payments.startCheckout('plan', { billing: billing });
      } catch (err) {
        u.toast(err.message || 'No se pudo crear la cuenta');
        registerBtn.disabled = false;
      }
    });
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.registerPlan = { render: render };
})();
