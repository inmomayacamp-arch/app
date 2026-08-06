// Vistas "Enlaces para clientes": listado y creación de enlaces personalizados.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var ac = window.App.agent.components;

  function renderList(params, root) {
    var agent = state.agents.current();
    var links = state.links.byAgent(agent.slug);

    var content =
      '<div class="row" style="justify-content:flex-end;margin-bottom:14px">' +
      '  <a class="btn btn--primary btn--sm" href="#/dashboard/enlaces/nuevo">' + u.icon('plus', { size: 15 }) + ' Nuevo enlace</a>' +
      '</div>' +
      (links.length
        ? '<div class="stack gap-2">' + links.map(function (link) {
          var url = window.location.origin + window.location.pathname + '#/' + agent.slug + '/' + link.clientSlug;
          return '<a class="ranked-row" href="#/dashboard/enlaces/' + link.clientSlug + '">' +
            '<span class="dashboard-card__icon">' + u.icon('user', { size: 16 }) + '</span>' +
            '<div class="ranked-row__info"><strong>' + u.escapeHtml(link.clientLabel) + '</strong><span>' + link.propertyIds.length + ' propiedades · ' + u.escapeHtml(url.replace(window.location.origin, '')) + '</span></div>' +
            u.icon('chevronRight', { size: 16 }) +
            '</a>';
        }).join('') + '</div>'
        : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('link', { size: 30 }) + '</span><h3>Aún no tienes enlaces</h3><p>Crea un enlace personalizado seleccionando propiedades para un cliente específico.</p><a class="btn btn--primary" href="#/dashboard/enlaces/nuevo">Crear mi primer enlace</a></div>');

    ac.mount('enlaces', 'Enlaces para clientes', content, root);
  }

  function renderCreate(params, root) {
    var agent = state.agents.current();
    var myProperties = state.properties.byAgent(agent.slug);
    var sharedCatalog = (window.App.agent.state.sharedPool ? window.App.agent.state.sharedPool.catalog() : []).map(function (row) { return row.property; });
    var allSelectable = myProperties.concat(sharedCatalog);
    var clientLabel = "";
    var message = "";
    var selected = [];

    function rowHTML(p) {
      var checked = selected.indexOf(p.id) !== -1;
      var isShared = p.agentSlug !== agent.slug;
      return '<label class="select-property-row" data-row="' + p.id + '">' +
        '<img src="' + p.photos[0] + '" alt="" />' +
        '<div class="select-property-row__info"><strong>' + u.escapeHtml(p.title) + (isShared ? ' <span class="badge badge--otro" style="margin-left:4px">Compartida</span>' : '') + '</strong><span>' + u.formatPrice(u.effectivePrice(p)) + (p.operation === 'renta' ? '/mes' : '') + '</span></div>' +
        '<span class="checkbox-circle' + (checked ? ' is-checked' : '') + '" data-check="' + p.id + '">' + u.icon('check', { size: 14 }) + '</span>' +
        '</label>';
    }
    function rowsHTML() {
      return allSelectable.map(rowHTML).join('');
    }

    var content =
      '<div class="admin-section" style="max-width:640px">' +
      '  <div class="form-field"><label>Nombre del cliente</label><input type="text" data-client-label placeholder="Familia García" /></div>' +
      '  <div class="form-field"><label>Mensaje personalizado (opcional)</label><textarea rows="3" data-message placeholder="Hola, te comparto estas propiedades que seleccioné especialmente para ti."></textarea></div>' +
      '  <div class="form-field"><label>Selecciona las propiedades para este cliente</label></div>' +
      '  <div data-rows>' + rowsHTML() + '</div>' +
      (allSelectable.length === 0 ? '<div class="empty-state"><p>Primero publica una propiedad o agrega una de la Bolsa Compartida para poder incluirla en un enlace.</p><a class="btn btn--primary" href="#/dashboard/publicar">Publicar propiedad</a></div>' : '') +
      '  <button type="button" class="btn btn--primary btn--block" data-create style="margin-top:16px">Crear enlace (<span data-count>0</span> seleccionadas)</button>' +
      '</div>';

    ac.mount('enlaces', 'Nuevo enlace personalizado', content, root);

    u.qs('[data-client-label]', root).addEventListener('input', function (e) { clientLabel = e.target.value; });
    u.qs('[data-message]', root).addEventListener('input', function (e) { message = e.target.value; });

    var rowsContainer = u.qs('[data-rows]', root);
    if (rowsContainer) rowsContainer.addEventListener('click', function (e) {
      var row = e.target.closest('[data-row]');
      if (!row) return;
      e.preventDefault();
      var id = row.getAttribute('data-row');
      var idx = selected.indexOf(id);
      if (idx === -1) selected.push(id); else selected.splice(idx, 1);
      u.qs('[data-check="' + id + '"]', row).classList.toggle('is-checked', idx === -1);
      u.qs('[data-count]', root).textContent = selected.length;
    });

    u.qs('[data-create]', root).addEventListener('click', async function () {
      if (!clientLabel.trim()) { u.toast('Escribe el nombre del cliente'); return; }
      if (!selected.length) { u.toast('Selecciona al menos una propiedad'); return; }
      var createBtn = u.qs('[data-create]', root);
      createBtn.disabled = true;
      try {
        var link = await state.links.create({ clientLabel: clientLabel.trim(), message: message.trim(), propertyIds: selected });
        u.toast('Enlace creado', { tone: 'success' });
        window.location.hash = '#/dashboard/enlaces/' + link.clientSlug;
      } catch (err) {
        createBtn.disabled = false;
        u.toast(err.message || 'No se pudo crear el enlace');
      }
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.linksManage = { renderList: renderList, renderCreate: renderCreate };
})();
