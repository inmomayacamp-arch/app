// Vista "Perfil del asesor": página pública con su mapa de propiedades.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var data = window.App.data;

  function render(params, root) {
    var agent = data.getAgent(params.agentSlug);
    if (!agent) {
      root.innerHTML = '<div class="empty-state"><h3>Asesor no encontrado</h3><a class="btn btn--primary" href="#/">Volver al mapa</a></div>';
      c.mountChrome('explore');
      return;
    }

    var allProps = state.properties.byAgent(agent.slug);
    var filters = u.defaultFilters();
    var mapCtrl = null;
    var profileUrl = window.location.origin + window.location.pathname + '#/' + agent.slug;
    var social = agent.social || {};
    var subtitle = u.agentTitleLabel(agent);
    var metaLine = [
      agent.city ? { icon: 'pin', text: agent.city } : null,
      agent.schedule ? { icon: 'clock', text: agent.schedule } : null
    ].filter(Boolean);
    var SOCIAL_LINKS = [
      { key: "facebook", icon: "facebook", label: "Facebook" },
      { key: "instagram", icon: "instagram", label: "Instagram" },
      { key: "tiktok", icon: "tiktok", label: "TikTok" },
      { key: "website", icon: "globe", label: "Sitio web" }
    ].filter(function (s) { return social[s.key]; });

    root.innerHTML =
      '<div class="explore-layout" style="grid-template-areas:\'map\' \'list\'">' +
      '  <div class="explore-map">' +
      '    <div class="map-canvas" data-map></div>' +
      '    <div class="map-top-overlay">' +
      '      <div class="row gap-2">' +
      '        <a class="btn btn--icon" href="#/" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '        <div class="map-brand-badge">' + u.logoHTML() + '</div>' +
      '      </div>' +
      '      <div class="map-chip-overlay">' +
      '        <div class="chip-row" data-quick-ops style="flex:1;min-width:0">' +
      c.quickFilterChipsHTML(filters.operation) +
      '        </div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="explore-list"><div class="explore-list__inner">' +
      '    <div class="property-grid property-grid--standalone" data-list></div>' +
      '  </div></div>' +
      '</div>' +
      '<div class="agent-hero">' +
      '  <img class="avatar agent-hero__photo" src="' + agent.photo + '" width="88" height="88" alt="" />' +
      '  <div class="agent-hero__name">' + u.escapeHtml(agent.name) + ' <span class="verified-dot">' + u.icon('check', { size: 16 }) + '</span></div>' +
      '  <div class="agent-hero__title">' + u.escapeHtml(subtitle) + '</div>' +
      (metaLine.length ? '<div class="row gap-3" style="justify-content:center;flex-wrap:wrap;margin-top:6px">' + metaLine.map(function (m) {
        return '<span class="detail-location" style="margin-top:0">' + u.icon(m.icon, { size: 14 }) + ' ' + u.escapeHtml(m.text) + '</span>';
      }).join('') + '</div>' : '') +
      '  <div class="agent-hero__actions">' +
      '    <a class="btn btn--whatsapp" data-track-agent="' + agent.id + '" target="_blank" rel="noopener" href="' + u.whatsappLink(agent.whatsapp, 'Hola ' + agent.name + ', encontré tu perfil en InmoMaps y quiero saber más de tus propiedades.') + '">' + u.icon('chat', { size: 16 }) + ' WhatsApp</a>' +
      '    <a class="btn btn--call" data-track-agent="' + agent.id + '" href="tel:' + u.escapeHtml(agent.phone) + '">' + u.icon('phone', { size: 16 }) + ' Llamar</a>' +
      '  </div>' +
      (SOCIAL_LINKS.length ? '<div class="agent-hero__social">' + SOCIAL_LINKS.map(function (s) {
        return '<a class="agent-hero__social-link" target="_blank" rel="noopener" href="' + u.escapeHtml(social[s.key]) + '" aria-label="' + s.label + '">' + u.icon(s.icon, { size: 17 }) + '</a>';
      }).join('') + '</div>' : '') +
      '  <p class="agent-hero__bio">' + u.escapeHtml(agent.bio) + '</p>' +
      '  <div style="max-width:420px;margin:16px auto 0">' + c.shareBarHTML(profileUrl) + '</div>' +
      '</div>';

    c.mountChrome('explore');
    document.title = agent.name + ' — ' + subtitle + ' en InmoMaps';
    var seoDescription = (agent.bio ? agent.bio + ' ' : '') + subtitle + (agent.city ? ' en ' + agent.city : '') +
      ' · ' + allProps.length + ' propiedad' + (allProps.length === 1 ? '' : 'es') + ' publicada' + (allProps.length === 1 ? '' : 's') + ' en InmoMaps.';
    u.setMeta({
      title: agent.name + ' — ' + subtitle + ' en InmoMaps',
      description: seoDescription.slice(0, 300),
      image: agent.photo || undefined,
      url: profileUrl,
      type: 'profile'
    });

    mapCtrl = window.App.map.create(u.qs('[data-map]', root), { compactPins: false });
    window.App.router.onLeave(function () { mapCtrl.destroy(); });

    function refresh() {
      var list = u.applyFilters(allProps, filters);
      u.qs('[data-list]', root).innerHTML = list.length
        ? list.map(function (p) { return c.propertyCardHTML(p, { variant: 'grid' }); }).join('')
        : '<div class="empty-state"><h3>Sin propiedades en esta categoría</h3></div>';
      if (mapCtrl.ready) {
        mapCtrl.setMarkers(list, function (p) { window.location.hash = '#/propiedad/' + p.id; });
        if (list.length) mapCtrl.fitToProperties(list);
      }
    }

    refresh();

    c.bindQuickFilterChips(root, filters, refresh);
    c.bindCopyButtons(root);
  }

  window.App.views = window.App.views || {};
  window.App.views.agentProfile = { render: render };
})();
