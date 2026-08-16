// Ficha pública de un proveedor del directorio (notario, valuadores, arquitectos, etc.).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  function render(params, root) {
    var cat = u.SERVICE_CATEGORIES.filter(function (c2) { return c2.key === params.category; })[0];
    var provider = state.providers.get(params.id);

    if (!cat || !provider || provider.category !== cat.key) {
      root.innerHTML = '<div class="empty-state" style="padding-top:80px"><h3>No encontramos esta ficha</h3><p>Puede que ya no esté disponible.</p><a class="btn btn--primary" href="#/servicios/' + (params.category || '') + '">Volver al directorio</a></div>';
      c.mountChrome('explore');
      return;
    }

    var locationLabel = provider.city || provider.state || 'Todo México';
    var gallery = provider.photos && provider.photos.length ? provider.photos : (provider.photo ? [provider.photo] : []);
    var cover = gallery[0];

    root.innerHTML =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/servicios/' + cat.key + '" aria-label="Volver al directorio">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">' + u.escapeHtml(cat.label) + '</h1>' +
      '</div>' +
      (gallery.length > 1 ? '<div class="page-wrap" style="padding-bottom:0">' + c.carouselHTML(gallery, { label: provider.name }) + '</div>' : '') +
      '<div class="page-wrap">' +
      '  <div class="agent-hero">' +
      (cover
        ? '    <img class="avatar agent-hero__photo" src="' + u.thumbUrl(cover, 200, 200) + '" width="88" height="88" alt="" />'
        : '    <span class="provider-hero__icon" style="--cat-color:' + cat.color + ';--cat-bg:' + cat.bg + '">' + u.icon(cat.icon, { size: 30 }) + '</span>') +
      '    <div class="agent-hero__name">' + u.escapeHtml(provider.name) + '</div>' +
      '    <div class="agent-hero__title">' + u.escapeHtml(cat.label) + ' · ' + u.icon('pin', { size: 12 }) + ' ' + u.escapeHtml(locationLabel) + '</div>' +
      '    <div class="agent-hero__actions">' +
      (provider.whatsapp
        ? '<a class="btn btn--whatsapp" target="_blank" rel="noopener" href="' + u.whatsappLink(provider.whatsapp, '¡Hola! 👋 Vi la ficha de ' + provider.name + ' en el directorio de InmoMaps, me interesa su servicio.') + '">' + u.icon('chat', { size: 16 }) + ' WhatsApp</a>'
        : '') +
      (provider.phone
        ? '<a class="btn btn--call" href="tel:' + u.escapeHtml(provider.phone) + '">' + u.icon('phone', { size: 16 }) + ' Llamar</a>'
        : '') +
      (provider.coords
        ? '<a class="btn btn--outline" target="_blank" rel="noopener" href="' + u.directionsLink(provider.coords) + '">' + u.icon('pin', { size: 16 }) + ' Cómo llegar</a>'
        : '') +
      '    </div>' +
      (provider.description ? '    <p class="text-secondary" style="margin-top:14px;white-space:pre-line">' + u.escapeHtml(provider.description) + '</p>' : '') +
      '  </div>' +
      '</div>';

    if (gallery.length > 1) c.initCarousel(root);

    c.mountChrome('explore');
    document.title = provider.name + ' — ' + cat.label + ' — InmoMaps';
    u.setMeta({
      title: provider.name + ' — ' + cat.label + ' — InmoMaps',
      description: (provider.description ? provider.description.slice(0, 200) + ' ' : '') + cat.label + ' en ' + locationLabel + '. Contacto directo en el directorio de InmoMaps.',
      image: cover ? u.thumbUrl(cover, 800, 800) : undefined
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.serviceProviderDetail = { render: render };
})();
