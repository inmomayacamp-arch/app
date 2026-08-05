// Vista "Detalle de propiedad".
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  function render(params, root) {
    var property = state.properties.get(params.id);
    var fromRef = params.query && params.query.from; // "agentSlug/clientSlug" si se llegó desde un enlace de cliente
    var backHref = fromRef ? '#/' + fromRef : '#/';

    if (!property) {
      root.innerHTML = '<div class="empty-state"><h3>Propiedad no encontrada</h3><p>Es posible que ya no esté disponible.</p><a class="btn btn--primary" href="' + backHref + '">Volver</a></div>';
      if (fromRef) { document.body.classList.add('is-admin'); u.qs('#site-header').innerHTML = ''; u.qs('#bottom-nav').innerHTML = ''; }
      else c.mountChrome('explore');
      return;
    }

    var agent = window.App.data.getAgent(property.agentSlug);
    var isFav = state.favorites.has(property.id);
    var priceLabel = u.formatPrice(property.price) + (property.operation === 'renta' ? ' MXN/mes' : ' MXN');

    root.innerHTML =
      '<div class="detail-header' + (fromRef ? ' detail-header--exclusive' : '') + '">' +
      '  <a class="btn btn--icon" href="' + backHref + '" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      (fromRef ? '' :
      '  <div class="row gap-2">' +
      '    <button type="button" class="btn btn--icon" data-share aria-label="Compartir propiedad">' + u.icon('share', { size: 16 }) + '</button>' +
      '    <button type="button" class="btn btn--icon" data-fav-id="' + property.id + '" aria-pressed="' + isFav + '" aria-label="Guardar en favoritos">' + u.icon(isFav ? 'heartFilled' : 'heart', { size: 16 }) + '</button>' +
      '  </div>') +
      '</div>' +
      c.carouselHTML(property.photos) +
      '<div class="detail-body">' +
      '  <div class="detail-title-row">' +
      '    <div>' +
      '      <span class="badge badge--' + (property.type === 'terreno' ? 'terreno' : (property.type === 'local' || property.type === 'oficina' ? 'otro' : property.operation)) + '">' + u.operationLabel(property.operation) + '</span>' +
      '      <div class="detail-price">' + priceLabel + '</div>' +
      '      <div class="detail-title">' + u.escapeHtml(property.title) + '</div>' +
      '      <div class="detail-location">' + u.icon('pin', { size: 14 }) + ' ' + u.escapeHtml(property.neighborhood) + ', ' + u.escapeHtml(property.city) + (property.addressNote ? ' · ' + u.escapeHtml(property.addressNote) : '') + '</div>' +
      '    </div>' +
      '  </div>' +

      '  <div class="specs-grid">' +
      (property.bedrooms ? '<div class="specs-grid__item">' + u.icon('bed', { size: 18 }) + '<strong>' + property.bedrooms + '</strong><span>Recámaras</span></div>' : '') +
      (property.bathrooms ? '<div class="specs-grid__item">' + u.icon('bath', { size: 18 }) + '<strong>' + property.bathrooms + '</strong><span>Baños</span></div>' : '') +
      (property.builtArea ? '<div class="specs-grid__item">' + u.icon('ruler', { size: 18 }) + '<strong>' + property.builtArea + ' m²</strong><span>Construcción</span></div>' : '') +
      (property.lotArea ? '<div class="specs-grid__item">' + u.icon('ruler', { size: 18 }) + '<strong>' + property.lotArea + ' m²</strong><span>Terreno</span></div>' : '') +
      (property.parking ? '<div class="specs-grid__item">' + u.icon('car', { size: 18 }) + '<strong>' + property.parking + '</strong><span>Estacionamiento</span></div>' : '') +
      '  </div>' +

      '  <div class="detail-desc">' +
      '    <h2 class="section-title" style="margin-top:0">Descripción</h2>' +
      '    <p class="is-clamped" data-desc>' + u.escapeHtml(property.description) + '</p>' +
      '    <button type="button" data-toggle-desc>Ver más</button>' +
      (property.features && property.features.length ? '<div class="feature-tags">' + property.features.map(function (f) { return '<span class="feature-tag">' + u.escapeHtml(f) + '</span>'; }).join('') + '</div>' : '') +
      '  </div>' +

      '  <div class="contact-actions">' +
      '    <a class="btn btn--whatsapp btn--block" target="_blank" rel="noopener" href="' + u.whatsappLink(agent ? agent.whatsapp : '', 'Hola, me interesa la propiedad "' + property.title + '" que vi en InmoMap.') + '">' + u.icon('chat', { size: 16 }) + ' WhatsApp</a>' +
      '    <a class="btn btn--outline btn--block" href="tel:' + (agent ? agent.phone : '') + '">' + u.icon('phone', { size: 16 }) + ' Llamar</a>' +
      '  </div>' +

      (agent ? (
        '<h2 class="section-title" style="margin-top:0">Asesor</h2>' +
        '<a class="agent-card" href="#/' + agent.slug + '">' +
        '  <img class="avatar" src="' + agent.photo + '" width="52" height="52" alt="" />' +
        '  <div class="agent-card__info">' +
        '    <div class="agent-card__name">' + u.escapeHtml(agent.name) + ' <span class="verified-dot">' + u.icon('check', { size: 14 }) + '</span></div>' +
        '    <span class="text-secondary" style="font-size:0.82rem">' + u.escapeHtml(agent.title) + '</span>' +
        '    <div class="agent-card__rating">' + u.icon('starFilled', { size: 13, class: 'text-muted' }) + ' ' + agent.rating + ' (' + agent.reviews + ' reseñas)</div>' +
        '  </div>' +
        '  <span class="btn btn--outline btn--sm">Ver perfil</span>' +
        '</a>'
      ) : '') +
      '</div>';

    if (fromRef) {
      document.body.classList.add('is-admin');
      u.qs('#site-header').innerHTML = '';
      u.qs('#bottom-nav').innerHTML = '';
    } else {
      c.mountChrome('explore');
    }
    document.title = property.title + ' — InmoMap';

    c.initCarousel(root);

    var descEl = u.qs('[data-desc]', root);
    var toggleBtn = u.qs('[data-toggle-desc]', root);
    if (descEl.scrollHeight <= descEl.clientHeight + 4) {
      toggleBtn.style.display = 'none';
    }
    toggleBtn.addEventListener('click', function () {
      var collapsed = descEl.classList.toggle('is-clamped');
      toggleBtn.textContent = collapsed ? 'Ver más' : 'Ver menos';
    });

    var shareBtn = u.qs('[data-share]', root);
    if (shareBtn) shareBtn.addEventListener('click', function () {
      var url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: property.title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { u.toast('Enlace copiado'); });
      }
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.propertyDetail = { render: render };
})();
