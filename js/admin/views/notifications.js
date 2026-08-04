// Vista "Notificaciones": envío de push, correos masivos y mensajes dirigidos.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  var AUDIENCES = ["Todos los usuarios", "Agentes", "Propietarios", "Usuario específico"];

  function render(params, root) {
    function refresh() {
      var log = s.notifications.log();
      var rows = log.map(function (n) {
        return '<tr><td>' + (n.channel === 'push' ? 'Push' : 'Correo') + '</td><td class="admin-table__name">' + u.escapeHtml(n.subject) + '</td>' +
          '<td class="admin-table__meta">' + u.escapeHtml(n.audience) + '</td><td class="admin-table__meta">' + u.relativeTime(n.sentAt) + '</td></tr>';
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Enviar notificación</div><div class="admin-section__subtitle">Push, correos masivos o mensajes a un segmento específico</div></div></div>' +
        '  <div class="form-row">' +
        '    <div class="form-field"><label>Canal</label><select data-f="channel"><option value="push">Notificación push</option><option value="correo">Correo electrónico</option></select></div>' +
        '    <div class="form-field"><label>Audiencia</label><select data-f="audience">' + AUDIENCES.map(function (a) { return '<option value="' + a + '">' + a + '</option>'; }).join('') + '</select></div>' +
        '  </div>' +
        '  <div class="form-field" data-specific-field style="display:none"><label>Correo o teléfono del destinatario</label><input type="text" data-f="target" placeholder="cliente@correo.com" /></div>' +
        '  <div class="form-field"><label>Asunto</label><input type="text" data-f="subject" placeholder="Nuevas propiedades disponibles" /></div>' +
        '  <div class="form-field"><label>Mensaje</label><textarea rows="4" data-f="body" placeholder="Escribe el contenido del mensaje..."></textarea></div>' +
        '  <button type="button" class="btn btn--primary" data-send>' + u.icon('bell', { size: 15 }) + ' Enviar notificación</button>' +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Historial de envíos</div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Canal</th><th>Asunto</th><th>Audiencia</th><th>Enviado</th></tr></thead>' +
        '  <tbody>' + (rows || '<tr><td colspan="4" class="admin-table__meta">Sin envíos todavía</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('notificaciones', 'Notificaciones', content, root);

      var audienceSel = u.qs('[data-f="audience"]', root);
      var specificField = u.qs('[data-specific-field]', root);
      audienceSel.addEventListener('change', function () {
        specificField.style.display = audienceSel.value === 'Usuario específico' ? 'flex' : 'none';
      });

      u.qs('[data-send]', root).addEventListener('click', function () {
        var subject = u.qs('[data-f="subject"]', root).value.trim();
        var body = u.qs('[data-f="body"]', root).value.trim();
        if (!subject || !body) { u.toast('Escribe un asunto y un mensaje'); return; }
        var audience = audienceSel.value === 'Usuario específico'
          ? u.qs('[data-f="target"]', root).value.trim() || 'Usuario específico'
          : audienceSel.value;
        s.notifications.send({ channel: u.qs('[data-f="channel"]', root).value, audience: audience, subject: subject, body: body });
        u.toast('Notificación enviada');
        refresh();
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.notifications = { render: render };
})();
