// Vista "Publicar como propietario": sin cuenta ni contraseña. Solo se
// guardan sus datos de contacto directo en la propiedad (owner_name/
// owner_phone/owner_email) para que los interesados lo contacten y para que
// quede visible en el panel admin — no se crea ningún perfil público.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;

  var TYPES = [
    { value: "casa", label: "Casa" },
    { value: "departamento", label: "Depto." },
    { value: "terreno", label: "Terreno" },
    { value: "local", label: "Local" },
    { value: "oficina", label: "Oficina" }
  ];

  var PAYMENT_METHODS = [
    { icon: "dollar", label: "Tarjeta de crédito o débito" },
    { icon: "exchange", label: "Transferencia bancaria" },
    { icon: "store", label: "Pago en OXXO" }
  ];

  function render(params, root) {
    document.body.classList.add('is-admin');
    u.qs('#site-header').innerHTML = '';
    u.qs('#bottom-nav').innerHTML = '';
    document.title = 'Publica tu propiedad — InmoMaps';

    if (state.agents.isLoggedIn()) {
      window.location.hash = '#/';
      return;
    }

    var plan = window.App.admin.data.OWNER_PLAN;
    var addon = plan.featuredAddon;
    var photos = [];
    var uploadingCount = 0;
    var destacar = false;
    var mapCtrl = null;
    var coords = null;
    var mexicoStates = window.APP_CONFIG.MEXICO_STATES;
    var stateKeys = Object.keys(mexicoStates).sort(function (a, b) { return mexicoStates[a].label.localeCompare(mexicoStates[b].label, 'es'); });

    function photoSlotsHTML() {
      var tiles = photos.map(function (p, i) {
        return '<div class="photo-slot photo-slot--filled"><img src="' + p.url + '" alt="" />' +
          '<button type="button" class="photo-slot__remove" data-remove-photo="' + i + '" aria-label="Eliminar foto">' + u.icon('x', { size: 12 }) + '</button></div>';
      }).join('');
      for (var i = 0; i < uploadingCount; i++) tiles += '<div class="photo-slot photo-slot--uploading"><span class="spinner"></span></div>';
      if (photos.length + uploadingCount < 6) {
        tiles += '<button type="button" class="photo-slot photo-slot--add" data-add-photos>' + u.icon('camera', { size: 20 }) + '<span>Agregar</span></button>';
      }
      return tiles;
    }

    function paymentMethodsHTML() {
      return PAYMENT_METHODS.map(function (m) {
        return '<div class="payment-option" aria-disabled="true">' +
          '<span class="payment-option__icon">' + u.icon(m.icon, { size: 16 }) + '</span>' +
          '<span>' + m.label + '</span>' +
          '<span class="payment-option__soon">' + u.icon('clock', { size: 12 }) + ' Próximamente</span>' +
          '</div>';
      }).join('');
    }

    function totalPrice() { return plan.price + (destacar ? addon.price : 0); }

    root.innerHTML =
      '<div class="signup-checkout">' +
      '  <div class="signup-checkout__card">' +
      '    <a class="signup-checkout__back" href="#/planes-propietario">' + u.icon('chevronLeft', { size: 16 }) + ' Volver</a>' +

      '    <div class="plan-summary">' +
      '      <div class="plan-summary__head">' +
      '        <div><span class="plan-summary__label">Plan</span>' +
      '        <strong class="plan-summary__name">' + u.escapeHtml(plan.name) + '</strong></div>' +
      '        <div class="plan-summary__price">$' + plan.price + '<span>/ ' + plan.period + '</span></div>' +
      '      </div>' +
      '      <ul class="plan-summary__features">' +
      plan.features.slice(0, 3).map(function (f) { return '<li>' + u.icon('check', { size: 12 }) + u.escapeHtml(f) + '</li>'; }).join('') +
      '      </ul>' +
      '    </div>' +

      '    <h1 class="signup-checkout__title">Tus datos de contacto</h1>' +
      '    <p class="signup-checkout__subtitle">Así te van a contactar los interesados. No necesitas crear una cuenta.</p>' +

      '    <div class="form-field"><label>Nombre completo</label><input type="text" data-name placeholder="Tu nombre" /></div>' +
      '    <div class="form-row">' +
      '    <div class="form-field"><label>Teléfono / WhatsApp</label><input type="text" data-phone placeholder="9811234567" /></div>' +
      '    <div class="form-field"><label>Correo</label><input type="email" data-email placeholder="tu@correo.com" /></div>' +
      '    </div>' +

      '    <h1 class="signup-checkout__title">Datos de tu propiedad</h1>' +
      '    <div class="form-field"><label>Título</label><input type="text" data-title placeholder="Casa en Fracc. Vista Alegre" /></div>' +
      '    <div class="form-row">' +
      '    <div class="form-field"><label>Tipo</label><select data-type>' + TYPES.map(function (t) { return '<option value="' + t.value + '">' + t.label + '</option>'; }).join('') + '</select></div>' +
      '    <div class="form-field"><label>Operación</label><select data-operation><option value="venta">Venta</option><option value="renta">Renta</option></select></div>' +
      '    </div>' +
      '    <div class="form-field"><label>Precio (MXN)</label><input type="number" min="0" data-price placeholder="2,500,000" /></div>' +
      '    <div class="form-row">' +
      '    <div class="form-field"><label>Estado</label><select data-state>' +
      '      <option value="">Selecciona un estado</option>' +
      stateKeys.map(function (k) { return '<option value="' + k + '">' + u.escapeHtml(mexicoStates[k].label) + '</option>'; }).join('') +
      '    </select></div>' +
      '    <div class="form-field"><label>Ciudad</label><select data-city disabled>' +
      '      <option value="">Elige un estado primero</option>' +
      '    </select></div>' +
      '    </div>' +
      '    <div class="form-field"><label>Colonia</label><input type="text" data-neighborhood placeholder="Vista Alegre" /></div>' +
      '    <div class="form-field" data-location-wrap style="display:none">' +
      '      <label>Ubicación en el mapa</label>' +
      '      <div class="map-picker"><div class="map-canvas" data-map style="position:absolute;inset:0"></div>' +
      '      <span class="map-picker__pin">' + u.icon('pin', { size: 34 }) + '</span></div>' +
      '      <p class="text-muted" style="font-size:0.78rem;margin-top:6px">Mueve el mapa hasta ubicar el pin en tu propiedad.</p>' +
      '    </div>' +
      '    <div class="form-field"><label>Descripción</label><textarea rows="4" data-description placeholder="Describe tu propiedad: acabados, distribución, puntos fuertes."></textarea></div>' +
      '    <div class="form-field"><label>Fotos</label><div class="photo-grid" data-photo-grid>' + photoSlotsHTML() + '</div>' +
      '    <input type="file" accept="image/*" multiple data-photo-input style="display:none" />' +
      '    <p class="text-muted" style="font-size:0.78rem;margin-top:6px">Sube al menos una foto real de tu propiedad.</p></div>' +

      '    <div class="form-field"><label class="row gap-2" style="cursor:pointer">' +
      '      <input type="checkbox" data-destacar style="width:18px;height:18px" /> ' + u.escapeHtml(addon.label) + ' (+$' + addon.price + ' MXN) — ' + u.escapeHtml(addon.description) +
      '    </label></div>' +

      '    <div class="payment-section">' +
      '      <div class="payment-section__title">' + u.icon('shield', { size: 15 }) + ' Método de pago</div>' +
      '      <div class="payment-options">' + paymentMethodsHTML() + '</div>' +
      '      <p class="payment-section__note">Estamos integrando el cobro en línea. Por ahora tu propiedad se publica sin costo; podrás agregar tu método de pago en cuanto esté disponible.</p>' +
      '    </div>' +

      '    <p class="text-muted" style="font-size:0.76rem;margin:2px 0 12px">Al publicar aceptas los <a href="#/terminos" style="color:var(--color-primary);font-weight:700">Términos y condiciones</a> y el <a href="#/privacidad" style="color:var(--color-primary);font-weight:700">Aviso de privacidad</a> de InmoMaps.</p>' +
      '    <button type="button" class="btn btn--primary btn--block" data-publish>Publicar mi propiedad ($<span data-total>' + totalPrice() + '</span> MXN)</button>' +
      '  </div>' +
      '</div>';

    var totalEl = u.qs('[data-total]', root);
    u.qs('[data-destacar]', root).addEventListener('change', function (e) {
      destacar = e.target.checked;
      totalEl.textContent = totalPrice();
    });

    function wirePhotoGrid() {
      var grid = u.qs('[data-photo-grid]', root);
      var addBtn = u.qs('[data-add-photos]', grid);
      if (addBtn) addBtn.addEventListener('click', function () { fileInput.click(); });
      u.qsa('[data-remove-photo]', grid).forEach(function (btn) {
        btn.addEventListener('click', function () {
          photos.splice(Number(btn.getAttribute('data-remove-photo')), 1);
          refreshPhotos();
        });
      });
    }
    function refreshPhotos() {
      u.qs('[data-photo-grid]', root).innerHTML = photoSlotsHTML();
      wirePhotoGrid();
    }
    wirePhotoGrid();

    var fileInput = u.qs('[data-photo-input]', root);
    fileInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(fileInput.files || []);
      fileInput.value = '';
      if (!files.length) return;
      uploadingCount += files.length;
      refreshPhotos();
      files.forEach(function (file) {
        window.App.photoUpload.uploadImage(file, 'propietarios').then(function (url) {
          photos.push({ url: url });
          uploadingCount -= 1;
          refreshPhotos();
        }).catch(function (err) {
          uploadingCount -= 1;
          u.toast(err.message || 'No se pudo subir una foto');
          refreshPhotos();
        });
      });
    });

    // Estado → Ciudad en cascada: hasta elegir ambos aparece el mapa real,
    // centrado en la ciudad elegida, para ubicar el pin de la propiedad.
    u.qs('[data-state]', root).addEventListener('change', function (e) {
      var stateKey = e.target.value;
      var citySelect = u.qs('[data-city]', root);
      var wrap = u.qs('[data-location-wrap]', root);
      var state = mexicoStates[stateKey];
      if (!state) {
        citySelect.innerHTML = '<option value="">Elige un estado primero</option>';
        citySelect.disabled = true;
        wrap.style.display = 'none';
        coords = null;
        return;
      }
      var cityKeys = Object.keys(state.cities).sort(function (a, b) { return state.cities[a].label.localeCompare(state.cities[b].label, 'es'); });
      citySelect.innerHTML = '<option value="">Selecciona una ciudad</option>' +
        cityKeys.map(function (k) { return '<option value="' + u.escapeHtml(state.cities[k].label) + '">' + u.escapeHtml(state.cities[k].label) + '</option>'; }).join('');
      citySelect.disabled = false;
      wrap.style.display = 'none';
      coords = null;
    });

    u.qs('[data-city]', root).addEventListener('change', function (e) {
      var stateKey = u.qs('[data-state]', root).value;
      var state = mexicoStates[stateKey];
      var label = e.target.value;
      var wrap = u.qs('[data-location-wrap]', root);
      var entry = null;
      if (state) Object.keys(state.cities).forEach(function (k) { if (state.cities[k].label === label) entry = state.cities[k]; });
      if (!entry) { wrap.style.display = 'none'; coords = null; return; }
      coords = entry.center.slice();
      wrap.style.display = '';
      if (!mapCtrl) {
        mapCtrl = window.App.map.create(u.qs('[data-map]', root), { center: coords, zoom: 15 });
        window.App.router.onLeave(function () { mapCtrl.destroy(); });
        if (mapCtrl.ready) {
          mapCtrl.map.on('moveend', function () {
            var c = mapCtrl.map.getCenter();
            coords = [c.lng, c.lat];
          });
        }
      } else if (mapCtrl.ready) {
        mapCtrl.map.jumpTo({ center: coords, zoom: 15 });
      }
    });

    var publishBtn = u.qs('[data-publish]', root);
    publishBtn.addEventListener('click', async function () {
      var name = u.qs('[data-name]', root).value.trim();
      var phone = u.qs('[data-phone]', root).value.trim();
      var email = u.qs('[data-email]', root).value.trim();
      var title = u.qs('[data-title]', root).value.trim();
      var type = u.qs('[data-type]', root).value;
      var operation = u.qs('[data-operation]', root).value;
      var price = Number(u.qs('[data-price]', root).value) || 0;
      var stateKey = u.qs('[data-state]', root).value;
      var stateLabel = (mexicoStates[stateKey] || {}).label || '';
      var city = u.qs('[data-city]', root).value.trim();
      var neighborhood = u.qs('[data-neighborhood]', root).value.trim();
      var description = u.qs('[data-description]', root).value.trim();

      if (!name || !phone || !email) { u.toast('Completa tus datos de contacto'); return; }
      if (!stateLabel || !city) { u.toast('Selecciona el estado y la ciudad de tu propiedad'); return; }
      if (!(price > 0)) { u.toast('Ingresa el precio de tu propiedad'); return; }
      if (!photos.length) { u.toast('Sube al menos una foto real de tu propiedad'); return; }

      publishBtn.disabled = true;
      try {
        var published = await state.properties.publishOwner({
          title: title || (u.propertyTypeLabel(type) + ' en ' + (neighborhood || city)),
          type: type, operation: operation,
          price: operation === 'venta' ? price : 0,
          priceRent: operation === 'renta' ? price : null,
          state: stateLabel, city: city, neighborhood: neighborhood || city, addressNote: '',
          coords: coords || window.APP_CONFIG.DEFAULT_CENTER,
          description: description,
          photos: photos.map(function (p) { return p.url; }),
          featured: destacar,
          ownerName: name, ownerPhone: phone, ownerEmail: email
        });
        window.location.hash = '#/propiedad/' + published.id;
        u.toast('¡Tu propiedad fue publicada!', { tone: 'success' });
      } catch (err) {
        publishBtn.disabled = false;
        u.toast(err.message || 'No se pudo publicar tu propiedad');
      }
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.ownerRegister = { render: render };
})();
