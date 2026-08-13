// Shell del panel del asesor: sin barra lateral — "Inicio" (dashboardHome.js)
// es el único menú, con botones grandes que llevan a cada sección; el resto
// de las pantallas solo lleva un encabezado simple con flecha de regreso al
// centro de control, igual que cualquier otra pantalla secundaria de la app.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;

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
    var header = activeRoute === 'dashboard'
      ? ('<div class="agent-hub-topbar">' + u.logoHTML() +
        '<a href="#/dashboard/perfil-profesional" aria-label="Perfil profesional"><img class="avatar" src="' + agent.photo + '" width="36" height="36" alt="" /></a></div>')
      : ('<div class="page-header">' +
        '<a class="btn btn--icon" href="#/dashboard" aria-label="Volver al panel">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
        '<h1 class="page-header__title">' + u.escapeHtml(title) + '</h1>' +
        '</div>');

    return (
      '<div class="agent-shell">' +
      header +
      '  <div class="agent-content">' + contentHtml + '</div>' +
      '</div>'
    );
  }

  function mount(activeRoute, title, contentHtml, root) {
    document.body.classList.remove('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';
    root.innerHTML = shellHTML(activeRoute, title, contentHtml);
    document.title = title + ' — Panel del asesor · InmoMaps';

    var logoutLink = u.qs('[data-agent-logout]', root);
    if (logoutLink) logoutLink.addEventListener('click', async function (e) {
      e.preventDefault();
      await state.agents.logout();
      window.location.hash = '#/';
    });
  }

  window.App.agent.components = {
    statusPill: statusPill,
    hbarListHTML: hbarListHTML,
    kpiCardHTML: kpiCardHTML,
    barChartHTML: barChartHTML,
    mount: mount
  };
})();
