// Vista "Publicidad": banners, anuncios y propiedades patrocinadas.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  var PLACEMENT_LABELS = { home_top: "Banner principal", sponsored: "Propiedad patrocinada", city: "Publicidad por ciudad" };

  function newAdSheet(refresh) {
    c.openSheet({
      title: "Nuevo anuncio",
      body:
        '<div class="form-field"><label>Título</label><input type="text" data-f="title" placeholder="Banner: Nueva promoción" /></div>' +
        '<div class="form-field"><label>Ubicación</label><select data-f="placement">' +
        '<option value="home_top">Banner principal</option><option value="sponsored">Propiedad patrocinada</option><option value="city">Publicidad por ciudad</option></select></div>' +
        '<div class="form-field"><label>Ciudad</label><input type="text" data-f="city" placeholder="Todas" value="Todas" /></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Crear anuncio</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      var title = u.qs('[data-f="title"]', sheetRoot).value.trim();
      if (!title) { u.toast('Escribe un título'); return; }
      var today = new Date().toISOString().slice(0, 10);
      s.ads.add({ title: title, placement: u.qs('[data-f="placement"]', sheetRoot).value, city: u.qs('[data-f="city"]', sheetRoot).value || 'Todas', active: true, startDate: today, endDate: today });
      c.closeSheet();
      u.toast('Anuncio creado');
      refresh();
    });
  }

  function render(params, root) {
    function refresh() {
      var ads = s.ads.all();
      var rows = ads.map(function (ad) {
        return '<tr>' +
          '<td class="admin-table__name">' + u.escapeHtml(ad.title) + '</td>' +
          '<td class="admin-table__meta">' + (PLACEMENT_LABELS[ad.placement] || ad.placement) + '</td>' +
          '<td>' + u.escapeHtml(ad.city) + '</td>' +
          '<td class="admin-table__meta">' + ad.startDate + ' – ' + ad.endDate + '</td>' +
          '<td>' + (ad.active ? ac.statusPill('activo') : ac.statusPill('inactivo')) + '</td>' +
          '<td class="actions"><div class="icon-btn-row">' +
          '<button type="button" class="btn btn--sm btn--outline" data-toggle="' + ad.id + '">' + (ad.active ? 'Desactivar' : 'Activar') + '</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-remove="' + ad.id + '">Eliminar</button>' +
          '</div></td></tr>';
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Banners y anuncios</div><div class="admin-section__subtitle">Banners principales, promociones y propiedades patrocinadas</div></div>' +
        '  <button type="button" class="btn btn--primary btn--sm" data-new-ad>' + u.icon('plus', { size: 14 }) + ' Nuevo anuncio</button></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Anuncio</th><th>Ubicación</th><th>Ciudad</th><th>Vigencia</th><th>Estado</th><th></th></tr></thead>' +
        '  <tbody>' + (rows || '<tr><td colspan="6" class="admin-table__meta">Sin anuncios</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('publicidad', 'Publicidad', content, root);

      u.qs('[data-new-ad]', root).addEventListener('click', function () { newAdSheet(refresh); });
      u.qsa('[data-toggle]', root).forEach(function (btn) { btn.addEventListener('click', function () { s.ads.toggle(btn.getAttribute('data-toggle')); refresh(); }); });
      u.qsa('[data-remove]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!window.confirm('¿Eliminar este anuncio?')) return;
          s.ads.remove(btn.getAttribute('data-remove')); refresh();
        });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.marketing = { render: render };
})();
