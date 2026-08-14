// Vista "Registro con plan": paso de checkout tras elegir un plan en /planes.
// Muestra el resumen del plan elegido, el formulario de alta y deja el espacio
// listo para conectar una pasarela de pagos real más adelante.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;

  var PAYMENT_METHODS = [
    { icon: "dollar", label: "Tarjeta de crédito o débito" },
    { icon: "exchange", label: "Transferencia bancaria" },
    { icon: "store", label: "Pago en OXXO" }
  ];

  function render(params, root) {
    document.body.classList.add('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';

    if (state.agents.isLoggedIn()) {
      window.location.hash = '#/dashboard';
      return;
    }

    var plans = window.App.admin.data.PLANS;
    var plan = plans.filter(function (p) { return p.id === params.plan; })[0] || plans[0];
    document.title = 'Activar plan ' + plan.name.replace('Plan ', '') + ' — InmoMaps';

    function paymentMethodsHTML() {
      return PAYMENT_METHODS.map(function (m) {
        return '<div class="payment-option" aria-disabled="true">' +
          '<span class="payment-option__icon">' + u.icon(m.icon, { size: 16 }) + '</span>' +
          '<span>' + m.label + '</span>' +
          '<span class="payment-option__soon">' + u.icon('clock', { size: 12 }) + ' Próximamente</span>' +
          '</div>';
      }).join('');
    }

    root.innerHTML =
      '<div class="signup-checkout">' +
      '  <div class="signup-checkout__card">' +
      '    <a class="signup-checkout__back" href="#/planes">' + u.icon('chevronLeft', { size: 16 }) + ' Volver a planes</a>' +

      '    <div class="plan-summary' + (plan.id === 'profesional' ? ' plan-summary--pro' : '') + '">' +
      '      <div class="plan-summary__head">' +
      '        <div><span class="plan-summary__label">Plan seleccionado</span>' +
      '        <strong class="plan-summary__name">' + u.escapeHtml(plan.name) + '</strong></div>' +
      '        <div class="plan-summary__price">$' + plan.price + '<span>/mes</span></div>' +
      '      </div>' +
      '      <ul class="plan-summary__features">' +
      plan.features.slice(0, 4).map(function (f) { return '<li>' + u.icon('check', { size: 12 }) + u.escapeHtml(f) + '</li>'; }).join('') +
      '      </ul>' +
      '      <a class="plan-summary__change" href="#/planes">Cambiar de plan</a>' +
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
      '      <div class="payment-section__title">' + u.icon('shield', { size: 15 }) + ' Método de pago</div>' +
      '      <div class="payment-options">' + paymentMethodsHTML() + '</div>' +
      '      <p class="payment-section__note">Estamos integrando el cobro en línea. Por ahora tu cuenta se activa sin costo con el Plan ' + u.escapeHtml(plan.name.replace('Plan ', '')) + '; podrás agregar tu método de pago desde tu panel en cuanto esté disponible.</p>' +
      '    </div>' +

      '    <p class="text-muted" style="font-size:0.76rem;margin:2px 0 12px">Al crear tu cuenta aceptas los <a href="#/terminos" style="color:var(--color-primary);font-weight:700">Términos y condiciones</a> y el <a href="#/privacidad" style="color:var(--color-primary);font-weight:700">Aviso de privacidad</a> de InmoMaps.</p>' +
      '    <button type="button" class="btn btn--primary btn--block" data-register>Crear mi cuenta y activar Plan ' + u.escapeHtml(plan.name.replace('Plan ', '')) + '</button>' +
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
        await state.agents.register({ name: name, email: email, phone: phone, city: city, password: password, plan: plan.id });
        u.toast('Cuenta creada, ¡bienvenido a InmoMaps!', { tone: 'success' });
        window.location.hash = '#/dashboard';
      } catch (err) {
        u.toast(err.message || 'No se pudo crear la cuenta');
      } finally {
        registerBtn.disabled = false;
      }
    });
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.registerPlan = { render: render };
})();
