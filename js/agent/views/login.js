// Vista "Acceso de asesor": iniciar sesión o registrarse como nuevo asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var supabase = window.App.supabase;

  function render(params, root) {
    document.body.classList.add('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';
    document.title = 'Acceso de asesor — InmoMaps';

    if (state.agents.isLoggedIn()) {
      window.location.hash = '#/dashboard';
      return;
    }

    function renderCard() {
      root.innerHTML =
        '<div class="admin-login">' +
        '  <div class="admin-login__card" style="max-width:400px">' +
        '    <a class="signup-checkout__back" href="#/">' + u.icon('chevronLeft', { size: 16 }) + ' Volver al inicio</a>' +
        '    <div class="admin-login__logo">' + u.logoHTML() + ' <span class="logo-tag">Asesores</span></div>' +
        '    <p class="text-muted" style="text-align:center;font-size:0.84rem;margin-bottom:18px">Tu panel de trabajo como asesor inmobiliario</p>' +
        '    <div class="tabs" style="padding:0 0 16px;justify-content:center">' +
        '      <span class="tab is-active">Iniciar sesión</span>' +
        '      <a class="tab" href="#/perfil">Crear cuenta</a>' +
        '    </div>' +
        loginFormHTML() +
        '  </div>' +
        '</div>';
      wire();
    }

    function loginFormHTML() {
      return (
        '<div class="form-field"><label>Correo</label><input type="email" data-email placeholder="tu@correo.com" autocomplete="username" /></div>' +
        '<div class="form-field"><label>Contraseña</label>' + u.passwordFieldHTML('password', 'Tu contraseña', 'current-password') + '</div>' +
        '<button type="button" class="btn btn--primary btn--block" data-login>Ingresar</button>' +
        '<p style="text-align:center;margin-top:12px"><a href="#" data-forgot style="font-size:0.84rem;color:var(--color-primary);font-weight:700">¿Olvidaste tu contraseña?</a></p>'
      );
    }

    function openForgotPassword() {
      c.openSheet({
        title: 'Recuperar contraseña',
        body:
          '<p class="text-secondary" style="font-size:0.86rem;margin-bottom:14px">Escribe el correo de tu cuenta y te mandamos un enlace para crear una nueva contraseña.</p>' +
          '<div class="form-field"><label>Correo</label><input type="email" data-forgot-email placeholder="tu@correo.com" /></div>' +
          '<button type="button" class="btn btn--primary btn--block" data-forgot-send>Enviar enlace</button>'
      });
      var sheetRoot = u.qs('#sheet-root');
      var sendBtn = u.qs('[data-forgot-send]', sheetRoot);
      sendBtn.addEventListener('click', async function () {
        var email = u.qs('[data-forgot-email]', sheetRoot).value.trim();
        if (!email) { u.toast('Escribe tu correo'); return; }
        sendBtn.disabled = true;
        try {
          if (!supabase) throw new Error('Supabase no está configurado');
          var result = await supabase.auth.resetPasswordForEmail(email.toLowerCase());
          if (result.error) throw result.error;
          c.closeSheet();
          u.toast('Te mandamos un enlace a tu correo', { tone: 'success' });
        } catch (err) {
          sendBtn.disabled = false;
          u.toast(err.message || 'No se pudo enviar el enlace');
        }
      });
    }

    function wire() {
      u.wirePasswordToggles(root);
      var loginBtn = u.qs('[data-login]', root);
      if (loginBtn) loginBtn.addEventListener('click', async function () {
        var email = u.qs('[data-email]', root).value;
        var password = u.qs('[data-password]', root).value;
        loginBtn.disabled = true;
        try {
          var agent = await state.agents.login(email, password);
          if (agent) { window.location.hash = '#/dashboard'; }
          else { u.toast('Correo o contraseña incorrectos'); }
        } catch (err) {
          u.toast(err.message || 'No se pudo iniciar sesión');
        } finally {
          loginBtn.disabled = false;
        }
      });
      var forgotLink = u.qs('[data-forgot]', root);
      if (forgotLink) forgotLink.addEventListener('click', function (e) { e.preventDefault(); openForgotPassword(); });
    }

    renderCard();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.login = { render: render };
})();
