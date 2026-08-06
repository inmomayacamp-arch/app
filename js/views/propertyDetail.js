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
    var priceLabel = c.propertyPriceLabel(property);
    var youtubeUrl = u.youtubeEmbedUrl(property.videoUrl);
    var fromLink = fromRef ? state.links.get(fromRef.split('/')[0], fromRef.split('/')[1]) : null;
    state.tracking.logPropertyView(property.id, fromLink ? fromLink.id : null);

    var whatsappHref = u.whatsappLink(agent ? agent.whatsapp : '', 'Hola, me interesa la propiedad "' + property.title + '" que vi en InmoMaps.');
    var trackAttrs = 'data-track-property="' + property.id + '"' + (fromLink ? ' data-track-link="' + fromLink.id + '"' : '');

    root.innerHTML =
      '<div class="detail-hero">' +
      '  <div class="detail-header' + (fromRef ? ' detail-header--exclusive' : '') + '">' +
      '    <a class="btn btn--icon" href="' + backHref + '" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      (fromRef ? '' : '    <div class="detail-header__brand">' + u.logoHTML({ tone: 'light' }) + '</div>') +
      (fromRef ? '' :
      '    <div class="row gap-2">' +
      '      <button type="button" class="btn btn--icon" data-share aria-label="Compartir propiedad">' + u.icon('share', { size: 16 }) + '</button>' +
      '      <button type="button" class="btn btn--icon" data-fav-id="' + property.id + '" aria-pressed="' + isFav + '" aria-label="Guardar en favoritos">' + u.icon(isFav ? 'heartFilled' : 'heart', { size: 16 }) + '</button>' +
      '    </div>') +
      '  </div>' +
      c.carouselHTML(property.photos) +
      '</div>' +
      '<div class="detail-float-contact" data-float-contact>' +
      '  <a class="detail-float-contact__btn detail-float-contact__btn--whatsapp" ' + trackAttrs + ' target="_blank" rel="noopener" href="' + whatsappHref + '" aria-label="Escribir por WhatsApp">' + u.icon('chat', { size: 20 }) + '</a>' +
      '  <a class="detail-float-contact__btn detail-float-contact__btn--call" ' + trackAttrs + ' href="tel:' + (agent ? agent.phone : '') + '" aria-label="Llamar">' + u.icon('phone', { size: 20 }) + '</a>' +
      '</div>' +
      '<div class="detail-body">' +
      '  <div class="detail-title-row">' +
      '    <div>' +
      '      <span class="badge badge--' + u.badgeClassFor(property.operation) + '">' + u.operationLabel(property.operation) + '</span>' +
      (property.tags && property.tags.length ? property.tags.map(function (v) {
        var t = u.SPECIAL_TAGS.filter(function (s) { return s.value === v; })[0];
        return t ? '<span class="badge badge--otro" style="margin-left:6px">' + u.escapeHtml(t.label) + '</span>' : '';
      }).join('') : '') +
      '      <div class="detail-price">' + priceLabel + '</div>' +
      '      <div class="detail-title">' + u.escapeHtml(property.title) + '</div>' +
      '      <div class="detail-location">' + u.icon('pin', { size: 14 }) + ' ' + u.escapeHtml(property.neighborhood) + ', ' + u.escapeHtml(property.city) + (property.addressNote ? ' · ' + u.escapeHtml(property.addressNote) : '') +
      (property.locationPrivacy === 'aproximada' ? ' <span class="text-muted" style="font-size:0.76rem">(ubicación aproximada)</span>' : '') +
      '      </div>' +
      '    </div>' +
      '  </div>' +

      '  <div class="specs-grid">' +
      (property.bedrooms ? '<div class="specs-grid__item">' + u.icon('bed', { size: 18 }) + '<strong>' + property.bedrooms + '</strong><span>Recámaras</span></div>' : '') +
      (property.bathrooms ? '<div class="specs-grid__item">' + u.icon('bath', { size: 18 }) + '<strong>' + property.bathrooms + '</strong><span>Baños</span></div>' : '') +
      (property.halfBathrooms ? '<div class="specs-grid__item">' + u.icon('bath', { size: 18 }) + '<strong>' + property.halfBathrooms + '</strong><span>Medios baños</span></div>' : '') +
      (property.parking ? '<div class="specs-grid__item">' + u.icon('car', { size: 18 }) + '<strong>' + property.parking + '</strong><span>Estacionamiento</span></div>' : '') +
      (property.builtArea ? '<div class="specs-grid__item">' + u.icon('ruler', { size: 18 }) + '<strong>' + property.builtArea + ' m²</strong><span>Construcción</span></div>' : '') +
      (property.lotArea ? '<div class="specs-grid__item">' + u.icon('ruler', { size: 18 }) + '<strong>' + property.lotArea + ' m²</strong><span>Terreno</span></div>' : '') +
      (property.levels ? '<div class="specs-grid__item">' + u.icon('layers', { size: 18 }) + '<strong>' + property.levels + '</strong><span>Niveles</span></div>' : '') +
      (property.age != null && property.age !== '' ? '<div class="specs-grid__item">' + u.icon('clock', { size: 18 }) + '<strong>' + property.age + '</strong><span>Años de antigüedad</span></div>' : '') +
      (property.frontage ? '<div class="specs-grid__item">' + u.icon('ruler', { size: 18 }) + '<strong>' + property.frontage + ' m</strong><span>Frente</span></div>' : '') +
      (property.depth ? '<div class="specs-grid__item">' + u.icon('ruler', { size: 18 }) + '<strong>' + property.depth + ' m</strong><span>Fondo</span></div>' : '') +
      (property.hasLivingRoom ? '<div class="specs-grid__item">' + u.icon('home', { size: 18 }) + '<strong>Sí</strong><span>Sala</span></div>' : '') +
      (property.hasLibrary ? '<div class="specs-grid__item">' + u.icon('briefcase', { size: 18 }) + '<strong>Sí</strong><span>Biblioteca</span></div>' : '') +
      '  </div>' +

      (property.creditsAccepted && property.creditsAccepted.length ? (
        '  <div class="detail-desc">' +
        '    <h2 class="section-title" style="margin-top:0">Créditos aceptados</h2>' +
        '    <div class="feature-tags">' + property.creditsAccepted.map(function (v) {
          var cr = u.CREDIT_TYPES.filter(function (x) { return x.value === v; })[0];
          return '<span class="feature-tag feature-tag--credit">' + u.icon('dollar', { size: 12 }) + ' ' + u.escapeHtml(cr ? cr.label : v) + '</span>';
        }).join('') + '</div>' +
        '  </div>'
      ) : '') +

      '  <div class="detail-desc">' +
      '    <h2 class="section-title" style="margin-top:0">Descripción</h2>' +
      '    <p class="is-clamped" data-desc>' + u.escapeHtml(property.description) + '</p>' +
      '    <button type="button" data-toggle-desc>Ver más</button>' +
      (property.features && property.features.length ? '<div class="feature-tags">' + property.features.map(function (f) { return '<span class="feature-tag">' + u.escapeHtml(f) + '</span>'; }).join('') + '</div>' : '') +
      '  </div>' +

      (youtubeUrl ? (
        '  <div class="detail-desc">' +
        '    <h2 class="section-title" style="margin-top:0">Video</h2>' +
        '    <div class="embed-frame"><iframe src="' + youtubeUrl + '" title="Video de la propiedad" allowfullscreen loading="lazy"></iframe></div>' +
        '  </div>'
      ) : '') +

      (property.virtualTourUrl ? (
        '  <div class="detail-desc">' +
        '    <h2 class="section-title" style="margin-top:0">Recorrido virtual</h2>' +
        '    <div class="embed-frame"><iframe src="' + u.escapeHtml(property.virtualTourUrl) + '" title="Recorrido virtual" allowfullscreen loading="lazy"></iframe></div>' +
        '  </div>'
      ) : '') +

      '  <div class="detail-desc" data-poi-section style="display:none">' +
      '    <h2 class="section-title" style="margin-top:0">Puntos de interés cercanos</h2>' +
      '    <div data-poi-list class="poi-grid"></div>' +
      '  </div>' +

      (property.coords ? (
        '  <div class="detail-desc">' +
        '    <h2 class="section-title" style="margin-top:0">Ubicación</h2>' +
        (property.locationPrivacy === 'aproximada' ? '    <p class="text-muted" style="font-size:0.82rem;margin:-6px 0 10px">La ubicación exacta se comparte al contactar al asesor.</p>' : '') +
        '    <div class="detail-map"><div class="map-canvas" data-detail-map></div></div>' +
        '    <a class="btn btn--outline btn--block" style="margin-top:10px" data-directions ' + trackAttrs + ' target="_blank" rel="noopener" href="' + u.directionsLink(property.coords) + '">' + u.icon('navigation', { size: 16 }) + ' Cómo llegar</a>' +
        '  </div>'
      ) : '') +

      '  <div class="contact-actions" data-contact-actions>' +
      '    <a class="btn btn--whatsapp btn--block" ' + trackAttrs + ' target="_blank" rel="noopener" href="' + whatsappHref + '">' + u.icon('chat', { size: 16 }) + ' WhatsApp</a>' +
      '    <a class="btn btn--call btn--block" ' + trackAttrs + ' href="tel:' + (agent ? agent.phone : '') + '">' + u.icon('phone', { size: 16 }) + ' Llamar</a>' +
      '  </div>' +
      '  <button type="button" class="btn btn--outline btn--block" data-download-pdf>' + u.icon('download', { size: 16 }) + ' Descargar ficha en PDF</button>' +

      (agent ? (
        '<h2 class="section-title" style="margin-top:0">Asesor</h2>' +
        '<a class="agent-card" href="#/' + agent.slug + '">' +
        '  <img class="avatar" src="' + agent.photo + '" width="52" height="52" alt="" />' +
        '  <div class="agent-card__info">' +
        '    <div class="agent-card__name">' + u.escapeHtml(agent.name) + ' <span class="verified-dot">' + u.icon('check', { size: 14 }) + '</span></div>' +
        '    <span class="text-secondary" style="font-size:0.82rem">' + u.escapeHtml(agent.title) + '</span>' +
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
    document.title = property.title + ' — InmoMaps';

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

    var pdfBtn = u.qs('[data-download-pdf]', root);
    pdfBtn.addEventListener('click', async function () {
      pdfBtn.disabled = true;
      try { await window.App.pdfFicha.generate(property, agent); }
      catch (err) { u.toast('No se pudo generar el PDF'); }
      finally { pdfBtn.disabled = false; }
    });

    if (property.coords && window.App.poi) {
      window.App.poi.fetchNearby(property.coords).then(function (categories) {
        if (!categories.length) return;
        var section = u.qs('[data-poi-section]', root);
        if (!section) return;
        section.style.display = 'block';
        u.qs('[data-poi-list]', root).innerHTML = categories.map(function (cat) {
          return '<div class="poi-item">' +
            '<span class="poi-item__icon">' + u.icon(cat.icon, { size: 16 }) + '</span>' +
            '<div><strong>' + u.escapeHtml(cat.label) + '</strong><span>' + u.escapeHtml(cat.items.join(', ')) + '</span></div>' +
            '</div>';
        }).join('');
      });
    }

    if (property.coords) {
      var detailMapEl = u.qs('[data-detail-map]', root);
      if (detailMapEl) {
        var detailMapCtrl = window.App.map.create(detailMapEl, { center: property.coords, zoom: 15 });
        if (detailMapCtrl.ready) detailMapCtrl.setMarkers([property], null);
      }
    }

    // Los botones flotantes de contacto se ocultan cuando los botones "de verdad"
    // (más abajo en la ficha) ya están a la vista, para no duplicar la misma acción.
    var floatContact = u.qs('[data-float-contact]', root);
    var contactActions = u.qs('[data-contact-actions]', root);
    if (floatContact && contactActions && window.IntersectionObserver) {
      var observer = new IntersectionObserver(function (entries) {
        floatContact.classList.toggle('is-hidden', entries[0].isIntersecting);
      }, { rootMargin: '0px 0px -10% 0px' });
      observer.observe(contactActions);
      window.App.router.onLeave(function () { observer.disconnect(); });
    }
  }

  window.App.views = window.App.views || {};
  window.App.views.propertyDetail = { render: render };
})();
