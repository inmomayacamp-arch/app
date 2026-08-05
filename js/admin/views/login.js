// Vista "Login del admin": acceso con correo y contraseña reales (Supabase Auth).
(function () {
  "use strict";

  var u = window.App.utils;
  var s = window.App.admin.state;

  function render(params, root) {
    document.body.classList.add('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';
    document.title = 'Acceso Admin — InmoMap';

    if (s.auth.isAuthed()) {
      window.location.hash = '#/admin';
      return;
    }

    root.innerHTML =
      '<div class="admin-login">' +
      '  <div class="admin-login__card">' +
      '    <div class="admin-login__logo">' + u.icon('pin', { size: 22 }) + ' InmoMap Admin</div>' +
      '    <p class="text-muted" style="text-align:center;font-size:0.84rem;margin-bottom:18px">Panel exclusivo para el equipo de InmoMap</p>' +
      '    <div class="form-field"><label>Correo</label><input type="email" data-email placeholder="tu@correo.com" autocomplete="username" /></div>' +
      '    <div class="form-field"><label>Contraseña</label><input type="password" data-password placeholder="Tu contraseña" autocomplete="current-password" /></div>' +
      '    <button type="button" class="btn btn--primary btn--block" data-login>Ingresar</button>' +
      '  </div>' +
      '</div>';

    async function attempt() {
      var email = u.qs('[data-email]', root).value;
      var password = u.qs('[data-password]', root).value;
      try {
        var ok = await s.auth.login(email, password);
        if (ok) window.location.hash = '#/admin';
        else u.toast('Correo o contraseña incorrectos, o la cuenta no tiene permisos de administrador');
      } catch (err) {
        u.toast(err.message || 'No se pudo iniciar sesión');
      }
    }
    u.qs('[data-login]', root).addEventListener('click', attempt);
    u.qs('[data-password]', root).addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.login = { render: render };
})();
