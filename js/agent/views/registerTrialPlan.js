// Vista "Registro de cortesía": abre una cuenta de asesor activa de
// inmediato, gratis por 30 días y sin pedir tarjeta -- pensada para
// compartirse como enlace directo (no hay ningún botón hacia esta página
// desde /planes ni desde ningún otro lugar público). La cuenta se activa
// server-side (ver signup-trial-agent) y queda marcada como "trial" para
// que se suspenda sola si nadie paga antes de que se cumplan los 30 días.
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
    document.title = 'Prueba gratis de asesor — InmoMaps';

    root.innerHTML =
      '<div class="signup-checkout">' +
      '  <div class="signup-checkout__card">' +
      '    <a class="signup-checkout__back" href="#/">' + u.icon('chevronLeft', { size: 16 }) + ' Volver al inicio</a>' +

      '    <div class="plan-summary">' +
      '      <div class="plan-summary__head">' +
      '        <div><span class="plan-summary__label">' + u.escapeHtml(plan.name) + ' · Cortesía</span>' +
      '        <strong class="plan-summary__name">30 días gratis</strong></div>' +
      '        <div class="plan-summary__price">$0<span>sin tarjeta</span></div>' +
      '      </div>' +
      '      <ul class="plan-summary__features">' +
      plan.features.slice(0, 5).map(function (f) { return '<li>' + u.icon('check', { size: 12 }) + u.escapeHtml(f) + '</li>'; }).join('') +
      '      </ul>' +
      '      <a class="plan-summary__change" href="#/plan-detalle/asesor">Ver todo lo que incluye, a detalle</a>' +
      '    </div>' +

      '    <h1 class="signup-checkout__title">Prueba tu cuenta de asesor gratis</h1>' +
      '    <p class="signup-checkout__subtitle">Acceso inmediato y completo a tu panel por 30 días: propiedades, clientes, enlaces y estadísticas. Sin tarjeta de por medio.</p>' +

      '    <div class="form-field"><label>Nombre completo</label><input type="text" data-name placeholder="Tu nombre" /></div>' +
      '    <div class="form-row">' +
      '    <div class="form-field"><label>Correo</label><input type="email" data-email placeholder="tu@correo.com" /></div>' +
      '    <div class="form-field"><label>Teléfono</label><input type="text" data-phone placeholder="9811234567" /></div>' +
      '    </div>' +
      '    <div class="form-field"><label>Ciudad</label><input type="text" data-city placeholder="Campeche" /></div>' +
      '    <div class="form-field"><label>Contraseña</label>' + u.passwordFieldHTML('password', 'Crea una contraseña', 'new-password') + '</div>' +
      '    <div class="form-field"><label>Confirmar contraseña</label>' + u.passwordFieldHTML('confirm-password', 'Repite tu contraseña', 'new-password') + '</div>' +

      '    <div class="payment-section">' +
      '      <div class="payment-section__title">' + u.icon('shield', { size: 15 }) + ' Sin tarjeta, sin compromiso</div>' +
      '      <p class="payment-section__note">Al terminar los 30 días, si quieres seguir usando InmoMaps solo entras a tu panel y activas tu suscripción — si no, tu cuenta se pausa sola, sin cargos.</p>' +
      '    </div>' +

      '    <p class="text-muted" style="font-size:0.76rem;margin:2px 0 12px">Al crear tu cuenta aceptas los <a href="#/terminos" style="color:var(--color-primary);font-weight:700">Términos y condiciones</a> y el <a href="#/privacidad" style="color:var(--color-primary);font-weight:700">Aviso de privacidad</a> de InmoMaps.</p>' +
      '    <button type="button" class="btn btn--primary btn--block" data-register>Crear mi cuenta de prueba</button>' +
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
      var password2 = u.qs('[data-confirm-password]', root).value;
      if (!name || !email || !password) { u.toast('Completa nombre, correo y contraseña'); return; }
      if (password.length < 6) { u.toast('La contraseña debe tener al menos 6 caracteres'); return; }
      if (password !== password2) { u.toast('Las contraseñas no coinciden'); return; }
      registerBtn.disabled = true;
      try {
        await state.agents.registerTrial({ name: name, email: email, phone: phone, city: city, password: password });
        window.location.hash = '#/dashboard';
      } catch (err) {
        u.toast(err.message || 'No se pudo crear la cuenta');
        registerBtn.disabled = false;
      }
    });
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.registerTrialPlan = { render: render };
})();
