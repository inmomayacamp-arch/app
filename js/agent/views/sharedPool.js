// Vista "Bolsa Compartida": colaboración entre asesores (solo Plan Profesional).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var sp = window.App.agent.state.sharedPool;
  var ac = window.App.agent.components;

  var TABS = [
    { key: "buscar", label: "Buscar", icon: "search", descOne: "disponible", descMany: "disponibles" },
    { key: "compartidas", label: "Mis compartidas", icon: "exchange", descOne: "propiedad", descMany: "propiedades" },
    { key: "catalogo", label: "Mi catálogo", icon: "clipboard", descOne: "propiedad", descMany: "propiedades" },
    { key: "liquidaciones", label: "Liquidaciones", icon: "dollar", descOne: "activa", descMany: "activas" }
  ];

  function commissionLabel(sharing) {
    var parts = [];
    if (sharing.totalCommission) parts.push(sharing.totalCommission + '% comisión total');
    if (sharing.collaboratorCommission) parts.push(sharing.collaboratorCommission + '% para colaborador');
    if (sharing.fixedAmount) parts.push(u.formatPrice(sharing.fixedAmount) + ' fijo');
    return parts.join(' · ') || 'Sin comisión definida';
  }

  function visibilityLabel(v) {
    return { todos: 'Todos los asesores', seleccionados: 'Asesores seleccionados', inmobiliaria: 'Misma inmobiliaria', invitacion: 'Solo por invitación' }[v] || v;
  }

  // Tarjeta de propiedad para las pestañas "Buscar" y "Mi catálogo": misma
  // tarjeta de propiedad que se usa en toda la app (imagen, precio, título,
  // ubicación, specs), con una franja extra para el asesor dueño y la
  // comisión. Antes usaba .ranked-row (pensada para una sola línea de texto)
  // con tres líneas de información encimadas — se veía informal y se
  // distorsionaba con títulos o ciudades largas.
  function poolCardHTML(p, footerHTML) {
    var owner = window.App.data.getAgent(p.agentSlug);
    var inCatalog = sp.isInCatalog(p.id);
    return (
      '<div class="property-card admin-property-card">' +
      '  <a class="property-card__media" href="#/propiedad/' + p.id + '" target="_blank" rel="noopener">' +
      '    <img src="' + u.thumbUrl(p.photos[0], 480, 360) + '" alt="" loading="lazy" />' +
      '    <span class="property-card__badge badge badge--' + u.badgeClassFor(p.operation) + '">' + u.operationLabel(p.operation) + '</span>' +
      (inCatalog ? '<span class="pool-card__cat-corner" title="En tu catálogo">' + u.icon('check', { size: 13 }) + '</span>' : '') +
      '  </a>' +
      '  <div class="property-card__body">' +
      '    <div class="property-card__price">' + u.formatPrice(u.effectivePrice(p)) + (p.operation === 'renta' ? '/mes' : '') + '</div>' +
      '    <div class="property-card__title">' + u.escapeHtml(p.title) + '</div>' +
      '    <div class="property-card__location">' + u.icon('pin', { size: 12 }) + ' ' + u.escapeHtml(p.neighborhood) + ', ' + u.escapeHtml(p.city) + '</div>' +
      (inCatalog ? '<div class="pool-card__pillrow"><span class="pool-card__pill">En tu catálogo</span></div>' : '') +
      '    <div class="pool-card__agent">' + (owner ? '<img src="' + owner.photo + '" alt="" />' : '') + '<span>' + u.escapeHtml(owner ? owner.name : p.agentSlug) + '</span></div>' +
      '    <div class="pool-card__commission">' + u.icon('dollar', { size: 11 }) + ' ' + commissionLabel(p.sharing) + '</div>' +
      '    <div class="pool-card__footer">' + footerHTML + '</div>' +
      '  </div>' +
      '</div>'
    );
  }

  function render(params, root) {
    var agent = state.agents.current();

    if (!sp.isPremium(agent.slug)) {
      var upsell =
        '<div class="promo-card"><span class="promo-card__icon">' + u.icon('exchange', { size: 28 }) + '</span>' +
        '<div class="promo-card__body"><strong>Disponible en el Plan Profesional</strong>' +
        '<p>La Bolsa Inmobiliaria Compartida te permite colaborar con otros asesores: compartir tus propiedades y ofrecer las de otros a tus clientes, ganando comisión por cada operación cerrada en conjunto.</p>' +
        '<a class="btn btn--primary btn--sm" href="#/dashboard/suscripcion">Mejorar mi plan</a></div></div>';
      ac.mount('bolsa', 'Bolsa Compartida', upsell, root);
      return;
    }

    var activeTab = "buscar";
    var filters = { city: '', type: '', operation: '', neighborhood: '', minCommission: 0, priceMax: '' };

    // Mismas tarjetas cuadradas que ya usan el centro de control y Clientes,
    // en vez de las pestañas de texto con scroll lateral — caben las 4 en
    // una fila sin desplazarse, y cada una ya dice cuánto hay adentro.
    function tabsHTML() {
      var counts = {
        buscar: sp.search({}).length,
        compartidas: sp.mine().length,
        catalogo: sp.catalog().length,
        liquidaciones: sp.collaboratorsForMyProperties().length
      };
      var pendingCount = sp.pendingRequests().length;
      return '<div class="dashboard-grid" style="margin-bottom:20px">' + TABS.map(function (t) {
        var n = counts[t.key] || 0;
        return '<button type="button" class="dashboard-card' + (t.key === activeTab ? ' is-active-stage' : '') + '" data-tab="' + t.key + '">' +
          '<span class="dashboard-card__icon">' + u.icon(t.icon, { size: 26 }) + '</span>' +
          (t.key === 'compartidas' && pendingCount ? '<span class="dashboard-card__badge badge-count">' + pendingCount + '</span>' : '') +
          '<strong>' + t.label + '</strong><span>' + n + ' ' + (n === 1 ? t.descOne : t.descMany) + '</span>' +
          '</button>';
      }).join('') + '</div>';
    }

    function poolFilterCount() {
      return ['city', 'type', 'operation'].filter(function (k) { return !!filters[k]; }).length + (filters.minCommission ? 1 : 0);
    }

    // Ciudad/tipo/operación/comisión mínima ya no están siempre abiertos en
    // 4 cajas: viven en esta hoja, detrás de un solo botón "Filtros" — igual
    // que el resto de la app (p. ej. Explorar). La colonia sigue como campo
    // de búsqueda directo porque es lo que más se escribe.
    function openPoolFiltersSheet() {
      var cities = Array.from(new Set(window.App.state.properties.all().map(function (p) { return p.city; }))).filter(Boolean);
      c.openSheet({
        title: 'Filtros',
        body:
          '<div class="form-field"><label>Ciudad</label><select data-pf-city><option value="">Todas las ciudades</option>' +
          cities.map(function (ci) { return '<option value="' + ci + '"' + (filters.city === ci ? ' selected' : '') + '>' + ci + '</option>'; }).join('') + '</select></div>' +
          '<div class="form-field"><label>Tipo de propiedad</label><select data-pf-type><option value="">Cualquier tipo</option>' +
          ['casa', 'departamento', 'terreno', 'local', 'oficina'].map(function (t) { return '<option value="' + t + '"' + (filters.type === t ? ' selected' : '') + '>' + u.propertyTypeLabel(t) + '</option>'; }).join('') + '</select></div>' +
          '<div class="form-field"><label>Operación</label><select data-pf-operation><option value="">Venta o renta</option><option value="venta"' + (filters.operation === 'venta' ? ' selected' : '') + '>Venta</option><option value="renta"' + (filters.operation === 'renta' ? ' selected' : '') + '>Renta</option></select></div>' +
          '<div class="form-field"><label>Comisión mínima (%)</label><input type="number" data-pf-commission placeholder="Ej. 5" value="' + (filters.minCommission || '') + '" /></div>' +
          '<button type="button" class="btn btn--primary btn--block" data-pf-apply>Aplicar filtros</button>'
      });
      var sheetRoot = u.qs('#sheet-root');
      u.qs('[data-pf-apply]', sheetRoot).addEventListener('click', function () {
        filters.city = u.qs('[data-pf-city]', sheetRoot).value;
        filters.type = u.qs('[data-pf-type]', sheetRoot).value;
        filters.operation = u.qs('[data-pf-operation]', sheetRoot).value;
        filters.minCommission = Number(u.qs('[data-pf-commission]', sheetRoot).value) || 0;
        c.closeSheet();
        refresh();
      });
    }

    function buscarHTML() {
      var results = sp.search(filters);
      var filterCount = poolFilterCount();

      var cards = results.map(function (p) {
        var inCatalog = sp.isInCatalog(p.id);
        var needsRequest = sp.requiresRequest(p);
        var footer = inCatalog
          ? ''
          : '<button type="button" class="btn btn--sm btn--primary btn--block" data-add-catalog="' + p.id + '">' + (needsRequest ? 'Solicitar acceso' : 'Agregar a mi catálogo') + '</button>';
        return poolCardHTML(p, footer);
      }).join('');

      return (
        '<div class="admin-section">' +
        '  <div class="pool-searchbar">' +
        '    <input type="text" data-f-neighborhood placeholder="Buscar por colonia..." value="' + u.escapeHtml(filters.neighborhood) + '" />' +
        '    <button type="button" class="pool-searchbar__filters" data-open-pool-filters aria-label="Filtros">' + u.icon('sliders', { size: 16 }) +
        (filterCount ? '<span class="badge-count">' + filterCount + '</span>' : '') + '</button>' +
        '  </div>' +
        (cards ? '<div class="pool-grid">' + cards + '</div>' : '<p class="text-muted" style="font-size:0.85rem">No hay propiedades compartidas por otros asesores que coincidan con tu búsqueda.</p>') +
        '</div>'
      );
    }

    function compartidasHTML() {
      var mine = sp.mine();
      var pending = sp.pendingRequests();

      var pendingHTML = pending.length
        ? '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Solicitudes de colaboración (' + pending.length + ')</div></div>' +
          '<div class="stack gap-2">' + pending.map(function (r) {
            var property = state.properties.get(r.propertyId);
            var requester = window.App.data.getAgent(r.requesterSlug);
            return '<div class="ranked-row"><span class="dashboard-card__icon">' + u.icon('user', { size: 16 }) + '</span>' +
              '<div class="ranked-row__info"><strong>' + (requester ? u.escapeHtml(requester.name) : r.requesterSlug) + '</strong><span>Quiere compartir: ' + (property ? u.escapeHtml(property.title) : r.propertyId) + '</span></div>' +
              '<div class="icon-btn-row"><button type="button" class="btn btn--sm btn--primary" data-approve="' + r.id + '">Aprobar</button><button type="button" class="btn btn--sm btn--outline" data-reject="' + r.id + '">Rechazar</button></div></div>';
          }).join('') + '</div></div>'
        : '';

      var propsHTML = mine.map(function (p) {
        var collaborators = sp.collaboratorsFor(p.id);
        return '<div class="admin-section">' +
          '<div class="admin-section__head"><div><div class="admin-section__title">' + u.escapeHtml(p.title) + '</div>' +
          '<div class="admin-section__subtitle">' + commissionLabel(p.sharing) + ' · Visibilidad: ' + visibilityLabel(p.sharing.visibility) + (p.sharing.conditions ? ' · "' + u.escapeHtml(p.sharing.conditions) + '"' : '') + '</div></div>' +
          '<div class="row gap-2" style="flex-wrap:wrap">' +
          '<a class="btn btn--outline btn--sm" href="#/dashboard/propiedades">Editar</a>' +
          '<button type="button" class="btn btn--outline btn--sm" data-stop-sharing="' + p.id + '" style="color:var(--color-primary);border-color:var(--color-primary)">Dejar de compartir</button>' +
          '</div></div>' +
          (collaborators.length
            ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Colaborador</th><th>Enviada</th><th>Vistas</th><th>Contactos</th><th>Visitas</th><th></th></tr></thead><tbody>' +
              collaborators.map(function (col) {
                var agentInfo = window.App.data.getAgent(col.collaboratorSlug);
                return '<tr><td class="admin-table__name">' + (agentInfo ? u.escapeHtml(agentInfo.name) : col.collaboratorSlug) + '</td>' +
                  '<td>' + col.sentCount + '</td><td>' + col.viewsCount + '</td><td>' + col.contactsCount + '</td><td>' + col.visitsScheduled + '</td>' +
                  '<td class="actions"><button type="button" class="btn btn--sm btn--outline" data-revoke="' + col.id + '">Retirar</button></td></tr>';
              }).join('') + '</tbody></table></div>'
            : '<p class="text-muted" style="font-size:0.85rem">Ningún asesor la ha agregado a su catálogo todavía.</p>') +
          '</div>';
      }).join('');

      return pendingHTML +
        (mine.length
          ? propsHTML
          : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('exchange', { size: 30 }) + '</span><h3>Aún no compartes propiedades</h3><p>Ve a "Mis propiedades" y usa el botón "Compartir" en cualquier propiedad para empezar.</p><a class="btn btn--primary" href="#/dashboard/propiedades">Ir a Mis propiedades</a></div>');
    }

    function catalogoHTML() {
      var rows = sp.catalog();
      var cards = rows.map(function (row) {
        var footer =
          '<div class="stack gap-2">' +
          '<a class="btn btn--sm btn--outline btn--block" href="#/dashboard/enlaces/nuevo">Incluir en enlace</a>' +
          '<button type="button" class="btn btn--sm btn--outline btn--block" data-remove-catalog="' + row.collaboration.id + '">Quitar</button>' +
          '</div>';
        return poolCardHTML(row.property, footer);
      }).join('');
      return '<div class="admin-section">' +
        '<div class="admin-section__head"><div><div class="admin-section__title">Propiedades en tu catálogo</div><div class="admin-section__subtitle">No puedes editar precio, fotos ni ubicación: siempre están sincronizadas con el asesor propietario</div></div></div>' +
        (cards
          ? '<div class="pool-grid">' + cards + '</div>'
          : '<p class="text-muted" style="font-size:0.85rem">Aún no has agregado propiedades compartidas por otros asesores. Ve a la pestaña "Buscar".</p>') +
        '</div>';
    }

    function liquidacionesHTML() {
      var rows = sp.settlements();
      var activeCollabs = sp.collaboratorsForMyProperties();
      return '<div class="admin-section">' +
        '<div class="admin-section__head"><div><div class="admin-section__title">Registrar liquidación</div><div class="admin-section__subtitle">Cuando cierres una venta compartida, registra cómo se dividió la comisión</div></div></div>' +
        (activeCollabs.length
          ? '<div class="form-field"><label>Colaboración</label><select data-settle-collab>' + activeCollabs.map(function (col) {
              var property = state.properties.get(col.propertyId);
              var collaborator = window.App.data.getAgent(col.collaboratorSlug);
              return '<option value="' + col.id + '">' + (property ? u.escapeHtml(property.title) : col.propertyId) + ' — ' + (collaborator ? u.escapeHtml(collaborator.name) : col.collaboratorSlug) + '</option>';
            }).join('') + '</select></div>' +
            '<div class="form-row"><div class="form-field"><label>Comisión total (MXN)</label><input type="number" data-settle-total placeholder="50000" /></div>' +
            '<div class="form-field"><label>% para colaborador</label><input type="number" data-settle-pct placeholder="50" /></div></div>' +
            '<button type="button" class="btn btn--primary btn--sm" data-create-settlement>Registrar liquidación</button>'
          : '<p class="text-muted" style="font-size:0.85rem">No tienes colaboraciones activas para liquidar todavía.</p>') +
        '</div>' +
        '<div class="admin-section">' +
        '<div class="admin-section__head"><div class="admin-section__title">Historial de liquidaciones</div></div>' +
        (rows.length
          ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Propiedad</th><th>Total</th><th>Propietario</th><th>Colaborador</th><th>Estado</th><th></th></tr></thead><tbody>' +
            rows.map(function (s) {
              var property = state.properties.get(s.propertyId);
              return '<tr><td class="admin-table__name">' + (property ? u.escapeHtml(property.title) : s.propertyId) + '</td>' +
                '<td>' + u.formatPrice(s.totalCommission) + '</td><td>' + u.formatPrice(s.ownerAmount) + '</td><td>' + u.formatPrice(s.collaboratorAmount) + '</td>' +
                '<td>' + (s.paymentStatus === 'pagada' ? '<span class="status-pill status-pill--pagado">Pagada</span>' : '<span class="status-pill status-pill--pendiente">Pendiente</span>') + '</td>' +
                '<td class="actions">' + (s.paymentStatus !== 'pagada' ? '<button type="button" class="btn btn--sm btn--outline" data-mark-paid="' + s.id + '">Marcar pagada</button>' : '') + '</td></tr>';
            }).join('') + '</tbody></table></div>'
          : '<p class="text-muted" style="font-size:0.85rem">Sin liquidaciones registradas.</p>') +
        '</div>';
    }

    function bodyForTab() {
      if (activeTab === 'buscar') return buscarHTML();
      if (activeTab === 'compartidas') return compartidasHTML();
      if (activeTab === 'catalogo') return catalogoHTML();
      return liquidacionesHTML();
    }

    function refresh() {
      var content = tabsHTML() + bodyForTab();
      ac.mount('bolsa', 'Bolsa Compartida', content, root);
      wire();
    }

    function wire() {
      u.qsa('[data-tab]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { activeTab = btn.getAttribute('data-tab'); refresh(); });
      });

      if (activeTab === 'buscar') {
        var neighborhoodEl = u.qs('[data-f-neighborhood]', root);
        if (neighborhoodEl) neighborhoodEl.addEventListener('input', u.debounce(function () { filters.neighborhood = neighborhoodEl.value; refresh(); }, 250));
        var openFiltersBtn = u.qs('[data-open-pool-filters]', root);
        if (openFiltersBtn) openFiltersBtn.addEventListener('click', openPoolFiltersSheet);
        u.qsa('[data-add-catalog]', root).forEach(function (btn) {
          btn.addEventListener('click', async function () {
            try {
              await sp.addToCatalog(btn.getAttribute('data-add-catalog'));
              u.toast('Solicitud/registro enviado', { tone: 'success' });
              refresh();
            } catch (err) {
              u.toast(err.message || 'No se pudo agregar al catálogo');
            }
          });
        });
      }

      if (activeTab === 'compartidas') {
        u.qsa('[data-approve]', root).forEach(function (btn) {
          btn.addEventListener('click', async function () {
            try { await sp.resolveRequest(btn.getAttribute('data-approve'), true); u.toast('Solicitud aprobada'); refresh(); }
            catch (err) { u.toast(err.message || 'No se pudo aprobar la solicitud'); }
          });
        });
        u.qsa('[data-reject]', root).forEach(function (btn) {
          btn.addEventListener('click', async function () {
            try { await sp.resolveRequest(btn.getAttribute('data-reject'), false); u.toast('Solicitud rechazada'); refresh(); }
            catch (err) { u.toast(err.message || 'No se pudo rechazar la solicitud'); }
          });
        });
        u.qsa('[data-revoke]', root).forEach(function (btn) {
          btn.addEventListener('click', async function () {
            try { await sp.removeFromCatalog(btn.getAttribute('data-revoke')); u.toast('Colaborador retirado'); refresh(); }
            catch (err) { u.toast(err.message || 'No se pudo retirar al colaborador'); }
          });
        });
        u.qsa('[data-stop-sharing]', root).forEach(function (btn) {
          btn.addEventListener('click', async function () {
            var propertyId = btn.getAttribute('data-stop-sharing');
            if (!window.confirm('Se dejará de compartir esta propiedad y se quitará de la lista de todos los asesores que la tienen en su catálogo. ¿Continuar?')) return;
            btn.disabled = true;
            try {
              var collaborators = sp.collaboratorsFor(propertyId);
              for (var i = 0; i < collaborators.length; i++) {
                await sp.removeFromCatalog(collaborators[i].id);
              }
              await sp.setSharing(propertyId, { enabled: false });
              u.toast('Dejaste de compartir esta propiedad', { tone: 'success' });
              refresh();
            } catch (err) {
              btn.disabled = false;
              u.toast(err.message || 'No se pudo dejar de compartir la propiedad');
            }
          });
        });
      }

      if (activeTab === 'catalogo') {
        u.qsa('[data-remove-catalog]', root).forEach(function (btn) {
          btn.addEventListener('click', async function () {
            try { await sp.removeFromCatalog(btn.getAttribute('data-remove-catalog')); u.toast('Quitada de tu catálogo'); refresh(); }
            catch (err) { u.toast(err.message || 'No se pudo quitar la propiedad'); }
          });
        });
      }

      if (activeTab === 'liquidaciones') {
        var createBtn = u.qs('[data-create-settlement]', root);
        if (createBtn) createBtn.addEventListener('click', async function () {
          var collabId = u.qs('[data-settle-collab]', root).value;
          var collab = sp.collaboratorsForMyProperties().filter(function (c2) { return c2.id === collabId; })[0];
          var total = Number(u.qs('[data-settle-total]', root).value) || 0;
          var pct = Number(u.qs('[data-settle-pct]', root).value) || 0;
          if (!collab || !total) { u.toast('Completa el monto total'); return; }
          var collaboratorAmount = Math.round(total * (pct / 100));
          try {
            await sp.createSettlement({
              propertyId: collab.propertyId, collaborationId: collab.id,
              ownerSlug: collab.ownerSlug, collaboratorSlug: collab.collaboratorSlug,
              totalCommission: total, collaboratorAmount: collaboratorAmount, ownerAmount: total - collaboratorAmount
            });
            u.toast('Liquidación registrada', { tone: 'success' });
            refresh();
          } catch (err) {
            u.toast(err.message || 'No se pudo registrar la liquidación');
          }
        });
        u.qsa('[data-mark-paid]', root).forEach(function (btn) {
          btn.addEventListener('click', async function () {
            try { await sp.markSettlementPaid(btn.getAttribute('data-mark-paid')); refresh(); }
            catch (err) { u.toast(err.message || 'No se pudo marcar como pagada'); }
          });
        });
      }
    }

    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.sharedPool = { render: render };
})();
