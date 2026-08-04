// Vistas "Clientes" (CRM básico del asesor): listado, alta y detalle con seguimiento.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var agentState = window.App.agent.state;
  var ac = window.App.agent.components;

  var ACTIVITY_LABELS = { llamada: "Llamada", visita: "Visita", seguimiento: "Seguimiento" };
  var ACTIVITY_ICONS = { llamada: "phone", visita: "pin", seguimiento: "clock" };

  function newClientSheet(refresh, onCreated) {
    c.openSheet({
      title: "Nuevo cliente",
      body:
        '<div class="form-field"><label>Nombre</label><input type="text" data-f="name" placeholder="Nombre del cliente" /></div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Teléfono</label><input type="text" data-f="phone" placeholder="9811234567" /></div>' +
        '<div class="form-field"><label>Correo</label><input type="text" data-f="email" placeholder="correo@ejemplo.com" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Presupuesto (MXN)</label><input type="number" data-f="budget" placeholder="2000000" /></div>' +
        '<div class="form-field"><label>Notas privadas</label><textarea rows="3" data-f="notes" placeholder="¿Qué busca este cliente?"></textarea></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Crear cliente</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      var name = u.qs('[data-f="name"]', sheetRoot).value.trim();
      if (!name) { u.toast('Escribe el nombre del cliente'); return; }
      var client = agentState.clients.create({
        name: name,
        phone: u.qs('[data-f="phone"]', sheetRoot).value.trim(),
        email: u.qs('[data-f="email"]', sheetRoot).value.trim(),
        budget: Number(u.qs('[data-f="budget"]', sheetRoot).value) || 0,
        notes: u.qs('[data-f="notes"]', sheetRoot).value.trim()
      });
      c.closeSheet();
      u.toast('Cliente creado', { tone: 'success' });
      if (onCreated) onCreated(client); else refresh();
    });
  }

  function editClientSheet(client, refresh) {
    c.openSheet({
      title: "Editar cliente",
      body:
        '<div class="form-field"><label>Nombre</label><input type="text" data-f="name" value="' + u.escapeHtml(client.name) + '" /></div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Teléfono</label><input type="text" data-f="phone" value="' + u.escapeHtml(client.phone || '') + '" /></div>' +
        '<div class="form-field"><label>Correo</label><input type="text" data-f="email" value="' + u.escapeHtml(client.email || '') + '" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Presupuesto (MXN)</label><input type="number" data-f="budget" value="' + (client.budget || 0) + '" /></div>' +
        '<div class="form-field"><label>Estado</label><select data-f="status"><option value="activo"' + (client.status === 'activo' ? ' selected' : '') + '>Activo</option><option value="cerrado"' + (client.status === 'cerrado' ? ' selected' : '') + '>Cerrado</option></select></div>' +
        '<div class="form-field"><label>Notas privadas</label><textarea rows="3" data-f="notes">' + u.escapeHtml(client.notes || '') + '</textarea></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Guardar cambios</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      agentState.clients.update(client.id, {
        name: u.qs('[data-f="name"]', sheetRoot).value,
        phone: u.qs('[data-f="phone"]', sheetRoot).value,
        email: u.qs('[data-f="email"]', sheetRoot).value,
        budget: Number(u.qs('[data-f="budget"]', sheetRoot).value) || 0,
        status: u.qs('[data-f="status"]', sheetRoot).value,
        notes: u.qs('[data-f="notes"]', sheetRoot).value
      });
      c.closeSheet();
      u.toast('Cliente actualizado', { tone: 'success' });
      refresh();
    });
  }

  function renderList(params, root) {
    function refresh() {
      var clients = agentState.clients.all();
      var rows = clients.map(function (cl) {
        var lastActivity = (cl.activity && cl.activity[0]) ? u.relativeTime(cl.activity[0].date) : "Sin actividad";
        return '<tr>' +
          '<td><a href="#/dashboard/clientes/' + cl.id + '" class="admin-table__name">' + u.escapeHtml(cl.name) + '</a><div class="admin-table__meta">' + u.escapeHtml(cl.phone || '') + '</div></td>' +
          '<td>' + (cl.budget ? u.formatPrice(cl.budget) : '—') + '</td>' +
          '<td>' + ac.statusPill(cl.status === 'activo' ? 'activo' : 'inactivo') + '</td>' +
          '<td class="admin-table__meta">' + lastActivity + '</td>' +
          '<td class="actions"><a class="btn btn--sm btn--outline" href="#/dashboard/clientes/' + cl.id + '">Ver</a></td></tr>';
      }).join('');

      var content =
        '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
        '  <button type="button" class="btn btn--primary btn--sm" data-new-client>' + u.icon('plus', { size: 14 }) + ' Nuevo cliente</button>' +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Cliente</th><th>Presupuesto</th><th>Estado</th><th>Última actividad</th><th></th></tr></thead>' +
        '  <tbody>' + (rows || '<tr><td colspan="5" class="admin-table__meta">Aún no tienes clientes registrados.</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('clientes', 'Clientes', content, root);
      u.qs('[data-new-client]', root).addEventListener('click', function () {
        newClientSheet(refresh, function (client) { window.location.hash = '#/dashboard/clientes/' + client.id; });
      });
    }
    refresh();
  }

  function renderDetail(params, root) {
    function refresh() {
      var client = agentState.clients.get(params.id);
      if (!client) {
        ac.mount('clientes', 'Cliente no encontrado', '<div class="empty-state"><h3>Cliente no encontrado</h3><a class="btn btn--primary" href="#/dashboard/clientes">Volver</a></div>', root);
        return;
      }

      var link = client.linkedClientSlug ? state.links.get(state.agents.currentSlug(), client.linkedClientSlug) : null;

      var activityHTML = (client.activity || []).map(function (a) {
        return '<div class="audit-row"><span class="audit-row__time">' + new Date(a.date).toLocaleString('es-MX') + '</span>' +
          '<span>' + u.icon(ACTIVITY_ICONS[a.type] || 'clock', { size: 14, class: 'text-muted' }) + ' <strong>' + (ACTIVITY_LABELS[a.type] || a.type) + '</strong> · ' + u.escapeHtml(a.note) + '</span></div>';
      }).join('');

      var content =
        '<div class="row" style="margin-bottom:14px"><a class="btn btn--icon" href="#/dashboard/clientes" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a></div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">' + u.escapeHtml(client.name) + '</div><div class="admin-section__subtitle">' + u.escapeHtml(client.phone || '') + (client.email ? ' · ' + u.escapeHtml(client.email) : '') + '</div></div>' +
        '  <button type="button" class="btn btn--outline btn--sm" data-edit>Editar</button></div>' +
        '  <div class="row gap-2" style="flex-wrap:wrap">' +
        (client.phone ? '<a class="btn btn--whatsapp btn--sm" target="_blank" rel="noopener" href="' + u.whatsappLink(client.phone, 'Hola ' + client.name + ', te escribo de parte de tu asesor en InmoMap.') + '">' + u.icon('chat', { size: 14 }) + ' WhatsApp</a>' : '') +
        (client.budget ? '<span class="badge badge--venta">Presupuesto: ' + u.formatPrice(client.budget) + '</span>' : '') +
        ac.statusPill(client.status === 'activo' ? 'activo' : 'inactivo') +
        '  </div>' +
        (client.notes ? '<p class="text-secondary" style="margin-top:12px;font-size:0.86rem">' + u.escapeHtml(client.notes) + '</p>' : '') +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Enlace personalizado</div></div>' +
        (link
          ? '<a class="ranked-row" href="#/dashboard/enlaces/' + link.clientSlug + '"><span class="dashboard-card__icon">' + u.icon('link', { size: 16 }) + '</span><div class="ranked-row__info"><strong>Ver estadísticas del enlace</strong><span>' + link.propertyIds.length + ' propiedades · ' + (link.stats.views || 0) + ' vistas</span></div>' + u.icon('chevronRight', { size: 16 }) + '</a>'
          : '<a class="btn btn--outline btn--sm" href="#/dashboard/enlaces/nuevo">' + u.icon('plus', { size: 14 }) + ' Crear enlace para este cliente</a>') +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Registrar actividad</div></div>' +
        '  <div class="row gap-2" style="flex-wrap:wrap">' +
        '  <button type="button" class="btn btn--outline btn--sm" data-log="llamada">' + u.icon('phone', { size: 14 }) + ' Registrar llamada</button>' +
        '  <button type="button" class="btn btn--outline btn--sm" data-log="visita">' + u.icon('pin', { size: 14 }) + ' Registrar visita</button>' +
        '  <button type="button" class="btn btn--outline btn--sm" data-log="seguimiento">' + u.icon('clock', { size: 14 }) + ' Registrar seguimiento</button>' +
        '  </div>' +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Historial</div></div>' +
        (activityHTML || '<p class="text-muted" style="font-size:0.85rem">Sin actividad registrada todavía.</p>') +
        '</div>' +

        '<button type="button" class="btn btn--outline" data-delete style="color:var(--color-primary);border-color:var(--color-primary)">Eliminar cliente</button>';

      ac.mount('clientes', client.name, content, root);

      u.qs('[data-edit]', root).addEventListener('click', function () { editClientSheet(client, refresh); });
      u.qsa('[data-log]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var type = btn.getAttribute('data-log');
          var note = window.prompt('Nota sobre esta ' + (ACTIVITY_LABELS[type] || type).toLowerCase() + ':', '');
          if (note === null) return;
          agentState.clients.addActivity(client.id, { type: type, note: note || (ACTIVITY_LABELS[type] + ' registrada') });
          u.toast('Actividad registrada');
          refresh();
        });
      });
      u.qs('[data-delete]', root).addEventListener('click', function () {
        if (!window.confirm('¿Eliminar a ' + client.name + ' de tu CRM?')) return;
        agentState.clients.remove(client.id);
        u.toast('Cliente eliminado');
        window.location.hash = '#/dashboard/clientes';
      });
    }
    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.clients = { renderList: renderList, renderDetail: renderDetail };
})();
