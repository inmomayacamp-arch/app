// Vista "Publicar propiedad": formulario multi-paso (tipo/operación/precio → ubicación →
// detalles → fotos → confirmación).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  var TYPES = [
    { value: "casa", label: "Casa", icon: "home" },
    { value: "departamento", label: "Depto.", icon: "layers" },
    { value: "terreno", label: "Terreno", icon: "map" },
    { value: "local", label: "Local", icon: "store" },
    { value: "oficina", label: "Oficina", icon: "briefcase" }
  ];

  var STOCK_PHOTOS = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"
  ];

  var TOTAL_STEPS = 4;

  function render(params, root) {
    var step = 1;
    var published = null;
    var payload = {
      type: "casa", operation: "venta", price: "",
      title: "", city: "", neighborhood: "", addressNote: "",
      coords: window.APP_CONFIG.DEFAULT_CENTER.slice(),
      bedrooms: "", bathrooms: "", builtArea: "", lotArea: "", parking: "",
      description: "", photos: []
    };

    function progressHTML() {
      var dots = "";
      for (var i = 1; i <= TOTAL_STEPS; i++) {
        dots += '<span class="wizard-progress__step' + (i < step ? ' is-done' : (i === step ? ' is-active' : '')) + '"></span>';
      }
      return '<div class="wizard-progress">' + dots + '</div>';
    }

    function step1HTML() {
      return (
        '<div class="page-wrap">' +
        '<div class="form-field"><label>Tipo de propiedad</label>' +
        '<div class="type-grid">' + TYPES.map(function (t) {
          return '<button type="button" class="type-option' + (payload.type === t.value ? ' is-active' : '') + '" data-type="' + t.value + '">' + u.icon(t.icon, { size: 20 }) + '<span>' + t.label + '</span></button>';
        }).join('') + '</div></div>' +
        '<div class="form-field"><label>Operación</label>' +
        '<div class="filter-options">' +
        ['venta', 'renta'].map(function (op) {
          return '<button type="button" class="filter-option' + (payload.operation === op ? ' is-active' : '') + '" data-op="' + op + '">' + (op === 'venta' ? 'Venta' : 'Renta') + '</button>';
        }).join('') + '</div></div>' +
        '<div class="form-field"><label>Precio (MXN' + (payload.operation === 'renta' ? ' mensual' : '') + ')</label>' +
        '<div class="input-prefix"><span>$</span><input type="number" min="0" inputmode="numeric" placeholder="2,500,000" value="' + u.escapeHtml(payload.price) + '" data-field="price" /></div></div>' +
        '</div>'
      );
    }

    function step2HTML() {
      return (
        '<div class="form-field" style="padding:0 16px"><label>Ubicación en el mapa</label>' +
        '<div class="map-picker"><div class="map-canvas" data-map style="position:absolute;inset:0"></div>' +
        '<span class="map-picker__pin">' + u.icon('pin', { size: 34 }) + '</span></div>' +
        '<p class="text-muted" style="font-size:0.78rem;margin-top:6px">Mueve el mapa hasta ubicar el pin en la propiedad.</p></div>' +
        '<div class="page-wrap" style="padding-top:0">' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Ciudad</label><input type="text" data-field="city" value="' + u.escapeHtml(payload.city) + '" placeholder="Campeche" /></div>' +
        '<div class="form-field"><label>Colonia</label><input type="text" data-field="neighborhood" value="' + u.escapeHtml(payload.neighborhood) + '" placeholder="Vista Alegre" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Referencia (opcional)</label><input type="text" data-field="addressNote" value="' + u.escapeHtml(payload.addressNote) + '" placeholder="A 5 min del malecón" /></div>' +
        '</div>'
      );
    }

    function step3HTML() {
      return (
        '<div class="page-wrap">' +
        '<div class="form-field"><label>Título de la publicación</label><input type="text" data-field="title" value="' + u.escapeHtml(payload.title) + '" placeholder="Casa moderna en Vista Alegre" /></div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Recámaras</label><input type="number" min="0" data-field="bedrooms" value="' + u.escapeHtml(payload.bedrooms) + '" /></div>' +
        '<div class="form-field"><label>Baños</label><input type="number" min="0" step="0.5" data-field="bathrooms" value="' + u.escapeHtml(payload.bathrooms) + '" /></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Construcción (m²)</label><input type="number" min="0" data-field="builtArea" value="' + u.escapeHtml(payload.builtArea) + '" /></div>' +
        '<div class="form-field"><label>Terreno (m²)</label><input type="number" min="0" data-field="lotArea" value="' + u.escapeHtml(payload.lotArea) + '" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Estacionamientos</label><input type="number" min="0" data-field="parking" value="' + u.escapeHtml(payload.parking) + '" /></div>' +
        '<div class="form-field"><label>Descripción</label><textarea rows="4" data-field="description" placeholder="Describe los acabados, ubicación y puntos fuertes de la propiedad.">' + u.escapeHtml(payload.description) + '</textarea></div>' +
        '</div>'
      );
    }

    function step4HTML() {
      var slots = "";
      for (var i = 0; i < 6; i++) {
        var photo = payload.photos[i];
        slots += '<button type="button" class="photo-slot" data-photo-slot="' + i + '">' +
          (photo ? '<img src="' + photo + '" alt="" />' : u.icon('camera', { size: 22 })) +
          '</button>';
      }
      return (
        '<div class="page-wrap">' +
        '<div class="form-field"><label>Fotos de la propiedad</label>' +
        '<div class="photo-grid">' + slots + '</div>' +
        '<p class="text-muted" style="font-size:0.78rem;margin-top:8px">Toca un espacio para agregar una foto de muestra. Toca una foto agregada para quitarla.</p>' +
        '</div></div>'
      );
    }

    function confirmationHTML() {
      return (
        '<div class="empty-state" style="padding-top:64px">' +
        '<span class="empty-state__icon" style="color:var(--color-venta)">' + u.icon('check', { size: 40 }) + '</span>' +
        '<h3>¡Listo!</h3>' +
        '<p>Tu propiedad ha sido publicada correctamente.</p>' +
        '<div class="stack gap-2" style="width:100%;max-width:280px;margin-top:8px">' +
        '<a class="btn btn--primary btn--block" href="#/propiedad/' + published.id + '">Ver mi publicación</a>' +
        '<a class="btn btn--outline btn--block" href="#/dashboard">Ir al panel</a>' +
        '</div></div>'
      );
    }

    var mapCtrl = null;

    function renderStep() {
      var titles = ["", "Publicar propiedad", "Ubicación", "Detalles de la propiedad", "Fotos de la propiedad"];
      var body = step === 1 ? step1HTML() : step === 2 ? step2HTML() : step === 3 ? step3HTML() : step4HTML();

      root.innerHTML =
        '<div class="page-header">' +
        '  <button type="button" class="btn btn--icon" data-back aria-label="Atrás">' + u.icon('chevronLeft', { size: 18 }) + '</button>' +
        '  <h1 class="page-header__title">' + titles[step] + '</h1>' +
        '</div>' +
        progressHTML() +
        body +
        '<div class="wizard-footer">' +
        (step > 1 ? '<button type="button" class="btn btn--outline" data-prev>Atrás</button>' : '<a class="btn btn--outline" href="#/dashboard">Cancelar</a>') +
        '<button type="button" class="btn btn--primary btn--block" data-next>' + (step === TOTAL_STEPS ? 'Publicar' : 'Siguiente') + '</button>' +
        '</div>';

      document.body.classList.add('is-admin');
      u.qs('#site-header').innerHTML = '';
      u.qs('#bottom-nav').innerHTML = '';
      wireStep();
    }

    function readField(name) {
      var el = u.qs('[data-field="' + name + '"]', root);
      return el ? el.value : "";
    }
    function syncFields(names) {
      names.forEach(function (name) { payload[name] = readField(name); });
    }

    function wireStep() {
      u.qs('[data-back]', root).addEventListener('click', function () {
        window.location.hash = '#/dashboard';
      });

      if (step === 1) {
        u.qsa('[data-type]', root).forEach(function (btn) {
          btn.addEventListener('click', function () { payload.type = btn.getAttribute('data-type'); renderStep(); });
        });
        u.qsa('[data-op]', root).forEach(function (btn) {
          btn.addEventListener('click', function () { payload.operation = btn.getAttribute('data-op'); renderStep(); });
        });
      }

      if (step === 2) {
        mapCtrl = window.App.map.create(u.qs('[data-map]', root), { center: payload.coords, zoom: 15 });
        if (mapCtrl.ready) {
          mapCtrl.map.on('moveend', function () {
            var center = mapCtrl.map.getCenter();
            payload.coords = [center.lng, center.lat];
          });
        }
      }

      if (step === 4) {
        u.qsa('[data-photo-slot]', root).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var idx = Number(btn.getAttribute('data-photo-slot'));
            if (payload.photos[idx]) {
              payload.photos.splice(idx, 1);
            } else if (payload.photos.length < 6) {
              payload.photos.push(STOCK_PHOTOS[payload.photos.length % STOCK_PHOTOS.length]);
            }
            renderStep();
          });
        });
      }

      u.qs('[data-prev]', root) && u.qs('[data-prev]', root).addEventListener('click', function () {
        collectStepFields();
        step -= 1;
        renderStep();
      });

      u.qs('[data-next]', root).addEventListener('click', function () {
        collectStepFields();
        if (step === 1 && !(Number(payload.price) > 0)) { u.toast('Ingresa un precio válido'); return; }
        if (step === 2 && !payload.city.trim()) { u.toast('Ingresa la ciudad'); return; }
        if (step < TOTAL_STEPS) {
          step += 1;
          renderStep();
          return;
        }
        // Publicar
        if (!payload.title.trim()) {
          payload.title = u.propertyTypeLabel(payload.type) + ' en ' + (payload.neighborhood || payload.city);
        }
        published = state.properties.publish({
          title: payload.title,
          type: payload.type,
          operation: payload.operation,
          price: Number(payload.price) || 0,
          city: payload.city,
          neighborhood: payload.neighborhood || payload.city,
          addressNote: payload.addressNote,
          coords: payload.coords,
          bedrooms: payload.bedrooms ? Number(payload.bedrooms) : null,
          bathrooms: payload.bathrooms ? Number(payload.bathrooms) : null,
          builtArea: payload.builtArea ? Number(payload.builtArea) : null,
          lotArea: payload.lotArea ? Number(payload.lotArea) : null,
          parking: payload.parking ? Number(payload.parking) : null,
          description: payload.description,
          photos: payload.photos
        });
        root.innerHTML = '<div class="page-header"><h1 class="page-header__title">Publicar propiedad</h1></div>' + confirmationHTML();
        document.body.classList.add('is-admin');
        u.qs('#site-header').innerHTML = '';
        u.qs('#bottom-nav').innerHTML = '';
        u.toast('Propiedad publicada', { tone: 'success' });
      });
    }

    function collectStepFields() {
      if (step === 1) syncFields(['price']);
      if (step === 2) syncFields(['city', 'neighborhood', 'addressNote']);
      if (step === 3) syncFields(['title', 'bedrooms', 'bathrooms', 'builtArea', 'lotArea', 'parking', 'description']);
    }

    renderStep();
    document.title = 'Publicar propiedad — InmoMap';
  }

  window.App.views = window.App.views || {};
  window.App.views.publishWizard = { render: render };
})();
