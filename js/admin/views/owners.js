// Vista "Propietarios": lista de solo lectura de las cuentas de propietario
// particular reales (publican 1 propiedad, sin panel de asesor).
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function contactHTML(a) {
    var parts = [];
    if (a.phone) parts.push('<a href="tel:' + u.escapeHtml(a.phone) + '">' + u.escapeHtml(a.phone) + '</a>');
    if (a.email) parts.push('<a href="mailto:' + u.escapeHtml(a.email) + '">' + u.escapeHtml(a.email) + '</a>');
    return parts.join(' · ') || 'Sin datos de contacto';
  }

  function render(params, root) {
    var owners = s.owners.all();

    var rows = owners.map(function (a) {
      var propsCount = window.App.state.properties.byAgent(a.slug).length;
      return (
        '<div class="admin-row-card">' +
        '  <div class="admin-row-card__main">' +
        '    <img class="admin-row-card__avatar" src="' + u.thumbUrl(a.photo, 88, 88) + '" alt="" loading="lazy" />' +
        '    <div class="admin-row-card__body">' +
        '      <strong>' + u.escapeHtml(a.name) + '</strong>' +
        '      <span class="admin-row-card__meta">' + u.escapeHtml(a.city || 'Sin ciudad') + '</span>' +
        '      <span class="admin-row-card__meta">' + contactHTML(a) + '</span>' +
        '      <span class="admin-row-card__meta admin-row-card__meta--wrap">' + propsCount + ' propiedad' + (propsCount === 1 ? '' : 'es') +
        (a.createdAt ? ' · registrado ' + new Date(a.createdAt).toLocaleDateString('es-MX') : '') + '</span>' +
        '    </div>' +
        '  </div>' +
        '  <div class="admin-row-card__foot">' +
        (a.status ? ac.statusPill(a.status) : '<span></span>') +
        '    <a class="btn btn--sm btn--outline" href="#/' + a.slug + '" target="_blank" rel="noopener">Ver perfil</a>' +
        '  </div>' +
        '</div>'
      );
    }).join('');

    var content =
      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Propietarios (' + owners.length + ')</div></div>' +
      '  <div class="admin-row-list">' + (rows || '<p class="text-muted" style="font-size:0.85rem">Aún no hay propietarios registrados.</p>') + '</div>' +
      '</div>';

    ac.mount('propietarios', 'Propietarios', content, root);
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.owners = { render: render };
})();
