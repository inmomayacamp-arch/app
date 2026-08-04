// Vista "Mensajería": chat local con clientes (mock, sin backend en tiempo real).
(function () {
  "use strict";

  var u = window.App.utils;
  var agentState = window.App.agent.state;
  var ac = window.App.agent.components;

  function render(params, root) {
    var activeId = null;

    function refresh() {
      var conversations = agentState.messages.all();
      var clients = agentState.clients.all();
      if (!activeId && conversations.length) activeId = conversations[0].id;
      var active = conversations.filter(function (c) { return c.id === activeId; })[0];

      var listHTML = conversations.map(function (conv) {
        var last = conv.messages[conv.messages.length - 1];
        return '<button type="button" class="ranked-row" data-open="' + conv.id + '" style="width:100%;text-align:left;border:1px solid var(--color-border);' + (conv.id === activeId ? 'border-color:var(--color-primary)' : '') + '">' +
          '<span class="dashboard-card__icon">' + u.icon('user', { size: 16 }) + '</span>' +
          '<div class="ranked-row__info"><strong>' + u.escapeHtml(conv.clientName) + '</strong><span>' + (last ? u.escapeHtml(last.text.slice(0, 40)) : 'Sin mensajes') + '</span></div>' +
          '</button>';
      }).join('');

      var clientsWithoutConvo = clients.filter(function (cl) { return !conversations.some(function (c) { return c.clientId === cl.id; }); });

      var threadHTML = !active ? '<p class="text-muted" style="font-size:0.85rem">Selecciona o inicia una conversación.</p>' :
        '<div style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto;padding:4px">' +
        active.messages.map(function (m) {
          var mine = m.from === 'asesor';
          return '<div style="align-self:' + (mine ? 'flex-end' : 'flex-start') + ';background:' + (mine ? 'var(--color-primary)' : 'var(--color-bg)') + ';color:' + (mine ? '#fff' : 'var(--color-ink)') + ';padding:8px 12px;border-radius:14px;max-width:75%;font-size:0.85rem">' +
            u.escapeHtml(m.text) + '</div>';
        }).join('') + '</div>';

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Conversaciones</div></div>' +
        '  <div class="stack gap-2">' + (listHTML || '<p class="text-muted" style="font-size:0.85rem">Aún no tienes conversaciones.</p>') + '</div>' +
        (clientsWithoutConvo.length
          ? '<div class="form-field" style="margin-top:14px"><label>Iniciar conversación con</label><select data-new-convo><option value="">Selecciona un cliente</option>' + clientsWithoutConvo.map(function (cl) { return '<option value="' + cl.id + '">' + u.escapeHtml(cl.name) + '</option>'; }).join('') + '</select></div>'
          : '') +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">' + (active ? u.escapeHtml(active.clientName) : 'Chat') + '</div></div>' +
        threadHTML +
        (active ? '<div class="row gap-2" style="margin-top:12px"><input type="text" data-message-input placeholder="Escribe un mensaje..." style="flex:1;border:1px solid var(--color-border-strong);border-radius:var(--radius-full);padding:10px 16px" /><button type="button" class="btn btn--primary" data-send>Enviar</button></div>' : '') +
        '</div>';

      ac.mount('mensajes', 'Mensajes', content, root);

      u.qsa('[data-open]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { activeId = btn.getAttribute('data-open'); refresh(); });
      });
      var newConvoSel = u.qs('[data-new-convo]', root);
      if (newConvoSel) newConvoSel.addEventListener('change', function () {
        if (!newConvoSel.value) return;
        var client = clients.filter(function (cl) { return cl.id === newConvoSel.value; })[0];
        var conv = agentState.messages.getOrCreate(client.id, client.name);
        activeId = conv.id;
        refresh();
      });
      var sendBtn = u.qs('[data-send]', root);
      if (sendBtn) sendBtn.addEventListener('click', function () {
        var input = u.qs('[data-message-input]', root);
        var text = input.value.trim();
        if (!text) return;
        agentState.messages.send(activeId, 'asesor', text);
        refresh();
      });
    }

    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.messages = { render: render };
})();
