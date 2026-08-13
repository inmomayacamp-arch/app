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

  // "draft" lleva todos los campos en edición, incluida la foto ya subida y
  // la ubicación ya elegida. Al abrir el picker de ubicación (que reemplaza
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
      photo: provider ? provider.photo : '',
      stateKey: null, cityKey: null,
      stateLabel: provider ? provider.state : '',
      cityLabel: provider ? provider.city : '',
      active: provider ? provider.active : true
    };
    var uploadingPhoto = false;

    function locationLabel() { return draft.cityLabel || draft.stateLabel || 'Sin ubicación'; }

    function photoHTML() {
      return (
        '<button type="button" class="profile-avatar-picker" data-photo-picker aria-label="Cambiar foto">' +
        (uploadingPhoto
          ? '<span class="spinner"></span>'
          : (draft.photo ? '<img src="' + draft.photo + '" alt="" />' : u.icon('camera', { size: 20 }))) +
        '<span class="profile-avatar-picker__badge">' + u.icon('camera', { size: 13 }) + '</span>' +
        '</button>'
      );
    }

    function bodyHTML() {
      return (
        '<div class="form-field" style="align-items:center;flex-direction:row;gap:14px">' +
        '<div data-photo-wrap>' + photoHTML() + '</div>' +
        '<input type="file" accept="image/*" data-photo-input style="display:none" />' +
        '<span class="text-muted" style="font-size:0.8rem">Foto o logo (opcional)</span>' +
        '</div>' +
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
        '<p class="text-muted" style="font-size:0.76rem;margin-top:4px">Si no eliges ciudad, aparece en todo el estado.</p></div>' +
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

    c.openSheet({ title: isNew ? 'Nuevo proveedor' : 'Editar proveedor', body: bodyHTML() });
    wire();

    function wire() {
      var sheetRoot = u.qs('#sheet-root');

      var fileInput = u.qs('[data-photo-input]', sheetRoot);
      u.qs('[data-photo-picker]', sheetRoot).addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        fileInput.value = '';
        if (!file) return;
        uploadingPhoto = true;
        refreshPhoto();
        window.App.photoUpload.uploadImage(file, 'directorio').then(function (url) {
          draft.photo = url;
          uploadingPhoto = false;
          refreshPhoto();
        }).catch(function (err) {
          uploadingPhoto = false;
          refreshPhoto();
          u.toast(err.message || 'No se pudo subir la foto');
        });
      });

      function refreshPhoto() {
        var wrap = u.qs('[data-photo-wrap]', sheetRoot);
        wrap.innerHTML = photoHTML();
        u.qs('[data-photo-picker]', wrap).addEventListener('click', function () { fileInput.click(); });
      }

      u.qs('[data-open-location]', sheetRoot).addEventListener('click', function () {
        collectDraft(sheetRoot);
        c.openLocationSheet({ stateKey: draft.stateKey, cityKey: draft.cityKey }, function (applied) {
          draft.stateKey = applied.stateKey;
          draft.cityKey = applied.cityKey;
          var st = applied.stateKey && window.APP_CONFIG.MEXICO_STATES[applied.stateKey];
          draft.stateLabel = st ? st.label : '';
          draft.cityLabel = (st && applied.cityKey && st.cities[applied.cityKey]) ? st.cities[applied.cityKey].label : '';
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
        var payload = {
          category: draft.category, name: name, phone: phone,
          whatsapp: draft.whatsapp.trim(), description: draft.description.trim(),
          photo: draft.photo, state: draft.stateLabel, city: draft.cityLabel, active: draft.active
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
        return '<tr>' +
          '<td>' + (p.photo ? '<img src="' + u.thumbUrl(p.photo, 80, 80) + '" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover" />' : '<span class="provider-card__icon-fallback" style="width:40px;height:40px;border-radius:50%;--cat-color:var(--color-primary);--cat-bg:var(--color-primary-light)">' + u.icon('award', { size: 16 }) + '</span>') + '</td>' +
          '<td><div class="admin-table__name">' + u.escapeHtml(p.name) + '</div><div class="admin-table__meta">' + u.escapeHtml(p.city || p.state || 'Sin ubicación') + '</div></td>' +
          '<td>' + u.escapeHtml(categoryLabel(p.category)) + '</td>' +
          '<td>' + ac.statusPill(p.active ? 'activo' : 'inactivo') + '</td>' +
          '<td class="actions"><div class="icon-btn-row">' +
          '<button type="button" class="btn btn--sm btn--outline" data-edit="' + p.id + '">Editar</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-toggle="' + p.id + '">' + (p.active ? 'Desactivar' : 'Activar') + '</button>' +
          '<button type="button" class="btn btn--sm btn--outline" data-delete="' + p.id + '">Eliminar</button>' +
          '</div></td></tr>';
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Proveedores (' + providers.length + ')</div>' +
        '  <div class="admin-section__subtitle">Notario, valuadores, arquitectos, servicios y SOFOM que se muestran en el directorio público</div></div>' +
        '  <button type="button" class="btn btn--primary btn--sm" data-new>' + u.icon('plus', { size: 14 }) + ' Nuevo proveedor</button></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th></th><th>Nombre</th><th>Categoría</th><th>Estado</th><th></th></tr></thead>' +
        '  <tbody>' + (rows || '<tr><td colspan="5" class="admin-table__meta">Sin proveedores todavía</td></tr>') + '</tbody></table></div>' +
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
