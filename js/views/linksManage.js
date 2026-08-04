// Vistas "Enlaces para clientes": listado y creación de enlaces personalizados.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var data = window.App.data;

  function renderList(params, root) {
    var agent = data.getAgent(window.APP_CONFIG.CURRENT_AGENT_SLUG);
    var links = state.links.byAgent(agent.slug);

    root.innerHTML =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/dashboard" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Enlaces para clientes</h1>' +
      '  <a class="btn btn--primary btn--sm" href="#/dashboard/enlaces/nuevo">' + u.icon('plus', { size: 15 }) + ' Nuevo</a>' +
      '</div>' +
      '<div class="page-wrap">' +
      (links.length
        ? '<div class="stack gap-2">' + links.map(function (link) {
          var url = window.location.origin + window.location.pathname + '#/' + agent.slug + '/' + link.clientSlug;
          return '<a class="ranked-row" href="#/dashboard/enlaces/' + link.clientSlug + '">' +
            '<span class="dashboard-card__icon">' + u.icon('user', { size: 16 }) + '</span>' +
            '<div class="ranked-row__info"><strong>' + u.escapeHtml(link.clientLabel) + '</strong><span>' + link.propertyIds.length + ' propiedades · ' + u.escapeHtml(url.replace(window.location.origin, '')) + '</span></div>' +
            u.icon('chevronRight', { size: 16 }) +
            '</a>';
        }).join('') + '</div>'
        : '<div class="empty-state"><span class="empty-state__icon">' + u.icon('link', { size: 30 }) + '</span><h3>Aún no tienes enlaces</h3><p>Crea un enlace personalizado seleccionando propiedades para un cliente específico.</p><a class="btn btn--primary" href="#/dashboard/enlaces/nuevo">Crear mi primer enlace</a></div>') +
      '</div>';

    c.mountChrome('dashboard');
    document.title = 'Enlaces para clientes — InmoMap';
  }

  function renderCreate(params, root) {
    var agent = data.getAgent(window.APP_CONFIG.CURRENT_AGENT_SLUG);
    var myProperties = state.properties.byAgent(agent.slug);
    var clientLabel = "";
    var selected = [];

    function rowsHTML() {
      return myProperties.map(function (p) {
        var checked = selected.indexOf(p.id) !== -1;
        return '<label class="select-property-row" data-row="' + p.id + '">' +
          '<img src="' + p.photos[0] + '" alt="" />' +
          '<div class="select-property-row__info"><strong>' + u.escapeHtml(p.title) + '</strong><span>' + u.formatPrice(p.price) + (p.operation === 'renta' ? '/mes' : '') + '</span></div>' +
          '<span class="checkbox-circle' + (checked ? ' is-checked' : '') + '" data-check="' + p.id + '">' + u.icon('check', { size: 14 }) + '</span>' +
          '</label>';
      }).join('');
    }

    root.innerHTML =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/dashboard/enlaces" aria-label="Cancelar">' + u.icon('x', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Nuevo enlace personalizado</h1>' +
      '</div>' +
      '<div class="page-wrap">' +
      '  <div class="form-field"><label>Nombre del cliente</label><input type="text" data-client-label placeholder="Familia García" /></div>' +
      '  <div class="form-field"><label>Selecciona las propiedades para este cliente</label></div>' +
      '  <div data-rows>' + rowsHTML() + '</div>' +
      (myProperties.length === 0 ? '<div class="empty-state"><p>Primero publica alguna propiedad para poder incluirla en un enlace.</p><a class="btn btn--primary" href="#/dashboard/publicar">Publicar propiedad</a></div>' : '') +
      '</div>' +
      '<div class="wizard-footer">' +
      '  <button type="button" class="btn btn--primary btn--block" data-create>Crear enlace (<span data-count>0</span> seleccionadas)</button>' +
      '</div>';

    c.mountChrome('dashboard');
    document.title = 'Nuevo enlace — InmoMap';

    u.qs('[data-client-label]', root).addEventListener('input', function (e) { clientLabel = e.target.value; });

    u.qs('[data-rows]', root).addEventListener('click', function (e) {
      var row = e.target.closest('[data-row]');
      if (!row) return;
      e.preventDefault();
      var id = row.getAttribute('data-row');
      var idx = selected.indexOf(id);
      if (idx === -1) selected.push(id); else selected.splice(idx, 1);
      u.qs('[data-check="' + id + '"]', row).classList.toggle('is-checked', idx === -1);
      u.qs('[data-count]', root).textContent = selected.length;
    });

    u.qs('[data-create]', root).addEventListener('click', function () {
      if (!clientLabel.trim()) { u.toast('Escribe el nombre del cliente'); return; }
      if (!selected.length) { u.toast('Selecciona al menos una propiedad'); return; }
      var link = state.links.create({ clientLabel: clientLabel.trim(), propertyIds: selected });
      u.toast('Enlace creado', { tone: 'success' });
      window.location.hash = '#/dashboard/enlaces/' + link.clientSlug;
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.linksManage = { renderList: renderList, renderCreate: renderCreate };
})();
