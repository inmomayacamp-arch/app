// Vista "Mis propiedades": administración completa de las propiedades del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var ac = window.App.agent.components;

  var STATUS_OPTIONS = [
    { value: "disponible", label: "Disponible" },
    { value: "apartada", label: "Apartada" },
    { value: "vendida", label: "Vendida" },
    { value: "rentada", label: "Rentada" },
    { value: "pausada", label: "Pausada" }
  ];

  function canFeature(agentSlug) {
    var info = window.App.admin.state.agents.all().filter(function (a) { return a.slug === agentSlug; })[0];
    return !info || info.plan === 'profesional';
  }

  function editSheet(p, refresh) {
    c.openSheet({
      title: "Editar propiedad",
      body:
        '<div class="form-field"><label>Título</label><input type="text" data-f="title" value="' + u.escapeHtml(p.title) + '" /></div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Precio (MXN)</label><input type="number" data-f="price" value="' + p.price + '" /></div>' +
        '<div class="form-field"><label>Operación</label><select data-f="operation"><option value="venta"' + (p.operation === 'venta' ? ' selected' : '') + '>Venta</option><option value="renta"' + (p.operation === 'renta' ? ' selected' : '') + '>Renta</option></select></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Recámaras</label><input type="number" min="0" data-f="bedrooms" value="' + (p.bedrooms || '') + '" /></div>' +
        '<div class="form-field"><label>Baños</label><input type="number" min="0" step="0.5" data-f="bathrooms" value="' + (p.bathrooms || '') + '" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Descripción</label><textarea rows="4" data-f="description">' + u.escapeHtml(p.description || '') + '</textarea></div>' +
        '<div class="form-field"><label>Observaciones privadas</label><textarea rows="2" data-f="privateNotes" placeholder="Solo visibles para ti">' + u.escapeHtml(p.privateNotes || '') + '</textarea></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Guardar cambios</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      state.properties.update(p.id, {
        title: u.qs('[data-f="title"]', sheetRoot).value,
        price: Number(u.qs('[data-f="price"]', sheetRoot).value) || p.price,
        operation: u.qs('[data-f="operation"]', sheetRoot).value,
        bedrooms: Number(u.qs('[data-f="bedrooms"]', sheetRoot).value) || null,
        bathrooms: Number(u.qs('[data-f="bathrooms"]', sheetRoot).value) || null,
        description: u.qs('[data-f="description"]', sheetRoot).value,
        privateNotes: u.qs('[data-f="privateNotes"]', sheetRoot).value
      });
      c.closeSheet();
      u.toast('Propiedad actualizada', { tone: 'success' });
      refresh();
    });
  }

  function render(params, root) {
    var agent = state.agents.current();
    var allowFeatured = canFeature(agent.slug);

    function refresh() {
      var properties = state.properties.byAgent(agent.slug);

      var rows = properties.map(function (p) {
        var status = p.status || 'disponible';
        return '<tr>' +
          '<td><img src="' + p.photos[0] + '" alt="" style="width:48px;height:48px;border-radius:8px;object-fit:cover" /></td>' +
          '<td><div class="admin-table__name">' + u.escapeHtml(p.title) + '</div><div class="admin-table__meta">' + u.propertyTypeLabel(p.type) + ' · ' + u.escapeHtml(p.city) + '</div></td>' +
          '<td>' + u.formatPrice(p.price) + (p.operation === 'renta' ? '/mes' : '') + '</td>' +
          '<td><select data-status="' + p.id + '" style="border:1px solid var(--color-border-strong);border-radius:8px;padding:6px 8px;font-size:0.8rem">' +
          STATUS_OPTIONS.map(function (s) { return '<option value="' + s.value + '"' + (status === s.value ? ' selected' : '') + '>' + s.label + '</option>'; }).join('') +
          '</select></td>' +
          '<td>' + (allowFeatured
            ? '<button type="button" class="btn btn--sm btn--outline" data-feature="' + p.id + '">' + (p.featured ? '★ Destacada' : 'Destacar') + '</button>'
            : '<span class="text-muted" style="font-size:0.76rem">Plan Profesional</span>') + '</td>' +
          '<td class="actions"><div class="icon-btn-row">' +
          '<a class="btn btn--sm btn--outline" href="#/propiedad/' + p.id + '" target="_blank" rel="noopener">Ver</a>' +
          '<button type="button" class="btn btn--sm btn--outline" data-edit="' + p.id + '">Editar</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-duplicate="' + p.id + '">Duplicar</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-remove="' + p.id + '">Eliminar</button>' +
          '</div></td></tr>';
      }).join('');

      var content =
        '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
        '  <a class="btn btn--primary btn--sm" href="#/dashboard/publicar">' + u.icon('plus', { size: 14 }) + ' Publicar propiedad</a>' +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th></th><th>Propiedad</th><th>Precio</th><th>Estado</th><th>Destacada</th><th></th></tr></thead>' +
        '  <tbody>' + (rows || '<tr><td colspan="6" class="admin-table__meta">Aún no tienes propiedades publicadas.</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('propiedades', 'Mis propiedades', content, root);

      u.qsa('[data-status]', root).forEach(function (sel) {
        sel.addEventListener('change', function () {
          state.properties.update(sel.getAttribute('data-status'), { status: sel.value });
          u.toast('Estado actualizado');
        });
      });
      u.qsa('[data-feature]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-feature');
          var p = properties.filter(function (x) { return x.id === id; })[0];
          state.properties.update(id, { featured: !p.featured });
          refresh();
        });
      });
      u.qsa('[data-edit]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { editSheet(properties.filter(function (p) { return p.id === btn.getAttribute('data-edit'); })[0], refresh); });
      });
      u.qsa('[data-duplicate]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.properties.duplicate(btn.getAttribute('data-duplicate'));
          u.toast('Propiedad duplicada', { tone: 'success' });
          refresh();
        });
      });
      u.qsa('[data-remove]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!window.confirm('¿Eliminar esta propiedad? Ya no aparecerá en InmoMap.')) return;
          state.properties.remove(btn.getAttribute('data-remove'));
          u.toast('Propiedad eliminada');
          refresh();
        });
      });
    }

    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.properties = { render: render };
})();
