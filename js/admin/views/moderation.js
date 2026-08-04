// Vista "Sistema de Moderación": contenido reportado por la comunidad.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  var TYPE_LABELS = {
    foto: "Fotografía inapropiada", info_falsa: "Información falsa", spam: "Spam",
    duplicado: "Publicación duplicada", usuario: "Usuario reportado"
  };

  function render(params, root) {
    function refresh() {
      var reports = s.reports.all();
      var pending = reports.filter(function (r) { return r.status === 'pendiente'; });
      var resolved = reports.filter(function (r) { return r.status !== 'pendiente'; });

      function rowHTML(r) {
        return '<tr>' +
          '<td class="admin-table__name">' + (TYPE_LABELS[r.type] || r.type) + '</td>' +
          '<td>' + u.escapeHtml(r.targetLabel) + '</td>' +
          '<td class="admin-table__meta">' + u.escapeHtml(r.reporterNote) + '</td>' +
          '<td class="admin-table__meta">' + u.relativeTime(r.createdAt) + '</td>' +
          '<td>' + ac.statusPill(r.status) + '</td>' +
          (r.status === 'pendiente'
            ? '<td class="actions"><div class="icon-btn-row"><button type="button" class="btn btn--sm btn--primary" data-resolve="' + r.id + '">Resolver</button><button type="button" class="btn btn--sm btn--outline" data-dismiss="' + r.id + '">Descartar</button></div></td>'
            : '<td></td>') +
          '</tr>';
      }

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Reportes pendientes (' + pending.length + ')</div><div class="admin-section__subtitle">Fotos inapropiadas, información falsa, spam, duplicados y usuarios reportados</div></div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Tipo</th><th>Elemento</th><th>Motivo</th><th>Reportado</th><th>Estado</th><th></th></tr></thead>' +
        '  <tbody>' + (pending.map(rowHTML).join('') || '<tr><td colspan="6" class="admin-table__meta">Sin reportes pendientes</td></tr>') + '</tbody></table></div>' +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Resueltos anteriormente</div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Tipo</th><th>Elemento</th><th>Motivo</th><th>Reportado</th><th>Estado</th><th></th></tr></thead>' +
        '  <tbody>' + (resolved.map(rowHTML).join('') || '<tr><td colspan="6" class="admin-table__meta">Sin registros</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('moderacion', 'Moderación', content, root);

      u.qsa('[data-resolve]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { s.reports.resolve(btn.getAttribute('data-resolve'), 'resuelto'); u.toast('Reporte resuelto'); refresh(); });
      });
      u.qsa('[data-dismiss]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { s.reports.resolve(btn.getAttribute('data-dismiss'), 'descartado'); u.toast('Reporte descartado'); refresh(); });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.moderation = { render: render };
})();
