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

    root.innerHTML =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/servicios/' + cat.key + '" aria-label="Volver al directorio">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">' + u.escapeHtml(cat.label) + '</h1>' +
      '</div>' +
      '<div class="page-wrap">' +
      '  <div class="agent-hero">' +
      (provider.photo
        ? '    <img class="avatar agent-hero__photo" src="' + u.thumbUrl(provider.photo, 200, 200) + '" width="88" height="88" alt="" />'
        : '    <span class="provider-hero__icon" style="--cat-color:' + cat.color + ';--cat-bg:' + cat.bg + '">' + u.icon(cat.icon, { size: 30 }) + '</span>') +
      '    <div class="agent-hero__name">' + u.escapeHtml(provider.name) + '</div>' +
      '    <div class="agent-hero__title">' + u.escapeHtml(cat.label) + ' · ' + u.icon('pin', { size: 12 }) + ' ' + u.escapeHtml(locationLabel) + '</div>' +
      '    <div class="agent-hero__actions">' +
      (provider.whatsapp
        ? '<a class="btn btn--whatsapp" target="_blank" rel="noopener" href="' + u.whatsappLink(provider.whatsapp, 'Hola, vi tu ficha de ' + provider.name + ' en el directorio de InmoMaps.') + '">' + u.icon('chat', { size: 16 }) + ' WhatsApp</a>'
        : '') +
      (provider.phone
        ? '<a class="btn btn--call" href="tel:' + u.escapeHtml(provider.phone) + '">' + u.icon('phone', { size: 16 }) + ' Llamar</a>'
        : '') +
      '    </div>' +
      (provider.description ? '    <p class="text-secondary" style="margin-top:14px;white-space:pre-line">' + u.escapeHtml(provider.description) + '</p>' : '') +
      '  </div>' +
      '</div>';

    c.mountChrome('explore');
    document.title = provider.name + ' — ' + cat.label + ' — InmoMaps';
    u.setMeta({
      title: provider.name + ' — ' + cat.label + ' — InmoMaps',
      description: (provider.description ? provider.description.slice(0, 200) + ' ' : '') + cat.label + ' en ' + locationLabel + '. Contacto directo en el directorio de InmoMaps.',
      image: provider.photo ? u.thumbUrl(provider.photo, 800, 800) : undefined
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.serviceProviderDetail = { render: render };
})();
