// Vista "Login del admin": acceso con correo y contraseña reales (Supabase Auth).
(function () {
  "use strict";

  var u = window.App.utils;
  var s = window.App.admin.state;

  function render(params, root) {
    document.body.classList.add('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';
    document.title = 'Acceso Admin — InmoMaps';

    if (s.auth.isAuthed()) {
      window.location.hash = '#/admin';
      return;
    }

    renderPasswordStep();

    function renderPasswordStep() {
      root.innerHTML =
        '<div class="admin-login">' +
        '  <div class="admin-login__card">' +
        '    <a class="signup-checkout__back" href="#/">' + u.icon('chevronLeft', { size: 16 }) + ' Volver al inicio</a>' +
        '    <div class="admin-login__logo">' + u.logoHTML() + ' <span class="logo-tag">Admin</span></div>' +
        '    <p class="text-muted" style="text-align:center;font-size:0.84rem;margin-bottom:18px">Panel exclusivo para el equipo de InmoMaps</p>' +
        '    <div class="form-field"><label>Correo</label><input type="email" data-email placeholder="tu@correo.com" autocomplete="username" /></div>' +
        '    <div class="form-field"><label>Contraseña</label><input type="password" data-password placeholder="Tu contraseña" autocomplete="current-password" /></div>' +
        '    <button type="button" class="btn btn--primary btn--block" data-login>Ingresar</button>' +
        '  </div>' +
        '</div>';

      var email = '';
      async function attempt() {
        email = u.qs('[data-email]', root).value;
        var password = u.qs('[data-password]', root).value;
        try {
          var result = await s.auth.login(email, password);
          if (!result.ok) { u.toast('Correo o contraseña incorrectos, o la cuenta no tiene permisos de administrador'); return; }
          if (result.needsMfa) renderMfaStep(result.factorId, email);
          else window.location.hash = '#/admin';
        } catch (err) {
          u.toast(err.message || 'No se pudo iniciar sesión');
        }
      }
      u.qs('[data-login]', root).addEventListener('click', attempt);
      u.qs('[data-password]', root).addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
    }

    function renderMfaStep(factorId, email) {
      root.innerHTML =
        '<div class="admin-login">' +
        '  <div class="admin-login__card">' +
        '    <div class="admin-login__logo">' + u.logoHTML() + ' <span class="logo-tag">Admin</span></div>' +
        '    <p class="text-muted" style="text-align:center;font-size:0.84rem;margin-bottom:18px">Escribe el código de 6 dígitos de tu app de autenticación</p>' +
        '    <div class="form-field"><label>Código</label><input type="text" inputmode="numeric" maxlength="6" data-code placeholder="000000" autocomplete="one-time-code" /></div>' +
        '    <button type="button" class="btn btn--primary btn--block" data-verify>Verificar</button>' +
        '  </div>' +
        '</div>';

      async function verify() {
        var code = u.qs('[data-code]', root).value.trim();
        if (!code) { u.toast('Escribe el código de 6 dígitos'); return; }
        try {
          await s.auth.completeMfaLogin(factorId, code, email);
          window.location.hash = '#/admin';
        } catch (err) {
          u.toast(err.message || 'Código incorrecto');
        }
      }
      u.qs('[data-verify]', root).addEventListener('click', verify);
      u.qs('[data-code]', root).addEventListener('keydown', function (e) { if (e.key === 'Enter') verify(); });
      u.qs('[data-code]', root).focus();
    }
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.login = { render: render };
})();
