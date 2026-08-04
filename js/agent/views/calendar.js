// Vista "Calendario": citas, visitas, recordatorios y tareas pendientes del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var agentState = window.App.agent.state;
  var ac = window.App.agent.components;

  var TYPE_LABELS = { cita: "Cita", visita: "Visita", recordatorio: "Recordatorio", tarea: "Tarea", llamada: "Llamada" };
  var TYPE_ICONS = { cita: "calendar", visita: "pin", recordatorio: "bell", tarea: "check", llamada: "phone" };

  function newEventSheet(refresh) {
    var clients = window.App.agent.state.clients.all();
    c.openSheet({
      title: "Nueva actividad",
      body:
        '<div class="form-field"><label>Tipo</label><select data-f="type">' +
        Object.keys(TYPE_LABELS).map(function (t) { return '<option value="' + t + '">' + TYPE_LABELS[t] + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="form-field"><label>Título</label><input type="text" data-f="title" placeholder="Ej. Visita con Familia García" /></div>' +
        '<div class="form-field"><label>Fecha y hora</label><input type="datetime-local" data-f="date" /></div>' +
        (clients.length ? '<div class="form-field"><label>Cliente relacionado (opcional)</label><select data-f="clientId"><option value="">Ninguno</option>' + clients.map(function (cl) { return '<option value="' + cl.id + '">' + u.escapeHtml(cl.name) + '</option>'; }).join('') + '</select></div>' : '') +
        '<button type="button" class="btn btn--primary btn--block" data-save>Agregar al calendario</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      var title = u.qs('[data-f="title"]', sheetRoot).value.trim();
      var dateVal = u.qs('[data-f="date"]', sheetRoot).value;
      if (!title || !dateVal) { u.toast('Escribe un título y una fecha'); return; }
      var clientSel = u.qs('[data-f="clientId"]', sheetRoot);
      agentState.calendar.create({
        type: u.qs('[data-f="type"]', sheetRoot).value,
        title: title,
        date: new Date(dateVal).toISOString(),
        clientId: clientSel ? (clientSel.value || null) : null
      });
      c.closeSheet();
      u.toast('Agregado a tu calendario', { tone: 'success' });
      refresh();
    });
  }

  function eventRowHTML(ev) {
    var client = ev.clientId ? window.App.agent.state.clients.get(ev.clientId) : null;
    return '<div class="ranked-row">' +
      '<span class="dashboard-card__icon">' + u.icon(TYPE_ICONS[ev.type] || 'calendar', { size: 16 }) + '</span>' +
      '<div class="ranked-row__info"><strong style="' + (ev.done ? 'text-decoration:line-through;color:var(--color-ink-muted)' : '') + '">' + u.escapeHtml(ev.title) + '</strong>' +
      '<span>' + new Date(ev.date).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) + (client ? ' · ' + u.escapeHtml(client.name) : '') + '</span></div>' +
      '<div class="icon-btn-row">' +
      '<button type="button" class="btn btn--sm btn--outline" data-toggle="' + ev.id + '">' + (ev.done ? 'Reabrir' : 'Completar') + '</button>' +
      '<button type="button" class="btn btn--icon" data-remove="' + ev.id + '" aria-label="Eliminar">' + u.icon('x', { size: 14 }) + '</button>' +
      '</div></div>';
  }

  function render(params, root) {
    function refresh() {
      var events = agentState.calendar.all();
      var pending = events.filter(function (e) { return !e.done; });
      var done = events.filter(function (e) { return e.done; });

      var content =
        '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
        '  <button type="button" class="btn btn--primary btn--sm" data-new>' + u.icon('plus', { size: 14 }) + ' Nueva actividad</button>' +
        '</div>' +
        '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Pendientes (' + pending.length + ')</div></div>' +
        '  <div class="stack gap-2">' + (pending.map(eventRowHTML).join('') || '<p class="text-muted" style="font-size:0.85rem">No tienes citas, visitas ni tareas pendientes.</p>') + '</div>' +
        '</div>' +
        '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Completadas</div></div>' +
        '  <div class="stack gap-2">' + (done.map(eventRowHTML).join('') || '<p class="text-muted" style="font-size:0.85rem">Aún no completas actividades.</p>') + '</div>' +
        '</div>';

      ac.mount('calendario', 'Calendario', content, root);

      u.qs('[data-new]', root).addEventListener('click', function () { newEventSheet(refresh); });
      u.qsa('[data-toggle]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { agentState.calendar.toggleDone(btn.getAttribute('data-toggle')); refresh(); });
      });
      u.qsa('[data-remove]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { agentState.calendar.remove(btn.getAttribute('data-remove')); refresh(); });
      });
    }
    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.calendar = { render: render };
})();
