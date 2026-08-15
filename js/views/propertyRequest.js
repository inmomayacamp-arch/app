// Vista "Solicitar propiedad": formulario para quienes no encontraron lo que
// buscaban. Se guarda como una solicitud que revisa el administrador.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  var TYPES = [
    { value: "", label: "Cualquiera" },
    { value: "casa", label: "Casa" },
    { value: "departamento", label: "Departamento" },
    { value: "terreno", label: "Terreno" },
    { value: "local", label: "Local" },
    { value: "oficina", label: "Oficina" }
  ];

  function render(params, root) {
    function renderForm() {
      root.innerHTML =
        '<div class="page-header">' +
        '  <a class="btn btn--icon" href="#/" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
        '  <h1 class="page-header__title">Solicitar propiedad</h1>' +
        '</div>' +
        '<div class="page-wrap" style="max-width:560px">' +
        '  <p class="text-secondary" style="margin-bottom:20px">¿No encontraste lo que buscabas? Cuéntanos qué necesitas y te avisamos en cuanto se publique algo parecido.</p>' +

        '  <div class="form-field"><label>Nombre completo</label><input type="text" data-name placeholder="Tu nombre" /></div>' +
        '  <div class="form-row">' +
        '  <div class="form-field"><label>Teléfono / WhatsApp</label><input type="text" data-phone placeholder="9811234567" /></div>' +
        '  <div class="form-field"><label>Correo (opcional)</label><input type="email" data-email placeholder="tu@correo.com" /></div>' +
        '  </div>' +
        '  <div class="form-row">' +
        '  <div class="form-field"><label>Tipo de propiedad</label><select data-type>' + TYPES.map(function (t) { return '<option value="' + t.value + '">' + t.label + '</option>'; }).join('') + '</select></div>' +
        '  <div class="form-field"><label>Operación</label><select data-operation><option value="venta">Venta</option><option value="renta">Renta</option></select></div>' +
        '  </div>' +
        '  <div class="form-row">' +
        '  <div class="form-field"><label>Ciudad</label><input type="text" data-city placeholder="Campeche" /></div>' +
        '  <div class="form-field"><label>Presupuesto (opcional)</label><input type="number" min="0" data-budget placeholder="2,000,000" /></div>' +
        '  </div>' +
        '  <div class="form-field"><label>¿Qué estás buscando?</label><textarea rows="4" data-message placeholder="Describe la propiedad ideal: colonia, características, etc."></textarea></div>' +
        '  <div style="position:absolute;left:-9999px" aria-hidden="true"><label>Sitio web</label><input type="text" data-website tabindex="-1" autocomplete="off" /></div>' +

        '  <button type="button" class="btn btn--primary btn--block" data-submit>Enviar solicitud</button>' +
        '</div>';

      c.mountChrome('explore');
      document.title = 'Solicitar propiedad — InmoMaps';

      var submitBtn = u.qs('[data-submit]', root);
      submitBtn.addEventListener('click', async function () {
        var name = u.qs('[data-name]', root).value.trim();
        var phone = u.qs('[data-phone]', root).value.trim();
        var email = u.qs('[data-email]', root).value.trim();
        var city = u.qs('[data-city]', root).value.trim();
        var message = u.qs('[data-message]', root).value.trim();
        var website = u.qs('[data-website]', root).value.trim();
        if (!name || !phone) { u.toast('Escribe tu nombre y teléfono'); return; }
        if (!city) { u.toast('Escribe la ciudad que te interesa'); return; }

        submitBtn.disabled = true;
        try {
          await state.leads.create({
            kind: 'solicitud', name: name, phone: phone, email: email, message: message, website: website,
            details: {
              type: u.qs('[data-type]', root).value,
              operation: u.qs('[data-operation]', root).value,
              city: city,
              budget: Number(u.qs('[data-budget]', root).value) || null
            }
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
        '  <h1 class="page-header__title">Solicitar propiedad</h1>' +
        '</div>' +
        '<div class="empty-state" style="padding-top:64px">' +
        '  <span class="empty-state__icon" style="color:var(--color-venta)">' + u.icon('check', { size: 40 }) + '</span>' +
        '  <h3>¡Solicitud enviada!</h3>' +
        '  <p>En cuanto tengamos una propiedad parecida, te contactaremos directo.</p>' +
        '  <a class="btn btn--primary" href="#/">Volver al mapa</a>' +
        '</div>';
      c.mountChrome('explore');
    }

    renderForm();
  }

  window.App.views = window.App.views || {};
  window.App.views.propertyRequest = { render: render };
})();
