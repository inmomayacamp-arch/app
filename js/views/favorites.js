// Vista "Favoritos": propiedades guardadas por el usuario (persistidas en este dispositivo).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  function render(params, root) {
    function refresh() {
      var list = state.favorites.list();
      root.innerHTML =
        '<div class="page-header"><h1 class="page-header__title">Favoritos (' + list.length + ')</h1></div>' +
        '<div class="page-wrap">' +
        (list.length
          ? '<div class="stack gap-2">' + list.map(function (p) { return c.propertyCardHTML(p, { variant: 'row' }); }).join('') + '</div>'
          : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('heart', { size: 32 }) + '</span><h3>Aún no tienes favoritos</h3><p>Toca el corazón en cualquier propiedad para guardarla aquí y comparar más tarde.</p><a class="btn btn--primary" href="#/">Explorar propiedades</a></div>') +
        '</div>';
    }

    refresh();
    c.mountChrome('favorites');
    document.title = 'InmoMaps — Favoritos';

    var off = state.on('favorites:change', refresh);
    window.App.router.onLeave(off);
  }

  window.App.views = window.App.views || {};
  window.App.views.favorites = { render: render };
})();
