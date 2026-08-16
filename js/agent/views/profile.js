// Vista "Perfil profesional": edición de la página pública del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var ac = window.App.agent.components;
  var supabase = window.App.supabase;

  function render(params, root) {
    var agent = state.agents.current();
    var photoUrl = agent.photo;
    var uploadingPhoto = false;

    function avatarHTML() {
      return (
        '<button type="button" class="profile-avatar-picker" data-avatar-picker aria-label="Cambiar foto de perfil">' +
        (uploadingPhoto
          ? '<span class="spinner"></span>'
          : '<img src="' + photoUrl + '" alt="" />') +
        '<span class="profile-avatar-picker__badge">' + u.icon('camera', { size: 13 }) + '</span>' +
        '</button>'
      );
    }

    var isOwner = agent.plan === 'propietario';

    var content =
      '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
      '  <a class="btn btn--outline btn--sm" href="#/' + agent.slug + '" target="_blank" rel="noopener">' + u.icon('home', { size: 14 }) + ' Ver mi perfil público</a>' +
      '</div>' +
      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Foto y datos generales</div></div>' +
      '  <div class="row gap-3" style="align-items:flex-start;flex-wrap:wrap">' +
      '  <div data-avatar-wrap>' + avatarHTML() + '</div>' +
      '  <input type="file" accept="image/*" data-avatar-input style="display:none" />' +
      '  <div style="flex:1;min-width:220px">' +
      '    <p class="text-muted" style="font-size:0.78rem;margin-top:4px">Toca tu foto para cambiarla.</p>' +
      '  </div></div>' +
      (isOwner
        ? '  <div class="form-field"><label>Nombre</label><input type="text" data-f="name" value="' + u.escapeHtml(agent.name) + '" /></div>' +
          '  <div class="form-field"><label>WhatsApp / Teléfono</label><input type="text" data-f="whatsapp" value="' + u.escapeHtml(agent.whatsapp) + '" /></div>'
        : '  <div class="form-row">' +
          '  <div class="form-field"><label>Nombre</label><input type="text" data-f="name" value="' + u.escapeHtml(agent.name) + '" /></div>' +
          '  <div class="form-field"><label>Empresa (opcional)</label><input type="text" data-f="company" value="' + u.escapeHtml(agent.company || '') + '" /></div>' +
          '  </div>' +
          '  <div class="form-row">' +
          '  <div class="form-field"><label>Especialidad</label><input type="text" data-f="specialty" placeholder="Ej. Residencial, terrenos..." value="' + u.escapeHtml(agent.specialty || '') + '" /></div>' +
          '  <div class="form-field"><label>Ciudad</label><input type="text" data-f="city" value="' + u.escapeHtml(agent.city) + '" /></div>' +
          '  </div>' +
          '  <div class="form-field"><label>Biografía</label><textarea rows="4" data-f="bio">' + u.escapeHtml(agent.bio) + '</textarea></div>') +
      '</div>' +

      (isOwner ? '' :
      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Contacto y horario</div></div>' +
      '  <div class="form-row">' +
      '  <div class="form-field"><label>WhatsApp</label><input type="text" data-f="whatsapp" value="' + u.escapeHtml(agent.whatsapp) + '" /></div>' +
      '  <div class="form-field"><label>Horario de atención</label><input type="text" data-f="schedule" placeholder="Lun-Sáb 9:00-19:00" value="' + u.escapeHtml(agent.schedule || '') + '" /></div>' +
      '  </div>' +
      '  <div class="form-row">' +
      '  <div class="form-field"><label>Facebook</label><input type="text" data-f="facebook" placeholder="https://facebook.com/tu-pagina" value="' + u.escapeHtml((agent.social && agent.social.facebook) || '') + '" /></div>' +
      '  <div class="form-field"><label>Instagram</label><input type="text" data-f="instagram" placeholder="https://instagram.com/tu-usuario" value="' + u.escapeHtml((agent.social && agent.social.instagram) || '') + '" /></div>' +
      '  </div>' +
      '  <div class="form-row">' +
      '  <div class="form-field"><label>TikTok</label><input type="text" data-f="tiktok" placeholder="https://tiktok.com/@tu-usuario" value="' + u.escapeHtml((agent.social && agent.social.tiktok) || '') + '" /></div>' +
      '  <div class="form-field"><label>Sitio web (opcional)</label><input type="text" data-f="website" placeholder="https://tu-sitio.com" value="' + u.escapeHtml((agent.social && agent.social.website) || '') + '" /></div>' +
      '  </div>' +
      '</div>') +

      '<button type="button" class="btn btn--primary" data-save>Guardar cambios</button>' +

      '<div class="admin-section" style="margin-top:20px">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Contraseña</div></div>' +
      '  <div class="form-field"><label>Nueva contraseña</label>' + u.passwordFieldHTML('new-password', 'Mínimo 6 caracteres', 'new-password') + '</div>' +
      '  <div class="form-field"><label>Confirmar contraseña</label>' + u.passwordFieldHTML('confirm-password', 'Repite la contraseña', 'new-password') + '</div>' +
      '  <button type="button" class="btn btn--outline" data-save-password>Cambiar contraseña</button>' +
      '</div>';

    ac.mount('perfil-profesional', 'Perfil profesional', content, root);
    u.wirePasswordToggles(root);

    var savePasswordBtn = u.qs('[data-save-password]', root);
    savePasswordBtn.addEventListener('click', async function () {
      var pass1 = u.qs('[data-new-password]', root).value;
      var pass2 = u.qs('[data-confirm-password]', root).value;
      if (!pass1 || pass1.length < 6) { u.toast('La contraseña debe tener al menos 6 caracteres'); return; }
      if (pass1 !== pass2) { u.toast('Las contraseñas no coinciden'); return; }
      savePasswordBtn.disabled = true;
      try {
        var updateResult = await supabase.auth.updateUser({ password: pass1 });
        if (updateResult.error) throw updateResult.error;
        u.qs('[data-new-password]', root).value = '';
        u.qs('[data-confirm-password]', root).value = '';
        u.toast('Contraseña actualizada', { tone: 'success' });
      } catch (err) {
        u.toast(err.message || 'No se pudo actualizar la contraseña');
      } finally {
        savePasswordBtn.disabled = false;
      }
    });

    var fileInput = u.qs('[data-avatar-input]', root);
    u.qs('[data-avatar-picker]', root).addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      uploadingPhoto = true;
      u.qs('[data-avatar-wrap]', root).innerHTML = avatarHTML();
      window.App.photoUpload.uploadImage(file, 'avatars/' + agent.slug).then(function (url) {
        photoUrl = url;
        uploadingPhoto = false;
        u.qs('[data-avatar-wrap]', root).innerHTML = avatarHTML();
        u.qs('[data-avatar-picker]', root).addEventListener('click', function () { fileInput.click(); });
      }).catch(function (err) {
        uploadingPhoto = false;
        u.qs('[data-avatar-wrap]', root).innerHTML = avatarHTML();
        u.qs('[data-avatar-picker]', root).addEventListener('click', function () { fileInput.click(); });
        u.toast(err.message || 'No se pudo subir la foto');
      });
    });

    u.qs('[data-save]', root).addEventListener('click', async function () {
      try {
        var fields = {
          photo: photoUrl,
          name: u.qs('[data-f="name"]', root).value,
          whatsapp: u.qs('[data-f="whatsapp"]', root).value
        };
        if (!isOwner) {
          Object.assign(fields, {
            company: u.qs('[data-f="company"]', root).value,
            specialty: u.qs('[data-f="specialty"]', root).value,
            city: u.qs('[data-f="city"]', root).value,
            bio: u.qs('[data-f="bio"]', root).value,
            schedule: u.qs('[data-f="schedule"]', root).value,
            social: {
              facebook: u.qs('[data-f="facebook"]', root).value,
              instagram: u.qs('[data-f="instagram"]', root).value,
              tiktok: u.qs('[data-f="tiktok"]', root).value,
              website: u.qs('[data-f="website"]', root).value
            }
          });
        }
        await state.agents.updateProfile(agent.slug, fields);
        u.toast('Perfil actualizado', { tone: 'success' });
      } catch (err) {
        u.toast(err.message || 'No se pudo guardar el perfil');
      }
    });
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.profile = { render: render };
})();
