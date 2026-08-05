// Vista "Acceso de asesor": iniciar sesión o registrarse como nuevo asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;

  function render(params, root) {
    document.body.classList.add('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';
    document.title = 'Acceso de asesor — InmoMap';

    if (state.agents.isLoggedIn()) {
      window.location.hash = '#/dashboard';
      return;
    }

    function renderCard() {
      root.innerHTML =
        '<div class="admin-login">' +
        '  <div class="admin-login__card" style="max-width:400px">' +
        '    <div class="admin-login__logo">' + u.icon('pin', { size: 22 }) + ' InmoMap Asesores</div>' +
        '    <p class="text-muted" style="text-align:center;font-size:0.84rem;margin-bottom:18px">Tu panel de trabajo como asesor inmobiliario</p>' +
        '    <div class="tabs" style="padding:0 0 16px;justify-content:center">' +
        '      <span class="tab is-active">Iniciar sesión</span>' +
        '      <a class="tab" href="#/planes">Crear cuenta</a>' +
        '    </div>' +
        loginFormHTML() +
        '  </div>' +
        '</div>';
      wire();
    }

    function loginFormHTML() {
      return (
        '<div class="form-field"><label>Correo</label><input type="email" data-email placeholder="tu@correo.com" autocomplete="username" /></div>' +
        '<div class="form-field"><label>Contraseña</label><input type="password" data-password placeholder="Tu contraseña" autocomplete="current-password" /></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-login>Ingresar</button>'
      );
    }

    function wire() {
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
    }

    renderCard();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.login = { render: render };
})();
