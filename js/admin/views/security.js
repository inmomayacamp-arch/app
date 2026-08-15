// Vista "Seguridad": activar/desactivar verificación en dos pasos (TOTP)
// para el acceso admin. Usa el soporte de MFA nativo de Supabase Auth, sin
// tabla ni Edge Function propia.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function render(params, root) {
    ac.mount('seguridad', 'Seguridad', '<div class="empty-state" style="padding-top:64px"><p class="text-muted">Cargando…</p></div>', root);

    s.mfa.listFactors().then(function (factors) {
      var verified = factors.filter(function (f) { return f.status === 'verified'; })[0];
      if (verified) renderEnabled(verified);
      else renderDisabled();
    }).catch(function (err) {
      ac.mount('seguridad', 'Seguridad', '<p class="text-muted">' + u.escapeHtml(err.message || 'No se pudo cargar el estado de seguridad') + '</p>', root);
    });

    function renderDisabled() {
      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Verificación en dos pasos</div>' +
        '  <div class="admin-section__subtitle">Está desactivada — cualquiera con tu contraseña puede entrar al panel</div></div></div>' +
        '  <p class="text-secondary">Al activarla, además de tu contraseña vas a necesitar un código de 6 dígitos de una app de autenticación (Google Authenticator, Authy, etc.) cada vez que inicies sesión.</p>' +
        '  <button type="button" class="btn btn--primary" data-start-enroll>Activar verificación en dos pasos</button>' +
        '</div>';
      ac.mount('seguridad', 'Seguridad', content, root);
      u.qs('[data-start-enroll]', root).addEventListener('click', startEnroll);
    }

    async function startEnroll() {
      try {
        var data = await s.mfa.enroll();
        renderEnrollStep(data);
      } catch (err) {
        u.toast(err.message || 'No se pudo iniciar la activación');
      }
    }

    function renderEnrollStep(data) {
      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Escanea el código</div>' +
        '  <div class="admin-section__subtitle">Con Google Authenticator, Authy o una app similar</div></div></div>' +
        '  <div style="display:flex;justify-content:center;padding:12px;background:#fff;border-radius:12px;max-width:220px;margin:0 auto 14px" data-qr></div>' +
        '  <p class="text-muted" style="text-align:center;font-size:0.78rem;word-break:break-all">¿No puedes escanear? Escribe esta clave en tu app: <strong>' + u.escapeHtml(data.totp.secret) + '</strong></p>' +
        '  <div class="form-field"><label>Código de 6 dígitos</label><input type="text" inputmode="numeric" maxlength="6" data-code placeholder="000000" /></div>' +
        '  <div class="row gap-2">' +
        '    <button type="button" class="btn btn--primary" data-confirm-enroll>Confirmar</button>' +
        '    <button type="button" class="btn btn--outline" data-cancel-enroll>Cancelar</button>' +
        '  </div>' +
        '</div>';
      ac.mount('seguridad', 'Seguridad', content, root);
      u.qs('[data-qr]', root).innerHTML = data.totp.qr_code;

      u.qs('[data-cancel-enroll]', root).addEventListener('click', async function () {
        try { await s.mfa.unenroll(data.id); } catch (e) { /* no-op */ }
        renderDisabled();
      });
      u.qs('[data-confirm-enroll]', root).addEventListener('click', async function () {
        var code = u.qs('[data-code]', root).value.trim();
        if (!code) { u.toast('Escribe el código de 6 dígitos'); return; }
        try {
          await s.mfa.confirm(data.id, code);
          u.toast('Verificación en dos pasos activada', { tone: 'success' });
          render(params, root);
        } catch (err) {
          u.toast(err.message || 'Código incorrecto');
        }
      });
    }

    function renderEnabled(factor) {
      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Verificación en dos pasos</div>' +
        '  <div class="admin-section__subtitle">Está activada — se pide un código además de la contraseña al iniciar sesión</div></div></div>' +
        '  <p class="text-secondary">Si pierdes acceso a tu app de autenticación, contáctanos para desactivarla desde la base de datos.</p>' +
        '  <button type="button" class="btn btn--outline" data-unenroll>Desactivar</button>' +
        '</div>';
      ac.mount('seguridad', 'Seguridad', content, root);
      u.qs('[data-unenroll]', root).addEventListener('click', async function () {
        if (!window.confirm('¿Desactivar la verificación en dos pasos? Con solo la contraseña se podrá entrar al panel.')) return;
        try {
          await s.mfa.unenroll(factor.id);
          u.toast('Verificación en dos pasos desactivada');
          render(params, root);
        } catch (err) {
          u.toast(err.message || 'No se pudo desactivar');
        }
      });
    }
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.security = { render: render };
})();
