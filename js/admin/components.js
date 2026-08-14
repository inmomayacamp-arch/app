// Shell y componentes compartidos del panel de administración: sin barra
// lateral — "Dashboard" es el único menú, con tarjetas grandes que llevan a
// cada sección, igual que el panel del asesor; el resto de las pantallas
// solo lleva un encabezado simple con flecha de regreso al dashboard.
(function () {
  "use strict";

  var u = window.App.utils;
  var s = window.App.admin.state;

  var NAV = [
    { route: "dashboard", href: "#/admin", label: "Dashboard", icon: "grid" },
    { route: "agentes", href: "#/admin/agentes", label: "Agentes", icon: "briefcase" },
    { route: "propietarios", href: "#/admin/propietarios", label: "Propietarios", icon: "home" },
    { route: "propiedades", href: "#/admin/propiedades", label: "Propiedades", icon: "map" },
    { route: "directorio", href: "#/admin/directorio", label: "Directorio", icon: "award" },
    { route: "solicitudes", href: "#/admin/solicitudes", label: "Solicitudes", icon: "chat" },
    { route: "estadisticas", href: "#/admin/estadisticas", label: "Estadísticas", icon: "chart" },
    { route: "reportes", href: "#/admin/reportes", label: "Reportes", icon: "download" }
  ];

  function statusPill(status) {
    var labels = {
      activo: "Activo", inactivo: "Inactivo", suspendido: "Suspendido", pendiente_pago: "Pendiente de pago",
      disponible: "Disponible", pendiente: "Pendiente", nuevo: "Nuevo", resuelto: "Resuelto", contactado: "Contactado"
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
    var header = activeRoute === 'dashboard'
      ? ('<div class="agent-hub-topbar">' + u.logoHTML() + ' <span class="logo-tag">Admin</span>' +
        '<a class="btn btn--icon" href="#/" aria-label="Ir al sitio público" style="margin-left:auto">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
        '<a href="#" class="btn btn--icon" data-admin-logout aria-label="Cerrar sesión">' + u.icon('logout', { size: 18 }) + '</a></div>')
      : ('<div class="page-header">' +
        '<a class="btn btn--icon" href="#/admin" aria-label="Volver al dashboard">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
        '<h1 class="page-header__title">' + u.escapeHtml(title) + '</h1>' +
        '<a href="#" class="btn btn--icon btn--icon-tinted" data-admin-logout aria-label="Cerrar sesión">' + u.icon('logout', { size: 18 }) + '</a>' +
        '</div>');

    return (
      '<div class="agent-shell">' +
      header +
      '  <div class="agent-content">' + contentHtml + '</div>' +
      '</div>'
    );
  }

  function mount(activeRoute, title, contentHtml, root) {
    document.body.classList.add('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';
    root.innerHTML = shellHTML(activeRoute, title, contentHtml);
    document.title = title + ' — Admin InmoMaps';

    u.qsa('[data-admin-logout]', root).forEach(function (link) {
      link.addEventListener('click', async function (e) {
        e.preventDefault();
        await s.auth.logout();
        window.location.hash = '#/admin/login';
      });
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
