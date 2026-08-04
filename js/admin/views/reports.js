// Vista "Reportes": descarga de información en CSV (compatible con Excel) y PDF (impresión).
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function toCSV(columns, rows) {
    var esc = function (v) { v = v == null ? '' : String(v); return '"' + v.replace(/"/g, '""') + '"'; };
    var lines = [columns.map(function (c) { return esc(c.label); }).join(',')];
    rows.forEach(function (row) {
      lines.push(columns.map(function (c) { return esc(row[c.key]); }).join(','));
    });
    return lines.join('\r\n');
  }

  function downloadCSV(filename, columns, rows) {
    var csv = "﻿" + toCSV(columns, rows);
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function printTable(title, columns, rows) {
    var win = window.open('', '_blank');
    if (!win) { u.toast('Permite las ventanas emergentes para generar el PDF'); return; }
    var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>' + title + '</title>' +
      '<style>body{font-family:Arial,sans-serif;padding:24px;color:#111} h1{font-size:18px} table{width:100%;border-collapse:collapse;margin-top:14px} th,td{border:1px solid #ddd;padding:8px;font-size:12px;text-align:left} th{background:#f5f5f5}</style>' +
      '</head><body><h1>' + title + '</h1><p>InmoMap — generado el ' + new Date().toLocaleString('es-MX') + '</p>' +
      '<table><thead><tr>' + columns.map(function (c) { return '<th>' + c.label + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (row) { return '<tr>' + columns.map(function (c) { return '<td>' + (row[c.key] == null ? '' : row[c.key]) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></body></html>';
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 300);
  }

  var REPORTS_DEF = [
    {
      key: "usuarios", label: "Usuarios", icon: "users",
      columns: [{ key: "name", label: "Nombre" }, { key: "email", label: "Correo" }, { key: "phone", label: "Teléfono" }, { key: "role", label: "Rol" }, { key: "city", label: "Ciudad" }, { key: "status", label: "Estado" }],
      rows: function () { return s.users.all(); }
    },
    {
      key: "agentes", label: "Agentes", icon: "briefcase",
      columns: [{ key: "name", label: "Nombre" }, { key: "city", label: "Ciudad" }, { key: "plan", label: "Plan" }, { key: "status", label: "Estado" }, { key: "rating", label: "Calificación" }],
      rows: function () { return s.agents.all(); }
    },
    {
      key: "propiedades", label: "Propiedades", icon: "home",
      columns: [{ key: "title", label: "Título" }, { key: "type", label: "Tipo" }, { key: "operation", label: "Operación" }, { key: "price", label: "Precio" }, { key: "city", label: "Ciudad" }, { key: "status", label: "Estado" }],
      rows: function () { return s.properties.all(); }
    },
    {
      key: "pagos", label: "Pagos", icon: "dollar",
      columns: [{ key: "agentSlug", label: "Agente" }, { key: "plan", label: "Plan" }, { key: "amount", label: "Monto" }, { key: "status", label: "Estado" }, { key: "date", label: "Fecha" }],
      rows: function () { return s.payments.all(); }
    }
  ];

  function render(params, root) {
    var cards = REPORTS_DEF.map(function (def) {
      return '<div class="dashboard-card">' +
        '<span class="dashboard-card__icon">' + u.icon(def.icon, { size: 18 }) + '</span>' +
        '<strong>' + def.label + '</strong><span>' + def.rows().length + ' registros</span>' +
        '<div class="row gap-2" style="margin-top:10px">' +
        '<button type="button" class="btn btn--sm btn--outline" data-csv="' + def.key + '">CSV / Excel</button>' +
        '<button type="button" class="btn btn--sm btn--outline" data-pdf="' + def.key + '">Imprimir / PDF</button>' +
        '</div></div>';
    }).join('');

    var content =
      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div><div class="admin-section__title">Reportes descargables</div><div class="admin-section__subtitle">Exporta la información del prototipo en CSV (se abre directamente en Excel) o imprime un PDF</div></div></div>' +
      '  <div class="dashboard-grid">' + cards + '</div>' +
      '</div>';

    ac.mount('reportes', 'Reportes', content, root);

    u.qsa('[data-csv]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var def = REPORTS_DEF.filter(function (r) { return r.key === btn.getAttribute('data-csv'); })[0];
        downloadCSV('inmomap-' + def.key + '.csv', def.columns, def.rows());
        u.toast('Descargando ' + def.label + '.csv');
      });
    });
    u.qsa('[data-pdf]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var def = REPORTS_DEF.filter(function (r) { return r.key === btn.getAttribute('data-pdf'); })[0];
        printTable(def.label + ' — InmoMap', def.columns, def.rows());
      });
    });
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.reports = { render: render };
})();
