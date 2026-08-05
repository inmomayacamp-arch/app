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

  var PUBLISH_STATUS_LABELS = {
    publicada: { label: "Publicada", tone: "aprobada" },
    borrador: { label: "Borrador", tone: "pendiente" },
    programada: { label: "Programada", tone: "pendiente" },
    oculta: { label: "Oculta", tone: "rechazada" }
  };

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
    u.qs('[data-save]', sheetRoot).addEventListener('click', async function () {
      try {
        await state.properties.update(p.id, {
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
      } catch (err) {
        u.toast(err.message || 'No se pudo actualizar la propiedad');
      }
    });
  }

  function shareSheet(p, agent, refresh) {
    var s = Object.assign({ enabled: false, totalCommission: 5, collaboratorCommission: 50, fixedAmount: null, conditions: '', expiresAt: null, visibility: 'todos', selectedAgentSlugs: [] }, p.sharing);
    var otherAgents = window.App.data.getAllAgents().filter(function (a) { return a.slug !== agent.slug; });

    c.openSheet({
      title: "Compartir con asesores",
      body:
        '<div class="form-field"><label class="row gap-2" style="cursor:pointer"><input type="checkbox" data-f="enabled"' + (s.enabled ? ' checked' : '') + ' style="width:18px;height:18px" /> Compartir esta propiedad con otros asesores</label></div>' +
        '<div data-share-fields style="display:' + (s.enabled ? 'block' : 'none') + '">' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Comisión total (%)</label><input type="number" min="0" max="100" data-f="totalCommission" value="' + s.totalCommission + '" /></div>' +
        '<div class="form-field"><label>% para colaborador</label><input type="number" min="0" max="100" data-f="collaboratorCommission" value="' + s.collaboratorCommission + '" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Monto fijo (opcional, MXN)</label><input type="number" min="0" data-f="fixedAmount" value="' + (s.fixedAmount || '') + '" /></div>' +
        '<div class="form-field"><label>Vigencia hasta (opcional)</label><input type="date" data-f="expiresAt" value="' + (s.expiresAt ? s.expiresAt.slice(0, 10) : '') + '" /></div>' +
        '<div class="form-field"><label>Visibilidad</label><select data-f="visibility">' +
        '<option value="todos"' + (s.visibility === 'todos' ? ' selected' : '') + '>Todos los asesores</option>' +
        '<option value="seleccionados"' + (s.visibility === 'seleccionados' ? ' selected' : '') + '>Solo asesores seleccionados</option>' +
        '<option value="inmobiliaria"' + (s.visibility === 'inmobiliaria' ? ' selected' : '') + '>Solo dentro de mi inmobiliaria</option>' +
        '<option value="invitacion"' + (s.visibility === 'invitacion' ? ' selected' : '') + '>Solo por invitación (requiere aprobación)</option>' +
        '</select></div>' +
        (otherAgents.length ? '<div class="form-field" data-selected-wrap style="display:' + (s.visibility === 'seleccionados' ? 'block' : 'none') + '"><label>Asesores seleccionados</label>' +
          otherAgents.map(function (a) {
            return '<label class="row gap-2" style="padding:4px 0"><input type="checkbox" data-selected-agent="' + a.slug + '"' + (s.selectedAgentSlugs.indexOf(a.slug) !== -1 ? ' checked' : '') + ' /> ' + u.escapeHtml(a.name) + '</label>';
          }).join('') + '</div>' : '') +
        '<div class="form-field"><label>Observaciones</label><textarea rows="2" data-f="conditions" placeholder="Ej. Solo clientes nuevos.">' + u.escapeHtml(s.conditions) + '</textarea></div>' +
        '</div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Guardar configuración</button>'
    });

    var sheetRoot = u.qs('#sheet-root');
    var enabledCheckbox = u.qs('[data-f="enabled"]', sheetRoot);
    var fieldsWrap = u.qs('[data-share-fields]', sheetRoot);
    enabledCheckbox.addEventListener('change', function () { fieldsWrap.style.display = enabledCheckbox.checked ? 'block' : 'none'; });
    var visibilitySelect = u.qs('[data-f="visibility"]', sheetRoot);
    var selectedWrap = u.qs('[data-selected-wrap]', sheetRoot);
    if (visibilitySelect) visibilitySelect.addEventListener('change', function () {
      if (selectedWrap) selectedWrap.style.display = visibilitySelect.value === 'seleccionados' ? 'block' : 'none';
    });

    u.qs('[data-save]', sheetRoot).addEventListener('click', async function () {
      var selectedAgentSlugs = u.qsa('[data-selected-agent]', sheetRoot).filter(function (cb) { return cb.checked; }).map(function (cb) { return cb.getAttribute('data-selected-agent'); });
      try {
        await window.App.agent.state.sharedPool.setSharing(p.id, {
          enabled: enabledCheckbox.checked,
          totalCommission: Number(u.qs('[data-f="totalCommission"]', sheetRoot).value) || 0,
          collaboratorCommission: Number(u.qs('[data-f="collaboratorCommission"]', sheetRoot).value) || 0,
          fixedAmount: u.qs('[data-f="fixedAmount"]', sheetRoot).value ? Number(u.qs('[data-f="fixedAmount"]', sheetRoot).value) : null,
          expiresAt: u.qs('[data-f="expiresAt"]', sheetRoot).value ? new Date(u.qs('[data-f="expiresAt"]', sheetRoot).value).toISOString() : null,
          visibility: visibilitySelect.value,
          selectedAgentSlugs: selectedAgentSlugs,
          conditions: u.qs('[data-f="conditions"]', sheetRoot).value
        });
        c.closeSheet();
        u.toast('Configuración de bolsa compartida guardada', { tone: 'success' });
        refresh();
      } catch (err) {
        u.toast(err.message || 'No se pudo guardar la configuración');
      }
    });
  }

  function render(params, root) {
    var agent = state.agents.current();
    var allowFeatured = canFeature(agent.slug);

    function refresh() {
      var properties = state.properties.byAgent(agent.slug);

      var rows = properties.map(function (p) {
        var status = p.status || 'disponible';
        var pubStatus = PUBLISH_STATUS_LABELS[p.publishStatus || 'publicada'] || PUBLISH_STATUS_LABELS.publicada;
        var isHidden = (p.publishStatus || 'publicada') === 'oculta';
        return '<tr>' +
          '<td><img src="' + p.photos[0] + '" alt="" style="width:48px;height:48px;border-radius:8px;object-fit:cover" /></td>' +
          '<td><div class="admin-table__name">' + u.escapeHtml(p.title) + '</div><div class="admin-table__meta">' + u.propertyTypeLabel(p.type) + ' · ' + u.escapeHtml(p.city) + '</div></td>' +
          '<td>' + window.App.components.propertyPriceLabel(p) + '</td>' +
          '<td><select data-status="' + p.id + '" style="border:1px solid var(--color-border-strong);border-radius:8px;padding:6px 8px;font-size:0.8rem">' +
          STATUS_OPTIONS.map(function (s) { return '<option value="' + s.value + '"' + (status === s.value ? ' selected' : '') + '>' + s.label + '</option>'; }).join('') +
          '</select></td>' +
          '<td><span class="status-pill status-pill--' + pubStatus.tone + '">' + pubStatus.label + '</span>' +
          (p.publishStatus && p.publishStatus !== 'publicada'
            ? '<button type="button" class="btn btn--sm btn--outline" style="margin-top:6px" data-publish-now="' + p.id + '">Publicar ahora</button>'
            : '<button type="button" class="btn btn--sm btn--outline" style="margin-top:6px" data-toggle-hide="' + p.id + '">' + (isHidden ? 'Mostrar' : 'Ocultar') + '</button>') +
          '</td>' +
          '<td>' + (allowFeatured
            ? '<button type="button" class="btn btn--sm btn--outline" data-feature="' + p.id + '">' + (p.featured ? '★ Destacada' : 'Destacar') + '</button>'
            : '<span class="text-muted" style="font-size:0.76rem">Plan Profesional</span>') + '</td>' +
          '<td class="actions"><div class="icon-btn-row">' +
          '<a class="btn btn--sm btn--outline" href="#/propiedad/' + p.id + '" target="_blank" rel="noopener">Ver</a>' +
          '<button type="button" class="btn btn--sm btn--outline" data-edit="' + p.id + '">Editar</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-duplicate="' + p.id + '">Duplicar</button>' +
          (allowFeatured ? '<button type="button" class="btn btn--sm btn--outline" data-share="' + p.id + '">' + u.icon('exchange', { size: 13 }) + ' ' + (p.sharing && p.sharing.enabled ? 'Compartida' : 'Compartir') + '</button>' : '') +
          '<button type="button" class="btn btn--sm btn--outline" data-remove="' + p.id + '">Eliminar</button>' +
          '</div></td></tr>';
      }).join('');

      var content =
        '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
        '  <a class="btn btn--primary btn--sm" href="#/dashboard/publicar">' + u.icon('plus', { size: 14 }) + ' Publicar propiedad</a>' +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th></th><th>Propiedad</th><th>Precio</th><th>Estado</th><th>Publicación</th><th>Destacada</th><th></th></tr></thead>' +
        '  <tbody>' + (rows || '<tr><td colspan="7" class="admin-table__meta">Aún no tienes propiedades publicadas.</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('propiedades', 'Mis propiedades', content, root);

      u.qsa('[data-status]', root).forEach(function (sel) {
        sel.addEventListener('change', async function () {
          try {
            await state.properties.update(sel.getAttribute('data-status'), { status: sel.value });
            u.toast('Estado actualizado');
          } catch (err) {
            u.toast(err.message || 'No se pudo actualizar el estado');
          }
        });
      });
      u.qsa('[data-publish-now]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          try {
            await state.properties.update(btn.getAttribute('data-publish-now'), { publishStatus: 'publicada', scheduledAt: null });
            u.toast('Propiedad publicada', { tone: 'success' });
            refresh();
          } catch (err) {
            u.toast(err.message || 'No se pudo publicar la propiedad');
          }
        });
      });
      u.qsa('[data-toggle-hide]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var id = btn.getAttribute('data-toggle-hide');
          var p = properties.filter(function (x) { return x.id === id; })[0];
          var nowHidden = (p.publishStatus || 'publicada') !== 'oculta';
          try {
            await state.properties.update(id, { publishStatus: nowHidden ? 'oculta' : 'publicada' });
            u.toast(nowHidden ? 'Propiedad oculta' : 'Propiedad visible de nuevo');
            refresh();
          } catch (err) {
            u.toast(err.message || 'No se pudo actualizar la propiedad');
          }
        });
      });
      u.qsa('[data-feature]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var id = btn.getAttribute('data-feature');
          var p = properties.filter(function (x) { return x.id === id; })[0];
          try {
            await state.properties.update(id, { featured: !p.featured });
            refresh();
          } catch (err) {
            u.toast(err.message || 'No se pudo actualizar la propiedad');
          }
        });
      });
      u.qsa('[data-edit]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { editSheet(properties.filter(function (p) { return p.id === btn.getAttribute('data-edit'); })[0], refresh); });
      });
      u.qsa('[data-share]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { shareSheet(properties.filter(function (p) { return p.id === btn.getAttribute('data-share'); })[0], agent, refresh); });
      });
      u.qsa('[data-duplicate]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          try {
            await state.properties.duplicate(btn.getAttribute('data-duplicate'));
            u.toast('Propiedad duplicada', { tone: 'success' });
            refresh();
          } catch (err) {
            u.toast(err.message || 'No se pudo duplicar la propiedad');
          }
        });
      });
      u.qsa('[data-remove]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (!window.confirm('¿Eliminar esta propiedad? Ya no aparecerá en InmoMap.')) return;
          try {
            await state.properties.remove(btn.getAttribute('data-remove'));
            u.toast('Propiedad eliminada');
            refresh();
          } catch (err) {
            u.toast(err.message || 'No se pudo eliminar la propiedad');
          }
        });
      });
    }

    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.properties = { render: render };
})();
