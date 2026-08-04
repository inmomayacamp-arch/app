// Vista "Administración de Agentes".
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;
  var d = window.App.admin.data;

  function editSheet(agent, refresh) {
    c.openSheet({
      title: "Editar agente",
      body:
        '<div class="form-field"><label>Plan</label><select data-f="plan">' +
        d.PLANS.map(function (p) { return '<option value="' + p.id + '"' + (agent.plan === p.id ? ' selected' : '') + '>' + p.name + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="form-field"><label>Fecha de vencimiento</label><input type="date" data-f="planExpiresAt" value="' + (agent.planExpiresAt || '').slice(0, 10) + '" /></div>' +
        '<div class="form-field"><label>Estado de la suscripción</label><select data-f="status">' +
        ['activo', 'inactivo', 'suspendido'].map(function (v) { return '<option value="' + v + '"' + (agent.status === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') +
        '</select></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Guardar cambios</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      s.agents.setField(agent.slug, {
        plan: u.qs('[data-f="plan"]', sheetRoot).value,
        planExpiresAt: new Date(u.qs('[data-f="planExpiresAt"]', sheetRoot).value).toISOString(),
        status: u.qs('[data-f="status"]', sheetRoot).value
      });
      c.closeSheet();
      u.toast('Agente actualizado');
      refresh();
    });
  }

  function render(params, root) {
    function refresh() {
      var pending = s.agents.pending();
      var agents = s.agents.all();

      var pendingRows = pending.map(function (p) {
        return '<tr>' +
          '<td><div class="admin-table__name">' + u.escapeHtml(p.name) + '</div><div class="admin-table__meta">' + u.escapeHtml(p.email) + ' · ' + u.escapeHtml(p.city) + '</div></td>' +
          '<td>' + (p.documentsSubmitted ? ac.statusPill('aprobada').replace('Aprobada', 'Completos') : ac.statusPill('pendiente').replace('Pendiente', 'Faltan')) + '</td>' +
          '<td class="admin-table__meta">' + u.relativeTime(p.requestedAt) + '</td>' +
          '<td class="actions"><div class="icon-btn-row">' +
          '<button type="button" class="btn btn--sm btn--outline" data-docs="' + p.slug + '">Ver documentos</button>' +
          '<button type="button" class="btn btn--sm btn--primary" data-approve="' + p.slug + '">Aprobar</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-reject="' + p.slug + '">Rechazar</button>' +
          '</div></td></tr>';
      }).join('');

      var activeRows = agents.map(function (a) {
        var planName = (d.PLANS.filter(function (p) { return p.id === a.plan; })[0] || {}).name || a.plan;
        var propsCount = window.App.state.properties.byAgent(a.slug).length;
        return '<tr>' +
          '<td><div class="admin-table__name">' + u.escapeHtml(a.name) + '</div><div class="admin-table__meta">' + u.escapeHtml(a.city) + '</div></td>' +
          '<td>' + u.escapeHtml(planName) + '</td>' +
          '<td class="admin-table__meta">' + new Date(a.planExpiresAt).toLocaleDateString('es-MX') + '</td>' +
          '<td>' + ac.statusPill(a.status) + '</td>' +
          '<td>' + propsCount + '</td>' +
          '<td class="actions"><div class="icon-btn-row">' +
          '<a class="btn btn--sm btn--outline" href="#/' + a.slug + '">Ver propiedades</a>' +
          '<button type="button" class="btn btn--sm btn--outline" data-edit="' + a.slug + '">Editar</button>' +
          '</div></td></tr>';
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Solicitudes pendientes</div><div class="admin-section__subtitle">Nuevos agentes que esperan aprobación</div></div>' +
        '  <a class="btn btn--outline btn--sm" href="#/admin/notificaciones">' + u.icon('bell', { size: 14 }) + ' Enviar mensaje masivo</a></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Solicitante</th><th>Documentos</th><th>Solicitado</th><th></th></tr></thead>' +
        '  <tbody>' + (pendingRows || '<tr><td colspan="4" class="admin-table__meta">No hay solicitudes pendientes</td></tr>') + '</tbody></table></div>' +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Agentes activos (' + agents.length + ')</div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Agente</th><th>Plan</th><th>Vencimiento</th><th>Estado</th><th>Propiedades</th><th></th></tr></thead>' +
        '  <tbody>' + activeRows + '</tbody></table></div>' +
        '</div>';

      ac.mount('agentes', 'Agentes', content, root);

      u.qsa('[data-approve]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { s.agents.approvePending(btn.getAttribute('data-approve')); u.toast('Agente aprobado'); refresh(); });
      });
      u.qsa('[data-reject]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!window.confirm('¿Rechazar esta solicitud?')) return;
          s.agents.rejectPending(btn.getAttribute('data-reject')); u.toast('Solicitud rechazada'); refresh();
        });
      });
      u.qsa('[data-docs]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { u.toast('Documentos: INE y comprobante de domicilio (simulado)'); });
      });
      u.qsa('[data-edit]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { editSheet(agents.filter(function (a) { return a.slug === btn.getAttribute('data-edit'); })[0], refresh); });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.agents = { render: render };
})();
