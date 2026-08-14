// Vista "Restablecer contraseña": a donde lleva el enlace de "¿Olvidaste tu
// contraseña?". Igual que confirmar-cuenta, usa un enlace de marca propia
// (token_hash + verifyOtp) en vez del que da Supabase por default.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var supabase = window.App.supabase;

  function shell(bodyHtml) {
    return '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Nueva contraseña</h1>' +
      '</div>' +
      '<div class="page-wrap" style="max-width:480px">' + bodyHtml + '</div>';
  }

  function renderState(root, icon, color, title, message, cta) {
    root.innerHTML = shell(
      '<div class="empty-state" style="padding-top:24px">' +
      '<span class="empty-state__icon" style="color:' + color + '">' + u.icon(icon, { size: 40 }) + '</span>' +
      '<h3>' + u.escapeHtml(title) + '</h3>' +
      '<p>' + message + '</p>' +
      (cta || '<a class="btn btn--primary" href="#/">Volver al mapa</a>') +
      '</div>'
    );
  }

  async function render(params, root) {
    document.title = 'Nueva contraseña — InmoMaps';
    c.mountChrome('explore');
    root.innerHTML = shell('<div class="empty-state" style="padding-top:24px"><span class="spinner"></span><p>Verificando enlace…</p></div>');

    var query = params.query || {};
    var tokenHash = query.token_hash;
    var type = query.type || 'recovery';

    if (!supabase || !tokenHash) {
      renderState(root, 'alert', 'var(--color-renta)', 'Enlace incompleto',
        'Este enlace no trae la información necesaria. Ábrelo directo desde el correo que te mandamos, o pide uno nuevo desde "¿Olvidaste tu contraseña?" al iniciar sesión.',
        '<a class="btn btn--primary" href="#/dashboard/login">Ir a iniciar sesión</a>');
      return;
    }

    var verifyResult = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type });
    if (verifyResult.error) {
      renderState(root, 'alert', 'var(--color-renta)', 'Este enlace ya no es válido',
        'Puede que ya lo hayas usado o que haya caducado. Pide uno nuevo desde "¿Olvidaste tu contraseña?" al iniciar sesión.',
        '<a class="btn btn--primary" href="#/dashboard/login">Ir a iniciar sesión</a>');
      return;
    }

    root.innerHTML = shell(
      '<p class="text-secondary" style="font-size:0.9rem;margin-bottom:16px">Escribe tu nueva contraseña.</p>' +
      '<div class="form-field"><label>Nueva contraseña</label>' + u.passwordFieldHTML('new-password', 'Mínimo 6 caracteres', 'new-password') + '</div>' +
      '<div class="form-field"><label>Confirmar contraseña</label>' + u.passwordFieldHTML('confirm-password', 'Repite la contraseña', 'new-password') + '</div>' +
      '<button type="button" class="btn btn--primary btn--block" data-save>Guardar y entrar</button>'
    );
    u.wirePasswordToggles(root);

    var saveBtn = u.qs('[data-save]', root);
    saveBtn.addEventListener('click', async function () {
      var pass1 = u.qs('[data-new-password]', root).value;
      var pass2 = u.qs('[data-confirm-password]', root).value;
      if (!pass1 || pass1.length < 6) { u.toast('La contraseña debe tener al menos 6 caracteres'); return; }
      if (pass1 !== pass2) { u.toast('Las contraseñas no coinciden'); return; }

      saveBtn.disabled = true;
      try {
        var updateResult = await supabase.auth.updateUser({ password: pass1 });
        if (updateResult.error) throw updateResult.error;
        await state.agents.bootstrap();
        u.toast('¡Contraseña actualizada!', { tone: 'success' });
        window.location.hash = '#/dashboard';
        window.location.reload();
      } catch (err) {
        saveBtn.disabled = false;
        u.toast(err.message || 'No se pudo actualizar la contraseña');
      }
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.resetPassword = { render: render };
})();
