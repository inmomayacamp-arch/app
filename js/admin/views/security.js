// Vista "Seguridad": roles y permisos, auditoría y respaldo de información.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;
  var d = window.App.admin.data;

  function downloadBackup() {
    var backup = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.indexOf('inmomap:') === 0) backup[key] = JSON.parse(localStorage.getItem(key));
    }
    var blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'inmomaps-respaldo-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function render(params, root) {
    var log = s.audit.log();
    var accessLog = log.filter(function (l) { return l.action === 'Inicio de sesión'; });

    var roleCards = d.ROLES.map(function (role) {
      var assigned = d.ADMIN_USERS.filter(function (a) { return a.role === role.id; });
      return '<div class="role-card"><div><strong>' + role.name + '</strong><span>' + role.description + '</span></div>' +
        '<span class="text-muted" style="font-size:0.78rem">' + assigned.map(function (a) { return a.name; }).join(', ') + '</span></div>';
    }).join('');

    var auditRows = log.slice(0, 40).map(function (l) {
      return '<div class="audit-row"><span class="audit-row__time">' + new Date(l.timestamp).toLocaleString('es-MX') + '</span>' +
        '<span><strong>' + u.escapeHtml(l.action) + '</strong> · ' + u.escapeHtml(l.target || '') + ' <span class="text-muted">(' + u.escapeHtml(l.actor) + ')</span></span></div>';
    }).join('');

    var content =
      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div><div class="admin-section__title">Autenticación</div><div class="admin-section__subtitle">Acceso protegido con correo y contraseña</div></div></div>' +
      '  <p class="text-secondary" style="font-size:0.85rem">Sesión activa: <strong>' + u.escapeHtml((window.App.state.agents.current() || {}).email || '') + '</strong></p>' +
      '  <p class="text-muted" style="font-size:0.78rem">Últimos accesos registrados: ' + accessLog.length + '</p>' +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Roles y permisos</div></div>' +
      roleCards +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div><div class="admin-section__title">Respaldo de información</div><div class="admin-section__subtitle">Descarga toda la información del prototipo (usuarios, propiedades, pagos, configuración)</div></div>' +
      '  <button type="button" class="btn btn--primary btn--sm" data-backup>' + u.icon('download', { size: 14 }) + ' Generar respaldo ahora</button></div>' +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Registro de auditoría</div></div>' +
      '  ' + (auditRows || '<p class="text-muted" style="font-size:0.85rem">Sin actividad registrada todavía.</p>') +
      '</div>';

    ac.mount('seguridad', 'Seguridad', content, root);

    u.qs('[data-backup]', root).addEventListener('click', function () {
      downloadBackup();
      u.toast('Respaldo generado y descargado');
    });
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.security = { render: render };
})();
