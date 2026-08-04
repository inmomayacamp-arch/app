// Vista "Administración de Usuarios".
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function render(params, root) {
    var query = "";

    function editSheet(user) {
      c.openSheet({
        title: "Editar usuario",
        body:
          '<div class="form-field"><label>Nombre</label><input type="text" data-f="name" value="' + u.escapeHtml(user.name) + '" /></div>' +
          '<div class="form-field"><label>Correo</label><input type="text" data-f="email" value="' + u.escapeHtml(user.email) + '" /></div>' +
          '<div class="form-field"><label>Teléfono</label><input type="text" data-f="phone" value="' + u.escapeHtml(user.phone) + '" /></div>' +
          '<button type="button" class="btn btn--primary btn--block" data-save>Guardar cambios</button>'
      });
      var sheetRoot = u.qs('#sheet-root');
      u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
        s.users.update(user.id, {
          name: u.qs('[data-f="name"]', sheetRoot).value,
          email: u.qs('[data-f="email"]', sheetRoot).value,
          phone: u.qs('[data-f="phone"]', sheetRoot).value
        });
        c.closeSheet();
        u.toast('Usuario actualizado');
        refresh();
      });
    }

    function refresh() {
      var list = s.users.all().filter(function (usr) {
        if (!query) return true;
        var q = query.toLowerCase();
        return usr.name.toLowerCase().indexOf(q) !== -1 || usr.email.toLowerCase().indexOf(q) !== -1;
      });

      var rows = list.map(function (usr) {
        return '<tr>' +
          '<td><div class="admin-table__name">' + u.escapeHtml(usr.name) + '</div><div class="admin-table__meta">' + u.escapeHtml(usr.email) + ' · ' + u.escapeHtml(usr.phone) + '</div></td>' +
          '<td>' + (usr.role === 'propietario' ? 'Propietario' : 'Usuario') + '</td>' +
          '<td>' + u.escapeHtml(usr.city) + '</td>' +
          '<td>' + ac.statusPill(usr.status) + '</td>' +
          '<td class="admin-table__meta">' + u.relativeTime(usr.lastActivity) + '</td>' +
          '<td class="actions">' +
          '<div class="icon-btn-row">' +
          '<button type="button" class="btn btn--sm btn--outline" data-edit="' + usr.id + '">Editar</button>' +
          (usr.status !== 'activo' ? '<button type="button" class="btn btn--sm btn--outline" data-status="' + usr.id + '" data-value="activo">Activar</button>' : '<button type="button" class="btn btn--sm btn--outline" data-status="' + usr.id + '" data-value="inactivo">Desactivar</button>') +
          (usr.status !== 'suspendido' ? '<button type="button" class="btn btn--sm btn--outline" data-status="' + usr.id + '" data-value="suspendido">Suspender</button>' : '') +
          '<button type="button" class="btn btn--sm btn--outline" data-reset="' + usr.id + '">Restablecer contraseña</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-remove="' + usr.id + '">Eliminar</button>' +
          '</div></td></tr>';
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-toolbar"><input type="text" placeholder="Buscar por nombre o correo" data-search value="' + u.escapeHtml(query) + '" /></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Ciudad</th><th>Estado</th><th>Última actividad</th><th></th></tr></thead>' +
        '  <tbody>' + (rows || '<tr><td colspan="6" class="admin-table__meta">Sin resultados</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('usuarios', 'Usuarios', content, root);

      u.qs('[data-search]', root).addEventListener('input', u.debounce(function (e) { query = e.target.value; refresh(); }, 200));
      u.qsa('[data-edit]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { editSheet(s.users.all().filter(function (x) { return x.id === btn.getAttribute('data-edit'); })[0]); });
      });
      u.qsa('[data-status]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          s.users.setStatus(btn.getAttribute('data-status'), btn.getAttribute('data-value'));
          u.toast('Estado actualizado');
          refresh();
        });
      });
      u.qsa('[data-reset]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { u.toast('Se envió un correo para restablecer la contraseña'); });
      });
      u.qsa('[data-remove]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!window.confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
          s.users.remove(btn.getAttribute('data-remove'));
          u.toast('Usuario eliminado');
          refresh();
        });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.users = { render: render };
})();
