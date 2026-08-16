// Vista "Propietarios": lista de las cuentas de propietario particular
// reales (publican 1 propiedad, sin panel de asesor), con opción de marcar
// una cuenta de cortesía como pendiente de pago (o reactivarla).
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
    function refresh() {
      var owners = s.owners.all();

      var rows = owners.map(function (a) {
        var propsCount = window.App.state.properties.byAgent(a.slug).length;
        var isActive = a.status === 'activo';
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
          '    <div class="row gap-2">' +
          '      <button type="button" class="btn btn--sm btn--outline" data-toggle-status="' + a.id + '" data-next-status="' + (isActive ? 'pendiente_pago' : 'activo') + '">' + (isActive ? 'Marcar pendiente de pago' : 'Reactivar sin pago') + '</button>' +
          '      <a class="btn btn--sm btn--outline" href="#/' + a.slug + '" target="_blank" rel="noopener">Ver perfil</a>' +
          '    </div>' +
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
      u.qsa('[data-toggle-status]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var profileId = btn.getAttribute('data-toggle-status');
          var nextStatus = btn.getAttribute('data-next-status');
          btn.disabled = true;
          try {
            await s.agents.setStatus(profileId, nextStatus);
            u.toast(nextStatus === 'activo' ? 'Cuenta reactivada' : 'Cuenta marcada pendiente de pago', { tone: 'success' });
            await window.App.state.agents.bootstrap();
            refresh();
          } catch (err) {
            btn.disabled = false;
            u.toast(err.message || 'No se pudo actualizar la cuenta');
          }
        });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.owners = { render: render };
})();
