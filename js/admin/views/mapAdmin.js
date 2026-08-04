// Vista "Administración del Mapa": ciudades, estados y zonas.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function newCitySheet(refresh) {
    c.openSheet({
      title: "Nueva ciudad",
      body:
        '<div class="form-field"><label>Ciudad</label><input type="text" data-f="name" placeholder="Cancún" /></div>' +
        '<div class="form-field"><label>Estado</label><input type="text" data-f="state" placeholder="Quintana Roo" /></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Crear ciudad</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      var name = u.qs('[data-f="name"]', sheetRoot).value.trim();
      var state = u.qs('[data-f="state"]', sheetRoot).value.trim();
      if (!name) { u.toast('Escribe el nombre de la ciudad'); return; }
      s.cities.add(name, state);
      c.closeSheet();
      u.toast('Ciudad creada');
      refresh();
    });
  }

  function newZoneSheet(city, refresh) {
    c.openSheet({
      title: "Agregar zona en " + city.name,
      body:
        '<div class="form-field"><label>Nombre de la zona o colonia</label><input type="text" data-f="zone" placeholder="Nueva colonia" /></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Agregar zona</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      var zone = u.qs('[data-f="zone"]', sheetRoot).value.trim();
      if (!zone) { u.toast('Escribe el nombre de la zona'); return; }
      s.cities.addZone(city.id, zone);
      c.closeSheet();
      u.toast('Zona agregada');
      refresh();
    });
  }

  function render(params, root) {
    function refresh() {
      var cities = s.cities.all();

      var rows = cities.map(function (city) {
        return '<tr>' +
          '<td><div class="admin-table__name">' + u.escapeHtml(city.name) + '</div><div class="admin-table__meta">' + u.escapeHtml(city.state) + '</div></td>' +
          '<td class="admin-table__meta">' + city.zones.join(', ') + (city.zones.length === 0 ? 'Sin zonas' : '') + '</td>' +
          '<td>' + (city.active ? ac.statusPill('activo') : ac.statusPill('inactivo')) + '</td>' +
          '<td class="actions"><div class="icon-btn-row">' +
          '<button type="button" class="btn btn--sm btn--outline" data-zone="' + city.id + '">Agregar zona</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-toggle="' + city.id + '">' + (city.active ? 'Desactivar' : 'Activar') + '</button>' +
          '</div></td></tr>';
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Ciudades y regiones</div><div class="admin-section__subtitle">Controla en qué ciudades opera InmoMap</div></div>' +
        '  <button type="button" class="btn btn--primary btn--sm" data-new-city>' + u.icon('plus', { size: 14 }) + ' Nueva ciudad</button></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Ciudad</th><th>Zonas / colonias</th><th>Estado</th><th></th></tr></thead>' +
        '  <tbody>' + rows + '</tbody></table></div>' +
        '  <p class="text-muted" style="font-size:0.78rem;margin-top:12px">Definir límites geográficos exactos sobre el mapa estará disponible en una próxima versión.</p>' +
        '</div>';

      ac.mount('mapa', 'Mapa', content, root);

      u.qs('[data-new-city]', root).addEventListener('click', function () { newCitySheet(refresh); });
      u.qsa('[data-zone]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { newZoneSheet(cities.filter(function (c2) { return c2.id === btn.getAttribute('data-zone'); })[0], refresh); });
      });
      u.qsa('[data-toggle]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { s.cities.toggle(btn.getAttribute('data-toggle')); refresh(); });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.mapAdmin = { render: render };
})();
