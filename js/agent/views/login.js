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

    var tab = 'login';

    function renderCard() {
      root.innerHTML =
        '<div class="admin-login">' +
        '  <div class="admin-login__card" style="max-width:400px">' +
        '    <div class="admin-login__logo">' + u.icon('pin', { size: 22 }) + ' InmoMap Asesores</div>' +
        '    <p class="text-muted" style="text-align:center;font-size:0.84rem;margin-bottom:18px">Tu panel de trabajo como asesor inmobiliario</p>' +
        '    <div class="tabs" style="padding:0 0 16px;justify-content:center">' +
        '      <button type="button" class="tab' + (tab === 'login' ? ' is-active' : '') + '" data-tab="login">Iniciar sesión</button>' +
        '      <button type="button" class="tab' + (tab === 'register' ? ' is-active' : '') + '" data-tab="register">Crear cuenta</button>' +
        '    </div>' +
        (tab === 'login' ? loginFormHTML() : registerFormHTML()) +
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

    function registerFormHTML() {
      return (
        '<div class="form-field"><label>Nombre completo</label><input type="text" data-name placeholder="Tu nombre" /></div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Correo</label><input type="text" data-reg-email placeholder="tu@correo.com" /></div>' +
        '<div class="form-field"><label>Teléfono</label><input type="text" data-phone placeholder="9811234567" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Ciudad</label><input type="text" data-city placeholder="Campeche" /></div>' +
        '<div class="form-field"><label>Contraseña</label><input type="password" data-reg-password placeholder="Crea una contraseña" /></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-register>Crear mi cuenta de asesor</button>' +
        '<div class="admin-login__hint">Al registrarte obtienes acceso inmediato a tu panel: propiedades, clientes, enlaces y estadísticas.</div>'
      );
    }

    function wire() {
      u.qsa('[data-tab]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { tab = btn.getAttribute('data-tab'); renderCard(); });
      });

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

      var registerBtn = u.qs('[data-register]', root);
      if (registerBtn) registerBtn.addEventListener('click', async function () {
        var name = u.qs('[data-name]', root).value.trim();
        var email = u.qs('[data-reg-email]', root).value.trim();
        var phone = u.qs('[data-phone]', root).value.trim();
        var city = u.qs('[data-city]', root).value.trim();
        var password = u.qs('[data-reg-password]', root).value;
        if (!name || !email || !password) { u.toast('Completa nombre, correo y contraseña'); return; }
        if (password.length < 6) { u.toast('La contraseña debe tener al menos 6 caracteres'); return; }
        registerBtn.disabled = true;
        try {
          await state.agents.register({ name: name, email: email, phone: phone, city: city, password: password });
          u.toast('Cuenta creada, ¡bienvenido a InmoMap!', { tone: 'success' });
          window.location.hash = '#/dashboard';
        } catch (err) {
          u.toast(err.message || 'No se pudo crear la cuenta');
        } finally {
          registerBtn.disabled = false;
        }
      });
    }

    renderCard();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.login = { render: render };
})();
