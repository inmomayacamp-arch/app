// Vista "Directorio de servicios": lista de proveedores (notario, valuadores,
// arquitectos, servicios, sofom) de una categoría, filtrados por la ubicación activa.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  function categoryMeta(key) {
    return u.SERVICE_CATEGORIES.filter(function (cat) { return cat.key === key; })[0] || u.SERVICE_CATEGORIES[0];
  }

  function render(params, root) {
    var cat = categoryMeta(params.category);
    var savedLocation = state.location.get();
    var loc = { stateKey: savedLocation.stateKey, cityKey: savedLocation.cityKey };

    function locationLabel() {
      var st = loc.stateKey && window.APP_CONFIG.MEXICO_STATES[loc.stateKey];
      if (!st) return 'Todo México';
      var city = loc.cityKey && st.cities[loc.cityKey];
      return city ? city.label : st.label;
    }

    root.innerHTML =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/" aria-label="Volver a Explorar">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">' + u.escapeHtml(cat.label) + '</h1>' +
      '</div>' +
      '<div class="page-wrap">' +
      '  <div class="chip-row" data-category-chips style="margin-bottom:12px">' +
      u.SERVICE_CATEGORIES.map(function (c2) {
        return '<button type="button" class="chip' + (c2.key === cat.key ? ' is-active' : '') + '" data-category="' + c2.key + '" style="--chip-color:' + c2.color + '">' + c2.label + '</button>';
      }).join('') +
      '  </div>' +
      '  <button type="button" class="city-chip" data-open-location aria-label="Ubicación" style="margin-bottom:16px">' + u.icon('pin', { size: 13 }) + ' <span data-location-label>' + u.escapeHtml(locationLabel()) + '</span></button>' +
      '  <div class="property-grid" data-list></div>' +
      '</div>';

    c.mountChrome('explore');
    document.title = cat.label + ' — Directorio InmoMaps';

    function resolveLabels() {
      var st = loc.stateKey && window.APP_CONFIG.MEXICO_STATES[loc.stateKey];
      var stateLabel = st ? st.label : null;
      var cityLabel = (st && loc.cityKey && st.cities[loc.cityKey]) ? st.cities[loc.cityKey].label : null;
      return { stateLabel: stateLabel, cityLabel: cityLabel };
    }

    function refresh() {
      var labels = resolveLabels();
      var list = state.providers.publicList(cat.key, labels.stateLabel, labels.cityLabel);
      u.qs('[data-list]', root).innerHTML = list.length
        ? list.map(function (p) { return c.providerCardHTML(p, cat); }).join('')
        : (
          '<div class="empty-state" style="grid-column:1/-1">' +
          '<span class="empty-state__icon">' + u.icon(cat.icon, { size: 32 }) + '</span>' +
          '<h3>Sin ' + u.escapeHtml(cat.label.toLowerCase()) + ' registrados aquí todavía</h3>' +
          '<p>Prueba con otra ubicación, o si eres un profesional de este rubro, anúnciate en InmoMaps.</p>' +
          '<a class="btn btn--primary btn--sm" href="#/anunciate">' + u.icon('chat', { size: 14 }) + ' Anúnciate aquí</a>' +
          '</div>'
        );
    }

    refresh();

    u.qsa('[data-category]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.location.hash = '#/servicios/' + btn.getAttribute('data-category');
      });
    });

    u.qs('[data-open-location]', root).addEventListener('click', function () {
      c.openLocationSheet({ stateKey: loc.stateKey, cityKey: loc.cityKey }, function (applied) {
        loc = applied;
        var label = u.qs('[data-location-label]', root);
        if (label) label.textContent = locationLabel();
        refresh();
      });
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.serviceDirectory = { render: render };
})();
