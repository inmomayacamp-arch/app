// Vista "Notificaciones" del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var agentState = window.App.agent.state;
  var ac = window.App.agent.components;

  var TYPE_ICONS = { visita: "pin", favorito: "heart", whatsapp: "chat", suscripcion: "dollar", mensaje: "chat" };

  function render(params, root) {
    function refresh() {
      var list = agentState.notifications.all();

      var rows = list.map(function (n) {
        return '<div class="ranked-row" style="' + (n.read ? 'opacity:0.6' : '') + '">' +
          '<span class="dashboard-card__icon">' + u.icon(TYPE_ICONS[n.type] || 'bell', { size: 16 }) + '</span>' +
          '<div class="ranked-row__info"><strong>' + u.escapeHtml(n.text) + '</strong><span>' + u.relativeTime(n.createdAt) + '</span></div>' +
          (!n.read ? '<button type="button" class="btn btn--sm btn--outline" data-read="' + n.id + '">Marcar leída</button>' : '') +
          '</div>';
      }).join('');

      var content =
        '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
        '  <button type="button" class="btn btn--outline btn--sm" data-read-all>Marcar todas como leídas</button>' +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="stack gap-2">' + (rows || '<p class="text-muted" style="font-size:0.85rem">No tienes notificaciones.</p>') + '</div>' +
        '</div>';

      ac.mount('notificaciones', 'Notificaciones', content, root);

      u.qsa('[data-read]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { agentState.notifications.markRead(btn.getAttribute('data-read')); refresh(); });
      });
      u.qs('[data-read-all]', root).addEventListener('click', function () { agentState.notifications.markAllRead(); refresh(); });
    }
    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.notifications = { render: render };
})();
