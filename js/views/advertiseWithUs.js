// Vista "Anúnciate aquí": formulario para que un profesional (notario,
// valuador, arquitecto, etc.) pida aparecer en el directorio. Se guarda como
// una solicitud que revisa el administrador — no crea la ficha automáticamente.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  function render(params, root) {
    function renderForm() {
      root.innerHTML =
        '<div class="page-header">' +
        '  <a class="btn btn--icon" href="#/" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
        '  <h1 class="page-header__title">Anúnciate aquí</h1>' +
        '</div>' +
        '<div class="page-wrap" style="max-width:560px">' +
        '  <p class="text-secondary" style="margin-bottom:20px">¿Eres notario, valuador, arquitecto o das otro servicio inmobiliario? Cuéntanos y te contactamos para aparecer en el directorio de InmoMaps.</p>' +

        '  <div class="form-field"><label>Nombre o razón social</label><input type="text" data-name placeholder="Tu nombre o el de tu despacho" /></div>' +
        '  <div class="form-row">' +
        '  <div class="form-field"><label>Teléfono / WhatsApp</label><input type="text" data-phone placeholder="9811234567" /></div>' +
        '  <div class="form-field"><label>Correo (opcional)</label><input type="email" data-email placeholder="tu@correo.com" /></div>' +
        '  </div>' +
        '  <div class="form-row">' +
        '  <div class="form-field"><label>Categoría</label><select data-category>' + u.SERVICE_CATEGORIES.map(function (cat) { return '<option value="' + cat.key + '">' + cat.label + '</option>'; }).join('') + '</select></div>' +
        '  <div class="form-field"><label>Ciudad donde trabajas</label><input type="text" data-city placeholder="Campeche" /></div>' +
        '  </div>' +
        '  <div class="form-field"><label>Cuéntanos de tu servicio</label><textarea rows="4" data-message placeholder="Experiencia, especialidad, zonas donde atiendes..."></textarea></div>' +
        '  <div style="position:absolute;left:-9999px" aria-hidden="true"><label>Sitio web</label><input type="text" data-website tabindex="-1" autocomplete="off" /></div>' +

        '  <button type="button" class="btn btn--primary btn--block" data-submit>Enviar solicitud</button>' +
        '</div>';

      c.mountChrome('explore');
      document.title = 'Anúnciate aquí — InmoMaps';

      var submitBtn = u.qs('[data-submit]', root);
      submitBtn.addEventListener('click', async function () {
        var name = u.qs('[data-name]', root).value.trim();
        var phone = u.qs('[data-phone]', root).value.trim();
        var email = u.qs('[data-email]', root).value.trim();
        var city = u.qs('[data-city]', root).value.trim();
        var message = u.qs('[data-message]', root).value.trim();
        if (!name || !phone) { u.toast('Escribe tu nombre y teléfono'); return; }

        submitBtn.disabled = true;
        try {
          await state.leads.create({
            kind: 'directorio', name: name, phone: phone, email: email, message: message,
            details: { category: u.qs('[data-category]', root).value, city: city }
          });
          renderConfirmation();
        } catch (err) {
          submitBtn.disabled = false;
          u.toast(err.message || 'No se pudo enviar tu solicitud');
        }
      });
    }

    function renderConfirmation() {
      root.innerHTML =
        '<div class="page-header">' +
        '  <a class="btn btn--icon" href="#/" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
        '  <h1 class="page-header__title">Anúnciate aquí</h1>' +
        '</div>' +
        '<div class="empty-state" style="padding-top:64px">' +
        '  <span class="empty-state__icon" style="color:var(--color-venta)">' + u.icon('check', { size: 40 }) + '</span>' +
        '  <h3>¡Solicitud enviada!</h3>' +
        '  <p>Te contactaremos para darte de alta en el directorio.</p>' +
        '  <a class="btn btn--primary" href="#/">Volver al mapa</a>' +
        '</div>';
      c.mountChrome('explore');
    }

    renderForm();
  }

  window.App.views = window.App.views || {};
  window.App.views.advertiseWithUs = { render: render };
})();
