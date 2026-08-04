// Vista "Configuración general": datos de la plataforma sin necesidad de programar.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function render(params, root) {
    var settings = s.settings.get();

    var content =
      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div><div class="admin-section__title">Identidad de la plataforma</div><div class="admin-section__subtitle">Se aplica en toda la app sin necesidad de tocar código</div></div></div>' +
      '  <div class="settings-grid">' +
      '  <div class="form-field"><label>Nombre de la plataforma</label><input type="text" data-f="platformName" value="' + u.escapeHtml(settings.platformName) + '" /></div>' +
      '  <div class="form-field"><label>Color principal</label><input type="color" data-f="primaryColor" value="' + settings.primaryColor + '" style="height:44px;padding:4px" /></div>' +
      '  </div>' +
      '  <div class="form-field"><label>Eslogan</label><input type="text" data-f="tagline" value="' + u.escapeHtml(settings.tagline) + '" /></div>' +
      '  <div class="form-field"><label>URL del logotipo</label><input type="text" data-f="logoUrl" placeholder="https://..." value="' + u.escapeHtml(settings.logoUrl) + '" /></div>' +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Redes sociales y contacto</div></div>' +
      '  <div class="settings-grid">' +
      '  <div class="form-field"><label>Facebook</label><input type="text" data-f="facebook" value="' + u.escapeHtml(settings.facebook) + '" /></div>' +
      '  <div class="form-field"><label>Instagram</label><input type="text" data-f="instagram" value="' + u.escapeHtml(settings.instagram) + '" /></div>' +
      '  <div class="form-field"><label>Correo de soporte</label><input type="text" data-f="supportEmail" value="' + u.escapeHtml(settings.supportEmail) + '" /></div>' +
      '  <div class="form-field"><label>Teléfono de soporte</label><input type="text" data-f="supportPhone" value="' + u.escapeHtml(settings.supportPhone) + '" /></div>' +
      '  </div>' +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Legales</div></div>' +
      '  <div class="form-field"><label>Términos y condiciones</label><textarea rows="4" data-f="termsText">' + u.escapeHtml(settings.termsText) + '</textarea></div>' +
      '  <div class="form-field"><label>Política de privacidad</label><textarea rows="4" data-f="privacyText">' + u.escapeHtml(settings.privacyText) + '</textarea></div>' +
      '</div>' +

      '<button type="button" class="btn btn--primary" data-save>Guardar configuración</button>';

    ac.mount('configuracion', 'Configuración', content, root);

    u.qs('[data-save]', root).addEventListener('click', function () {
      var fields = {};
      u.qsa('[data-f]', root).forEach(function (el) { fields[el.getAttribute('data-f')] = el.value; });
      s.settings.update(fields);
      if (window.App.applyBrandColor) window.App.applyBrandColor(fields.primaryColor);
      u.toast('Configuración guardada');
    });
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.settings = { render: render };
})();
