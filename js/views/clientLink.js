// Vista "Enlace personalizado": página exclusiva para el cliente, sin la barra
// de navegación estándar. Solo el logo (que lleva al mapa principal), el mapa
// con las propiedades elegidas, un carrusel de esas propiedades y, al final,
// el perfil del asesor que preparó la selección.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var data = window.App.data;

  function minimalChrome() {
    document.body.classList.add('is-admin');
    u.qs('#bottom-nav').innerHTML = '';
    u.qs('#site-header').innerHTML = '';
  }

  function headerHTML() {
    return (
      '<header class="client-exclusive__header">' +
      '  <a class="client-exclusive__logo" href="#/">' + u.logoHTML() + '</a>' +
      '</header>'
    );
  }

  function render(params, root) {
    var agent = data.getAgent(params.agentSlug);
    var link = agent ? state.links.get(params.agentSlug, params.clientSlug) : null;

    if (!agent || !link) {
      root.innerHTML =
        headerHTML() +
        '<div class="empty-state" style="padding-top:64px"><h3>Este enlace no existe o ya no está disponible</h3><p>Pídele a tu asesor que te comparta un nuevo enlace.</p><a class="btn btn--primary" href="#/">Ir a InmoMaps</a></div>';
      minimalChrome();
      return;
    }

    var properties = link.propertyIds.map(function (id) { return state.properties.get(id); }).filter(Boolean);
    var mapCtrl = null;
    state.tracking.logLinkVisit(link.id);

    root.innerHTML =
      headerHTML() +
      '<div class="explore-layout" style="grid-template-areas:\'map\' \'list\' \'agent\'">' +
      '  <div class="explore-map"><div class="map-canvas" data-map></div></div>' +

      '  <div class="explore-list"><div class="explore-list__inner">' +
      '    <h2 class="section-title" style="margin-top:4px">Selección para ' + u.escapeHtml(link.clientLabel) + ' (' + properties.length + ')</h2>' +
      '    <div class="property-scroller" data-list></div>' +
      '  </div></div>' +

      '  <div class="explore-agent">' +
      '    <div class="agent-hero" style="border-bottom:none">' +
      '      <p class="client-exclusive__note">' + u.icon('user', { size: 15 }) + ' <strong>' + u.escapeHtml(agent.name) + '</strong> preparó esta selección para ti' + (link.message ? ':' : '') + '</p>' +
      (link.message ? '      <p class="client-exclusive__message">“' + u.escapeHtml(link.message) + '”</p>' : '') +
      '      <img class="avatar agent-hero__photo" style="margin-top:18px" src="' + agent.photo + '" width="76" height="76" alt="" />' +
      '      <div class="agent-hero__name">' + u.escapeHtml(agent.name) + ' <span class="verified-dot">' + u.icon('check', { size: 15 }) + '</span></div>' +
      '      <div class="agent-hero__title">' + u.escapeHtml(agent.title) + '</div>' +
      '      <div class="agent-hero__actions">' +
      '        <a class="btn btn--whatsapp" data-track-link="' + link.id + '" target="_blank" rel="noopener" href="' + u.whatsappLink(agent.whatsapp, 'Hola ' + agent.name + ', vi la selección de propiedades que preparaste para mí en InmoMaps.') + '">' + u.icon('chat', { size: 16 }) + ' Escribir por WhatsApp</a>' +
      '        <a class="btn btn--call" data-track-link="' + link.id + '" href="tel:' + agent.phone + '">' + u.icon('phone', { size: 16 }) + ' Llamar</a>' +
      '      </div>' +
      '      <a class="text-muted" style="display:inline-block;margin-top:16px;font-weight:700;font-size:0.82rem" href="#/' + agent.slug + '">Ver perfil completo y todas sus propiedades</a>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    minimalChrome();
    document.title = 'Selección de ' + agent.name + ' para ' + link.clientLabel + ' — InmoMaps';

    var backRef = '?from=' + encodeURIComponent(agent.slug + '/' + link.clientSlug);

    u.qs('[data-list]', root).innerHTML = properties.length
      ? properties.map(function (p) { return c.propertyCardHTML(p, { variant: 'grid', linkId: link.id }); }).join('')
      : '<div class="empty-state"><h3>Esta selección aún no tiene propiedades</h3></div>';
    u.qsa('.property-card[data-property-id]', root).forEach(function (card) {
      card.setAttribute('href', card.getAttribute('href') + backRef);
    });

    mapCtrl = window.App.map.create(u.qs('[data-map]', root), {});
    if (mapCtrl.ready && properties.length) {
      mapCtrl.setMarkers(properties, function (p) { window.location.hash = '#/propiedad/' + p.id + backRef; });
      mapCtrl.fitToProperties(properties);
    }
  }

  window.App.views = window.App.views || {};
  window.App.views.clientLink = { render: render };
})();
