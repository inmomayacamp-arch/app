// Vista "Solicitudes": propiedades que buscan los visitantes y mensajes de
// soporte/contacto enviados desde el sitio público.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;

  var TYPE_LABELS = { casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local", oficina: "Oficina", "": "Cualquiera" };
  var SUBJECT_LABELS = { reporte: "Reportar un problema", cuenta: "Ayuda con mi cuenta", otro: "Otro" };

  function categoryLabel(key) {
    return (u.SERVICE_CATEGORIES.filter(function (cat) { return cat.key === key; })[0] || {}).label || 'Sin especificar';
  }

  function contactHTML(lead) {
    var parts = [];
    if (lead.phone) parts.push('<a href="tel:' + u.escapeHtml(lead.phone) + '">' + u.escapeHtml(lead.phone) + '</a>');
    if (lead.email) parts.push('<a href="mailto:' + u.escapeHtml(lead.email) + '">' + u.escapeHtml(lead.email) + '</a>');
    return parts.join(' · ') || '—';
  }

  function render(params, root) {
    async function refresh() {
      var all = window.App.state.leads.all();
      var solicitudes = all.filter(function (l) { return l.kind === 'solicitud'; });
      var soporte = all.filter(function (l) { return l.kind === 'soporte'; });
      var directorio = all.filter(function (l) { return l.kind === 'directorio'; });

      function actionCell(lead) {
        return '<td class="actions"><div class="icon-btn-row">' +
          (lead.status === 'nuevo'
            ? '<button type="button" class="btn btn--sm btn--primary" data-atender="' + lead.id + '">Marcar atendido</button>'
            : '<button type="button" class="btn btn--sm btn--outline" data-reabrir="' + lead.id + '">Reabrir</button>') +
          '</div></td>';
      }

      function solicitudRow(lead) {
        var d = lead.details || {};
        return '<tr>' +
          '<td class="admin-table__name">' + u.escapeHtml(lead.name) + '<div class="admin-table__meta">' + contactHTML(lead) + '</div></td>' +
          '<td>' + (TYPE_LABELS[d.type] || 'Cualquiera') + ' · ' + (d.operation === 'renta' ? 'Renta' : 'Venta') + '</td>' +
          '<td>' + u.escapeHtml(d.city || '—') + '</td>' +
          '<td>' + (d.budget ? u.formatPrice(d.budget) : '—') + '</td>' +
          '<td class="admin-table__meta">' + u.escapeHtml(lead.message || '—') + '</td>' +
          '<td class="admin-table__meta">' + u.relativeTime(lead.createdAt) + '</td>' +
          '<td>' + ac.statusPill(lead.status === 'nuevo' ? 'pendiente' : 'resuelto') + '</td>' +
          actionCell(lead) +
          '</tr>';
      }

      function soporteRow(lead) {
        var d = lead.details || {};
        return '<tr>' +
          '<td class="admin-table__name">' + u.escapeHtml(lead.name) + '<div class="admin-table__meta">' + contactHTML(lead) + '</div></td>' +
          '<td>' + (SUBJECT_LABELS[d.subject] || 'Otro') + '</td>' +
          '<td class="admin-table__meta">' + u.escapeHtml(lead.message || '—') + '</td>' +
          '<td class="admin-table__meta">' + u.relativeTime(lead.createdAt) + '</td>' +
          '<td>' + ac.statusPill(lead.status === 'nuevo' ? 'pendiente' : 'resuelto') + '</td>' +
          actionCell(lead) +
          '</tr>';
      }

      function directorioRow(lead) {
        var d = lead.details || {};
        return '<tr>' +
          '<td class="admin-table__name">' + u.escapeHtml(lead.name) + '<div class="admin-table__meta">' + contactHTML(lead) + '</div></td>' +
          '<td>' + categoryLabel(d.category) + '</td>' +
          '<td>' + u.escapeHtml(d.city || '—') + '</td>' +
          '<td class="admin-table__meta">' + u.escapeHtml(lead.message || '—') + '</td>' +
          '<td class="admin-table__meta">' + u.relativeTime(lead.createdAt) + '</td>' +
          '<td>' + ac.statusPill(lead.status === 'nuevo' ? 'pendiente' : 'resuelto') + '</td>' +
          actionCell(lead) +
          '</tr>';
      }

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Solicitudes de propiedad (' + solicitudes.length + ')</div>' +
        '  <div class="admin-section__subtitle">Visitantes que no encontraron lo que buscaban</div></div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Contacto</th><th>Tipo</th><th>Ciudad</th><th>Presupuesto</th><th>Detalle</th><th>Enviado</th><th>Estado</th><th></th></tr></thead>' +
        '  <tbody>' + (solicitudes.map(solicitudRow).join('') || '<tr><td colspan="8" class="admin-table__meta">Sin solicitudes por ahora</td></tr>') + '</tbody></table></div>' +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Anúnciate aquí (' + directorio.length + ')</div>' +
        '  <div class="admin-section__subtitle">Profesionales interesados en aparecer en el directorio de servicios</div></div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Contacto</th><th>Categoría</th><th>Ciudad</th><th>Mensaje</th><th>Enviado</th><th>Estado</th><th></th></tr></thead>' +
        '  <tbody>' + (directorio.map(directorioRow).join('') || '<tr><td colspan="7" class="admin-table__meta">Sin solicitudes por ahora</td></tr>') + '</tbody></table></div>' +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Soporte y contacto (' + soporte.length + ')</div>' +
        '  <div class="admin-section__subtitle">Reportes y mensajes enviados al administrador</div></div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Contacto</th><th>Asunto</th><th>Mensaje</th><th>Enviado</th><th>Estado</th><th></th></tr></thead>' +
        '  <tbody>' + (soporte.map(soporteRow).join('') || '<tr><td colspan="6" class="admin-table__meta">Sin mensajes por ahora</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('solicitudes', 'Solicitudes', content, root);

      u.qsa('[data-atender]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          try { await window.App.state.leads.updateStatus(btn.getAttribute('data-atender'), 'atendido'); u.toast('Marcado como atendido'); refresh(); }
          catch (err) { u.toast(err.message || 'No se pudo actualizar'); }
        });
      });
      u.qsa('[data-reabrir]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          try { await window.App.state.leads.updateStatus(btn.getAttribute('data-reabrir'), 'nuevo'); u.toast('Solicitud reabierta'); refresh(); }
          catch (err) { u.toast(err.message || 'No se pudo actualizar'); }
        });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.leads = { render: render };
})();
