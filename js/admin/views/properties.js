// Vista "Propiedades": lista de solo lectura de las propiedades reales.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function render(params, root) {
    var properties = s.properties.all();

    var rows = properties.map(function (p) {
      return (
        '<div class="admin-row-card">' +
        '  <div class="admin-row-card__main">' +
        '    <img class="admin-row-card__avatar admin-row-card__avatar--square" src="' + u.thumbUrl(p.photos[0], 88, 88) + '" alt="" loading="lazy" />' +
        '    <div class="admin-row-card__body">' +
        '      <strong>' + u.escapeHtml(p.title) + '</strong>' +
        '      <span class="admin-row-card__meta">' + u.escapeHtml(p.city) + ' · ' + u.propertyTypeLabel(p.type) + ' · ' + u.operationLabel(p.operation) + '</span>' +
        '      <span class="admin-row-card__meta">' + u.formatPrice(u.effectivePrice(p)) + (p.operation === 'renta' ? '/mes' : '') + (p.featured ? ' · Destacada' : '') + '</span>' +
        '    </div>' +
        '  </div>' +
        '  <div class="admin-row-card__foot">' +
        ac.statusPill(p.status) +
        '    <a class="btn btn--sm btn--outline" href="#/propiedad/' + p.id + '" target="_blank" rel="noopener">Ver</a>' +
        '  </div>' +
        '</div>'
      );
    }).join('');

    var content =
      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Todas las propiedades (' + properties.length + ')</div></div>' +
      '  <div class="admin-row-list">' + (rows || '<p class="text-muted" style="font-size:0.85rem">Aún no hay propiedades publicadas.</p>') + '</div>' +
      '</div>';

    ac.mount('propiedades', 'Propiedades', content, root);
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.properties = { render: render };
})();
