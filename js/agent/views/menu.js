// Vista "Menú": accesos secundarios del panel del asesor y cuenta.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var ac = window.App.agent.components;

  function render(params, root) {
    var agent = state.agents.current();

    var cardsHtml = ac.MENU_ITEMS.map(function (item) {
      var count = item.badge ? item.badge() : 0;
      return '<a class="dashboard-card" href="' + item.href + '">' +
        (count ? '<span class="dashboard-card__badge badge-count">' + count + '</span>' : '') +
        '<span class="dashboard-card__icon">' + u.icon(item.icon, { size: 18 }) + '</span>' +
        '<strong>' + u.escapeHtml(item.label) + '</strong><span>' + u.escapeHtml(item.desc) + '</span>' +
        '</a>';
    }).join('');

    var content =
      '<div class="dashboard-grid">' + cardsHtml + '</div>' +

      '<div class="admin-section" style="margin-top:24px">' +
      '  <div class="row gap-2" style="align-items:center">' +
      (agent ? '<img src="' + agent.photo + '" width="48" height="48" style="border-radius:50%;object-fit:cover" alt="" />' : '') +
      '    <div style="min-width:0;flex:1">' +
      '      <div style="font-weight:800;font-size:0.95rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (agent ? u.escapeHtml(agent.name) : '') + '</div>' +
      '      <div class="text-muted" style="font-size:0.78rem">' + (agent ? u.escapeHtml(agent.email) : '') + '</div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="stack gap-2" style="margin-top:16px">' +
      (agent ? '<a class="btn btn--outline btn--block" href="#/' + agent.slug + '">' + u.icon('home', { size: 15 }) + ' Ver mi perfil público</a>' : '') +
      '    <a class="btn btn--outline btn--block" href="#/">' + u.icon('chevronLeft', { size: 15 }) + ' Ir al sitio público</a>' +
      '    <button type="button" class="btn btn--outline btn--block" data-logout style="color:var(--color-primary);border-color:var(--color-primary)">' + u.icon('logout', { size: 15 }) + ' Cerrar sesión</button>' +
      '  </div>' +
      '</div>';

    ac.mount('menu', 'Menú', content, root);

    u.qs('[data-logout]', root).addEventListener('click', async function () {
      await state.agents.logout();
      window.location.hash = '#/';
    });
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.menu = { render: render };
})();
