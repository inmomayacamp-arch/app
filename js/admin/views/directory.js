// Vista "Directorio": administra los proveedores de servicios (notario,
// valuadores, arquitectos, servicios, sofom) que se muestran en el
// directorio público. El cobro se arregla por fuera de la plataforma; aquí
// solo se activa/desactiva quién aparece.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var ac = window.App.admin.components;
  var s = window.App.state;

  function categoryLabel(key) {
    return (u.SERVICE_CATEGORIES.filter(function (cat) { return cat.key === key; })[0] || {}).label || key;
  }

  // "draft" lleva todos los campos en edición, incluidas las fotos ya subidas
  // y la ubicación ya elegida. Al abrir el picker de ubicación (que reemplaza
  // por completo el contenido de la hoja) se vuelve a llamar editSheet con
  // el mismo draft, así no se pierde nada de lo ya capturado en esta sesión.
  function editSheet(provider, refresh, draft) {
    var isNew = !provider;
    draft = draft || {
      category: provider ? provider.category : u.SERVICE_CATEGORIES[0].key,
      name: provider ? provider.name : '',
      phone: provider ? provider.phone : '',
      whatsapp: provider ? provider.whatsapp : '',
      description: provider ? provider.description : '',
      photos: (provider && provider.photos && provider.photos.length ? provider.photos : (provider && provider.photo ? [provider.photo] : [])).map(function (url) { return { url: url }; }),
      coords: provider ? provider.coords : null,
      stateKey: null, cityKey: null,
      stateLabel: provider ? provider.state : '',
      cityLabel: provider ? provider.city : '',
      active: provider ? provider.active : true
    };
    var uploadingCount = 0;
    var mapCtrl = null;

    function locationLabel() { return draft.cityLabel || draft.stateLabel || 'Sin ubicación'; }

    function photoTileHTML(photo, index) {
      if (photo.uploading) return '<div class="photo-slot photo-slot--uploading"><span class="spinner"></span></div>';
      return (
        '<div class="photo-slot photo-slot--filled">' +
        '<img src="' + photo.url + '" alt="" />' +
        (index === 0 ? '<span class="photo-slot__badge">Principal</span>' : '') +
        '<button type="button" class="photo-slot__remove" data-remove-photo="' + index + '" aria-label="Eliminar foto">' + u.icon('x', { size: 12 }) + '</button>' +
        '</div>'
      );
    }

    function photosHTML() {
      var tiles = draft.photos.map(photoTileHTML).join('');
      for (var i = 0; i < uploadingCount; i++) tiles += photoTileHTML({ uploading: true }, -1);
      return (
        '<div class="photo-grid photo-grid--upload" data-photo-grid>' + tiles +
        '<button type="button" class="photo-slot photo-slot--add" data-add-photos>' + u.icon('camera', { size: 22 }) + '<span>Agregar fotos</span></button>' +
        '</div>'
      );
    }

    function bodyHTML() {
      return (
        '<div class="form-field"><label>Fotos</label><div data-photos-wrap>' + photosHTML() + '</div>' +
        '<input type="file" accept="image/*" multiple data-photo-input style="display:none" />' +
        '<p class="text-muted" style="font-size:0.76rem;margin-top:6px">La primera foto es la que se usa como principal. Se optimizan automáticamente al subirlas.</p></div>' +
        '<div class="form-field"><label>Categoría</label><select data-f="category">' +
        u.SERVICE_CATEGORIES.map(function (cat) { return '<option value="' + cat.key + '"' + (draft.category === cat.key ? ' selected' : '') + '>' + cat.label + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="form-field"><label>Nombre o razón social</label><input type="text" data-f="name" value="' + u.escapeHtml(draft.name) + '" placeholder="Notaría 5 — Lic. Juan Pérez" /></div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Teléfono</label><input type="text" data-f="phone" value="' + u.escapeHtml(draft.phone) + '" placeholder="9811234567" /></div>' +
        '<div class="form-field"><label>WhatsApp</label><input type="text" data-f="whatsapp" value="' + u.escapeHtml(draft.whatsapp) + '" placeholder="9811234567" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Ubicación</label>' +
        '<button type="button" class="location-picker-trigger" data-open-location>' + u.icon('pin', { size: 15 }) + '<span>' + u.escapeHtml(locationLabel()) + '</span>' + u.icon('chevronRight', { size: 15 }) + '</button>' +
        '<p class="text-muted" style="font-size:0.76rem;margin-top:4px">Si no eliges ciudad, aparece en todo el estado.</p>' +
        (draft.stateLabel ? (
          '<label style="margin-top:12px;display:block">Ubicación exacta en el mapa (opcional)</label>' +
          '<div class="map-picker"><div class="map-canvas" data-map style="position:absolute;inset:0"></div><span class="map-picker__pin">' + u.icon('pin', { size: 30 }) + '</span></div>' +
          '<p class="text-muted" style="font-size:0.76rem;margin-top:6px">Mueve el mapa hasta el punto exacto. Así aparece con su propio pin en Explorar, además de en el directorio.</p>'
        ) : '') +
        '</div>' +
        '<div class="form-field"><label>Descripción</label><textarea rows="3" data-f="description" placeholder="Especialidad, experiencia, zonas donde atiende...">' + u.escapeHtml(draft.description) + '</textarea></div>' +
        '<div class="form-field"><label class="row gap-2" style="cursor:pointer"><input type="checkbox" data-f="active"' + (draft.active ? ' checked' : '') + ' style="width:18px;height:18px" /> Activo (visible en el directorio público)</label></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>' + (isNew ? 'Crear proveedor' : 'Guardar cambios') + '</button>'
      );
    }

    function collectDraft(sheetRoot) {
      draft.category = u.qs('[data-f="category"]', sheetRoot).value;
      draft.name = u.qs('[data-f="name"]', sheetRoot).value;
      draft.phone = u.qs('[data-f="phone"]', sheetRoot).value;
      draft.whatsapp = u.qs('[data-f="whatsapp"]', sheetRoot).value;
      draft.description = u.qs('[data-f="description"]', sheetRoot).value;
      draft.active = u.qs('[data-f="active"]', sheetRoot).checked;
    }

    c.openSheet({
      title: isNew ? 'Nuevo proveedor' : 'Editar proveedor', body: bodyHTML(),
      onClose: function () { if (mapCtrl) { mapCtrl.destroy(); mapCtrl = null; } }
    });
    wire();

    function wire() {
      var sheetRoot = u.qs('#sheet-root');

      if (draft.stateLabel) {
        var states = window.APP_CONFIG.MEXICO_STATES;
        var stateKey = null;
        Object.keys(states).forEach(function (k) { if (states[k].label === draft.stateLabel) stateKey = k; });
        var center = draft.coords;
        if (!center && stateKey) {
          var st = states[stateKey];
          var cityKey = null;
          if (draft.cityLabel) Object.keys(st.cities).forEach(function (k) { if (st.cities[k].label === draft.cityLabel) cityKey = k; });
          center = (cityKey ? st.cities[cityKey].center : st.center).slice();
        }
        mapCtrl = window.App.map.create(u.qs('[data-map]', sheetRoot), { center: center, zoom: 15 });
        if (mapCtrl.ready) {
          mapCtrl.map.on('moveend', function () {
            var c2 = mapCtrl.map.getCenter();
            draft.coords = [c2.lng, c2.lat];
          });
        }
      }

      var fileInput = u.qs('[data-photo-input]', sheetRoot);
      function bindAddPhotos() { u.qs('[data-add-photos]', sheetRoot).addEventListener('click', function () { fileInput.click(); }); }
      function bindRemovePhotos() {
        u.qsa('[data-remove-photo]', sheetRoot).forEach(function (btn) {
          btn.addEventListener('click', function () { draft.photos.splice(Number(btn.getAttribute('data-remove-photo')), 1); refreshPhotos(); });
        });
      }
      function refreshPhotos() {
        var wrap = u.qs('[data-photos-wrap]', sheetRoot);
        wrap.innerHTML = photosHTML();
        bindAddPhotos();
        bindRemovePhotos();
      }
      bindAddPhotos();
      bindRemovePhotos();

      fileInput.addEventListener('change', function () {
        var files = Array.prototype.slice.call(fileInput.files || []);
        fileInput.value = '';
        if (!files.length) return;
        uploadingCount += files.length;
        refreshPhotos();
        files.forEach(function (file) {
          window.App.photoUpload.uploadImage(file, 'directorio').then(function (url) {
            draft.photos.push({ url: url });
            uploadingCount -= 1;
            refreshPhotos();
          }).catch(function (err) {
            uploadingCount -= 1;
            refreshPhotos();
            u.toast(err.message || 'No se pudo subir una foto');
          });
        });
      });

      u.qs('[data-open-location]', sheetRoot).addEventListener('click', function () {
        collectDraft(sheetRoot);
        if (mapCtrl) { mapCtrl.destroy(); mapCtrl = null; }
        c.openLocationSheet({ stateKey: draft.stateKey, cityKey: draft.cityKey }, function (applied) {
          draft.stateKey = applied.stateKey;
          draft.cityKey = applied.cityKey;
          var st = applied.stateKey && window.APP_CONFIG.MEXICO_STATES[applied.stateKey];
          var newStateLabel = st ? st.label : '';
          var newCityLabel = (st && applied.cityKey && st.cities[applied.cityKey]) ? st.cities[applied.cityKey].label : '';
          // Si cambiaron de ciudad/estado, el pin exacto anterior ya no aplica.
          if (newStateLabel !== draft.stateLabel || newCityLabel !== draft.cityLabel) draft.coords = null;
          draft.stateLabel = newStateLabel;
          draft.cityLabel = newCityLabel;
          editSheet(provider, refresh, draft);
        });
      });

      u.qs('[data-save]', sheetRoot).addEventListener('click', async function () {
        collectDraft(sheetRoot);
        var name = draft.name.trim();
        var phone = draft.phone.trim();
        if (!name) { u.toast('Escribe el nombre del proveedor'); return; }
        if (!phone) { u.toast('Escribe un teléfono de contacto'); return; }

        var saveBtn = u.qs('[data-save]', sheetRoot);
        saveBtn.disabled = true;
        var photoUrls = draft.photos.filter(function (p) { return p.url; }).map(function (p) { return p.url; });
        var payload = {
          category: draft.category, name: name, phone: phone,
          whatsapp: draft.whatsapp.trim(), description: draft.description.trim(),
          photo: photoUrls[0] || '', photos: photoUrls, coords: draft.coords,
          state: draft.stateLabel, city: draft.cityLabel, active: draft.active
        };
        try {
          if (isNew) { await s.providers.create(payload); u.toast('Proveedor creado'); }
          else { await s.providers.update(provider.id, payload); u.toast('Proveedor actualizado'); }
          c.closeSheet();
          refresh();
        } catch (err) {
          saveBtn.disabled = false;
          u.toast(err.message || 'No se pudo guardar el proveedor');
        }
      });
    }
  }

  function render(params, root) {
    function refresh() {
      var providers = s.providers.all();

      var rows = providers.map(function (p) {
        var cover = p.photos && p.photos.length ? p.photos[0] : p.photo;
        return (
          '<div class="admin-row-card">' +
          '  <div class="admin-row-card__main">' +
          (cover
            ? '<img class="admin-row-card__avatar admin-row-card__avatar--round" src="' + u.thumbUrl(cover, 88, 88) + '" alt="" loading="lazy" />'
            : '<span class="admin-row-card__avatar admin-row-card__avatar--round admin-row-card__avatar--icon">' + u.icon('award', { size: 18 }) + '</span>') +
          '    <div class="admin-row-card__body">' +
          '      <strong>' + u.escapeHtml(p.name) + '</strong>' +
          '      <span class="admin-row-card__meta">' + u.escapeHtml(categoryLabel(p.category)) + ' · ' + u.escapeHtml(p.city || p.state || 'Sin ubicación') + (p.coords ? ' · en el mapa' : '') + '</span>' +
          '    </div>' +
          '  </div>' +
          '  <div class="admin-row-card__foot">' +
          ac.statusPill(p.active ? 'activo' : 'inactivo') +
          '    <div class="admin-row-card__actions">' +
          '    <button type="button" class="btn btn--sm btn--outline" data-edit="' + p.id + '">Editar</button>' +
          '    <button type="button" class="btn btn--sm btn--outline" data-toggle="' + p.id + '">' + (p.active ? 'Desactivar' : 'Activar') + '</button>' +
          '    <button type="button" class="btn btn--sm btn--outline" data-delete="' + p.id + '">Eliminar</button>' +
          '    </div>' +
          '  </div>' +
          '</div>'
        );
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Proveedores (' + providers.length + ')</div>' +
        '  <div class="admin-section__subtitle">Notario, valuadores, arquitectos, servicios y SOFOM que se muestran en el directorio público</div></div>' +
        '  <button type="button" class="btn btn--primary btn--sm" data-new>' + u.icon('plus', { size: 14 }) + ' Nuevo proveedor</button></div>' +
        '  <div class="admin-row-list">' + (rows || '<p class="text-muted" style="font-size:0.85rem">Sin proveedores todavía</p>') + '</div>' +
        '</div>';

      ac.mount('directorio', 'Directorio', content, root);

      u.qs('[data-new]', root).addEventListener('click', function () { editSheet(null, refresh); });
      u.qsa('[data-edit]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { editSheet(s.providers.get(btn.getAttribute('data-edit')), refresh); });
      });
      u.qsa('[data-toggle]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var p = s.providers.get(btn.getAttribute('data-toggle'));
          try { await s.providers.update(p.id, { active: !p.active }); u.toast(p.active ? 'Proveedor desactivado' : 'Proveedor activado'); refresh(); }
          catch (err) { u.toast(err.message || 'No se pudo actualizar'); }
        });
      });
      u.qsa('[data-delete]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (!window.confirm('¿Eliminar este proveedor del directorio?')) return;
          try { await s.providers.remove(btn.getAttribute('data-delete')); u.toast('Proveedor eliminado'); refresh(); }
          catch (err) { u.toast(err.message || 'No se pudo eliminar'); }
        });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.directory = { render: render };
})();
