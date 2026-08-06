// Vista "Publicar propiedad": formulario completo, dividido en pasos, con
// borrador/programación, fotos reales, compartir con agentes y vista previa.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var ac = window.App.agent.components;

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function toLocalDatetimeValue(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function numOrEmpty(v) { return v === null || v === undefined || v === '' ? '' : String(v); }

  function existingToPayload(p) {
    return {
      title: p.title || "", operation: p.operation || "venta", type: p.type || "casa",
      price: numOrEmpty(p.price), priceRent: numOrEmpty(p.priceRent), currency: p.currency || "MXN",
      creditsAccepted: (p.creditsAccepted || []).slice(),
      state: p.state || "", municipality: p.municipality || "", city: p.city || "", neighborhood: p.neighborhood || "",
      street: p.street || "", extNumber: p.extNumber || "", postalCode: p.postalCode || "", addressNote: p.addressNote || "",
      coords: (p.coords || window.APP_CONFIG.DEFAULT_CENTER).slice(), locationPrivacy: p.locationPrivacy || "exacta",
      bedrooms: numOrEmpty(p.bedrooms), hasLivingRoom: !!p.hasLivingRoom, hasLibrary: !!p.hasLibrary,
      bathrooms: numOrEmpty(p.bathrooms), halfBathrooms: numOrEmpty(p.halfBathrooms), parking: numOrEmpty(p.parking),
      levels: numOrEmpty(p.levels), age: numOrEmpty(p.age), lotArea: numOrEmpty(p.lotArea), builtArea: numOrEmpty(p.builtArea),
      frontage: numOrEmpty(p.frontage), depth: numOrEmpty(p.depth),
      features: (p.features || []).slice(),
      description: p.description || "",
      privateNotes: p.privateNotes || "",
      photos: (p.photos || []).map(function (url) { return { url: url }; }),
      videoUrl: p.videoUrl || "", virtualTourUrl: p.virtualTourUrl || "",
      sharing: Object.assign({ enabled: false, totalCommission: 5, collaboratorCommission: 50, fixedAmount: null, conditions: "", expiresAt: null, visibility: "todos", selectedAgentSlugs: [] }, p.sharing || {}),
      publishStatus: p.publishStatus || "publicada", scheduledAt: toLocalDatetimeValue(p.scheduledAt), featured: !!p.featured,
      tags: (p.tags || []).slice()
    };
  }

  var OPERATIONS = [
    { value: "venta", label: "Venta" },
    { value: "renta", label: "Renta" },
    { value: "venta_renta", label: "Venta y renta" }
  ];

  var CURRENCIES = [
    { value: "MXN", label: "MXN — Pesos mexicanos" },
    { value: "USD", label: "USD — Dólares" }
  ];

  var STEP_KEYS = [
    "general", "precio", "creditos", "ubicacion", "caracteristicas", "amenidades",
    "descripcion", "fotos", "video", "compartir", "publicacion", "vista_previa"
  ];
  var STEP_TITLES = {
    general: "Información general", precio: "Precio", creditos: "Créditos aceptados",
    ubicacion: "Ubicación", caracteristicas: "Características", amenidades: "Amenidades",
    descripcion: "Descripción", fotos: "Fotografías", video: "Video y recorrido virtual",
    compartir: "Compartir con otros agentes", publicacion: "Publicación y etiquetas", vista_previa: "Vista previa"
  };

  function render(params, root) {
    var agent = state.agents.current();
    var isPremium = agent.plan === "profesional";

    var editingId = params.id || null;
    var existing = editingId ? state.properties.get(editingId) : null;
    if (editingId && (!existing || existing.agentSlug !== agent.slug)) {
      ac.mount('propiedades', 'Propiedad no encontrada', '<div class="empty-state"><h3>Propiedad no encontrada</h3><a class="btn btn--primary" href="#/dashboard/propiedades">Volver</a></div>', root);
      return;
    }

    var stepIndex = 0;
    var published = null;
    var uploadingCount = 0;
    var payload = existing ? existingToPayload(existing) : {
      title: "", operation: "venta", type: "casa",
      price: "", priceRent: "", currency: "MXN",
      creditsAccepted: [],
      state: "", municipality: "", city: "", neighborhood: "", street: "", extNumber: "", postalCode: "", addressNote: "",
      coords: window.APP_CONFIG.DEFAULT_CENTER.slice(), locationPrivacy: "exacta",
      bedrooms: "", hasLivingRoom: false, hasLibrary: false, bathrooms: "", halfBathrooms: "", parking: "",
      levels: "", age: "", lotArea: "", builtArea: "", frontage: "", depth: "",
      features: [],
      description: "",
      privateNotes: "",
      photos: [],
      videoUrl: "", virtualTourUrl: "",
      sharing: { enabled: false, totalCommission: 5, collaboratorCommission: 50, fixedAmount: null, conditions: "", expiresAt: null, visibility: "todos", selectedAgentSlugs: [] },
      publishStatus: "publicada", scheduledAt: "", featured: false,
      tags: []
    };

    function progressHTML() {
      var dots = "";
      for (var i = 0; i < STEP_KEYS.length; i++) {
        dots += '<span class="wizard-progress__step' + (i < stepIndex ? ' is-done' : (i === stepIndex ? ' is-active' : '')) + '"></span>';
      }
      return '<div class="wizard-progress">' + dots + '</div>' +
        '<p class="wizard-progress__label">Paso ' + (stepIndex + 1) + ' de ' + STEP_KEYS.length + '</p>';
    }

    /* ---------- Paso 1: Información general ---------- */
    function stepGeneralHTML() {
      return (
        '<div class="page-wrap">' +
        '<div class="form-field"><label>Título de la propiedad</label><input type="text" data-field="title" value="' + u.escapeHtml(payload.title) + '" placeholder="Casa moderna en Vista Alegre" /></div>' +
        '<div class="form-field"><label>Tipo de operación</label>' +
        '<div class="filter-options">' + OPERATIONS.map(function (op) {
          return '<button type="button" class="filter-option' + (payload.operation === op.value ? ' is-active' : '') + '" data-op="' + op.value + '">' + op.label + '</button>';
        }).join('') + '</div></div>' +
        '<div class="form-field"><label>Tipo de inmueble</label>' +
        '<div class="type-grid">' + u.PROPERTY_TYPES.map(function (t) {
          return '<button type="button" class="type-option' + (payload.type === t.value ? ' is-active' : '') + '" data-type="' + t.value + '">' + u.icon(t.icon, { size: 20 }) + '<span>' + t.label + '</span></button>';
        }).join('') + '</div></div>' +
        '</div>'
      );
    }

    /* ---------- Paso 2: Precio ---------- */
    function stepPrecioHTML() {
      var showVenta = payload.operation === 'venta' || payload.operation === 'venta_renta';
      var showRenta = payload.operation === 'renta' || payload.operation === 'venta_renta';
      return (
        '<div class="page-wrap">' +
        '<div class="form-field"><label>Moneda</label><select data-field="currency">' +
        CURRENCIES.map(function (cu) { return '<option value="' + cu.value + '"' + (payload.currency === cu.value ? ' selected' : '') + '>' + cu.label + '</option>'; }).join('') +
        '</select></div>' +
        (showVenta ? '<div class="form-field"><label>Precio de venta</label><div class="input-prefix"><span>$</span><input type="number" min="0" inputmode="numeric" placeholder="2,500,000" value="' + u.escapeHtml(payload.price) + '" data-field="price" /></div></div>' : '') +
        (showRenta ? '<div class="form-field"><label>Precio de renta (mensual)</label><div class="input-prefix"><span>$</span><input type="number" min="0" inputmode="numeric" placeholder="15,000" value="' + u.escapeHtml(payload.priceRent) + '" data-field="priceRent" /></div></div>' : '') +
        '</div>'
      );
    }

    /* ---------- Paso 3: Créditos aceptados ---------- */
    function stepCreditosHTML() {
      return (
        '<div class="page-wrap">' +
        (payload.operation === 'renta' ? '<p class="text-muted" style="font-size:0.8rem;margin-bottom:12px">Estos créditos suelen aplicar para propiedades en venta. Puedes dejar esto en blanco si tu propiedad es solo en renta.</p>' : '') +
        '<div class="form-field"><label>¿Qué créditos acepta esta propiedad?</label>' +
        '<div class="checkbox-list">' + u.CREDIT_TYPES.map(function (cr) {
          var checked = payload.creditsAccepted.indexOf(cr.value) !== -1;
          return '<label class="checkbox-list__item"><input type="checkbox" data-credit="' + cr.value + '"' + (checked ? ' checked' : '') + ' /> ' + cr.label + '</label>';
        }).join('') + '</div></div>' +
        '</div>'
      );
    }

    /* ---------- Paso 4: Ubicación ---------- */
    function stepUbicacionHTML() {
      return (
        '<div class="form-field" style="padding:0 16px"><label>Ubicación en el mapa</label>' +
        '<div class="map-picker"><div class="map-canvas" data-map style="position:absolute;inset:0"></div>' +
        '<span class="map-picker__pin">' + u.icon('pin', { size: 34 }) + '</span></div>' +
        '<p class="text-muted" style="font-size:0.78rem;margin-top:6px">Mueve el mapa hasta ubicar el pin en la propiedad, o busca la dirección abajo.</p></div>' +
        '<div class="page-wrap" style="padding-top:0">' +
        '<div class="form-field"><label>Privacidad de la ubicación</label>' +
        '<div class="filter-options">' +
        '<button type="button" class="filter-option' + (payload.locationPrivacy === 'exacta' ? ' is-active' : '') + '" data-privacy="exacta">Ubicación exacta</button>' +
        '<button type="button" class="filter-option' + (payload.locationPrivacy === 'aproximada' ? ' is-active' : '') + '" data-privacy="aproximada">Ubicación aproximada</button>' +
        '</div>' +
        '<p class="text-muted" style="font-size:0.78rem;margin-top:6px">La ubicación aproximada protege la privacidad del propietario: el pin público se muestra unos metros desplazado.</p></div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Estado</label><input type="text" data-field="state" value="' + u.escapeHtml(payload.state) + '" placeholder="Campeche" /></div>' +
        '<div class="form-field"><label>Municipio</label><input type="text" data-field="municipality" value="' + u.escapeHtml(payload.municipality) + '" placeholder="Campeche" /></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Ciudad</label><input type="text" data-field="city" value="' + u.escapeHtml(payload.city) + '" placeholder="Campeche" /></div>' +
        '<div class="form-field"><label>Colonia</label><input type="text" data-field="neighborhood" value="' + u.escapeHtml(payload.neighborhood) + '" placeholder="Vista Alegre" /></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Calle</label><input type="text" data-field="street" value="' + u.escapeHtml(payload.street) + '" placeholder="Calle 10" /></div>' +
        '<div class="form-field"><label>Número exterior</label><input type="text" data-field="extNumber" value="' + u.escapeHtml(payload.extNumber) + '" placeholder="123" /></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Código postal</label><input type="text" data-field="postalCode" value="' + u.escapeHtml(payload.postalCode) + '" placeholder="24000" /></div>' +
        '<div class="form-field"><label>Referencias</label><input type="text" data-field="addressNote" value="' + u.escapeHtml(payload.addressNote) + '" placeholder="A 5 min del malecón" /></div>' +
        '</div>' +
        '</div>'
      );
    }

    /* ---------- Paso 5: Características ---------- */
    function stepCaracteristicasHTML() {
      return (
        '<div class="page-wrap">' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Recámaras</label><input type="number" min="0" data-field="bedrooms" value="' + u.escapeHtml(payload.bedrooms) + '" /></div>' +
        '<div class="form-field"><label>Niveles</label><input type="number" min="0" data-field="levels" value="' + u.escapeHtml(payload.levels) + '" /></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Baños completos</label><input type="number" min="0" data-field="bathrooms" value="' + u.escapeHtml(payload.bathrooms) + '" /></div>' +
        '<div class="form-field"><label>Medios baños</label><input type="number" min="0" data-field="halfBathrooms" value="' + u.escapeHtml(payload.halfBathrooms) + '" /></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Estacionamientos</label><input type="number" min="0" data-field="parking" value="' + u.escapeHtml(payload.parking) + '" /></div>' +
        '<div class="form-field"><label>Antigüedad (años)</label><input type="number" min="0" data-field="age" value="' + u.escapeHtml(payload.age) + '" /></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Construcción (m²)</label><input type="number" min="0" data-field="builtArea" value="' + u.escapeHtml(payload.builtArea) + '" /></div>' +
        '<div class="form-field"><label>Terreno (m²)</label><input type="number" min="0" data-field="lotArea" value="' + u.escapeHtml(payload.lotArea) + '" /></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Frente (m)</label><input type="number" min="0" data-field="frontage" value="' + u.escapeHtml(payload.frontage) + '" /></div>' +
        '<div class="form-field"><label>Fondo (m)</label><input type="number" min="0" data-field="depth" value="' + u.escapeHtml(payload.depth) + '" /></div>' +
        '</div>' +
        '<div class="form-field"><label class="row gap-2" style="cursor:pointer"><input type="checkbox" data-check="hasLivingRoom"' + (payload.hasLivingRoom ? ' checked' : '') + ' style="width:18px;height:18px" /> Tiene sala</label></div>' +
        '<div class="form-field"><label class="row gap-2" style="cursor:pointer"><input type="checkbox" data-check="hasLibrary"' + (payload.hasLibrary ? ' checked' : '') + ' style="width:18px;height:18px" /> Tiene biblioteca</label></div>' +
        '</div>'
      );
    }

    /* ---------- Paso 6: Amenidades ---------- */
    function stepAmenidadesHTML() {
      return (
        '<div class="page-wrap">' +
        '<div class="form-field"><label>Selecciona las amenidades de la propiedad</label>' +
        '<div class="checkbox-list checkbox-list--grid">' + u.AMENITIES.map(function (a) {
          var checked = payload.features.indexOf(a) !== -1;
          return '<label class="checkbox-list__item"><input type="checkbox" data-amenity="' + u.escapeHtml(a) + '"' + (checked ? ' checked' : '') + ' /> ' + u.escapeHtml(a) + '</label>';
        }).join('') + '</div></div>' +
        '</div>'
      );
    }

    /* ---------- Paso 7: Descripción ---------- */
    function generateDescription() {
      var typeLabel = u.propertyTypeLabel(payload.type).toLowerCase();
      var opLabel = payload.operation === 'venta_renta' ? 'venta y renta' : (payload.operation === 'renta' ? 'renta' : 'venta');
      var parts = [];
      parts.push((payload.title.trim() || (typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1))) + ' en ' + opLabel + (payload.neighborhood ? ', ubicada en ' + payload.neighborhood : '') + (payload.city ? (payload.neighborhood ? ', ' : ' en ') + payload.city + '.' : '.'));
      var specs = [];
      if (payload.bedrooms) specs.push(payload.bedrooms + ' recámara' + (Number(payload.bedrooms) === 1 ? '' : 's'));
      if (payload.bathrooms) specs.push(payload.bathrooms + ' baño' + (Number(payload.bathrooms) === 1 ? '' : 's') + ' completo' + (Number(payload.bathrooms) === 1 ? '' : 's'));
      if (payload.parking) specs.push(payload.parking + ' estacionamiento' + (Number(payload.parking) === 1 ? '' : 's'));
      if (payload.builtArea) specs.push(payload.builtArea + ' m² de construcción');
      if (payload.lotArea) specs.push(payload.lotArea + ' m² de terreno');
      if (specs.length) parts.push('Cuenta con ' + specs.join(', ') + '.');
      if (payload.features.length) parts.push('Entre sus amenidades destacan: ' + payload.features.slice(0, 6).join(', ') + '.');
      if (payload.creditsAccepted.length) {
        var creditLabels = payload.creditsAccepted.map(function (v) { return (u.CREDIT_TYPES.filter(function (c) { return c.value === v; })[0] || {}).label || v; });
        parts.push('Acepta los siguientes créditos: ' + creditLabels.join(', ') + '.');
      }
      parts.push('Contáctanos para agendar una visita.');
      return parts.join(' ');
    }

    function stepDescripcionHTML() {
      return (
        '<div class="page-wrap">' +
        '<div class="form-field">' +
        '<label class="row" style="justify-content:space-between;align-items:center">' +
        '<span>Descripción</span>' +
        '<button type="button" class="btn btn--outline btn--sm" data-generate-desc>' + u.icon('sparkles', { size: 13 }) + ' Generar descripción</button>' +
        '</label>' +
        '<textarea rows="6" data-field="description" placeholder="Describe los acabados, ubicación y puntos fuertes de la propiedad.">' + u.escapeHtml(payload.description) + '</textarea>' +
        '<p class="text-muted" style="font-size:0.76rem;margin-top:6px">Generamos un borrador automático con los datos que ya capturaste; siempre puedes editarlo.</p>' +
        '</div>' +
        '<div class="form-field"><label>Observaciones privadas</label><textarea rows="2" data-field="privateNotes" placeholder="Solo visibles para ti">' + u.escapeHtml(payload.privateNotes) + '</textarea></div>' +
        '</div>'
      );
    }

    /* ---------- Paso 8: Fotografías ---------- */
    function photoTileHTML(photo, index) {
      if (photo.uploading) {
        return '<div class="photo-slot photo-slot--uploading"><span class="spinner"></span></div>';
      }
      return (
        '<div class="photo-slot photo-slot--filled" draggable="true" data-photo-index="' + index + '">' +
        '<img src="' + photo.url + '" alt="" />' +
        (index === 0 ? '<span class="photo-slot__badge">Principal</span>' : '<button type="button" class="photo-slot__main" data-set-main="' + index + '" title="Usar como principal">' + u.icon('star', { size: 13 }) + '</button>') +
        '<button type="button" class="photo-slot__remove" data-remove-photo="' + index + '" aria-label="Eliminar foto">' + u.icon('x', { size: 12 }) + '</button>' +
        '<div class="photo-slot__move">' +
        '<button type="button" data-move-photo="' + index + ':-1" aria-label="Mover a la izquierda"' + (index === 0 ? ' disabled' : '') + '>' + u.icon('chevronLeft', { size: 12 }) + '</button>' +
        '<button type="button" data-move-photo="' + index + ':1" aria-label="Mover a la derecha"' + (index === payload.photos.length - 1 ? ' disabled' : '') + '>' + u.icon('chevronRight', { size: 12 }) + '</button>' +
        '</div>' +
        '</div>'
      );
    }

    function stepFotosHTML() {
      var tiles = payload.photos.map(function (p, i) { return photoTileHTML(p, i); }).join('');
      for (var i = 0; i < uploadingCount; i++) tiles += photoTileHTML({ uploading: true }, -1);
      return (
        '<div class="page-wrap">' +
        '<div class="form-field"><label>Fotos de la propiedad</label>' +
        '<div class="photo-grid photo-grid--upload" data-photo-grid>' + tiles +
        '<button type="button" class="photo-slot photo-slot--add" data-add-photos>' + u.icon('camera', { size: 22 }) + '<span>Agregar fotos</span></button>' +
        '</div>' +
        '<input type="file" accept="image/*" multiple data-photo-input style="display:none" />' +
        '<p class="text-muted" style="font-size:0.78rem;margin-top:8px">Arrastra una foto para cambiar el orden, o usa las flechas. Toca la estrella para elegirla como principal. Las imágenes se optimizan automáticamente al subirlas.</p>' +
        '</div></div>'
      );
    }

    /* ---------- Paso 9: Video y recorrido virtual ---------- */
    function stepVideoHTML() {
      return (
        '<div class="page-wrap">' +
        '<div class="form-field"><label>Enlace de video (YouTube)</label><input type="text" data-field="videoUrl" value="' + u.escapeHtml(payload.videoUrl) + '" placeholder="https://youtube.com/watch?v=..." /></div>' +
        '<p class="text-muted" style="font-size:0.76rem;margin-top:-8px;margin-bottom:16px">El video se mostrará incrustado dentro de la publicación. Solo aceptamos enlaces de YouTube para no sobrecargar el servidor.</p>' +
        '<div class="form-field"><label>Recorrido virtual (Matterport, Kuula u otro)</label><input type="text" data-field="virtualTourUrl" value="' + u.escapeHtml(payload.virtualTourUrl) + '" placeholder="https://my.matterport.com/show/?m=..." /></div>' +
        '</div>'
      );
    }

    /* ---------- Paso 10: Compartir con otros agentes ---------- */
    function stepCompartirHTML() {
      if (!isPremium) {
        return (
          '<div class="page-wrap">' +
          '<div class="promo-card"><span class="promo-card__icon">' + u.icon('exchange', { size: 28 }) + '</span>' +
          '<div class="promo-card__body"><strong>Disponible en el Plan Profesional</strong>' +
          '<p>Comparte tus propiedades con otros asesores y define una comisión de colaboración. Esta función es exclusiva del Plan Profesional.</p>' +
          '<a class="btn btn--primary btn--sm" href="#/dashboard/suscripcion">Mejorar mi plan</a></div></div>' +
          '</div>'
        );
      }
      var s = payload.sharing;
      return (
        '<div class="page-wrap">' +
        '<div class="form-field"><label class="row gap-2" style="cursor:pointer"><input type="checkbox" data-check="sharingEnabled"' + (s.enabled ? ' checked' : '') + ' style="width:18px;height:18px" /> Compartir esta propiedad con otros asesores</label>' +
        '<p class="text-muted" style="font-size:0.78rem;margin-top:4px">Solo la verán otros asesores con sesión iniciada.</p></div>' +
        '<div data-sharing-fields style="display:' + (s.enabled ? 'block' : 'none') + '">' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Comisión total (%)</label><input type="number" min="0" max="100" data-field="totalCommission" value="' + s.totalCommission + '" /></div>' +
        '<div class="form-field"><label>% para colaborador</label><input type="number" min="0" max="100" data-field="collaboratorCommission" value="' + s.collaboratorCommission + '" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Monto fijo (opcional, MXN)</label><input type="number" min="0" data-field="fixedAmount" value="' + (s.fixedAmount || '') + '" /></div>' +
        '<div class="form-field"><label>Condiciones de colaboración</label><textarea rows="2" data-field="conditions" placeholder="Ej. Solo clientes nuevos.">' + u.escapeHtml(s.conditions) + '</textarea></div>' +
        '</div>' +
        '</div>'
      );
    }

    /* ---------- Paso 11: Publicación y etiquetas ---------- */
    function stepPublicacionHTML() {
      var statusOptions = [
        { value: "publicada", label: "Publicar inmediatamente" },
        { value: "borrador", label: "Guardar como borrador" },
        { value: "programada", label: "Programar publicación" },
        { value: "oculta", label: "Ocultar temporalmente" }
      ];
      return (
        '<div class="page-wrap">' +
        '<div class="form-field"><label>Configuración de publicación</label>' +
        '<div class="stack gap-2">' + statusOptions.map(function (o) {
          return '<label class="checkbox-list__item"><input type="radio" name="publishStatus" data-publish-status="' + o.value + '"' + (payload.publishStatus === o.value ? ' checked' : '') + ' /> ' + o.label + '</label>';
        }).join('') + '</div></div>' +
        (payload.publishStatus === 'programada' ? '<div class="form-field"><label>Fecha y hora de publicación</label><input type="datetime-local" data-field="scheduledAt" value="' + u.escapeHtml(payload.scheduledAt) + '" /></div>' : '') +
        '<div class="form-field">' +
        (isPremium
          ? '<label class="row gap-2" style="cursor:pointer"><input type="checkbox" data-check="featured"' + (payload.featured ? ' checked' : '') + ' style="width:18px;height:18px" /> Publicación destacada (aparece primero en resultados)</label>'
          : '<div class="text-muted" style="font-size:0.82rem"><strong>Publicación destacada:</strong> disponible únicamente para el Plan Profesional. <a href="#/dashboard/suscripcion" style="color:var(--color-primary);font-weight:700">Mejorar mi plan</a></div>') +
        '</div>' +
        '<div class="form-field"><label>Etiquetas especiales</label>' +
        '<div class="checkbox-list">' + u.SPECIAL_TAGS.map(function (t) {
          var checked = payload.tags.indexOf(t.value) !== -1;
          return '<label class="checkbox-list__item"><input type="checkbox" data-tag="' + t.value + '"' + (checked ? ' checked' : '') + ' /> ' + t.label + '</label>';
        }).join('') + '</div></div>' +
        '</div>'
      );
    }

    /* ---------- Paso 12: Vista previa ---------- */
    function stepVistaPreviaHTML() {
      var priceLabel = payload.operation === 'venta_renta'
        ? (payload.price ? u.formatPrice(Number(payload.price)) + ' venta' : '') + (payload.price && payload.priceRent ? ' · ' : '') + (payload.priceRent ? u.formatPrice(Number(payload.priceRent)) + '/mes renta' : '')
        : (payload.operation === 'renta' ? u.formatPrice(Number(payload.priceRent) || 0) + '/mes' : u.formatPrice(Number(payload.price) || 0));
      var cover = payload.photos[0] ? payload.photos[0].url : null;
      return (
        '<div class="page-wrap">' +
        '<p class="text-secondary" style="margin-bottom:14px">Así es como verán tu propiedad los compradores. Puedes regresar a cualquier paso para editar antes de publicar.</p>' +
        '<div class="preview-card">' +
        (cover ? '<img class="preview-card__photo" src="' + cover + '" alt="" />' : '<div class="preview-card__photo preview-card__photo--empty">' + u.icon('camera', { size: 28 }) + '</div>') +
        '<div class="preview-card__body">' +
        '<span class="badge badge--' + (payload.type === 'terreno' ? 'terreno' : 'venta') + '">' + u.operationLabel(payload.operation) + '</span>' +
        '<div class="preview-card__price">' + priceLabel + ' ' + payload.currency + '</div>' +
        '<div class="preview-card__title">' + u.escapeHtml(payload.title || '(Sin título)') + '</div>' +
        '<div class="detail-location">' + u.icon('pin', { size: 14 }) + ' ' + u.escapeHtml(payload.neighborhood) + (payload.city ? ', ' + u.escapeHtml(payload.city) : '') + '</div>' +
        '<div class="specs-grid" style="margin-top:12px">' +
        (payload.bedrooms ? '<div class="specs-grid__item">' + u.icon('bed', { size: 18 }) + '<strong>' + payload.bedrooms + '</strong><span>Recámaras</span></div>' : '') +
        (payload.bathrooms ? '<div class="specs-grid__item">' + u.icon('bath', { size: 18 }) + '<strong>' + payload.bathrooms + '</strong><span>Baños</span></div>' : '') +
        (payload.builtArea ? '<div class="specs-grid__item">' + u.icon('ruler', { size: 18 }) + '<strong>' + payload.builtArea + ' m²</strong><span>Construcción</span></div>' : '') +
        (payload.parking ? '<div class="specs-grid__item">' + u.icon('car', { size: 18 }) + '<strong>' + payload.parking + '</strong><span>Estacionamiento</span></div>' : '') +
        '</div>' +
        (payload.description ? '<p class="text-secondary" style="margin-top:12px;font-size:0.86rem">' + u.escapeHtml(payload.description) + '</p>' : '') +
        (payload.features.length ? '<div class="feature-tags" style="margin-top:10px">' + payload.features.map(function (f) { return '<span class="feature-tag">' + u.escapeHtml(f) + '</span>'; }).join('') + '</div>' : '') +
        (payload.tags.length ? '<div class="feature-tags" style="margin-top:10px">' + payload.tags.map(function (v) { return '<span class="feature-tag">' + u.escapeHtml((u.SPECIAL_TAGS.filter(function (t) { return t.value === v; })[0] || {}).label || v) + '</span>'; }).join('') + '</div>' : '') +
        '</div></div>' +
        '</div>'
      );
    }

    var STEP_RENDERERS = {
      general: stepGeneralHTML, precio: stepPrecioHTML, creditos: stepCreditosHTML, ubicacion: stepUbicacionHTML,
      caracteristicas: stepCaracteristicasHTML, amenidades: stepAmenidadesHTML, descripcion: stepDescripcionHTML,
      fotos: stepFotosHTML, video: stepVideoHTML, compartir: stepCompartirHTML, publicacion: stepPublicacionHTML,
      vista_previa: stepVistaPreviaHTML
    };

    var mapCtrl = null;

    function renderStep() {
      var key = STEP_KEYS[stepIndex];
      var isLast = stepIndex === STEP_KEYS.length - 1;
      root.innerHTML =
        '<div class="page-header">' +
        '  <button type="button" class="btn btn--icon" data-back aria-label="Atrás">' + u.icon('chevronLeft', { size: 18 }) + '</button>' +
        '  <h1 class="page-header__title">' + STEP_TITLES[key] + '</h1>' +
        '</div>' +
        progressHTML() +
        STEP_RENDERERS[key]() +
        '<div class="wizard-footer">' +
        (stepIndex > 0 ? '<button type="button" class="btn btn--outline" data-prev>Atrás</button>' : '<a class="btn btn--outline" href="' + (editingId ? '#/dashboard/propiedades' : '#/dashboard') + '">Cancelar</a>') +
        '<button type="button" class="btn btn--primary btn--block" data-next' + (uploadingCount > 0 ? ' disabled' : '') + '>' + (isLast ? publishButtonLabel() : 'Siguiente') + '</button>' +
        '</div>';

      document.body.classList.add('is-admin');
      u.qs('#site-header').innerHTML = '';
      u.qs('#bottom-nav').innerHTML = '';
      wireStep(key);
    }

    function publishButtonLabel() {
      if (payload.publishStatus === 'borrador') return 'Guardar borrador';
      if (payload.publishStatus === 'programada') return 'Programar publicación';
      if (payload.publishStatus === 'oculta') return 'Guardar (oculta)';
      return editingId ? 'Guardar cambios' : 'Publicar';
    }

    function readField(name) {
      var el = u.qs('[data-field="' + name + '"]', root);
      return el ? el.value : "";
    }

    function collectStepFields() {
      var key = STEP_KEYS[stepIndex];
      if (key === 'general') { payload.title = readField('title'); }
      if (key === 'precio') { payload.price = readField('price'); payload.priceRent = readField('priceRent'); payload.currency = readField('currency') || payload.currency; }
      if (key === 'ubicacion') ['state', 'municipality', 'city', 'neighborhood', 'street', 'extNumber', 'postalCode', 'addressNote'].forEach(function (n) { payload[n] = readField(n); });
      if (key === 'caracteristicas') ['bedrooms', 'bathrooms', 'halfBathrooms', 'parking', 'levels', 'age', 'builtArea', 'lotArea', 'frontage', 'depth'].forEach(function (n) { payload[n] = readField(n); });
      if (key === 'descripcion') { payload.description = readField('description'); payload.privateNotes = readField('privateNotes'); }
      if (key === 'video') { payload.videoUrl = readField('videoUrl'); payload.virtualTourUrl = readField('virtualTourUrl'); }
      if (key === 'compartir' && payload.sharing.enabled) {
        payload.sharing.totalCommission = Number(readField('totalCommission')) || 0;
        payload.sharing.collaboratorCommission = Number(readField('collaboratorCommission')) || 0;
        payload.sharing.fixedAmount = readField('fixedAmount') ? Number(readField('fixedAmount')) : null;
        payload.sharing.conditions = readField('conditions');
      }
      if (key === 'publicacion' && payload.publishStatus === 'programada') { payload.scheduledAt = readField('scheduledAt'); }
    }

    function validateStep() {
      var key = STEP_KEYS[stepIndex];
      // Solo lo esencial es obligatorio: precio, ubicación y al menos una foto. Todo lo demás es opcional.
      if (key === 'precio') {
        var needsVenta = payload.operation === 'venta' || payload.operation === 'venta_renta';
        var needsRenta = payload.operation === 'renta' || payload.operation === 'venta_renta';
        if (needsVenta && !(Number(payload.price) > 0)) { u.toast('Ingresa un precio de venta válido'); return false; }
        if (needsRenta && !(Number(payload.priceRent) > 0)) { u.toast('Ingresa un precio de renta válido'); return false; }
      }
      if (key === 'ubicacion' && !payload.city.trim()) { u.toast('Ingresa al menos la ciudad'); return false; }
      if (key === 'fotos' && payload.photos.length === 0) { u.toast('Agrega al menos una foto de la propiedad'); return false; }
      if (key === 'publicacion' && payload.publishStatus === 'programada' && !payload.scheduledAt) { u.toast('Elige la fecha y hora de publicación'); return false; }
      return true;
    }

    function wireStep(key) {
      u.qs('[data-back]', root).addEventListener('click', function () { window.location.hash = editingId ? '#/dashboard/propiedades' : '#/dashboard'; });

      if (key === 'general') {
        u.qsa('[data-op]', root).forEach(function (btn) { btn.addEventListener('click', function () { collectStepFields(); payload.operation = btn.getAttribute('data-op'); renderStep(); }); });
        u.qsa('[data-type]', root).forEach(function (btn) { btn.addEventListener('click', function () { collectStepFields(); payload.type = btn.getAttribute('data-type'); renderStep(); }); });
      }

      if (key === 'creditos') {
        u.qsa('[data-credit]', root).forEach(function (cb) {
          cb.addEventListener('change', function () {
            var v = cb.getAttribute('data-credit');
            var idx = payload.creditsAccepted.indexOf(v);
            if (cb.checked && idx === -1) payload.creditsAccepted.push(v);
            if (!cb.checked && idx !== -1) payload.creditsAccepted.splice(idx, 1);
          });
        });
      }

      if (key === 'ubicacion') {
        mapCtrl = window.App.map.create(u.qs('[data-map]', root), { center: payload.coords, zoom: 15 });
        if (mapCtrl.ready) {
          mapCtrl.map.on('moveend', function () {
            var center = mapCtrl.map.getCenter();
            payload.coords = [center.lng, center.lat];
          });
        }
        u.qsa('[data-privacy]', root).forEach(function (btn) {
          btn.addEventListener('click', function () { collectStepFields(); payload.locationPrivacy = btn.getAttribute('data-privacy'); renderStep(); });
        });
      }

      if (key === 'caracteristicas') {
        u.qsa('[data-check]', root).forEach(function (cb) {
          cb.addEventListener('change', function () { payload[cb.getAttribute('data-check')] = cb.checked; });
        });
      }

      if (key === 'amenidades') {
        u.qsa('[data-amenity]', root).forEach(function (cb) {
          cb.addEventListener('change', function () {
            var v = cb.getAttribute('data-amenity');
            var idx = payload.features.indexOf(v);
            if (cb.checked && idx === -1) payload.features.push(v);
            if (!cb.checked && idx !== -1) payload.features.splice(idx, 1);
          });
        });
      }

      if (key === 'descripcion') {
        u.qs('[data-generate-desc]', root).addEventListener('click', function () {
          payload.description = readField('description') || payload.description;
          payload.description = generateDescription();
          u.qs('[data-field="description"]', root).value = payload.description;
        });
      }

      if (key === 'fotos') {
        var fileInput = u.qs('[data-photo-input]', root);
        u.qs('[data-add-photos]', root).addEventListener('click', function () { fileInput.click(); });
        fileInput.addEventListener('change', function () {
          var files = Array.prototype.slice.call(fileInput.files || []);
          fileInput.value = '';
          if (!files.length) return;
          uploadingCount += files.length;
          renderStep();
          files.forEach(function (file) {
            window.App.photoUpload.uploadImage(file, agent.slug).then(function (url) {
              payload.photos.push({ url: url });
              uploadingCount -= 1;
              renderStep();
            }).catch(function (err) {
              uploadingCount -= 1;
              u.toast(err.message || 'No se pudo subir una foto');
              renderStep();
            });
          });
        });
        u.qsa('[data-remove-photo]', root).forEach(function (btn) {
          btn.addEventListener('click', function () { payload.photos.splice(Number(btn.getAttribute('data-remove-photo')), 1); renderStep(); });
        });
        u.qsa('[data-set-main]', root).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var idx = Number(btn.getAttribute('data-set-main'));
            var photo = payload.photos.splice(idx, 1)[0];
            payload.photos.unshift(photo);
            renderStep();
          });
        });
        u.qsa('[data-move-photo]', root).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var parts = btn.getAttribute('data-move-photo').split(':');
            var idx = Number(parts[0]), dir = Number(parts[1]);
            var target = idx + dir;
            if (target < 0 || target >= payload.photos.length) return;
            var tmp = payload.photos[idx];
            payload.photos[idx] = payload.photos[target];
            payload.photos[target] = tmp;
            renderStep();
          });
        });
        var dragIndex = null;
        u.qsa('[data-photo-index]', root).forEach(function (tile) {
          tile.addEventListener('dragstart', function () { dragIndex = Number(tile.getAttribute('data-photo-index')); });
          tile.addEventListener('dragover', function (e) { e.preventDefault(); });
          tile.addEventListener('drop', function (e) {
            e.preventDefault();
            var dropIndex = Number(tile.getAttribute('data-photo-index'));
            if (dragIndex === null || dragIndex === dropIndex) return;
            var moved = payload.photos.splice(dragIndex, 1)[0];
            payload.photos.splice(dropIndex, 0, moved);
            dragIndex = null;
            renderStep();
          });
        });
      }

      if (key === 'compartir' && isPremium) {
        var enabledCb = u.qs('[data-check="sharingEnabled"]', root);
        enabledCb.addEventListener('change', function () {
          payload.sharing.enabled = enabledCb.checked;
          u.qs('[data-sharing-fields]', root).style.display = enabledCb.checked ? 'block' : 'none';
        });
      }

      if (key === 'publicacion') {
        u.qsa('[data-publish-status]', root).forEach(function (radio) {
          radio.addEventListener('change', function () { collectStepFields(); payload.publishStatus = radio.getAttribute('data-publish-status'); renderStep(); });
        });
        u.qsa('[data-check]', root).forEach(function (cb) {
          cb.addEventListener('change', function () { payload[cb.getAttribute('data-check')] = cb.checked; });
        });
        u.qsa('[data-tag]', root).forEach(function (cb) {
          cb.addEventListener('change', function () {
            var v = cb.getAttribute('data-tag');
            var idx = payload.tags.indexOf(v);
            if (cb.checked && idx === -1) payload.tags.push(v);
            if (!cb.checked && idx !== -1) payload.tags.splice(idx, 1);
          });
        });
      }

      u.qs('[data-prev]', root) && u.qs('[data-prev]', root).addEventListener('click', function () {
        collectStepFields();
        stepIndex -= 1;
        renderStep();
      });

      u.qs('[data-next]', root).addEventListener('click', async function () {
        collectStepFields();
        if (!validateStep()) return;
        if (stepIndex < STEP_KEYS.length - 1) {
          stepIndex += 1;
          renderStep();
          return;
        }
        await submit();
      });
    }

    async function submit() {
      if (!payload.title.trim()) {
        payload.title = u.propertyTypeLabel(payload.type) + ' en ' + (payload.neighborhood || payload.city);
      }
      var nextBtn = u.qs('[data-next]', root);
      nextBtn.disabled = true;
      try {
        var scheduledIso = payload.scheduledAt ? new Date(payload.scheduledAt).toISOString() : null;
        var row = {
          title: payload.title,
          type: payload.type,
          operation: payload.operation,
          price: (payload.operation === 'venta' || payload.operation === 'venta_renta') ? (Number(payload.price) || 0) : 0,
          priceRent: (payload.operation === 'renta' || payload.operation === 'venta_renta') ? (Number(payload.priceRent) || null) : null,
          currency: payload.currency,
          creditsAccepted: payload.creditsAccepted,
          city: payload.city, neighborhood: payload.neighborhood || payload.city, addressNote: payload.addressNote,
          state: payload.state, municipality: payload.municipality, street: payload.street,
          extNumber: payload.extNumber, postalCode: payload.postalCode, locationPrivacy: payload.locationPrivacy,
          coords: payload.coords,
          bedrooms: payload.bedrooms ? Number(payload.bedrooms) : null,
          bathrooms: payload.bathrooms ? Number(payload.bathrooms) : null,
          halfBathrooms: payload.halfBathrooms ? Number(payload.halfBathrooms) : null,
          hasLivingRoom: payload.hasLivingRoom, hasLibrary: payload.hasLibrary,
          levels: payload.levels ? Number(payload.levels) : null,
          age: payload.age ? Number(payload.age) : null,
          builtArea: payload.builtArea ? Number(payload.builtArea) : null,
          lotArea: payload.lotArea ? Number(payload.lotArea) : null,
          frontage: payload.frontage ? Number(payload.frontage) : null,
          depth: payload.depth ? Number(payload.depth) : null,
          parking: payload.parking ? Number(payload.parking) : null,
          description: payload.description,
          privateNotes: payload.privateNotes,
          features: payload.features,
          photos: payload.photos.map(function (p) { return p.url; }),
          videoUrl: payload.videoUrl, virtualTourUrl: payload.virtualTourUrl,
          sharing: payload.sharing.enabled ? payload.sharing : null,
          publishStatus: payload.publishStatus,
          scheduledAt: scheduledIso,
          featured: isPremium && payload.featured,
          tags: payload.tags
        };
        published = editingId ? await state.properties.update(editingId, row) : await state.properties.publish(row);
        renderConfirmation();
        u.toast(editingId ? 'Cambios guardados' : (payload.publishStatus === 'borrador' ? 'Borrador guardado' : 'Propiedad publicada'), { tone: 'success' });
      } catch (err) {
        nextBtn.disabled = false;
        u.toast(err.message || (editingId ? 'No se pudieron guardar los cambios' : 'No se pudo publicar la propiedad'));
      }
    }

    function renderConfirmation() {
      var statusNote = editingId ? 'Tu propiedad se actualizó correctamente.' : {
        publicada: '¡Tu propiedad ha sido publicada correctamente!',
        borrador: 'Tu propiedad se guardó como borrador. Podrás publicarla cuando quieras desde Mis propiedades.',
        programada: 'Tu propiedad se publicará automáticamente en la fecha programada.',
        oculta: 'Tu propiedad se guardó oculta. Actívala cuando quieras desde Mis propiedades.'
      }[payload.publishStatus];
      root.innerHTML =
        '<div class="page-header"><h1 class="page-header__title">' + (editingId ? 'Editar propiedad' : 'Publicar propiedad') + '</h1></div>' +
        '<div class="empty-state" style="padding-top:64px">' +
        '<span class="empty-state__icon" style="color:var(--color-venta)">' + u.icon('check', { size: 40 }) + '</span>' +
        '<h3>' + (editingId ? '¡Cambios guardados!' : '¡Listo!') + '</h3>' +
        '<p>' + statusNote + '</p>' +
        '<div class="stack gap-2" style="width:100%;max-width:280px;margin-top:8px">' +
        '<a class="btn btn--primary btn--block" href="#/propiedad/' + published.id + '">Ver mi publicación</a>' +
        '<a class="btn btn--outline btn--block" href="#/dashboard/propiedades">Ir a mis propiedades</a>' +
        '</div></div>';
      document.body.classList.add('is-admin');
      u.qs('#site-header').innerHTML = '';
      u.qs('#bottom-nav').innerHTML = '';
    }

    renderStep();
    document.title = (editingId ? 'Editar propiedad' : 'Publicar propiedad') + ' — InmoMaps';
  }

  window.App.views = window.App.views || {};
  window.App.views.publishWizard = { render: render };
})();
