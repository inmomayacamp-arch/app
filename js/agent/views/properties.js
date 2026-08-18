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

  function canFeature(agent) {
    return agent.plan === 'asesor' && agent.status === 'activo';
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

  function dealBadgeHTML(p) {
    var status = p.status || 'disponible';
    if (status === 'disponible') return '';
    var tone = (status === 'vendida' || status === 'rentada') ? 'aprobada' : (status === 'apartada' ? 'pendiente' : 'inactivo');
    var label = (STATUS_OPTIONS.filter(function (s) { return s.value === status; })[0] || {}).label || status;
    return '<span class="status-pill status-pill--' + tone + '">' + label + '</span>';
  }

  function cardHTML(p, isOwner, allowFeatured, otherFeaturedCount) {
    var pubStatus = PUBLISH_STATUS_LABELS[p.publishStatus || 'publicada'] || PUBLISH_STATUS_LABELS.publicada;
    var isExpired = isOwner && p.expiresAt && new Date(p.expiresAt) <= new Date();
    var daysLeft = (isOwner && p.expiresAt && !isExpired) ? Math.ceil((new Date(p.expiresAt) - new Date()) / 86400000) : null;
    var featuredDaysLeft = p.featuredExpiresAt ? Math.ceil((new Date(p.featuredExpiresAt) - new Date()) / 86400000) : null;
    var atFeaturedCap = allowFeatured && !p.featured && otherFeaturedCount >= 1;
    return (
      '<div class="property-card admin-property-card">' +
      '  <a class="property-card__media" href="#/propiedad/' + p.id + '" target="_blank" rel="noopener">' +
      '    <img src="' + p.photos[0] + '" alt="" loading="lazy" />' +
      '    <span class="property-card__badge badge badge--' + u.badgeClassFor(p.operation) + '">' + u.operationLabel(p.operation) + '</span>' +
      '    <div class="admin-property-card__pills">' +
      '      <span class="status-pill status-pill--' + (isExpired ? 'rechazada' : pubStatus.tone) + '">' + (isExpired ? 'Vencida' : pubStatus.label) + '</span>' +
      dealBadgeHTML(p) +
      '    </div>' +
      (p.featured ? '<span class="admin-property-card__featured">' + u.icon('starFilled', { size: 11 }) + ' Destacada' + (featuredDaysLeft !== null ? ' · ' + featuredDaysLeft + 'd' : '') + '</span>' : '') +
      '  </a>' +
      '  <div class="property-card__body">' +
      '    <div class="property-card__price">' + c.propertyPriceLabel(p) + '</div>' +
      '    <div class="property-card__title">' + u.escapeHtml(p.title) + '</div>' +
      '    <div class="property-card__location">' + u.icon('pin', { size: 12 }) + ' ' + u.escapeHtml(p.neighborhood) + ', ' + u.escapeHtml(p.city) + '</div>' +
      '    <div class="property-card__specs">' + c.specsRowHTML(p) + '</div>' +
      (isExpired
        ? '    <div class="card-destacar-hint">' +
          '      <p>' + u.icon('clock', { size: 13 }) + ' Tu publicación venció y ya no aparece en el mapa ni en las búsquedas.</p>' +
          '      <button type="button" class="btn btn--primary btn--sm btn--block" data-renew="' + p.id + '">Renovar gratis por 30 días más</button>' +
          '    </div>'
        : '') +
      '    <div class="admin-property-card__footer">' +
      '      <span class="text-muted" style="font-size:0.74rem">' + u.relativeTime(p.createdAt) + ' · ' + u.icon('eye', { size: 12 }) + ' ' + u.formatNumber(state.tracking.viewsForProperty(p.id)) +
      (daysLeft !== null && daysLeft <= 7 ? ' · Vence en ' + daysLeft + (daysLeft === 1 ? ' día' : ' días') : '') +
      '</span>' +
      '      <div class="row gap-2">' +
      '        <button type="button" class="btn btn--icon" data-copy-text="' + window.location.origin + '/propiedad/' + p.id + '" aria-label="Copiar enlace">' + u.icon('link', { size: 16 }) + '</button>' +
      '        <button type="button" class="btn btn--icon btn--icon-solid" data-actions="' + p.id + '" aria-label="Más opciones">' + u.icon('more', { size: 16 }) + '</button>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>'
    );
  }

  function actionsSheet(p, agent, allowFeatured, otherFeaturedCount, refresh) {
    var isHidden = (p.publishStatus || 'publicada') === 'oculta';
    var canPublishNow = p.publishStatus && p.publishStatus !== 'publicada' && p.publishStatus !== 'oculta';
    var otherStatuses = STATUS_OPTIONS.filter(function (s) { return s.value !== (p.status || 'disponible'); });
    var addon = window.App.admin.data.OWNER_PLAN.featuredAddon;
    var atFeaturedCap = allowFeatured && !p.featured && otherFeaturedCount >= 1;
    var canPayFeature = !p.featured && (agent.plan === 'propietario' || atFeaturedCap);

    c.openSheet({
      title: p.title,
      body:
        '<div class="stack gap-2">' +
        '<a class="btn btn--outline btn--block" target="_blank" rel="noopener" href="#/propiedad/' + p.id + '">' + u.icon('eye', { size: 15 }) + ' Ver ficha pública</a>' +
        '<button type="button" class="btn btn--outline btn--block" data-act="edit">' + u.icon('edit', { size: 15 }) + ' Editar</button>' +
        '<button type="button" class="btn btn--outline btn--block" data-act="pdf">' + u.icon('download', { size: 15 }) + ' Descargar PDF</button>' +
        (p.status !== 'vendida' ? '<button type="button" class="btn btn--outline btn--block" data-act="status" data-status="vendida">' + u.icon('check', { size: 15 }) + ' Marcar como vendida</button>' : '') +
        '<button type="button" class="btn btn--outline btn--block" data-act="toggle-hide">' + u.icon('eye', { size: 15 }) + (isHidden ? ' Mostrar' : ' Ocultar') + '</button>' +
        (canPublishNow ? '<button type="button" class="btn btn--outline btn--block" data-act="publish-now">' + u.icon('check', { size: 15 }) + ' Publicar ahora</button>' : '') +
        '<button type="button" class="btn btn--outline btn--block" data-act="duplicate">' + u.icon('copy', { size: 15 }) + ' Duplicar</button>' +
        (allowFeatured ? '<button type="button" class="btn btn--outline btn--block" data-act="feature">' + u.icon('starFilled', { size: 15 }) + (p.featured ? ' Quitar destacado' : (atFeaturedCap ? ' Destacar (ya usada, quítasela a la otra)' : ' Destacar')) + '</button>' : '') +
        (canPayFeature ? '<button type="button" class="btn btn--primary btn--block" data-act="pay-feature">' + u.icon('starFilled', { size: 15 }) + ' Destacar mi propiedad (+$' + addon.price + ' MXN)</button>' : '') +
        (allowFeatured ? '<button type="button" class="btn btn--outline btn--block" data-act="share">' + u.icon('exchange', { size: 15 }) + ' ' + (p.sharing && p.sharing.enabled ? 'Compartida con asesores' : 'Compartir con asesores') + '</button>' : '') +
        (otherStatuses.length ? '<div class="text-muted" style="font-size:0.76rem;font-weight:700;margin:6px 0 -2px">Otro estado</div><div class="row gap-2" style="flex-wrap:wrap">' +
          otherStatuses.map(function (s) { return '<button type="button" class="btn btn--sm btn--outline" data-act="status" data-status="' + s.value + '">' + s.label + '</button>'; }).join('') + '</div>' : '') +
        '<button type="button" class="btn btn--outline btn--block" data-act="delete" style="color:var(--color-primary);border-color:var(--color-primary);margin-top:4px">' + u.icon('x', { size: 15 }) + ' Eliminar</button>' +
        '</div>'
    });

    var sheetRoot = u.qs('#sheet-root');
    function afterAction() { c.closeSheet(); refresh(); }

    var editBtn = u.qs('[data-act="edit"]', sheetRoot);
    if (editBtn) editBtn.addEventListener('click', function () { c.closeSheet(); window.location.hash = '#/dashboard/publicar/' + p.id; });

    var shareBtn = u.qs('[data-act="share"]', sheetRoot);
    if (shareBtn) shareBtn.addEventListener('click', function () { c.closeSheet(); shareSheet(p, agent, refresh); });

    var pdfBtn = u.qs('[data-act="pdf"]', sheetRoot);
    if (pdfBtn) pdfBtn.addEventListener('click', async function () {
      pdfBtn.disabled = true;
      try { await window.App.pdfFicha.generate(p, agent); }
      catch (err) { console.error(err); u.toast('No se pudo generar el PDF'); }
      finally { pdfBtn.disabled = false; }
    });

    var duplicateBtn = u.qs('[data-act="duplicate"]', sheetRoot);
    if (duplicateBtn) duplicateBtn.addEventListener('click', async function () {
      try { await state.properties.duplicate(p.id); u.toast('Propiedad duplicada', { tone: 'success' }); afterAction(); }
      catch (err) { u.toast(err.message || 'No se pudo duplicar la propiedad'); }
    });

    var hideBtn = u.qs('[data-act="toggle-hide"]', sheetRoot);
    if (hideBtn) hideBtn.addEventListener('click', async function () {
      try {
        await state.properties.update(p.id, { publishStatus: isHidden ? 'publicada' : 'oculta' });
        u.toast(isHidden ? 'Propiedad visible de nuevo' : 'Propiedad oculta');
        afterAction();
      } catch (err) { u.toast(err.message || 'No se pudo actualizar la propiedad'); }
    });

    var publishBtn = u.qs('[data-act="publish-now"]', sheetRoot);
    if (publishBtn) publishBtn.addEventListener('click', async function () {
      try {
        await state.properties.update(p.id, { publishStatus: 'publicada', scheduledAt: null });
        u.toast('Propiedad publicada', { tone: 'success' });
        afterAction();
      } catch (err) { u.toast(err.message || 'No se pudo publicar la propiedad'); }
    });

    var featureBtn = u.qs('[data-act="feature"]', sheetRoot);
    if (featureBtn) featureBtn.addEventListener('click', async function () {
      if (atFeaturedCap) { c.closeSheet(); u.toast('Ya usaste tu destacada incluida. Quítasela a la otra propiedad primero, o paga por destacar esta también.'); return; }
      featureBtn.disabled = true;
      try { await state.properties.toggleFreeFeature(p.id); afterAction(); }
      catch (err) { featureBtn.disabled = false; u.toast(err.message || 'No se pudo actualizar la propiedad'); }
    });

    var payFeatureBtn = u.qs('[data-act="pay-feature"]', sheetRoot);
    if (payFeatureBtn) payFeatureBtn.addEventListener('click', function () {
      c.closeSheet();
      window.location.hash = '#/dashboard/destacar/' + p.id;
    });

    u.qsa('[data-act="status"]', sheetRoot).forEach(function (btn) {
      btn.addEventListener('click', async function () {
        try {
          await state.properties.update(p.id, { status: btn.getAttribute('data-status') });
          u.toast('Estado actualizado', { tone: 'success' });
          afterAction();
        } catch (err) { u.toast(err.message || 'No se pudo actualizar el estado'); }
      });
    });

    var deleteBtn = u.qs('[data-act="delete"]', sheetRoot);
    if (deleteBtn) deleteBtn.addEventListener('click', async function () {
      if (!window.confirm('¿Eliminar esta propiedad? Ya no aparecerá en InmoMaps.')) return;
      try { await state.properties.remove(p.id); u.toast('Propiedad eliminada'); afterAction(); }
      catch (err) { u.toast(err.message || 'No se pudo eliminar la propiedad'); }
    });
  }

  function render(params, root) {
    var agent = state.agents.current();
    var allowFeatured = canFeature(agent);

    function refresh() {
      var properties = state.properties.byAgent(agent.slug);
      var isOwner = agent.plan === 'propietario';
      var cards = properties.map(function (p) {
        var otherFeaturedCount = properties.filter(function (x) { return x.featured && x.id !== p.id; }).length;
        return cardHTML(p, isOwner, allowFeatured, otherFeaturedCount);
      }).join('');
      var ownerAtLimit = isOwner && properties.length >= 1;
      var agentAtLimit = allowFeatured && properties.length >= 15;
      var publishHref = isOwner ? '#/dashboard/publicar-elegir' : '#/dashboard/publicar';

      var content =
        ((ownerAtLimit || agentAtLimit) ? '' :
        '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
        '  <a class="btn btn--primary btn--sm" href="' + publishHref + '">' + u.icon('plus', { size: 14 }) + ' Publicar propiedad</a>' +
        '</div>') +
        (properties.length
          ? '<div class="stack gap-3">' + cards + '</div>'
          : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('home', { size: 30 }) + '</span><h3>Aún no tienes propiedades publicadas</h3><a class="btn btn--primary" href="' + publishHref + '">Publicar tu primera propiedad</a></div>');

      ac.mount('propiedades', 'Mis propiedades', content, root);

      u.qsa('[data-actions]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var p = properties.filter(function (x) { return x.id === btn.getAttribute('data-actions'); })[0];
          var otherFeaturedCount = properties.filter(function (x) { return x.featured && x.id !== p.id; }).length;
          actionsSheet(p, agent, allowFeatured, otherFeaturedCount, refresh);
        });
      });

      u.qsa('[data-renew]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          btn.disabled = true;
          try {
            var newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await state.properties.update(btn.getAttribute('data-renew'), { expiresAt: newExpiry });
            u.toast('¡Publicación renovada por 30 días más!', { tone: 'success' });
            refresh();
          } catch (err) {
            btn.disabled = false;
            u.toast(err.message || 'No se pudo renovar la publicación');
          }
        });
      });
    }

    refresh();
    c.bindCopyButtons(root);
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.properties = { render: render };
})();
