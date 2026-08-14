// Vista "Crea tu cuenta de propietario": registro mínimo (sin plan de pago)
// para quien quiere publicar su propiedad sin ser asesor. Usa la misma
// cuenta de asesor por debajo (state.agents.register con plan "propietario"),
// así que después de crearla entra al mismo asistente de publicación que
// usan los asesores (#/dashboard/publicar) — nada más que ese formulario ya
// sabe ocultarle la Bolsa Compartida y el destacado gratis a quien no tiene
// plan "profesional" (ver isPremium en publishWizard.js).
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;

  function render(params, root) {
    document.body.classList.add('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';
    document.title = 'Crea tu cuenta — InmoMaps';

    if (state.agents.isLoggedIn()) {
      window.location.hash = '#/dashboard';
      return;
    }

    var photoUrl = '';
    var uploadingPhoto = false;

    function avatarHTML() {
      return (
        '<button type="button" class="profile-avatar-picker" data-avatar-picker aria-label="Agregar foto de perfil">' +
        (uploadingPhoto
          ? '<span class="spinner"></span>'
          : (photoUrl ? '<img src="' + photoUrl + '" alt="" />' : u.icon('camera', { size: 22 }))) +
        '<span class="profile-avatar-picker__badge">' + u.icon('camera', { size: 13 }) + '</span>' +
        '</button>'
      );
    }

    root.innerHTML =
      '<div class="signup-checkout">' +
      '  <div class="signup-checkout__card">' +
      '    <a class="signup-checkout__back" href="#/planes-propietario">' + u.icon('chevronLeft', { size: 16 }) + ' Volver</a>' +

      '    <h1 class="signup-checkout__title">Crea tu cuenta</h1>' +
      '    <p class="signup-checkout__subtitle">Solo lo esencial — con esto puedes publicar tu propiedad gratis y volver cuando quieras para editarla o destacarla.</p>' +

      '    <div class="row" style="justify-content:center;margin-bottom:18px" data-avatar-wrap>' + avatarHTML() + '</div>' +
      '    <input type="file" accept="image/*" data-avatar-input style="display:none" />' +

      '    <div class="form-field"><label>Nombre completo</label><input type="text" data-name placeholder="Tu nombre" /></div>' +
      '    <div class="form-row">' +
      '    <div class="form-field"><label>Correo</label><input type="email" data-email placeholder="tu@correo.com" /></div>' +
      '    <div class="form-field"><label>Teléfono / WhatsApp</label><input type="text" data-phone placeholder="9811234567" /></div>' +
      '    </div>' +
      '    <div class="form-field"><label>Contraseña</label><input type="password" data-password placeholder="Crea una contraseña" /></div>' +

      '    <p class="text-muted" style="font-size:0.76rem;margin:2px 0 12px">Al crear tu cuenta aceptas los <a href="#/terminos" style="color:var(--color-primary);font-weight:700">Términos y condiciones</a> y el <a href="#/privacidad" style="color:var(--color-primary);font-weight:700">Aviso de privacidad</a> de InmoMaps.</p>' +
      '    <button type="button" class="btn btn--primary btn--block" data-register>Crear mi cuenta y publicar</button>' +
      '    <p class="signup-checkout__footer">¿Ya tienes cuenta? <a href="#/dashboard/login">Inicia sesión</a></p>' +
      '  </div>' +
      '</div>';

    var fileInput = u.qs('[data-avatar-input]', root);
    u.qs('[data-avatar-picker]', root).addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      uploadingPhoto = true;
      u.qs('[data-avatar-wrap]', root).innerHTML = avatarHTML();
      window.App.photoUpload.uploadImage(file, 'avatars/propietarios').then(function (url) {
        photoUrl = url;
        uploadingPhoto = false;
        u.qs('[data-avatar-wrap]', root).innerHTML = avatarHTML();
        u.qs('[data-avatar-picker]', root).addEventListener('click', function () { fileInput.click(); });
      }).catch(function (err) {
        uploadingPhoto = false;
        u.qs('[data-avatar-wrap]', root).innerHTML = avatarHTML();
        u.qs('[data-avatar-picker]', root).addEventListener('click', function () { fileInput.click(); });
        u.toast(err.message || 'No se pudo subir tu foto');
      });
    });

    var registerBtn = u.qs('[data-register]', root);
    registerBtn.addEventListener('click', async function () {
      var name = u.qs('[data-name]', root).value.trim();
      var email = u.qs('[data-email]', root).value.trim();
      var phone = u.qs('[data-phone]', root).value.trim();
      var password = u.qs('[data-password]', root).value;
      if (!name || !email || !phone || !password) { u.toast('Completa nombre, correo, teléfono y contraseña'); return; }
      if (password.length < 6) { u.toast('La contraseña debe tener al menos 6 caracteres'); return; }

      registerBtn.disabled = true;
      try {
        await state.agents.register({ name: name, email: email, phone: phone, password: password, plan: 'propietario', photo: photoUrl || undefined });
        u.toast('¡Cuenta creada! Ahora publica tu propiedad', { tone: 'success' });
        window.location.hash = '#/dashboard/publicar';
      } catch (err) {
        if (err && /revisa tu correo/i.test(err.message || '')) {
          renderCheckEmail(email);
        } else {
          registerBtn.disabled = false;
          u.toast(err.message || 'No se pudo crear la cuenta');
        }
      }
    });

    function renderCheckEmail(email) {
      document.title = 'Revisa tu correo — InmoMaps';
      root.innerHTML =
        '<div class="signup-checkout">' +
        '  <div class="signup-checkout__card">' +
        '    <div class="empty-state" style="padding-top:24px">' +
        '      <span class="empty-state__icon" style="color:var(--color-venta)">' + u.icon('mail', { size: 40 }) + '</span>' +
        '      <h3>Revisa tu correo</h3>' +
        '      <p>Te mandamos un enlace a <strong>' + u.escapeHtml(email) + '</strong> para confirmar tu cuenta. Ábrelo y podrás iniciar sesión y publicar tu propiedad.</p>' +
        '      <a class="btn btn--primary" href="#/dashboard/login">Ya confirmé, iniciar sesión</a>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    }
  }

  window.App.views = window.App.views || {};
  window.App.views.ownerRegister = { render: render };
})();
