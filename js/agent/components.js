// Shell del panel del asesor: sidebar fija en escritorio (cajón deslizable +
// hamburguesa en celular), calcada del mismo patrón que ya usa el panel
// admin (js/admin/components.js + css/admin.css, quiebre en 900px) — en vez
// de la barra inferior que usaba el sitio público. Con solo 7 secciones,
// todas caben directo en la sidebar sin necesitar una pestaña "Menú" aparte.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var as = window.App.agent.state;

  var NAV = [
    { route: "dashboard", href: "#/dashboard", label: "Inicio", icon: "grid" },
    { route: "propiedades", href: "#/dashboard/propiedades", label: "Propiedades", icon: "home" },
    { route: "clientes", href: "#/dashboard/clientes", label: "Clientes", icon: "users", badge: function () { return as.clients.all().filter(function (cl) { return cl.status === 'nuevo'; }).length; } },
    { route: "bolsa", href: "#/dashboard/bolsa", label: "Bolsa Compartida", icon: "exchange", badge: function () { return as.sharedPool ? as.sharedPool.pendingRequests().length : 0; } },
    { route: "enlaces", href: "#/dashboard/enlaces", label: "Enlaces", icon: "link" },
    { route: "perfil-profesional", href: "#/dashboard/perfil-profesional", label: "Perfil profesional", icon: "user" },
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

  function shellHTML(activeRoute, title, contentHtml) {
    var agent = state.agents.current();
    var navHtml = NAV.map(function (item) {
      var count = item.badge ? item.badge() : 0;
      return '<a class="agent-nav-link' + (item.route === activeRoute ? ' is-active' : '') + '" href="' + item.href + '">' +
        u.icon(item.icon, { size: 17 }) + '<span>' + item.label + '</span>' +
        (count ? '<span class="badge-count">' + count + '</span>' : '') + '</a>';
    }).join('');

    return (
      '<div class="agent-shell" id="agent-shell">' +
      '  <div class="agent-sidebar-backdrop" data-agent-close-nav></div>' +
      '  <aside class="agent-sidebar">' +
      '    <div class="agent-sidebar__logo">' + u.logoHTML({ tone: 'light' }) + ' <span class="logo-tag">Panel</span></div>' +
      '    <a class="agent-sidebar__publish-btn" href="#/dashboard/publicar">' + u.icon('plus', { size: 16 }) + ' Publicar propiedad</a>' +
      '    <nav>' + navHtml + '</nav>' +
      '    <div class="agent-sidebar__footer">' +
      (agent ? '<a href="#/' + agent.slug + '">' + u.icon('eye', { size: 16 }) + ' Ver mi perfil público</a>' : '') +
      '      <a href="#/">' + u.icon('chevronLeft', { size: 16 }) + ' Ir al sitio público</a>' +
      '      <a href="#/soporte">' + u.icon('flag', { size: 16 }) + ' Soporte</a>' +
      '      <a href="#" data-agent-logout>' + u.icon('logout', { size: 16 }) + ' Cerrar sesión</a>' +
      '    </div>' +
      '  </aside>' +
      '  <div class="agent-main">' +
      '    <div class="agent-topbar">' +
      '      <button type="button" class="btn btn--icon agent-menu-toggle" data-agent-open-nav aria-label="Abrir menú">' + u.icon('menu', { size: 18 }) + '</button>' +
      '      <h1 class="agent-topbar__title">' + u.escapeHtml(title) + '</h1>' +
      '    </div>' +
      '    <div class="agent-content">' + contentHtml + '</div>' +
      '  </div>' +
      '</div>'
    );
  }

  function mount(activeRoute, title, contentHtml, root) {
    document.body.classList.remove('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';
    root.innerHTML = shellHTML(activeRoute, title, contentHtml);
    document.title = title + ' — Panel del asesor · InmoMaps';

    var shell = u.qs('#agent-shell', root);
    u.qs('[data-agent-open-nav]', root).addEventListener('click', function () { shell.classList.add('is-nav-open'); });
    u.qs('[data-agent-close-nav]', root).addEventListener('click', function () { shell.classList.remove('is-nav-open'); });
    var logoutLink = u.qs('[data-agent-logout]', root);
    if (logoutLink) logoutLink.addEventListener('click', async function (e) {
      e.preventDefault();
      await state.agents.logout();
      window.location.hash = '#/';
    });
  }

  window.App.agent.components = {
    NAV: NAV,
    statusPill: statusPill,
    hbarListHTML: hbarListHTML,
    kpiCardHTML: kpiCardHTML,
    barChartHTML: barChartHTML,
    mount: mount
  };
})();
