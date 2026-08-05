// Vista "Calendario": vista de mes + agenda del día, con citas, visitas,
// recordatorios y tareas del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var agentState = window.App.agent.state;
  var ac = window.App.agent.components;

  var TYPE_LABELS = { cita: "Cita", visita: "Visita", recordatorio: "Recordatorio", tarea: "Tarea", llamada: "Llamada" };
  var TYPE_ICONS = { cita: "calendar", visita: "pin", recordatorio: "bell", tarea: "check", llamada: "phone" };
  var DOW_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

  function dayKey(d) {
    var dt = new Date(d);
    return dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate();
  }

  function buildMonthCells(year, month) {
    var firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // lunes = 0
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var cells = [];
    for (var i = 0; i < firstDow; i++) cells.push(null);
    for (var d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  function googleCalendarUrl(ev) {
    var start = new Date(ev.date);
    var end = new Date(start.getTime() + 60 * 60 * 1000);
    function fmt(d) { return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; }
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(ev.title) +
      '&dates=' + fmt(start) + '/' + fmt(end) +
      '&details=' + encodeURIComponent('Creado desde InmoMap');
  }

  function newEventSheet(refresh, presetDate) {
    var clients = window.App.agent.state.clients.all();
    c.openSheet({
      title: "Nueva actividad",
      body:
        '<div class="form-field"><label>Tipo</label><select data-f="type">' +
        Object.keys(TYPE_LABELS).map(function (t) { return '<option value="' + t + '">' + TYPE_LABELS[t] + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="form-field"><label>Título</label><input type="text" data-f="title" placeholder="Ej. Visita con Familia García" /></div>' +
        '<div class="form-field"><label>Fecha y hora</label><input type="datetime-local" data-f="date" value="' + (presetDate || '') + '" /></div>' +
        (clients.length ? '<div class="form-field"><label>Cliente relacionado (opcional)</label><select data-f="clientId"><option value="">Ninguno</option>' + clients.map(function (cl) { return '<option value="' + cl.id + '">' + u.escapeHtml(cl.name) + '</option>'; }).join('') + '</select></div>' : '') +
        '<button type="button" class="btn btn--primary btn--block" data-save>Agregar al calendario</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', async function () {
      var title = u.qs('[data-f="title"]', sheetRoot).value.trim();
      var dateVal = u.qs('[data-f="date"]', sheetRoot).value;
      if (!title || !dateVal) { u.toast('Escribe un título y una fecha'); return; }
      var clientSel = u.qs('[data-f="clientId"]', sheetRoot);
      try {
        await agentState.calendar.create({
          type: u.qs('[data-f="type"]', sheetRoot).value,
          title: title,
          date: new Date(dateVal).toISOString(),
          clientId: clientSel ? (clientSel.value || null) : null
        });
        c.closeSheet();
        u.toast('Agregado a tu calendario', { tone: 'success' });
        refresh();
      } catch (err) {
        u.toast(err.message || 'No se pudo agregar la actividad');
      }
    });
  }

  function agendaCardHTML(ev) {
    var client = ev.clientId ? window.App.agent.state.clients.get(ev.clientId) : null;
    return '<div class="agenda-card agenda-card--' + ev.type + '">' +
      '<div class="agenda-card__meta"><span>' + u.icon(TYPE_ICONS[ev.type] || 'calendar', { size: 13 }) + ' ' + (TYPE_LABELS[ev.type] || ev.type) + '</span><span>' + new Date(ev.date).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) + '</span></div>' +
      '<strong style="' + (ev.done ? 'text-decoration:line-through;color:var(--color-ink-muted)' : '') + '">' + u.escapeHtml(ev.title) + '</strong>' +
      (client ? '<span class="text-muted" style="font-size:0.78rem">' + u.escapeHtml(client.name) + '</span>' : '') +
      '<div class="icon-btn-row" style="margin-top:6px">' +
      '<a class="btn btn--sm btn--outline" target="_blank" rel="noopener" href="' + googleCalendarUrl(ev) + '">' + u.icon('calendar', { size: 13 }) + ' Google Calendar</a>' +
      '<button type="button" class="btn btn--sm btn--outline" data-toggle="' + ev.id + '">' + (ev.done ? 'Reabrir' : 'Completar') + '</button>' +
      '<button type="button" class="btn btn--icon" data-remove="' + ev.id + '" aria-label="Eliminar">' + u.icon('x', { size: 14 }) + '</button>' +
      '</div></div>';
  }

  function render(params, root) {
    var today = new Date();
    var viewYear = today.getFullYear();
    var viewMonth = today.getMonth();
    var selectedDay = dayKey(today);

    function refresh() {
      var events = agentState.calendar.all();
      var byDay = {};
      events.forEach(function (ev) { var k = dayKey(ev.date); (byDay[k] = byDay[k] || []).push(ev); });

      var monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      var cells = buildMonthCells(viewYear, viewMonth);
      var gridHTML = DOW_LABELS.map(function (d) { return '<span class="calendar-grid__dow">' + d + '</span>'; }).join('') +
        cells.map(function (day) {
          if (!day) return '<span></span>';
          var k = viewYear + '-' + (viewMonth + 1) + '-' + day;
          var isToday = k === dayKey(today);
          var isSelected = k === selectedDay;
          var hasEvents = !!(byDay[k] && byDay[k].length);
          return '<button type="button" class="calendar-day' + (isToday ? ' calendar-day--today' : '') + (isSelected ? ' is-selected' : '') + '" data-day="' + k + '">' + day + (hasEvents ? '<span class="calendar-day__dot"></span>' : '') + '</button>';
        }).join('');

      var dayEvents = (byDay[selectedDay] || []).slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
      var selectedDate = new Date(selectedDay.split('-')[0], Number(selectedDay.split('-')[1]) - 1, selectedDay.split('-')[2]);
      var dayLabel = selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

      var upcoming = events.filter(function (e) { return !e.done && dayKey(e.date) !== selectedDay; })
        .sort(function (a, b) { return new Date(a.date) - new Date(b.date); }).slice(0, 5);

      var content =
        '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
        '  <button type="button" class="btn btn--primary btn--sm" data-new>' + u.icon('plus', { size: 14 }) + ' Nueva actividad</button>' +
        '</div>' +

        '<div class="calendar-month">' +
        '  <div class="calendar-month__head">' +
        '    <button type="button" class="btn btn--icon" data-prev-month aria-label="Mes anterior">' + u.icon('chevronLeft', { size: 16 }) + '</button>' +
        '    <span>' + monthLabel + '</span>' +
        '    <button type="button" class="btn btn--icon" data-next-month aria-label="Mes siguiente">' + u.icon('chevronRight', { size: 16 }) + '</button>' +
        '  </div>' +
        '  <div class="calendar-grid">' + gridHTML + '</div>' +
        '</div>' +

        '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title" style="text-transform:capitalize">' + dayLabel + '</div></div>' +
        '  <div class="stack gap-2">' + (dayEvents.map(agendaCardHTML).join('') || '<p class="text-muted" style="font-size:0.85rem">Sin actividades este día.</p>') + '</div>' +
        '</div>' +

        '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Próximas actividades</div></div>' +
        '  <div class="stack gap-2">' + (upcoming.map(agendaCardHTML).join('') || '<p class="text-muted" style="font-size:0.85rem">No tienes más actividades pendientes.</p>') + '</div>' +
        '</div>';

      ac.mount('calendario', 'Calendario', content, root);

      u.qs('[data-new]', root).addEventListener('click', function () {
        var d = new Date(selectedDay.split('-')[0], Number(selectedDay.split('-')[1]) - 1, selectedDay.split('-')[2], 12, 0);
        var preset = d.toISOString().slice(0, 16);
        newEventSheet(refresh, preset);
      });
      u.qs('[data-prev-month]', root).addEventListener('click', function () {
        viewMonth -= 1; if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
        refresh();
      });
      u.qs('[data-next-month]', root).addEventListener('click', function () {
        viewMonth += 1; if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
        refresh();
      });
      u.qsa('[data-day]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { selectedDay = btn.getAttribute('data-day'); refresh(); });
      });
      u.qsa('[data-toggle]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          try { await agentState.calendar.toggleDone(btn.getAttribute('data-toggle')); refresh(); }
          catch (err) { u.toast(err.message || 'No se pudo actualizar'); }
        });
      });
      u.qsa('[data-remove]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          try { await agentState.calendar.remove(btn.getAttribute('data-remove')); refresh(); }
          catch (err) { u.toast(err.message || 'No se pudo eliminar'); }
        });
      });
    }
    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.calendar = { render: render };
})();
