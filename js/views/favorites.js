// Vista "Favoritos": propiedades guardadas por el usuario (persistidas en este dispositivo).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  // Arma un mensaje de texto con el título, precio y enlace de cada
  // favorito (los favoritos solo existen en este dispositivo — no hay una
  // lista guardada en el servidor que se pueda compartir como un solo
  // enlace, así que cada propiedad manda a su propia ficha real).
  function buildShareText(list) {
    var base = window.location.origin;
    var shown = list.slice(0, 20);
    var items = shown.map(function (p, i) {
      return (i + 1) + '. ' + p.title + ' — ' + c.propertyPriceLabel(p) + '\n' + base + '/propiedad/' + p.id;
    });
    var extra = list.length > shown.length ? '\n\n…y ' + (list.length - shown.length) + ' más en mis favoritos de InmoMaps.' : '';
    return 'Estas son mis propiedades favoritas en InmoMaps:\n\n' + items.join('\n\n') + extra;
  }

  function render(params, root) {
    function refresh() {
      var list = state.favorites.list();
      var shareHref = list.length ? u.whatsappLink(null, buildShareText(list)) : '';
      root.innerHTML =
        '<div class="page-header"><h1 class="page-header__title">Favoritos (' + list.length + ')</h1></div>' +
        '<div class="page-wrap">' +
        (list.length
          ? '<a class="btn btn--whatsapp btn--block" href="' + shareHref + '" target="_blank" rel="noopener" style="margin-bottom:14px">' + u.icon('chat', { size: 16 }) + ' Compartir mis favoritos</a>' +
            '<div class="stack gap-2">' + list.map(function (p) { return c.propertyCardHTML(p, { variant: 'row' }); }).join('') + '</div>'
          : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('heart', { size: 32 }) + '</span><h3>Aún no tienes favoritos</h3><div class="empty-state__steps"><span><b>①</b> Toca el ♥ en una propiedad</span><span><b>②</b> Compártela por WhatsApp</span></div><a class="btn btn--primary" href="#/">Explorar propiedades</a></div>') +
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
