// Shell y componentes compartidos del panel del asesor (reutiliza el estilo
// visual del panel admin: sidebar + topbar, definido en css/admin.css).
(function () {
  "use strict";

  var u = window.App.utils;
  var as = window.App.agent.state;

  var NAV = [
    { route: "dashboard", href: "#/dashboard", label: "Dashboard", icon: "grid" },
    { route: "propiedades", href: "#/dashboard/propiedades", label: "Mis propiedades", icon: "home" },
    { route: "clientes", href: "#/dashboard/clientes", label: "Clientes", icon: "users" },
    { route: "enlaces", href: "#/dashboard/enlaces", label: "Enlaces", icon: "link" },
    { route: "bolsa", href: "#/dashboard/bolsa", label: "Bolsa Compartida", icon: "exchange", badge: function () { return as.sharedPool ? as.sharedPool.pendingRequests().length : 0; } },
    { route: "calendario", href: "#/dashboard/calendario", label: "Calendario", icon: "calendar" },
    { route: "perfil-profesional", href: "#/dashboard/perfil-profesional", label: "Perfil profesional", icon: "user" },
    { route: "estadisticas", href: "#/dashboard/estadisticas", label: "Estadísticas", icon: "chart" },
    { route: "publicidad", href: "#/dashboard/publicidad", label: "Publicidad", icon: "megaphone" },
    { route: "notificaciones", href: "#/dashboard/notificaciones", label: "Notificaciones", icon: "bell", badge: function () { return as.notifications.unreadCount(); } },
    { route: "suscripcion", href: "#/dashboard/suscripcion", label: "Suscripción", icon: "dollar" }
  ];

  function statusPill(status) {
    return window.App.admin.components.statusPill(status);
  }
  function hbarListHTML(data, opts) {
    return window.App.admin.components.hbarListHTML(data, opts);
  }
  function kpiCardHTML(icon, value, label) {
    return window.App.admin.components.kpiCardHTML(icon, value, label);
  }

  function shellHTML(activeRoute, title, contentHtml) {
    var agent = window.App.state.agents.current();
    var navHtml = NAV.map(function (item) {
      var count = item.badge ? item.badge() : 0;
      return '<a class="admin-nav-link' + (item.route === activeRoute ? ' is-active' : '') + '" href="' + item.href + '">' +
        u.icon(item.icon, { size: 17 }) + '<span>' + item.label + '</span>' +
        (count ? '<span class="badge-count">' + count + '</span>' : '') + '</a>';
    }).join('');

    return (
      '<div class="admin-shell" id="agent-shell">' +
      '  <div class="admin-sidebar-backdrop" data-agent-close-nav></div>' +
      '  <aside class="admin-sidebar">' +
      '    <div class="admin-sidebar__logo">' + u.icon('pin', { size: 20 }) + ' InmoMap <span class="tag">Asesor</span></div>' +
      (agent ? '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px 16px"><img src="' + agent.photo + '" width="34" height="34" style="border-radius:50%;object-fit:cover" alt="" /><div style="min-width:0"><div style="color:#fff;font-weight:700;font-size:0.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + u.escapeHtml(agent.name) + '</div><div style="color:#9CA3AF;font-size:0.7rem">Ver perfil público</div></div></div>' : '') +
      '    <nav>' + navHtml + '</nav>' +
      '    <div class="admin-sidebar__footer">' +
      (agent ? '<a href="#/' + agent.slug + '">' + u.icon('home', { size: 16 }) + ' Ver mi perfil público</a>' : '') +
      '      <a href="#/">' + u.icon('chevronLeft', { size: 16 }) + ' Ir al sitio público</a>' +
      '      <a href="#" data-agent-logout>' + u.icon('logout', { size: 16 }) + ' Cerrar sesión</a>' +
      '    </div>' +
      '  </aside>' +
      '  <div class="admin-main">' +
      '    <div class="admin-topbar">' +
      '      <button type="button" class="btn btn--icon admin-menu-toggle" data-agent-open-nav aria-label="Abrir menú">' + u.icon('menu', { size: 18 }) + '</button>' +
      '      <h1 class="admin-topbar__title">' + title + '</h1>' +
      '    </div>' +
      '    <div class="admin-content">' + contentHtml + '</div>' +
      '  </div>' +
      '</div>'
    );
  }

  function mount(activeRoute, title, contentHtml, root) {
    document.body.classList.add('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';
    root.innerHTML = shellHTML(activeRoute, title, contentHtml);
    document.title = title + ' — Panel del asesor · InmoMap';

    var shell = u.qs('#agent-shell', root);
    u.qs('[data-agent-open-nav]', root).addEventListener('click', function () { shell.classList.add('is-nav-open'); });
    u.qs('[data-agent-close-nav]', root).addEventListener('click', function () { shell.classList.remove('is-nav-open'); });
    var logoutLink = u.qs('[data-agent-logout]', root);
    if (logoutLink) logoutLink.addEventListener('click', async function (e) {
      e.preventDefault();
      await window.App.state.agents.logout();
      window.location.hash = '#/dashboard/login';
    });
  }

  window.App.agent.components = {
    NAV: NAV,
    statusPill: statusPill,
    hbarListHTML: hbarListHTML,
    kpiCardHTML: kpiCardHTML,
    mount: mount
  };
})();
