// Shell y componentes compartidos del panel de administración.
(function () {
  "use strict";

  var u = window.App.utils;
  var s = window.App.admin.state;

  var NAV = [
    { route: "dashboard", href: "#/admin", label: "Dashboard", icon: "grid" },
    { route: "usuarios", href: "#/admin/usuarios", label: "Usuarios", icon: "users" },
    { route: "agentes", href: "#/admin/agentes", label: "Agentes", icon: "briefcase", badge: function () { return s.agents.pending().length; } },
    { route: "propiedades", href: "#/admin/propiedades", label: "Propiedades", icon: "home", badge: function () { return s.properties.pending().length; } },
    { route: "mapa", href: "#/admin/mapa", label: "Mapa", icon: "map" },
    { route: "suscripciones", href: "#/admin/suscripciones", label: "Suscripciones", icon: "link" },
    { route: "pagos", href: "#/admin/pagos", label: "Pagos", icon: "dollar" },
    { route: "estadisticas", href: "#/admin/estadisticas", label: "Estadísticas", icon: "chart" },
    { route: "moderacion", href: "#/admin/moderacion", label: "Moderación", icon: "flag", badge: function () { return s.reports.all().filter(function (r) { return r.status === 'pendiente'; }).length; } },
    { route: "solicitudes", href: "#/admin/solicitudes", label: "Solicitudes", icon: "chat", badge: function () { return window.App.state.leads.all().filter(function (l) { return l.status === 'nuevo'; }).length; } },
    { route: "publicidad", href: "#/admin/publicidad", label: "Publicidad", icon: "megaphone" },
    { route: "notificaciones", href: "#/admin/notificaciones", label: "Notificaciones", icon: "bell" },
    { route: "configuracion", href: "#/admin/configuracion", label: "Configuración", icon: "sliders" },
    { route: "reportes", href: "#/admin/reportes", label: "Reportes", icon: "download" },
    { route: "seguridad", href: "#/admin/seguridad", label: "Seguridad", icon: "shield" }
  ];

  function statusPill(status) {
    var labels = {
      activo: "Activo", inactivo: "Inactivo", suspendido: "Suspendido",
      aprobada: "Aprobada", pendiente: "Pendiente", rechazada: "Rechazada", rechazado: "Rechazado", oculta: "Oculta",
      pagado: "Pagado", reembolsado: "Reembolsado", resuelto: "Resuelto", descartado: "Descartado"
    };
    return '<span class="status-pill status-pill--' + status + '">' + (labels[status] || status) + '</span>';
  }

  function hbarListHTML(data, opts) {
    opts = opts || {};
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    return data.map(function (d) {
      var pct = Math.round((d.value / max) * 100);
      return '<div class="hbar-row"><span class="hbar-row__label">' + u.escapeHtml(d.label) + '</span>' +
        '<span class="hbar-row__track"><span class="hbar-row__fill" style="width:' + pct + '%"></span></span>' +
        '<span class="hbar-row__value">' + (opts.format ? opts.format(d.value) : d.value) + '</span></div>';
    }).join('');
  }

  function kpiCardHTML(icon, value, label) {
    return '<div class="admin-kpi"><span class="admin-kpi__icon">' + u.icon(icon, { size: 16 }) + '</span>' +
      '<span class="admin-kpi__value">' + value + '</span><span class="admin-kpi__label">' + u.escapeHtml(label) + '</span></div>';
  }

  function shellHTML(activeRoute, title, contentHtml) {
    var navHtml = NAV.map(function (item) {
      var count = item.badge ? item.badge() : 0;
      return '<a class="admin-nav-link' + (item.route === activeRoute ? ' is-active' : '') + '" href="' + item.href + '">' +
        u.icon(item.icon, { size: 17 }) + '<span>' + item.label + '</span>' +
        (count ? '<span class="badge-count">' + count + '</span>' : '') + '</a>';
    }).join('');

    return (
      '<div class="admin-shell" id="admin-shell">' +
      '  <div class="admin-sidebar-backdrop" data-admin-close-nav></div>' +
      '  <aside class="admin-sidebar">' +
      '    <div class="admin-sidebar__logo">' + u.logoHTML({ tone: 'light' }) + ' <span class="logo-tag">Admin</span></div>' +
      '    <nav>' + navHtml + '</nav>' +
      '    <div class="admin-sidebar__footer">' +
      '      <a href="#/">' + u.icon('chevronLeft', { size: 16 }) + ' Ir al sitio público</a>' +
      '      <a href="#" data-admin-logout>' + u.icon('logout', { size: 16 }) + ' Cerrar sesión</a>' +
      '    </div>' +
      '  </aside>' +
      '  <div class="admin-main">' +
      '    <div class="admin-topbar">' +
      '      <button type="button" class="btn btn--icon admin-menu-toggle" data-admin-open-nav aria-label="Abrir menú">' + u.icon('menu', { size: 18 }) + '</button>' +
      '      <h1 class="admin-topbar__title">' + u.escapeHtml(title) + '</h1>' +
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
    document.title = title + ' — Admin InmoMaps';

    var shell = u.qs('#admin-shell', root);
    u.qs('[data-admin-open-nav]', root).addEventListener('click', function () { shell.classList.add('is-nav-open'); });
    u.qs('[data-admin-close-nav]', root).addEventListener('click', function () { shell.classList.remove('is-nav-open'); });
    var logoutLink = u.qs('[data-admin-logout]', root);
    if (logoutLink) logoutLink.addEventListener('click', async function (e) {
      e.preventDefault();
      await s.auth.logout();
      window.location.hash = '#/admin/login';
    });
  }

  window.App.admin.components = {
    NAV: NAV,
    statusPill: statusPill,
    hbarListHTML: hbarListHTML,
    kpiCardHTML: kpiCardHTML,
    mount: mount
  };
})();
