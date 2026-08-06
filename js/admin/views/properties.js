// Vista "Administración de Propiedades" (moderación).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function editSheet(p, refresh) {
    c.openSheet({
      title: "Editar propiedad",
      body:
        '<div class="form-field"><label>Categoría</label><select data-f="type">' +
        ['casa', 'departamento', 'terreno', 'local', 'oficina'].map(function (t) { return '<option value="' + t + '"' + (p.type === t ? ' selected' : '') + '>' + u.propertyTypeLabel(t) + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="form-field"><label>Ciudad</label><input type="text" data-f="city" value="' + u.escapeHtml(p.city) + '" /></div>' +
        '<div class="form-field"><label>Precio (MXN)</label><input type="number" data-f="price" value="' + p.price + '" /></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Guardar cambios</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      s.properties.setMod(p.id, {
        typeOverride: u.qs('[data-f="type"]', sheetRoot).value,
        cityOverride: u.qs('[data-f="city"]', sheetRoot).value,
        priceOverride: Number(u.qs('[data-f="price"]', sheetRoot).value)
      });
      c.closeSheet();
      u.toast('Propiedad actualizada (cambios visibles solo en el panel admin de este prototipo)');
      refresh();
    });
  }

  function render(params, root) {
    function refresh() {
      var pending = s.properties.pending();
      var properties = s.properties.all();

      var pendingRows = pending.map(function (p) {
        return '<tr>' +
          '<td><img src="' + p.photos[0] + '" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover" /></td>' +
          '<td><div class="admin-table__name">' + u.escapeHtml(p.title) + '</div><div class="admin-table__meta">' + u.escapeHtml(p.neighborhood) + ', ' + u.escapeHtml(p.city) + '</div></td>' +
          '<td>' + u.propertyTypeLabel(p.type) + ' · ' + u.operationLabel(p.operation) + '</td>' +
          '<td>' + u.formatPrice(u.effectivePrice(p)) + (p.operation === 'renta' ? '/mes' : '') + '</td>' +
          '<td class="admin-table__meta">' + u.relativeTime(p.submittedAt) + '</td>' +
          '<td class="actions"><div class="icon-btn-row">' +
          '<button type="button" class="btn btn--sm btn--primary" data-approve="' + p.id + '">Aprobar</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-reject="' + p.id + '">Rechazar</button>' +
          '</div></td></tr>';
      }).join('');

      var rows = properties.map(function (p) {
        return '<tr>' +
          '<td><img src="' + p.photos[0] + '" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover" /></td>' +
          '<td><div class="admin-table__name">' + u.escapeHtml(p.title) + '</div><div class="admin-table__meta">' + u.escapeHtml(p.city) + '</div></td>' +
          '<td>' + u.propertyTypeLabel(p.type) + '</td>' +
          '<td>' + u.formatPrice(u.effectivePrice(p)) + (p.operation === 'renta' ? '/mes' : '') + '</td>' +
          '<td>' + ac.statusPill(p.status) + '</td>' +
          '<td>' + (p.featured ? ac.statusPill('aprobada').replace('Aprobada', 'Sí') : '<span class="admin-table__meta">No</span>') + '</td>' +
          '<td class="actions"><div class="icon-btn-row">' +
          '<a class="btn btn--sm btn--outline" href="#/propiedad/' + p.id + '" target="_blank" rel="noopener">Ver</a>' +
          '<button type="button" class="btn btn--sm btn--outline" data-edit="' + p.id + '">Editar</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-feature="' + p.id + '">' + (p.featured ? 'Quitar destacado' : 'Destacar') + '</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-hide="' + p.id + '">' + (p.status === 'oculta' ? 'Reactivar' : 'Ocultar') + '</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-remove="' + p.id + '">Eliminar</button>' +
          '</div></td></tr>';
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Pendientes de aprobación (' + pending.length + ')</div><div class="admin-section__subtitle">Nuevas publicaciones enviadas por asesores y propietarios</div></div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th></th><th>Propiedad</th><th>Tipo</th><th>Precio</th><th>Enviado</th><th></th></tr></thead>' +
        '  <tbody>' + (pendingRows || '<tr><td colspan="6" class="admin-table__meta">No hay publicaciones pendientes</td></tr>') + '</tbody></table></div>' +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Todas las propiedades (' + properties.length + ')</div></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th></th><th>Propiedad</th><th>Tipo</th><th>Precio</th><th>Estado</th><th>Destacada</th><th></th></tr></thead>' +
        '  <tbody>' + rows + '</tbody></table></div>' +
        '</div>';

      ac.mount('propiedades', 'Propiedades', content, root);

      u.qsa('[data-approve]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          try {
            await s.properties.approvePending(btn.getAttribute('data-approve'));
            u.toast('Propiedad aprobada y publicada');
            refresh();
          } catch (err) {
            u.toast(err.message || 'No se pudo aprobar la propiedad');
          }
        });
      });
      u.qsa('[data-reject]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!window.confirm('¿Rechazar esta publicación?')) return;
          s.properties.rejectPending(btn.getAttribute('data-reject')); u.toast('Publicación rechazada'); refresh();
        });
      });
      u.qsa('[data-edit]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { editSheet(properties.filter(function (p) { return p.id === btn.getAttribute('data-edit'); })[0], refresh); });
      });
      u.qsa('[data-feature]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var p = properties.filter(function (x) { return x.id === btn.getAttribute('data-feature'); })[0];
          s.properties.setMod(p.id, { featured: !p.featured });
          refresh();
        });
      });
      u.qsa('[data-hide]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var p = properties.filter(function (x) { return x.id === btn.getAttribute('data-hide'); })[0];
          s.properties.setMod(p.id, { status: p.status === 'oculta' ? 'aprobada' : 'oculta' });
          refresh();
        });
      });
      u.qsa('[data-remove]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!window.confirm('¿Eliminar esta propiedad del panel admin?')) return;
          s.properties.setMod(btn.getAttribute('data-remove'), { removed: true });
          u.toast('Propiedad eliminada');
          refresh();
        });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.properties = { render: render };
})();
