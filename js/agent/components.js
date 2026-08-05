// Shell del panel del asesor: reutiliza el mismo sistema de navegación
// adaptativa del sitio público (barra superior en escritorio, barra inferior
// con botón flotante en celular — mismos contenedores #site-header/#bottom-nav
// y mismo breakpoint de css/styles.css), en vez de una barra lateral fija.
(function () {
  "use strict";

  var u = window.App.utils;
  var as = window.App.agent.state;

  var PRIMARY = [
    { route: "dashboard", href: "#/dashboard", label: "Inicio", icon: "grid" },
    { route: "propiedades", href: "#/dashboard/propiedades", label: "Propiedades", icon: "home" },
    { route: "publicar", href: "#/dashboard/publicar", label: "Publicar", icon: "plus", fab: true },
    { route: "clientes", href: "#/dashboard/clientes", label: "Clientes", icon: "users" },
    { route: "menu", href: "#/dashboard/menu", label: "Menú", icon: "menu", badge: function () { return menuBadgeCount(); } }
  ];

  var MENU_ITEMS = [
    { route: "enlaces", href: "#/dashboard/enlaces", label: "Enlaces", icon: "link", desc: "Selecciones para tus clientes" },
    { route: "bolsa", href: "#/dashboard/bolsa", label: "Bolsa Compartida", icon: "exchange", desc: "Colabora con otros asesores", badge: function () { return as.sharedPool ? as.sharedPool.pendingRequests().length : 0; } },
    { route: "calendario", href: "#/dashboard/calendario", label: "Calendario", icon: "calendar", desc: "Citas, visitas y tareas" },
    { route: "perfil-profesional", href: "#/dashboard/perfil-profesional", label: "Perfil profesional", icon: "user", desc: "Tu información pública" },
    { route: "estadisticas", href: "#/dashboard/estadisticas", label: "Estadísticas", icon: "chart", desc: "Vistas, contactos y conversión" },
    { route: "publicidad", href: "#/dashboard/publicidad", label: "Publicidad", icon: "megaphone", desc: "Destaca tus propiedades" },
    { route: "notificaciones", href: "#/dashboard/notificaciones", label: "Notificaciones", icon: "bell", desc: "Actividad reciente", badge: function () { return as.notifications.unreadCount(); } },
    { route: "suscripcion", href: "#/dashboard/suscripcion", label: "Suscripción", icon: "dollar", desc: "Tu plan y pagos" }
  ];

  function menuBadgeCount() {
    var pending = as.sharedPool ? as.sharedPool.pendingRequests().length : 0;
    var unread = as.notifications ? as.notifications.unreadCount() : 0;
    return pending + unread;
  }

  function statusPill(status) {
    return window.App.admin.components.statusPill(status);
  }
  function hbarListHTML(data, opts) {
    return window.App.admin.components.hbarListHTML(data, opts);
  }
  function kpiCardHTML(icon, value, label) {
    return window.App.admin.components.kpiCardHTML(icon, value, label);
  }

  function barChartHTML(data, opts) {
    opts = opts || {};
    var w = opts.width || 600, h = opts.height || 140, gap = 6;
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    var barW = (w - gap * (data.length - 1)) / data.length;
    var bars = data.map(function (d, i) {
      var barH = Math.max(2, Math.round((d.value / max) * (h - 20)));
      var x = i * (barW + gap);
      var y = h - barH;
      return '<rect class="bar-chart-svg__bar" x="' + x.toFixed(1) + '" y="' + y + '" width="' + barW.toFixed(1) + '" height="' + barH + '" rx="4"><title>' + u.escapeHtml(d.label) + ': ' + d.value + '</title></rect>';
    }).join('');
    var labels = data.map(function (d, i) {
      if (data.length > 10 && i % 2 !== 0) return '';
      var x = i * (barW + gap) + barW / 2;
      return '<text class="bar-chart-svg__label" x="' + x.toFixed(1) + '" y="' + (h + 14) + '" text-anchor="middle">' + u.escapeHtml(d.shortLabel || d.label) + '</text>';
    }).join('');
    return '<svg class="bar-chart-svg" viewBox="0 0 ' + w + ' ' + (h + 20) + '" preserveAspectRatio="none" role="img" aria-label="Gráfica de barras">' +
      '<line class="bar-chart-svg__baseline" x1="0" y1="' + h + '" x2="' + w + '" y2="' + h + '" />' +
      bars + labels + '</svg>';
  }

  function renderAgentHeader(activeRoute) {
    var links = PRIMARY.filter(function (i) { return !i.fab; }).map(function (item) {
      var cls = "site-header__link" + (item.route === activeRoute ? " is-active" : "");
      var count = item.badge ? item.badge() : 0;
      return '<a class="' + cls + '" href="' + item.href + '">' + u.escapeHtml(item.label) + (count ? ' <span class="badge-count">' + count + '</span>' : '') + '</a>';
    }).join('');
    var fab = PRIMARY.filter(function (i) { return i.fab; })[0];

    return (
      '<a class="site-header__logo" href="#/dashboard">' + u.icon('pin', { size: 22 }) + ' InmoMap</a>' +
      '<nav class="site-header__nav">' + links + '</nav>' +
      '<a class="btn btn--primary btn--sm" href="' + fab.href + '">' + u.icon(fab.icon, { size: 14 }) + ' ' + fab.label + '</a>'
    );
  }

  function renderAgentBottomNav(activeRoute) {
    return PRIMARY.map(function (item) {
      if (item.fab) {
        return '<a class="bottom-nav__item" href="' + item.href + '" aria-label="' + item.label + '"><span class="bottom-nav__fab">' + u.icon(item.icon, { size: 20 }) + '</span></a>';
      }
      var cls = "bottom-nav__item" + (item.route === activeRoute ? " is-active" : "");
      var count = item.badge ? item.badge() : 0;
      var badgeHtml = count ? '<span class="bottom-nav__badge">' + count + '</span>' : '';
      return '<a class="' + cls + '" href="' + item.href + '" aria-current="' + (item.route === activeRoute ? 'page' : 'false') + '">' +
        badgeHtml + u.icon(item.icon, { size: 21 }) + '<span>' + u.escapeHtml(item.label) + '</span></a>';
    }).join('');
  }

  function mount(activeRoute, title, contentHtml, root) {
    document.body.classList.remove('is-admin');
    u.qs('#site-header').innerHTML = renderAgentHeader(activeRoute);
    u.qs('#bottom-nav').innerHTML = renderAgentBottomNav(activeRoute);
    root.innerHTML =
      '<div class="agent-content">' +
      '  <div class="agent-topbar"><h1 class="agent-topbar__title">' + title + '</h1></div>' +
      contentHtml +
      '</div>';
    document.title = title + ' — Panel del asesor · InmoMap';
  }

  window.App.agent.components = {
    PRIMARY: PRIMARY,
    MENU_ITEMS: MENU_ITEMS,
    menuBadgeCount: menuBadgeCount,
    statusPill: statusPill,
    hbarListHTML: hbarListHTML,
    kpiCardHTML: kpiCardHTML,
    barChartHTML: barChartHTML,
    mount: mount
  };
})();
