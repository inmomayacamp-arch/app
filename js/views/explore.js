// Vista "Explorar": mapa a pantalla completa como eje central de la navegación.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var data = window.App.data;

  // Radio máximo (km) para asumir que la geolocalización "está" en una ciudad
  // del catálogo nacional. Más amplio que antes porque ahora la cobertura es
  // todo México, no solo 3 ciudades cercanas entre sí.
  var AUTO_LOCATION_RADIUS_KM = 120;

  function render(params, root) {
    var filters = u.defaultFilters();
    var savedLocation = state.location.get();
    filters.stateKey = savedLocation.stateKey;
    filters.cityKey = savedLocation.cityKey;
    var mapCtrl = null;
    var mexicoStates = window.APP_CONFIG.MEXICO_STATES;

    // Resuelve un {stateKey, cityKey} al centro/zoom donde mover el mapa y a
    // la etiqueta que se muestra en el botón de ubicación.
    function resolveLocation(stateKey, cityKey) {
      var st = stateKey && mexicoStates[stateKey];
      if (!st) return null;
      var city = cityKey && st.cities[cityKey];
      if (city) return { center: city.center, zoom: city.zoom, label: city.label };
      return { center: st.center, zoom: st.zoom, label: st.label };
    }

    function locationLabel() {
      var loc = resolveLocation(filters.stateKey, filters.cityKey);
      return loc ? loc.label : 'Ubicación';
    }

    function visibleProperties() {
      var base = state.properties.publicList();
      var filtered = u.applyFilters(base, filters);
      if (filters.searchText && filters.searchText.trim()) {
        var q = filters.searchText.trim().toLowerCase();
        filtered = filtered.filter(function (p) {
          return (p.title + ' ' + p.neighborhood + ' ' + p.city).toLowerCase().indexOf(q) !== -1;
        });
      }
      return filtered;
    }

    // "Publicar" ocupa el primer lugar (antes era Notario) para que
    // resalte; Notario pasa al último lugar, donde estaba Publicar.
    var orderedCategories = u.SERVICE_CATEGORIES.filter(function (cat) { return cat.key !== 'notario'; })
      .concat(u.SERVICE_CATEGORIES.filter(function (cat) { return cat.key === 'notario'; }));

    root.innerHTML =
      '<h1 class="visually-hidden">Explorar propiedades en el mapa</h1>' +
      '<div class="explore-layout">' +
      '  <div class="explore-map">' +
      '    <div class="map-canvas" data-map></div>' +
      '    <div class="map-top-overlay">' +
      '      <div class="map-chip-overlay">' +
      '        <div class="map-brand-badge">' + u.logoHTML() + '</div>' +
      '        <div class="chip-row" data-quick-ops style="flex:1;min-width:0">' +
      c.quickFilterChipsHTML(filters.operation) +
      '        </div>' +
      '        <button type="button" class="btn btn--icon" data-open-filters aria-label="Buscar y filtrar">' + u.icon('sliders', { size: 18 }) + '</button>' +
      '      </div>' +
      '    </div>' +
      '    <div class="map-bottom-overlay">' +
      '      <div class="row gap-2">' +
      (navigator.geolocation ? '        <button type="button" class="map-locate-btn" data-locate-me aria-label="Usar mi ubicación actual">' + u.icon('locate', { size: 15 }) + '</button>' : '') +
      '        <button type="button" class="city-chip" data-open-location aria-label="Ubicación">' + u.icon('pin', { size: 13 }) + ' <span data-location-label>' + u.escapeHtml(locationLabel()) + '</span></button>' +
      '      </div>' +
      '      <div class="map-legend">' +
      '        <span class="map-legend__item"><span class="map-legend__dot" style="background:var(--color-primary)"></span>Venta</span>' +
      '        <span class="map-legend__item"><span class="map-legend__dot" style="background:var(--color-renta)"></span>Renta</span>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="explore-list">' +
      '    <div class="explore-list__inner">' +
      '      <div class="row" style="justify-content:space-between;align-items:center;margin-top:4px">' +
      '        <h2 class="section-title" style="margin:0">Propiedades destacadas (<span data-count>0</span>)</h2>' +
      '        <a href="#/propiedades" class="text-muted" style="font-weight:700;font-size:0.85rem">Ver todas</a>' +
      '      </div>' +
      '      <div class="property-scroller" data-list></div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="explore-discover">' +
      '    <div class="container">' +
      '      <h2 class="section-title" style="margin-top:20px">Explorar por categoría</h2>' +
      '      <button type="button" class="promo-card promo-card--action" data-all-properties>' +
      '        <span class="promo-card__icon">' + u.icon('home', { size: 28 }) + '</span>' +
      '        <div class="promo-card__body"><strong>Ver todas las casas</strong><p style="margin-bottom:0">Explora el catálogo completo de propiedades disponibles</p></div>' +
      u.icon('chevronRight', { size: 18 }) +
      '      </button>' +
      '      <div class="category-grid" data-categories>' +
      '        <a href="#/perfil" class="category-card category-card--cta" style="--cat-color:var(--color-venta);--cat-bg:var(--color-venta-bg)">' +
      '          <span class="category-card__icon">' + u.icon('plus', { size: 22 }) + '</span><strong>Publicar</strong>' +
      '        </a>' +
      orderedCategories.map(function (cat) {
        return '<button type="button" class="category-card" data-service="' + cat.key + '" style="--cat-color:' + cat.color + ';--cat-bg:' + cat.bg + '">' +
          '<span class="category-card__icon">' + u.icon(cat.icon, { size: 22 }) + '</span><strong>' + cat.label + '</strong></button>';
      }).join('') +
      '      </div>' +

      '      <div class="provider-marquee">' +
      '        <h2 class="provider-marquee__title">Directorio de InmoMaps</h2>' +
      '        <div class="provider-marquee__viewport"><div class="provider-marquee__track" data-provider-marquee></div></div>' +
      '      </div>' +

      '      <div class="promo-card" style="margin-top:20px">' +
      '        <span class="promo-card__icon">' + u.icon('search', { size: 28 }) + '</span>' +
      '        <div class="promo-card__body">' +
      '          <strong>¿No encontraste la propiedad que buscabas?</strong>' +
      '          <p>Cuéntanos qué necesitas y te avisamos en cuanto se publique algo parecido.</p>' +
      '          <a class="btn btn--primary btn--sm" href="#/solicitud">' + u.icon('chat', { size: 14 }) + ' Dejar mi solicitud</a>' +
      '        </div>' +
      '      </div>' +

      '      <p class="explore-discover__support">' + u.icon('flag', { size: 13 }) + ' ¿Necesitas ayuda o quieres reportar un problema? <a href="#/soporte">Contactar al administrador</a></p>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    c.mountChrome('explore');
    document.title = 'InmoMaps — Explorar propiedades en el mapa';

    var initialLocation = resolveLocation(filters.stateKey, filters.cityKey);
    mapCtrl = window.App.map.create(u.qs('[data-map]', root), Object.assign({ showLocate: true }, initialLocation ? { center: initialLocation.center, zoom: initialLocation.zoom } : {}));
    window.App.router.onLeave(function () { mapCtrl.destroy(); });

    function onSelectProperty(property) {
      window.location.hash = '#/propiedad/' + property.id;
    }

    function onSelectProvider(provider) {
      window.location.hash = '#/servicios/' + provider.category + '/' + provider.id;
    }

    // Carrusel automático del directorio (entre las categorías y "no
    // encontraste la propiedad"): fichas chicas, filtradas por la misma
    // ciudad/estado que ya está activo para las propiedades, con "Anúnciate
    // aquí" siempre primero. Se duplica la lista para que el loop de CSS
    // (translateX -50%) no se note el corte.
    var ctaFichaHTML = '<a class="provider-ficha provider-ficha--cta" href="#/planes-proveedor">' + u.icon('chat', { size: 20 }) + '<strong>Anúnciate<br>aquí</strong></a>';

    function providerFichaHTML(p) {
      var cat = u.SERVICE_CATEGORIES.filter(function (c2) { return c2.key === p.category; })[0] || u.SERVICE_CATEGORIES[0];
      var cover = p.photos && p.photos.length ? p.photos[0] : p.photo;
      return (
        '<a class="provider-ficha" href="#/servicios/' + cat.key + '/' + p.id + '">' +
        '<div class="provider-ficha__media" style="--cat-color:' + cat.color + ';--cat-bg:' + cat.bg + '">' +
        (cover ? '<img src="' + u.thumbUrl(cover, 200, 150) + '" alt="" loading="lazy" />' : u.icon(cat.icon, { size: 22 })) +
        '</div>' +
        '<div class="provider-ficha__body">' +
        '<div class="provider-ficha__name">' + u.escapeHtml(p.name) + '</div>' +
        '<div class="provider-ficha__loc">' + u.icon('pin', { size: 10 }) + ' ' + u.escapeHtml(p.city || p.state || 'México') + '</div>' +
        '</div></a>'
      );
    }

    function refreshProviderMarquee() {
      var st = filters.stateKey && mexicoStates[filters.stateKey];
      var stateLabel = st ? st.label : null;
      var cityLabel = (st && filters.cityKey && st.cities[filters.cityKey]) ? st.cities[filters.cityKey].label : null;
      var list = state.providers.publicList(null, stateLabel, cityLabel).slice(0, 12);
      var cards = [ctaFichaHTML].concat(list.map(providerFichaHTML)).join('');
      var track = u.qs('[data-provider-marquee]', root);
      if (track) track.innerHTML = cards + cards;
    }

    // El directorio no depende de los filtros de propiedades (operación, tipo,
    // precio), así que sus pines se ponen una sola vez, no en cada refreshList().
    if (mapCtrl.ready) mapCtrl.setProviderMarkers(state.providers.publicList(), onSelectProvider);

    function refreshList() {
      // El mapa siempre muestra todas las propiedades disponibles que cumplen los filtros:
      // el mapa es el elemento visual principal de la app.
      var mapList = visibleProperties();
      if (mapCtrl.ready) mapCtrl.setMarkers(mapList, onSelectProperty);

      // La lista de abajo solo muestra una selección curada (destacadas), máximo 10,
      // para mantener el foco en el mapa.
      var featuredList = mapList.filter(function (p) { return p.featured; }).slice(0, 10);
      u.qs('[data-count]', root).textContent = featuredList.length;
      u.qs('[data-list]', root).innerHTML = featuredList.length
        ? featuredList.map(function (p) { return c.propertyCardHTML(p, { variant: 'grid' }); }).join('')
        : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('search', { size: 32 }) + '</span><h3>Sin destacadas para estos filtros</h3><p>Ajusta los filtros o revisa el mapa para ver todas las propiedades disponibles.</p></div>';
    }

    // Fuente única de verdad para activar una ubicación: la usan la hoja de
    // ubicación y la geolocalización inicial, para no repetir el mismo bloque.
    function applyLocation(stateKey, cityKey) {
      state.location.set(stateKey, cityKey);
      filters.stateKey = stateKey;
      filters.cityKey = cityKey;
      var label = u.qs('[data-location-label]', root);
      if (label) label.textContent = locationLabel();
      refreshList();
      refreshProviderMarquee();
    }

    refreshList();
    refreshProviderMarquee();

    // Chips rápidos de operación / tipo
    c.bindQuickFilterChips(root, filters, refreshList);

    // Búsqueda y filtros avanzados: "Ver X propiedades" lleva a la página
    // Propiedades (mapa + lista completa del resultado), no se aplica sobre
    // el mapa general de Explorar.
    u.qs('[data-open-filters]', root).addEventListener('click', function () {
      c.openFilterSheet(filters, state.properties.publicList(), function (applied) {
        state.filters.set(applied);
        window.location.hash = '#/propiedades';
      });
    });

    // Ubicación: filtra las propiedades disponibles y mueve el mapa ahí
    u.qs('[data-open-location]', root).addEventListener('click', function () {
      c.openLocationSheet({ stateKey: filters.stateKey, cityKey: filters.cityKey }, function (loc) {
        applyLocation(loc.stateKey, loc.cityKey);
        var target = resolveLocation(loc.stateKey, loc.cityKey);
        if (target && mapCtrl.ready) mapCtrl.flyTo(target.center, target.zoom);
      });
    });

    // Ícono discreto sobre el mapa: mismo atajo de geolocalización, sin abrir la hoja
    var locateBtn = u.qs('[data-locate-me]', root);
    if (locateBtn) locateBtn.addEventListener('click', function () {
      locateBtn.disabled = true;
      navigator.geolocation.getCurrentPosition(function (pos) {
        locateBtn.disabled = false;
        var loc = u.nearestMexicoLocation([pos.coords.longitude, pos.coords.latitude], AUTO_LOCATION_RADIUS_KM);
        if (!loc) { u.toast('No encontramos una ciudad cercana a tu ubicación en el catálogo.'); return; }
        applyLocation(loc.stateKey, loc.cityKey);
        var target = resolveLocation(loc.stateKey, loc.cityKey);
        if (target && mapCtrl.ready) mapCtrl.flyTo(target.center, target.zoom);
      }, function () {
        locateBtn.disabled = false;
        u.toast('No pudimos acceder a tu ubicación. Revisa los permisos del navegador.');
      });
    });

    // Categorías
    var allPropertiesBtn = u.qs('[data-all-properties]', root);
    if (allPropertiesBtn) allPropertiesBtn.addEventListener('click', function () {
      window.location.hash = '#/propiedades';
    });

    u.qsa('[data-service]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.location.hash = '#/servicios/' + btn.getAttribute('data-service');
      });
    });

    // Al entrar sin ninguna ubicación activa, se detecta la ubicación real para
    // arrancar ya filtrado ahí. Silencioso si se niega el permiso o no hay
    // soporte: es una detección en segundo plano, no una acción que el
    // usuario pidió a propósito. Si ya había una ubicación activa, no se
    // vuelve a preguntar — no se le pisa la elección solo por volver a entrar.
    if (!filters.stateKey && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (pos) {
        var loc = u.nearestMexicoLocation([pos.coords.longitude, pos.coords.latitude], AUTO_LOCATION_RADIUS_KM);
        if (loc) {
          applyLocation(loc.stateKey, loc.cityKey);
          var target = resolveLocation(loc.stateKey, loc.cityKey);
          if (target && mapCtrl.ready) mapCtrl.flyTo(target.center, target.zoom);
          u.toast('Te mostramos propiedades en ' + (target ? target.label : '') + ' según tu ubicación.');
        }
      }, function () { /* permiso denegado o error: sin aviso, queda como estaba */ });
    }
  }

  window.App.views = window.App.views || {};
  window.App.views.explore = { render: render };
})();
