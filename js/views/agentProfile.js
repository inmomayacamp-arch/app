// Vista "Perfil del asesor": página pública con su mapa de propiedades.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var data = window.App.data;

  var TABS = [
    { key: "todas", label: "Todas" },
    { key: "venta", label: "Venta" },
    { key: "renta", label: "Renta" },
    { key: "terreno", label: "Terrenos" }
  ];

  function render(params, root) {
    var agent = data.getAgent(params.agentSlug);
    if (!agent) {
      root.innerHTML = '<div class="empty-state"><h3>Asesor no encontrado</h3><a class="btn btn--primary" href="#/">Volver al mapa</a></div>';
      c.mountChrome('explore');
      return;
    }

    var allProps = state.properties.byAgent(agent.slug);
    var activeTab = "todas";
    var mapCtrl = null;
    var profileUrl = window.location.origin + window.location.pathname + '#/' + agent.slug;

    function filteredProps() {
      if (activeTab === 'todas') return allProps;
      if (activeTab === 'terreno') return allProps.filter(function (p) { return p.type === 'terreno'; });
      return allProps.filter(function (p) { return p.operation === activeTab; });
    }

    root.innerHTML =
      '<div class="page-header" style="border-bottom:none;background:transparent;position:static">' +
      '  <a class="btn btn--icon" href="#/" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '</div>' +
      '<div class="agent-hero">' +
      '  <img class="avatar agent-hero__photo" src="' + agent.photo + '" width="88" height="88" alt="" />' +
      '  <div class="agent-hero__name">' + u.escapeHtml(agent.name) + ' <span class="verified-dot">' + u.icon('check', { size: 16 }) + '</span></div>' +
      '  <div class="agent-hero__title">' + u.escapeHtml(agent.title) + '</div>' +
      '  <div class="agent-hero__rating">' + u.icon('starFilled', { size: 15 }) + ' ' + agent.rating + ' <span class="text-muted" style="font-weight:500">(' + agent.reviews + ' reseñas)</span></div>' +
      '  <div class="agent-hero__stats">' +
      '    <div class="agent-hero__stat"><strong>' + allProps.length + '</strong><span>Propiedades</span></div>' +
      '    <div class="agent-hero__stat"><strong>' + agent.clientsCount + '</strong><span>Clientes</span></div>' +
      '    <div class="agent-hero__stat"><strong>' + agent.yearsExperience + '</strong><span>Años</span></div>' +
      '  </div>' +
      '  <div class="agent-hero__actions">' +
      '    <a class="btn btn--whatsapp" data-track-agent="' + agent.id + '" target="_blank" rel="noopener" href="' + u.whatsappLink(agent.whatsapp, 'Hola ' + agent.name + ', vi tu perfil en InmoMap.') + '">' + u.icon('chat', { size: 16 }) + ' WhatsApp</a>' +
      '    <a class="btn btn--outline" data-track-agent="' + agent.id + '" href="tel:' + agent.phone + '">' + u.icon('phone', { size: 16 }) + ' Llamar</a>' +
      '  </div>' +
      '  <p class="agent-hero__bio">' + u.escapeHtml(agent.bio) + '</p>' +
      '  <div style="max-width:420px;margin:16px auto 0">' + c.shareBarHTML(profileUrl) + '</div>' +
      '</div>' +
      '<div class="tabs">' + TABS.map(function (t) {
        return '<button type="button" class="tab' + (t.key === activeTab ? ' is-active' : '') + '" data-tab="' + t.key + '">' + t.label + '</button>';
      }).join('') + '</div>' +
      '<div class="explore-layout" style="grid-template-areas:\'map\' \'list\'">' +
      '  <div class="explore-map"><div class="map-canvas" data-map></div></div>' +
      '  <div class="explore-list"><div class="explore-list__inner">' +
      '    <div class="property-grid property-grid--standalone" data-list></div>' +
      '  </div></div>' +
      '</div>';

    c.mountChrome('explore');
    document.title = agent.name + ' — Asesor inmobiliario en InmoMap';

    mapCtrl = window.App.map.create(u.qs('[data-map]', root), { compactPins: false });

    function refresh() {
      var list = filteredProps();
      u.qs('[data-list]', root).innerHTML = list.length
        ? list.map(function (p) { return c.propertyCardHTML(p, { variant: 'grid' }); }).join('')
        : '<div class="empty-state"><h3>Sin propiedades en esta categoría</h3></div>';
      if (mapCtrl.ready) {
        mapCtrl.setMarkers(list, function (p) { window.location.hash = '#/propiedad/' + p.id; });
        if (list.length) mapCtrl.fitToProperties(list);
      }
    }

    refresh();

    u.qsa('[data-tab]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeTab = btn.getAttribute('data-tab');
        u.qsa('[data-tab]', root).forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        refresh();
      });
    });

    c.bindCopyButtons(root);
  }

  window.App.views = window.App.views || {};
  window.App.views.agentProfile = { render: render };
})();
