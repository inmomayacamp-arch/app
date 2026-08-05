// Vista "Publicar como propietario": cuenta simple + datos de la propiedad +
// espacio de pago, todo en un solo paso. Sin panel de trabajo: el propietario
// solo deja sus datos para que los interesados lo contacten directo.
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

  var STOCK_PHOTOS = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"
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
    document.title = 'Publica tu propiedad — InmoMap';

    if (state.agents.isLoggedIn()) {
      window.location.hash = '#/';
      return;
    }

    var plan = window.App.admin.data.OWNER_PLAN;
    var addon = plan.featuredAddon;
    var photos = [];
    var destacar = false;

    function photoSlotsHTML() {
      var slots = "";
      for (var i = 0; i < 6; i++) {
        var photo = photos[i];
        slots += '<button type="button" class="photo-slot" data-photo-slot="' + i + '">' +
          (photo ? '<img src="' + photo + '" alt="" />' : u.icon('camera', { size: 20 })) +
          '</button>';
      }
      return slots;
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
      '    <p class="signup-checkout__subtitle">Así te van a contactar los interesados. No necesitas crear una cuenta de asesor.</p>' +

      '    <div class="form-field"><label>Nombre completo</label><input type="text" data-name placeholder="Tu nombre" /></div>' +
      '    <div class="form-row">' +
      '    <div class="form-field"><label>Teléfono / WhatsApp</label><input type="text" data-phone placeholder="9811234567" /></div>' +
      '    <div class="form-field"><label>Correo</label><input type="email" data-email placeholder="tu@correo.com" /></div>' +
      '    </div>' +
      '    <div class="form-field"><label>Contraseña</label><input type="password" data-password placeholder="Crea una contraseña" /></div>' +

      '    <h1 class="signup-checkout__title">Datos de tu propiedad</h1>' +
      '    <div class="form-field"><label>Título</label><input type="text" data-title placeholder="Casa en Fracc. Vista Alegre" /></div>' +
      '    <div class="form-row">' +
      '    <div class="form-field"><label>Tipo</label><select data-type>' + TYPES.map(function (t) { return '<option value="' + t.value + '">' + t.label + '</option>'; }).join('') + '</select></div>' +
      '    <div class="form-field"><label>Operación</label><select data-operation><option value="venta">Venta</option><option value="renta">Renta</option></select></div>' +
      '    </div>' +
      '    <div class="form-field"><label>Precio (MXN)</label><input type="number" min="0" data-price placeholder="2,500,000" /></div>' +
      '    <div class="form-row">' +
      '    <div class="form-field"><label>Ciudad</label><input type="text" data-city placeholder="Campeche" /></div>' +
      '    <div class="form-field"><label>Colonia</label><input type="text" data-neighborhood placeholder="Vista Alegre" /></div>' +
      '    </div>' +
      '    <div class="form-field"><label>Descripción</label><textarea rows="4" data-description placeholder="Describe tu propiedad: acabados, distribución, puntos fuertes."></textarea></div>' +
      '    <div class="form-field"><label>Fotos</label><div class="photo-grid" data-photo-grid>' + photoSlotsHTML() + '</div>' +
      '    <p class="text-muted" style="font-size:0.78rem;margin-top:6px">Toca un espacio para agregar una foto de muestra.</p></div>' +

      '    <div class="form-field"><label class="row gap-2" style="cursor:pointer">' +
      '      <input type="checkbox" data-destacar style="width:18px;height:18px" /> ' + u.escapeHtml(addon.label) + ' (+$' + addon.price + ' MXN) — ' + u.escapeHtml(addon.description) +
      '    </label></div>' +

      '    <div class="payment-section">' +
      '      <div class="payment-section__title">' + u.icon('shield', { size: 15 }) + ' Método de pago</div>' +
      '      <div class="payment-options">' + paymentMethodsHTML() + '</div>' +
      '      <p class="payment-section__note">Estamos integrando el cobro en línea. Por ahora tu propiedad se publica sin costo; podrás agregar tu método de pago en cuanto esté disponible.</p>' +
      '    </div>' +

      '    <button type="button" class="btn btn--primary btn--block" data-publish>Publicar mi propiedad ($<span data-total>' + totalPrice() + '</span> MXN)</button>' +
      '  </div>' +
      '</div>';

    var totalEl = u.qs('[data-total]', root);
    u.qs('[data-destacar]', root).addEventListener('change', function (e) {
      destacar = e.target.checked;
      totalEl.textContent = totalPrice();
    });

    u.qs('[data-photo-grid]', root).addEventListener('click', function (e) {
      var slot = e.target.closest('[data-photo-slot]');
      if (!slot) return;
      var idx = Number(slot.getAttribute('data-photo-slot'));
      if (photos[idx]) {
        photos.splice(idx, 1);
      } else if (photos.length < 6) {
        photos.push(STOCK_PHOTOS[photos.length % STOCK_PHOTOS.length]);
      }
      u.qs('[data-photo-grid]', root).innerHTML = photoSlotsHTML();
    });

    var publishBtn = u.qs('[data-publish]', root);
    publishBtn.addEventListener('click', async function () {
      var name = u.qs('[data-name]', root).value.trim();
      var phone = u.qs('[data-phone]', root).value.trim();
      var email = u.qs('[data-email]', root).value.trim();
      var password = u.qs('[data-password]', root).value;
      var title = u.qs('[data-title]', root).value.trim();
      var type = u.qs('[data-type]', root).value;
      var operation = u.qs('[data-operation]', root).value;
      var price = Number(u.qs('[data-price]', root).value) || 0;
      var city = u.qs('[data-city]', root).value.trim();
      var neighborhood = u.qs('[data-neighborhood]', root).value.trim();
      var description = u.qs('[data-description]', root).value.trim();

      if (!name || !phone || !email || !password) { u.toast('Completa tus datos de contacto'); return; }
      if (password.length < 6) { u.toast('La contraseña debe tener al menos 6 caracteres'); return; }
      if (!city.trim() || !(price > 0)) { u.toast('Completa la ciudad y el precio de tu propiedad'); return; }

      publishBtn.disabled = true;
      try {
        await state.agents.register({ name: name, email: email, phone: phone, city: city, password: password, plan: 'propietario' });
        var published = await state.properties.publish({
          title: title || (u.propertyTypeLabel(type) + ' en ' + (neighborhood || city)),
          type: type, operation: operation, price: price, city: city,
          neighborhood: neighborhood || city, addressNote: '', coords: window.APP_CONFIG.DEFAULT_CENTER,
          description: description, photos: photos, featured: destacar
        });
        await state.agents.logout();
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
