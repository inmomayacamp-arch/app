// Vista "Bolsa Compartida": colaboración entre asesores (solo Plan Profesional).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var sp = window.App.agent.state.sharedPool;
  var ac = window.App.agent.components;

  var TABS = [
    { key: "buscar", label: "Buscar" },
    { key: "compartidas", label: "Mis compartidas" },
    { key: "catalogo", label: "Mi catálogo" },
    { key: "liquidaciones", label: "Liquidaciones" }
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

    function tabsHTML() {
      return '<div class="tabs" style="padding:0 0 16px">' + TABS.map(function (t) {
        return '<button type="button" class="tab' + (t.key === activeTab ? ' is-active' : '') + '" data-tab="' + t.key + '">' + t.label + '</button>';
      }).join('') + '</div>';
    }

    function buscarHTML() {
      var results = sp.search(filters);
      var cities = Array.from(new Set(window.App.state.properties.all().map(function (p) { return p.city; }))).filter(Boolean);

      var cards = results.map(function (p) {
        var owner = window.App.data.getAgent(p.agentSlug);
        var inCatalog = sp.isInCatalog(p.id);
        var needsRequest = sp.requiresRequest(p);
        return '<div class="ranked-row" style="align-items:flex-start">' +
          '<img src="' + u.thumbUrl(p.photos[0], 130) + '" alt="" loading="lazy" style="width:64px;height:64px;border-radius:8px;object-fit:cover" />' +
          '<div class="ranked-row__info">' +
          '<strong>' + u.escapeHtml(p.title) + '</strong>' +
          '<span>' + u.formatPrice(u.effectivePrice(p)) + (p.operation === 'renta' ? '/mes' : '') + ' · ' + u.escapeHtml(p.neighborhood) + ', ' + u.escapeHtml(p.city) + '</span><br />' +
          '<span>Asesor: ' + (owner ? u.escapeHtml(owner.name) : p.agentSlug) + ' · ' + commissionLabel(p.sharing) + '</span>' +
          '</div>' +
          (inCatalog
            ? '<span class="status-pill status-pill--activo">En tu catálogo</span>'
            : '<button type="button" class="btn btn--sm btn--primary" data-add-catalog="' + p.id + '">' + (needsRequest ? 'Solicitar acceso' : 'Agregar a mi catálogo') + '</button>') +
          '</div>';
      }).join('');

      return (
        '<div class="admin-section">' +
        '  <div class="admin-toolbar" style="flex-wrap:wrap">' +
        '    <select data-f-city style="border:1px solid var(--color-border-strong);border-radius:8px;padding:9px"><option value="">Todas las ciudades</option>' + cities.map(function (ci) { return '<option value="' + ci + '"' + (filters.city === ci ? ' selected' : '') + '>' + ci + '</option>'; }).join('') + '</select>' +
        '    <select data-f-type style="border:1px solid var(--color-border-strong);border-radius:8px;padding:9px"><option value="">Cualquier tipo</option>' +
        ['casa', 'departamento', 'terreno', 'local', 'oficina'].map(function (t) { return '<option value="' + t + '"' + (filters.type === t ? ' selected' : '') + '>' + u.propertyTypeLabel(t) + '</option>'; }).join('') + '</select>' +
        '    <select data-f-operation style="border:1px solid var(--color-border-strong);border-radius:8px;padding:9px"><option value="">Venta o renta</option><option value="venta"' + (filters.operation === 'venta' ? ' selected' : '') + '>Venta</option><option value="renta"' + (filters.operation === 'renta' ? ' selected' : '') + '>Renta</option></select>' +
        '    <input type="text" data-f-neighborhood placeholder="Colonia" value="' + u.escapeHtml(filters.neighborhood) + '" />' +
        '    <input type="number" data-f-commission placeholder="Comisión mín. %" style="max-width:150px" value="' + (filters.minCommission || '') + '" />' +
        '  </div>' +
        '  <div class="stack gap-2">' + (cards || '<p class="text-muted" style="font-size:0.85rem">No hay propiedades compartidas por otros asesores que coincidan con tu búsqueda.</p>') + '</div>' +
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
          '<a class="btn btn--outline btn--sm" href="#/dashboard/propiedades">Editar</a></div>' +
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
      return '<div class="admin-section">' +
        '<div class="admin-section__head"><div><div class="admin-section__title">Propiedades en tu catálogo</div><div class="admin-section__subtitle">No puedes editar precio, fotos ni ubicación: siempre están sincronizadas con el asesor propietario</div></div></div>' +
        (rows.length
          ? '<div class="stack gap-2">' + rows.map(function (row) {
            var owner = window.App.data.getAgent(row.property.agentSlug);
            return '<div class="ranked-row">' +
              '<img src="' + u.thumbUrl(row.property.photos[0], 110) + '" alt="" loading="lazy" style="width:52px;height:52px;border-radius:8px;object-fit:cover" />' +
              '<div class="ranked-row__info"><strong>' + u.escapeHtml(row.property.title) + ' <span class="badge badge--otro" style="margin-left:4px">Compartida</span></strong>' +
              '<span>' + u.formatPrice(u.effectivePrice(row.property)) + (row.property.operation === 'renta' ? '/mes' : '') + ' · Propietario: ' + (owner ? u.escapeHtml(owner.name) : row.property.agentSlug) + '</span></div>' +
              '<div class="icon-btn-row">' +
              '<a class="btn btn--sm btn--outline" href="#/dashboard/enlaces/nuevo">Incluir en enlace</a>' +
              '<button type="button" class="btn btn--sm btn--outline" data-remove-catalog="' + row.collaboration.id + '">Quitar</button>' +
              '</div></div>';
          }).join('') + '</div>'
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
        ['city', 'type', 'operation'].forEach(function (key) {
          var el = u.qs('[data-f-' + key + ']', root);
          if (el) el.addEventListener('change', function () { filters[key] = el.value; refresh(); });
        });
        var neighborhoodEl = u.qs('[data-f-neighborhood]', root);
        if (neighborhoodEl) neighborhoodEl.addEventListener('input', u.debounce(function () { filters.neighborhood = neighborhoodEl.value; refresh(); }, 250));
        var commissionEl = u.qs('[data-f-commission]', root);
        if (commissionEl) commissionEl.addEventListener('input', u.debounce(function () { filters.minCommission = Number(commissionEl.value) || 0; refresh(); }, 250));
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
