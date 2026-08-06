// Vista "Soporte y contacto": formulario para reportar un problema o
// contactar al administrador de InmoMaps. Si quien la abre es un asesor con
// sesión iniciada, usa el mismo encabezado/navegación del panel en vez del
// header público, y precarga sus datos.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var ac = window.App.agent.components;

  var SUBJECTS = [
    { value: "problema", label: "Reportar un problema técnico" },
    { value: "propiedad", label: "Reportar una propiedad o usuario" },
    { value: "cuenta", label: "Ayuda con mi cuenta o plan" },
    { value: "sugerencia", label: "Sugerencia para mejorar la app" },
    { value: "otro", label: "Otro" }
  ];

  function render(params, root) {
    var agent = state.agents.isLoggedIn() ? state.agents.current() : null;
    var backHref = agent ? '#/dashboard/menu' : '#/';

    function mountPage(bodyHtml) {
      if (agent) {
        ac.mount('menu', 'Soporte', bodyHtml, root);
      } else {
        root.innerHTML =
          '<div class="page-header">' +
          '  <a class="btn btn--icon" href="' + backHref + '" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
          '  <h1 class="page-header__title">Soporte y contacto</h1>' +
          '</div>' + bodyHtml;
        c.mountChrome('explore');
      }
      document.title = 'Soporte y contacto — InmoMaps';
    }

    function renderForm() {
      mountPage(
        '<div class="page-wrap" style="max-width:560px">' +
        '  <p class="text-secondary" style="margin-bottom:20px">¿Tienes un problema, una duda o una sugerencia? Escríbenos y el equipo de InmoMaps te responderá.</p>' +

        '  <div class="form-field"><label>Nombre completo</label><input type="text" data-name placeholder="Tu nombre" value="' + (agent ? u.escapeHtml(agent.name) : '') + '" /></div>' +
        '  <div class="form-row">' +
        '  <div class="form-field"><label>Correo</label><input type="email" data-email placeholder="tu@correo.com" value="' + (agent ? u.escapeHtml(agent.email || '') : '') + '" /></div>' +
        '  <div class="form-field"><label>Teléfono (opcional)</label><input type="text" data-phone placeholder="9811234567" value="' + (agent ? u.escapeHtml(agent.phone || '') : '') + '" /></div>' +
        '  </div>' +
        '  <div class="form-field"><label>Asunto</label><select data-subject>' + SUBJECTS.map(function (s) { return '<option value="' + s.value + '">' + s.label + '</option>'; }).join('') + '</select></div>' +
        '  <div class="form-field"><label>Mensaje</label><textarea rows="5" data-message placeholder="Cuéntanos qué pasó o en qué te podemos ayudar."></textarea></div>' +

        '  <button type="button" class="btn btn--primary btn--block" data-submit>Enviar mensaje</button>' +
        '</div>'
      );

      var submitBtn = u.qs('[data-submit]', root);
      submitBtn.addEventListener('click', async function () {
        var name = u.qs('[data-name]', root).value.trim();
        var email = u.qs('[data-email]', root).value.trim();
        var phone = u.qs('[data-phone]', root).value.trim();
        var message = u.qs('[data-message]', root).value.trim();
        var subject = u.qs('[data-subject]', root).value;
        if (!name || !email || !message) { u.toast('Completa tu nombre, correo y mensaje'); return; }

        submitBtn.disabled = true;
        try {
          await state.leads.create({
            kind: 'soporte', name: name, phone: phone, email: email, message: message,
            details: { subject: subject, agentSlug: agent ? agent.slug : null }
          });
          renderConfirmation();
        } catch (err) {
          submitBtn.disabled = false;
          u.toast(err.message || 'No se pudo enviar tu mensaje');
        }
      });
    }

    function renderConfirmation() {
      mountPage(
        '<div class="empty-state" style="padding-top:64px">' +
        '  <span class="empty-state__icon" style="color:var(--color-venta)">' + u.icon('check', { size: 40 }) + '</span>' +
        '  <h3>¡Mensaje enviado!</h3>' +
        '  <p>El equipo de InmoMaps revisará tu mensaje y te contactará si es necesario.</p>' +
        '  <a class="btn btn--primary" href="' + backHref + '">' + (agent ? 'Volver al panel' : 'Volver al mapa') + '</a>' +
        '</div>'
      );
    }

    renderForm();
  }

  window.App.views = window.App.views || {};
  window.App.views.support = { render: render };
})();
