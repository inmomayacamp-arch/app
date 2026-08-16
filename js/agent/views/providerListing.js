// Vista "Mi ficha": edición de la propia ficha del directorio de servicios
// para cuentas plan "proveedor" (notario, valuadores, arquitectos, servicios,
// SOFOM). Mismo patrón de fotos + ubicación que ya usa el admin en
// js/admin/views/directory.js, pero como página completa del dashboard
// (ac.mount) en vez de una hoja, y editando la propia fila (profile_id =
// la cuenta con sesión), no una elegida de una lista.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var ac = window.App.agent.components;
  var supabase = window.App.supabase;

  function render(params, root) {
    var agent = state.agents.current();
    var existing = state.providers.all().filter(function (p) { return p.profileId === agent.id; })[0] || null;

    if (!existing) {
      ac.mount('mi-ficha', 'Mi ficha',
        '<div class="empty-state"><h3>No encontramos tu ficha</h3><p>Si acabas de pagar, espera unos segundos y recarga la página. Si el problema sigue, contáctanos.</p><a class="btn btn--primary" href="#/soporte">Ir a Soporte</a></div>',
        root);
      return;
    }

    var draft = {
      category: existing.category,
      name: existing.name,
      phone: existing.phone,
      whatsapp: existing.whatsapp,
      description: existing.description,
      photos: (existing.photos || []).map(function (url) { return { url: url }; }),
      coords: existing.coords,
      stateKey: null, cityKey: null,
      stateLabel: existing.state, cityLabel: existing.city
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

    function contentHTML() {
      return (
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Fotos</div></div>' +
        '  <div data-photos-wrap>' + photosHTML() + '</div>' +
        '  <input type="file" accept="image/*" multiple data-photo-input style="display:none" />' +
        '  <p class="text-muted" style="font-size:0.76rem;margin-top:6px">La primera foto es la que se usa como principal. Se optimizan automáticamente al subirlas.</p>' +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Datos generales</div></div>' +
        '  <div class="form-field"><label>Categoría</label><select data-f="category">' +
        u.SERVICE_CATEGORIES.map(function (cat) { return '<option value="' + cat.key + '"' + (draft.category === cat.key ? ' selected' : '') + '>' + cat.label + '</option>'; }).join('') +
        '</select></div>' +
        '  <div class="form-field"><label>Nombre o razón social</label><input type="text" data-f="name" value="' + u.escapeHtml(draft.name) + '" /></div>' +
        '  <div class="form-row">' +
        '  <div class="form-field"><label>Teléfono</label><input type="text" data-f="phone" value="' + u.escapeHtml(draft.phone) + '" /></div>' +
        '  <div class="form-field"><label>WhatsApp</label><input type="text" data-f="whatsapp" value="' + u.escapeHtml(draft.whatsapp) + '" /></div>' +
        '  </div>' +
        '  <div class="form-field"><label>Descripción</label><textarea rows="3" data-f="description" placeholder="Especialidad, experiencia, zonas donde atiendes...">' + u.escapeHtml(draft.description) + '</textarea></div>' +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Ubicación</div></div>' +
        '  <button type="button" class="location-picker-trigger" data-open-location>' + u.icon('pin', { size: 15 }) + '<span>' + u.escapeHtml(locationLabel()) + '</span>' + u.icon('chevronRight', { size: 15 }) + '</button>' +
        '  <p class="text-muted" style="font-size:0.76rem;margin-top:4px">Si no eliges ciudad, apareces en todo el estado.</p>' +
        (draft.stateLabel ? (
          '  <label style="margin-top:12px;display:block">Ubicación exacta en el mapa (opcional)</label>' +
          '  <div class="map-picker"><div class="map-canvas" data-map style="position:absolute;inset:0"></div><span class="map-picker__pin">' + u.icon('pin', { size: 30 }) + '</span></div>' +
          '  <p class="text-muted" style="font-size:0.76rem;margin-top:6px">Mueve el mapa hasta tu ubicación exacta. Así apareces con tu propio pin en el mapa de Explorar, además de en el directorio.</p>'
        ) : '') +
        '</div>' +

        '<button type="button" class="btn btn--primary" data-save>Guardar cambios</button>' +

        '<div class="admin-section" style="margin-top:20px">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Contraseña</div></div>' +
        '  <div class="form-field"><label>Nueva contraseña</label>' + u.passwordFieldHTML('new-password', 'Mínimo 6 caracteres', 'new-password') + '</div>' +
        '  <div class="form-field"><label>Confirmar contraseña</label>' + u.passwordFieldHTML('confirm-password', 'Repite la contraseña', 'new-password') + '</div>' +
        '  <button type="button" class="btn btn--outline" data-save-password>Cambiar contraseña</button>' +
        '</div>'
      );
    }

    function redraw() {
      if (mapCtrl) { mapCtrl.destroy(); mapCtrl = null; }
      ac.mount('mi-ficha', 'Mi ficha', contentHTML(), root);
      wire();
    }

    function collectDraft() {
      draft.category = u.qs('[data-f="category"]', root).value;
      draft.name = u.qs('[data-f="name"]', root).value;
      draft.phone = u.qs('[data-f="phone"]', root).value;
      draft.whatsapp = u.qs('[data-f="whatsapp"]', root).value;
      draft.description = u.qs('[data-f="description"]', root).value;
    }

    function wire() {
      u.wirePasswordToggles(root);
      var savePasswordBtn = u.qs('[data-save-password]', root);
      savePasswordBtn.addEventListener('click', async function () {
        var pass1 = u.qs('[data-new-password]', root).value;
        var pass2 = u.qs('[data-confirm-password]', root).value;
        if (!pass1 || pass1.length < 6) { u.toast('La contraseña debe tener al menos 6 caracteres'); return; }
        if (pass1 !== pass2) { u.toast('Las contraseñas no coinciden'); return; }
        savePasswordBtn.disabled = true;
        try {
          var updateResult = await supabase.auth.updateUser({ password: pass1 });
          if (updateResult.error) throw updateResult.error;
          u.qs('[data-new-password]', root).value = '';
          u.qs('[data-confirm-password]', root).value = '';
          u.toast('Contraseña actualizada', { tone: 'success' });
        } catch (err) {
          u.toast(err.message || 'No se pudo actualizar la contraseña');
        } finally {
          savePasswordBtn.disabled = false;
        }
      });

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
        mapCtrl = window.App.map.create(u.qs('[data-map]', root), { center: center, zoom: 15 });
        if (mapCtrl.ready) {
          mapCtrl.map.on('moveend', function () {
            var c2 = mapCtrl.map.getCenter();
            draft.coords = [c2.lng, c2.lat];
          });
        }
      }

      var fileInput = u.qs('[data-photo-input]', root);
      function bindAddPhotos() { u.qs('[data-add-photos]', root).addEventListener('click', function () { fileInput.click(); }); }
      function bindRemovePhotos() {
        u.qsa('[data-remove-photo]', root).forEach(function (btn) {
          btn.addEventListener('click', function () { draft.photos.splice(Number(btn.getAttribute('data-remove-photo')), 1); refreshPhotos(); });
        });
      }
      function refreshPhotos() {
        var wrap = u.qs('[data-photos-wrap]', root);
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

      u.qs('[data-open-location]', root).addEventListener('click', function () {
        collectDraft();
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
          redraw();
        });
      });

      u.qs('[data-save]', root).addEventListener('click', async function () {
        collectDraft();
        var name = draft.name.trim();
        var phone = draft.phone.trim();
        if (!name) { u.toast('Escribe el nombre de tu negocio'); return; }
        if (!phone) { u.toast('Escribe un teléfono de contacto'); return; }

        var saveBtn = u.qs('[data-save]', root);
        saveBtn.disabled = true;
        var photoUrls = draft.photos.filter(function (p) { return p.url; }).map(function (p) { return p.url; });
        var payload = {
          category: draft.category, name: name, phone: phone,
          whatsapp: draft.whatsapp.trim(), description: draft.description.trim(),
          photo: photoUrls[0] || '', photos: photoUrls, coords: draft.coords,
          state: draft.stateLabel, city: draft.cityLabel
        };
        try {
          await state.providers.update(existing.id, payload);
          u.toast('Ficha actualizada', { tone: 'success' });
          saveBtn.disabled = false;
        } catch (err) {
          saveBtn.disabled = false;
          u.toast(err.message || 'No se pudo guardar tu ficha');
        }
      });
    }

    redraw();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.providerListing = { render: render };
})();
