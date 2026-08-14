// Vista "Solicitudes": propiedades que buscan los visitantes y mensajes de
// soporte/contacto enviados desde el sitio público.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;

  var TYPE_LABELS = { casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local", oficina: "Oficina", "": "Cualquiera" };
  var SUBJECT_LABELS = { reporte: "Reportar un problema", cuenta: "Ayuda con mi cuenta", ciudad: "Ciudad faltante en el catálogo", otro: "Otro" };

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

      function actionButtons(lead) {
        return lead.status === 'nuevo'
          ? '<button type="button" class="btn btn--sm btn--primary" data-atender="' + lead.id + '">Marcar atendido</button>'
          : '<button type="button" class="btn btn--sm btn--outline" data-reabrir="' + lead.id + '">Reabrir</button>';
      }

      function solicitudCard(lead) {
        var d = lead.details || {};
        return (
          '<div class="admin-row-card">' +
          '  <div class="admin-row-card__body">' +
          '    <strong>' + u.escapeHtml(lead.name) + '</strong>' +
          '    <span class="admin-row-card__meta">' + contactHTML(lead) + '</span>' +
          '    <span class="admin-row-card__meta">' + (TYPE_LABELS[d.type] || 'Cualquiera') + ' · ' + (d.operation === 'renta' ? 'Renta' : 'Venta') + ' · ' + u.escapeHtml(d.city || '—') + (d.budget ? ' · ' + u.formatPrice(d.budget) : '') + '</span>' +
          (lead.message ? '    <span class="admin-row-card__meta admin-row-card__meta--wrap">' + u.escapeHtml(lead.message) + '</span>' : '') +
          '    <span class="admin-row-card__meta">' + u.relativeTime(lead.createdAt) + '</span>' +
          '  </div>' +
          '  <div class="admin-row-card__foot">' +
          ac.statusPill(lead.status === 'nuevo' ? 'pendiente' : 'resuelto') +
          actionButtons(lead) +
          '  </div>' +
          '</div>'
        );
      }

      function soporteCard(lead) {
        var d = lead.details || {};
        return (
          '<div class="admin-row-card">' +
          '  <div class="admin-row-card__body">' +
          '    <strong>' + u.escapeHtml(lead.name) + '</strong>' +
          '    <span class="admin-row-card__meta">' + contactHTML(lead) + ' · ' + (SUBJECT_LABELS[d.subject] || 'Otro') + '</span>' +
          (lead.message ? '    <span class="admin-row-card__meta admin-row-card__meta--wrap">' + u.escapeHtml(lead.message) + '</span>' : '') +
          '    <span class="admin-row-card__meta">' + u.relativeTime(lead.createdAt) + '</span>' +
          '  </div>' +
          '  <div class="admin-row-card__foot">' +
          ac.statusPill(lead.status === 'nuevo' ? 'pendiente' : 'resuelto') +
          actionButtons(lead) +
          '  </div>' +
          '</div>'
        );
      }

      function directorioCard(lead) {
        var d = lead.details || {};
        return (
          '<div class="admin-row-card">' +
          '  <div class="admin-row-card__body">' +
          '    <strong>' + u.escapeHtml(lead.name) + '</strong>' +
          '    <span class="admin-row-card__meta">' + contactHTML(lead) + ' · ' + categoryLabel(d.category) + ' · ' + u.escapeHtml(d.city || '—') + '</span>' +
          (lead.message ? '    <span class="admin-row-card__meta admin-row-card__meta--wrap">' + u.escapeHtml(lead.message) + '</span>' : '') +
          '    <span class="admin-row-card__meta">' + u.relativeTime(lead.createdAt) + '</span>' +
          '  </div>' +
          '  <div class="admin-row-card__foot">' +
          ac.statusPill(lead.status === 'nuevo' ? 'pendiente' : 'resuelto') +
          actionButtons(lead) +
          '  </div>' +
          '</div>'
        );
      }

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Solicitudes de propiedad (' + solicitudes.length + ')</div>' +
        '  <div class="admin-section__subtitle">Visitantes que no encontraron lo que buscaban</div></div></div>' +
        '  <div class="admin-row-list">' + (solicitudes.map(solicitudCard).join('') || '<p class="text-muted" style="font-size:0.85rem">Sin solicitudes por ahora</p>') + '</div>' +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Anúnciate aquí (' + directorio.length + ')</div>' +
        '  <div class="admin-section__subtitle">Profesionales interesados en aparecer en el directorio de servicios</div></div></div>' +
        '  <div class="admin-row-list">' + (directorio.map(directorioCard).join('') || '<p class="text-muted" style="font-size:0.85rem">Sin solicitudes por ahora</p>') + '</div>' +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Soporte y contacto (' + soporte.length + ')</div>' +
        '  <div class="admin-section__subtitle">Reportes y mensajes enviados al administrador</div></div></div>' +
        '  <div class="admin-row-list">' + (soporte.map(soporteCard).join('') || '<p class="text-muted" style="font-size:0.85rem">Sin mensajes por ahora</p>') + '</div>' +
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
