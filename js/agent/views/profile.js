// Vista "Perfil profesional": edición de la página pública del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var ac = window.App.agent.components;

  function render(params, root) {
    var agent = state.agents.current();

    var content =
      '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
      '  <a class="btn btn--outline btn--sm" href="#/' + agent.slug + '" target="_blank" rel="noopener">' + u.icon('home', { size: 14 }) + ' Ver mi perfil público</a>' +
      '</div>' +
      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Foto y datos generales</div></div>' +
      '  <div class="row gap-3" style="align-items:flex-start;flex-wrap:wrap">' +
      '  <img src="' + agent.photo + '" alt="" style="width:72px;height:72px;border-radius:50%;object-fit:cover" />' +
      '  <div style="flex:1;min-width:220px">' +
      '    <div class="form-field"><label>URL de tu fotografía</label><input type="text" data-f="photo" value="' + u.escapeHtml(agent.photo) + '" /></div>' +
      '    <div class="form-field"><label>URL de tu logo (opcional)</label><input type="text" data-f="logoUrl" placeholder="https://..." value="' + u.escapeHtml(agent.logoUrl || '') + '" /></div>' +
      '  </div></div>' +
      '  <div class="form-row">' +
      '  <div class="form-field"><label>Nombre</label><input type="text" data-f="name" value="' + u.escapeHtml(agent.name) + '" /></div>' +
      '  <div class="form-field"><label>Empresa (opcional)</label><input type="text" data-f="company" value="' + u.escapeHtml(agent.company || '') + '" /></div>' +
      '  </div>' +
      '  <div class="form-row">' +
      '  <div class="form-field"><label>Especialidad</label><input type="text" data-f="specialty" placeholder="Ej. Residencial, terrenos..." value="' + u.escapeHtml(agent.specialty || '') + '" /></div>' +
      '  <div class="form-field"><label>Ciudad</label><input type="text" data-f="city" value="' + u.escapeHtml(agent.city) + '" /></div>' +
      '  </div>' +
      '  <div class="form-field"><label>Biografía</label><textarea rows="4" data-f="bio">' + u.escapeHtml(agent.bio) + '</textarea></div>' +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Contacto y horario</div></div>' +
      '  <div class="form-row">' +
      '  <div class="form-field"><label>WhatsApp</label><input type="text" data-f="whatsapp" value="' + u.escapeHtml(agent.whatsapp) + '" /></div>' +
      '  <div class="form-field"><label>Horario de atención</label><input type="text" data-f="schedule" placeholder="Lun-Sáb 9:00-19:00" value="' + u.escapeHtml(agent.schedule || '') + '" /></div>' +
      '  </div>' +
      '  <div class="form-row">' +
      '  <div class="form-field"><label>Facebook</label><input type="text" data-f="facebook" value="' + u.escapeHtml((agent.social && agent.social.facebook) || '') + '" /></div>' +
      '  <div class="form-field"><label>Instagram</label><input type="text" data-f="instagram" value="' + u.escapeHtml((agent.social && agent.social.instagram) || '') + '" /></div>' +
      '  </div>' +
      '</div>' +

      '<button type="button" class="btn btn--primary" data-save>Guardar cambios</button>';

    ac.mount('perfil-profesional', 'Perfil profesional', content, root);

    u.qs('[data-save]', root).addEventListener('click', async function () {
      try {
        await state.agents.updateProfile(agent.slug, {
          photo: u.qs('[data-f="photo"]', root).value,
          logoUrl: u.qs('[data-f="logoUrl"]', root).value,
          name: u.qs('[data-f="name"]', root).value,
          company: u.qs('[data-f="company"]', root).value,
          specialty: u.qs('[data-f="specialty"]', root).value,
          city: u.qs('[data-f="city"]', root).value,
          bio: u.qs('[data-f="bio"]', root).value,
          whatsapp: u.qs('[data-f="whatsapp"]', root).value,
          schedule: u.qs('[data-f="schedule"]', root).value,
          social: {
            facebook: u.qs('[data-f="facebook"]', root).value,
            instagram: u.qs('[data-f="instagram"]', root).value
          }
        });
        u.toast('Perfil actualizado', { tone: 'success' });
      } catch (err) {
        u.toast(err.message || 'No se pudo guardar el perfil');
      }
    });
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.profile = { render: render };
})();
