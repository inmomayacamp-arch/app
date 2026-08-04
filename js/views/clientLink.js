// Vista "Enlace personalizado": solo muestra las propiedades que el asesor
// seleccionó para un cliente en particular.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var data = window.App.data;

  function render(params, root) {
    var agent = data.getAgent(params.agentSlug);
    var link = agent ? state.links.get(params.agentSlug, params.clientSlug) : null;

    if (!agent || !link) {
      root.innerHTML = '<div class="empty-state"><h3>Este enlace no existe o ya no está disponible</h3><p>Pídele a tu asesor que te comparta un nuevo enlace.</p><a class="btn btn--primary" href="#/">Ir a InmoMap</a></div>';
      c.mountChrome('explore');
      return;
    }

    var properties = link.propertyIds.map(function (id) { return state.properties.get(id); }).filter(Boolean);
    var mapCtrl = null;

    root.innerHTML =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/' + agent.slug + '" aria-label="Ver perfil del asesor">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Selección para ' + u.escapeHtml(link.clientLabel) + '</h1>' +
      '</div>' +
      '<div class="client-banner">' +
      '  <span class="client-banner__icon">' + u.icon('user', { size: 22 }) + '</span>' +
      '  <div><strong>' + u.escapeHtml(agent.name) + ' preparó esta selección para ti</strong><span>' + properties.length + ' propiedades elegidas especialmente para ' + u.escapeHtml(link.clientLabel) + '</span></div>' +
      '</div>' +
      '<div class="explore-layout" style="grid-template-areas:\'map\' \'list\'">' +
      '  <div class="explore-map" style="height:46vh"><div class="map-canvas" data-map></div></div>' +
      '  <div class="explore-list"><div class="explore-list__inner">' +
      '    <div class="property-grid property-grid--standalone" data-list></div>' +
      '  </div></div>' +
      '</div>' +
      '<div class="page-wrap" style="padding-top:0">' +
      '  <a class="agent-card" href="#/' + agent.slug + '">' +
      '    <img class="avatar" src="' + agent.photo + '" width="52" height="52" alt="" />' +
      '    <div class="agent-card__info">' +
      '      <div class="agent-card__name">' + u.escapeHtml(agent.name) + '</div>' +
      '      <span class="text-secondary" style="font-size:0.82rem">' + u.escapeHtml(agent.title) + ' · Ver todas sus propiedades</span>' +
      '    </div>' +
      '  </a>' +
      '</div>';

    c.mountChrome('explore');
    document.title = 'Selección de ' + agent.name + ' para ' + link.clientLabel + ' — InmoMap';

    u.qs('[data-list]', root).innerHTML = properties.length
      ? properties.map(function (p) { return c.propertyCardHTML(p, { variant: 'grid' }); }).join('')
      : '<div class="empty-state"><h3>Esta selección aún no tiene propiedades</h3></div>';

    mapCtrl = window.App.map.create(u.qs('[data-map]', root), {});
    if (mapCtrl.ready && properties.length) {
      mapCtrl.setMarkers(properties, function (p) { window.location.hash = '#/propiedad/' + p.id; });
      mapCtrl.fitToProperties(properties);
    }
  }

  window.App.views = window.App.views || {};
  window.App.views.clientLink = { render: render };
})();
