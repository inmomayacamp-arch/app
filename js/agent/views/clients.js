// Vistas "Clientes" (CRM del asesor): pipeline en tablero (kanban), alta y detalle con seguimiento.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var agentState = window.App.agent.state;
  var ac = window.App.agent.components;

  var ACTIVITY_LABELS = { llamada: "Llamada", visita: "Visita", seguimiento: "Seguimiento" };
  var ACTIVITY_ICONS = { llamada: "phone", visita: "pin", seguimiento: "clock" };

  var STAGES = [
    { value: "nuevo", label: "Nuevo" },
    { value: "contactado", label: "Contactado" },
    { value: "visita", label: "Visita agendada" },
    { value: "negociacion", label: "Negociación" },
    { value: "cerrado", label: "Cerrado" },
    { value: "perdido", label: "Perdido" }
  ];
  var STAGE_LABELS = {};
  var STAGE_ORDER = {};
  var STAGE_TONE = { nuevo: "pendiente", contactado: "pendiente", visita: "activo", negociacion: "activo", cerrado: "aprobada", perdido: "rechazada" };
  var STAGE_ICONS = { nuevo: "sparkles", contactado: "chat", visita: "pin", negociacion: "exchange", cerrado: "check", perdido: "x" };
  var STAGE_ICON_CLASS = { contactado: "dashboard-card__icon--renta", visita: "dashboard-card__icon--terreno", negociacion: "dashboard-card__icon--otro", cerrado: "dashboard-card__icon--venta" };
  STAGES.forEach(function (s, i) { STAGE_LABELS[s.value] = s.label; STAGE_ORDER[s.value] = i; });

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
    u.qs('[data-save]', sheetRoot).addEventListener('click', async function () {
      var name = u.qs('[data-f="name"]', sheetRoot).value.trim();
      if (!name) { u.toast('Escribe el nombre del cliente'); return; }
      try {
        var client = await agentState.clients.create({
          name: name,
          phone: u.qs('[data-f="phone"]', sheetRoot).value.trim(),
          email: u.qs('[data-f="email"]', sheetRoot).value.trim(),
          budget: Number(u.qs('[data-f="budget"]', sheetRoot).value) || 0,
          notes: u.qs('[data-f="notes"]', sheetRoot).value.trim()
        });
        c.closeSheet();
        u.toast('Cliente creado', { tone: 'success' });
        if (onCreated) onCreated(client); else refresh();
      } catch (err) {
        u.toast(err.message || 'No se pudo crear el cliente');
      }
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
        '<div class="form-field"><label>Notas privadas</label><textarea rows="3" data-f="notes">' + u.escapeHtml(client.notes || '') + '</textarea></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Guardar cambios</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', async function () {
      try {
        await agentState.clients.update(client.id, {
          name: u.qs('[data-f="name"]', sheetRoot).value,
          phone: u.qs('[data-f="phone"]', sheetRoot).value,
          email: u.qs('[data-f="email"]', sheetRoot).value,
          budget: Number(u.qs('[data-f="budget"]', sheetRoot).value) || 0,
          notes: u.qs('[data-f="notes"]', sheetRoot).value
        });
        c.closeSheet();
        u.toast('Cliente actualizado', { tone: 'success' });
        refresh();
      } catch (err) {
        u.toast(err.message || 'No se pudo actualizar el cliente');
      }
    });
  }

  function stageTileHTML(stage, count, isActive) {
    return '<button type="button" class="dashboard-card' + (isActive ? ' is-active-stage' : '') + '" data-stage-filter="' + stage.value + '">' +
      '<span class="dashboard-card__icon' + (STAGE_ICON_CLASS[stage.value] ? ' ' + STAGE_ICON_CLASS[stage.value] : '') + '">' + u.icon(STAGE_ICONS[stage.value], { size: 18 }) + '</span>' +
      (count ? '<span class="dashboard-card__badge badge-count">' + count + '</span>' : '') +
      '<strong>' + stage.label + '</strong><span>' + count + (count === 1 ? ' cliente' : ' clientes') + '</span>' +
      '</button>';
  }

  function clientRowHTML(cl) {
    var lastActivity = (cl.activity && cl.activity[0]) ? u.relativeTime(cl.activity[0].date) : 'Sin actividad';
    var canLose = cl.status !== 'cerrado' && cl.status !== 'perdido';
    return '<div class="client-row">' +
      '<a href="#/dashboard/clientes/' + cl.id + '" style="text-decoration:none;color:inherit;display:block">' +
      '<div class="client-row__head"><span class="client-row__name">' + u.escapeHtml(cl.name) + '</span>' +
      '<span class="status-pill status-pill--' + STAGE_TONE[cl.status] + '">' + STAGE_LABELS[cl.status] + '</span></div>' +
      '<div class="client-row__meta">' +
      (cl.budget ? '<span>' + u.formatPrice(cl.budget) + '</span>' : '') +
      (cl.phone ? '<span>' + u.escapeHtml(cl.phone) + '</span>' : '') +
      '<span>' + lastActivity + '</span>' +
      '</div></a>' +
      '<div class="client-row__actions">' +
      '<select data-move-select="' + cl.id + '">' +
      STAGES.map(function (s) { return '<option value="' + s.value + '"' + (cl.status === s.value ? ' selected' : '') + '>' + s.label + '</option>'; }).join('') +
      '</select>' +
      (canLose ? '<button type="button" class="btn btn--sm btn--ghost" data-move="' + cl.id + '" data-move-to="perdido">Marcar como perdido</button>' : '') +
      '</div></div>';
  }

  function renderList(params, root) {
    var activeStage = null;

    function refresh() {
      var clients = agentState.clients.all();
      var visible = (activeStage ? clients.filter(function (cl) { return cl.status === activeStage; }) : clients)
        .slice()
        .sort(function (a, b) { return STAGE_ORDER[a.status] - STAGE_ORDER[b.status]; });

      var tilesHTML = '<div class="dashboard-grid">' + STAGES.map(function (stage) {
        var count = clients.filter(function (cl) { return cl.status === stage.value; }).length;
        return stageTileHTML(stage, count, activeStage === stage.value);
      }).join('') + '</div>';

      var listHTML = visible.length
        ? visible.map(clientRowHTML).join('')
        : '<p class="text-muted" style="font-size:0.85rem;margin-top:16px">Sin clientes en esta etapa.</p>';

      var content =
        '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
        '  <button type="button" class="btn btn--primary btn--sm" data-new-client>' + u.icon('plus', { size: 14 }) + ' Nuevo cliente</button>' +
        '</div>' +
        (clients.length
          ? tilesHTML + '<div style="margin-top:20px">' + listHTML + '</div>'
          : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('users', { size: 30 }) + '</span><h3>Aún no tienes clientes</h3><p>Crea tu primer cliente para empezar a darle seguimiento.</p></div>');

      ac.mount('clientes', 'Clientes', content, root);
      u.qs('[data-new-client]', root).addEventListener('click', function () {
        newClientSheet(refresh, function (client) { window.location.hash = '#/dashboard/clientes/' + client.id; });
      });
      u.qsa('[data-stage-filter]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var stage = btn.getAttribute('data-stage-filter');
          activeStage = activeStage === stage ? null : stage;
          refresh();
        });
      });
      u.qsa('[data-move-select]', root).forEach(function (select) {
        select.addEventListener('change', async function () {
          select.disabled = true;
          try {
            await agentState.clients.update(select.getAttribute('data-move-select'), { status: select.value });
            refresh();
          } catch (err) {
            select.disabled = false;
            u.toast(err.message || 'No se pudo mover el cliente');
          }
        });
      });
      u.qsa('[data-move]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          btn.disabled = true;
          try {
            await agentState.clients.update(btn.getAttribute('data-move'), { status: btn.getAttribute('data-move-to') });
            refresh();
          } catch (err) {
            btn.disabled = false;
            u.toast(err.message || 'No se pudo mover el cliente');
          }
        });
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
        '  <div class="row gap-2" style="flex-wrap:wrap;align-items:center">' +
        (client.phone ? '<a class="btn btn--whatsapp btn--sm" target="_blank" rel="noopener" href="' + u.whatsappLink(client.phone, 'Hola ' + client.name + ', te escribo de parte de tu asesor en InmoMaps.') + '">' + u.icon('chat', { size: 14 }) + ' WhatsApp</a>' : '') +
        (client.budget ? '<span class="badge badge--venta">Presupuesto: ' + u.formatPrice(client.budget) + '</span>' : '') +
        '  <select data-status style="border:1px solid var(--color-border-strong);border-radius:var(--radius-full);padding:6px 12px;font-size:0.78rem;font-weight:800">' +
        STAGES.map(function (s) { return '<option value="' + s.value + '"' + (client.status === s.value ? ' selected' : '') + '>' + s.label + '</option>'; }).join('') +
        '  </select>' +
        '  </div>' +
        (client.notes ? '<p class="text-secondary" style="margin-top:12px;font-size:0.86rem">' + u.escapeHtml(client.notes) + '</p>' : '') +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Enlace personalizado</div></div>' +
        (link
          ? '<a class="ranked-row" href="#/dashboard/enlaces/' + link.clientSlug + '"><span class="dashboard-card__icon">' + u.icon('link', { size: 16 }) + '</span><div class="ranked-row__info"><strong>Ver estadísticas del enlace</strong><span>' + link.propertyIds.length + ' propiedades · ' + state.tracking.statsForLink(link.id).views + ' vistas</span></div>' + u.icon('chevronRight', { size: 16 }) + '</a>'
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
      u.qs('[data-status]', root).addEventListener('change', async function (e) {
        e.target.disabled = true;
        try {
          await agentState.clients.update(client.id, { status: e.target.value });
          u.toast('Etapa actualizada', { tone: 'success' });
          refresh();
        } catch (err) {
          e.target.disabled = false;
          u.toast(err.message || 'No se pudo actualizar la etapa');
        }
      });
      u.qsa('[data-log]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var type = btn.getAttribute('data-log');
          var note = window.prompt('Nota sobre esta ' + (ACTIVITY_LABELS[type] || type).toLowerCase() + ':', '');
          if (note === null) return;
          btn.disabled = true;
          try {
            await agentState.clients.addActivity(client.id, { type: type, note: note || (ACTIVITY_LABELS[type] + ' registrada') });
            u.toast('Actividad registrada');
            refresh();
          } catch (err) {
            btn.disabled = false;
            u.toast(err.message || 'No se pudo registrar la actividad');
          }
        });
      });
      u.qs('[data-delete]', root).addEventListener('click', async function (e) {
        if (!window.confirm('¿Eliminar a ' + client.name + ' de tu CRM?')) return;
        e.target.disabled = true;
        try {
          await agentState.clients.remove(client.id);
          u.toast('Cliente eliminado');
          window.location.hash = '#/dashboard/clientes';
        } catch (err) {
          e.target.disabled = false;
          u.toast(err.message || 'No se pudo eliminar el cliente');
        }
      });
    }
    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.clients = { renderList: renderList, renderDetail: renderDetail };
})();
