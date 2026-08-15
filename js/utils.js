// Utilidades compartidas: iconos SVG, formateo y helpers de DOM.
(function () {
  "use strict";

  var ICONS = {
    menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    sliders: '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2" fill="currentColor" stroke="none"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="7" cy="18" r="2" fill="currentColor" stroke="none"/>',
    home: '<polyline points="4,11 12,4 20,11"/><polyline points="6,10 6,20 18,20 18,10"/>',
    pin: '<path d="M12 21s-7-7.37-7-12a7 7 0 0 1 14 0c0 4.63-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    heart: '<polygon points="12,19 4,12 4,8 7,5 12,9 17,5 20,8 20,12"/>',
    heartFilled: '<polygon points="12,19 4,12 4,8 7,5 12,9 17,5 20,8 20,12" fill="currentColor"/>',
    star: '<polygon points="12,2 15,8.5 22,9.3 17,14.1 18.2,21 12,17.6 5.8,21 7,14.1 2,9.3 9,8.5"/>',
    starFilled: '<polygon points="12,2 15,8.5 22,9.3 17,14.1 18.2,21 12,17.6 5.8,21 7,14.1 2,9.3 9,8.5" fill="currentColor"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/>',
    phone: '<rect x="7.5" y="2" width="9" height="20" rx="2.5" transform="rotate(45 12 12)"/>',
    chat: '<rect x="2" y="3" width="20" height="14" rx="4"/><polygon points="9,17 9,21 13,17"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2.5"/><polyline points="2.5,5.5 12,13 21.5,5.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><polyline points="4,20 4,18 8,15 16,15 20,18 20,20"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    x: '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>',
    chevronLeft: '<polyline points="15,6 9,12 15,18"/>',
    chevronRight: '<polyline points="9,6 15,12 9,18"/>',
    chevronDown: '<polyline points="6,9 12,15 18,9"/>',
    check: '<polyline points="5,13 10,18 19,7"/>',
    layers: '<polygon points="12,3 3,8 12,13 21,8"/><polyline points="3,13 12,18 21,13"/><polyline points="3,17.5 12,22 21,17.5"/>',
    locate: '<circle cx="12" cy="12" r="7"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>',
    bed: '<rect x="3" y="13" width="18" height="6" rx="1"/><line x1="3" y1="19" x2="3" y2="21"/><line x1="21" y1="19" x2="21" y2="21"/><rect x="3" y="8" width="8" height="5" rx="1"/><line x1="3" y1="13" x2="3" y2="8"/>',
    bath: '<rect x="4" y="11" width="16" height="7" rx="1"/><line x1="4" y1="18" x2="4" y2="20"/><line x1="20" y1="18" x2="20" y2="20"/><line x1="4" y1="11" x2="4" y2="6"/><circle cx="6" cy="5" r="1"/>',
    ruler: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="3" x2="8" y2="6"/><line x1="13" y1="3" x2="13" y2="6"/><line x1="18" y1="3" x2="18" y2="6"/><line x1="3" y1="8" x2="6" y2="8"/><line x1="3" y1="13" x2="6" y2="13"/>',
    car: '<rect x="3" y="11" width="18" height="6" rx="2"/><polyline points="5,11 7,6 17,6 19,11"/><circle cx="7" cy="17" r="1.5" fill="currentColor"/><circle cx="17" cy="17" r="1.5" fill="currentColor"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><polyline points="8,7 9,4 15,4 16,7"/><circle cx="12" cy="14" r="4"/>',
    link: '<rect x="2" y="9" width="10" height="6" rx="3" transform="rotate(-45 7 12)"/><rect x="12" y="9" width="10" height="6" rx="3" transform="rotate(-45 17 12)"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><rect x="3" y="3" width="13" height="13" rx="2" fill="none"/>',
    edit: '<line x1="3" y1="21" x2="9" y2="21"/><polyline points="4,20 4,17 16,5 19,8 7,20"/>',
    eye: '<ellipse cx="12" cy="12" rx="9" ry="6"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/>',
    eyeOff: '<ellipse cx="12" cy="12" rx="9" ry="6"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/><line x1="4" y1="4" x2="20" y2="20"/>',
    clock: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="12" x2="12" y2="7"/><line x1="12" y1="12" x2="16" y2="14"/>',
    arrowUp: '<polyline points="6,14 12,7 18,14"/><line x1="12" y1="7" x2="12" y2="19"/>',
    arrowDown: '<polyline points="6,10 12,17 18,10"/><line x1="12" y1="5" x2="12" y2="17"/>',
    lasso: '<polygon points="4,14 6,7 12,4 18,6 20,13 15,18 8,19 4,14" stroke-dasharray="3,2"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>',
    map: '<polygon points="9,3 3,6 3,20 9,17 15,20 21,17 21,3 15,6 9,3"/><line x1="9" y1="3" x2="9" y2="17"/><line x1="15" y1="6" x2="15" y2="20"/>',
    store: '<rect x="3" y="10" width="18" height="10" rx="1"/><polyline points="3,10 5,4 19,4 21,10"/><line x1="9" y1="20" x2="9" y2="14"/><line x1="15" y1="20" x2="15" y2="14"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none"/><line x1="3" y1="13" x2="21" y2="13"/>',
    users: '<circle cx="8" cy="8" r="3"/><polyline points="2,20 2,18 5,15.5 11,15.5 14,18 14,20"/><circle cx="17" cy="9" r="2.4"/><polyline points="15,20 15,18.3 17,16.3 20.5,16.3 21.5,17.3"/>',
    dollar: '<line x1="12" y1="2" x2="12" y2="22"/><text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor" stroke="none">$</text>',
    chart: '<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="12" width="3" height="8"/><rect x="11" y="8" width="3" height="12"/><rect x="16" y="14" width="3" height="6"/>',
    flag: '<line x1="5" y1="21" x2="5" y2="3"/><polyline points="5,4 18,4 15,8 18,12 5,12"/>',
    navigation: '<polygon points="3,11 22,2 13,21 11,13 3,11"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/>',
    clipboard: '<path d="M9 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2" fill="none"/><rect x="9" y="1" width="6" height="4" rx="1"/>',
    penTool: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" fill="none"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="none"/>',
    megaphone: '<polygon points="3,10 3,14 8,14 15,19 15,5 8,10"/><line x1="17" y1="7" x2="19" y2="5"/><line x1="17" y1="17" x2="19" y2="19"/>',
    bell: '<polygon points="7,16 7,10 9,6 15,6 17,10 17,16 19,18 5,18"/><path d="M10 20a2 2 0 0 0 4 0" fill="none"/>',
    download: '<line x1="12" y1="3" x2="12" y2="15"/><polyline points="7,10 12,15 17,10"/><line x1="4" y1="20" x2="20" y2="20"/>',
    shield: '<polygon points="12,3 19,6 19,12 12,21 5,12 5,6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    grid: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
    exchange: '<polyline points="7,4 3,8 7,12"/><line x1="3" y1="8" x2="21" y2="8"/><polyline points="17,12 21,16 17,20"/><line x1="21" y1="16" x2="3" y2="16"/>',
    crown: '<polygon points="3,8 8,11 12,4 16,11 21,8 19,18 5,18"/><line x1="5" y1="18" x2="19" y2="18"/>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 15l0.7 2 2 0.7-2 0.7-0.7 2-0.7-2-2-0.7 2-0.7 0.7-2z" fill="currentColor" stroke="none"/>',
    infinity: '<path d="M6 9a3.5 3.5 0 1 0 0 6c2.5 0 3.5-6 6-6a3.5 3.5 0 1 1 0 6c-2.5 0-3.5-6-6-6z"/>',
    more: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M14 21v-8h2.7l.4-3.3H14V7.6c0-.96.27-1.6 1.64-1.6H17V3.1C16.7 3.07 15.7 3 14.5 3 12 3 10.3 4.5 10.3 7.3v2.4H7.6V13h2.7v8z"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="16.6" cy="7.4" r="1" fill="currentColor" stroke="none"/>',
    tiktok: '<path d="M14 3v11.2a3.3 3.3 0 1 1-2.6-3.23" fill="none"/><path d="M14 3a4.8 4.8 0 0 0 4.8 4.8" fill="none"/>',
    globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/>'
  };

  function icon(name, opts) {
    opts = opts || {};
    var size = opts.size || 20;
    var cls = opts.class ? ' ' + opts.class : '';
    var body = ICONS[name] || '';
    return '<svg class="icon' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  // Marca de InmoMaps: la "o" de "Inmo" con la esquina inferior izquierda
  // cuadrada y la contraforma abierta al centro. Geometría exacta del kit de marca.
  var BRAND_MARK_PATH = "M0 22A22 22 0 1 1 22 44L0 44Z M22 12.5A9.5 9.5 0 1 0 22 31.5 9.5 9.5 0 0 0 22 12.5Z";

  function brandMark(opts) {
    opts = opts || {};
    var cls = opts.class ? ' ' + opts.class : '';
    var sizeAttr = opts.size ? ' width="' + opts.size + '" height="' + opts.size + '"' : '';
    var style = opts.style ? ' style="' + opts.style + '"' : '';
    return '<svg class="brand-mark' + cls + '"' + sizeAttr + style + ' viewBox="0 0 44 44" fill="currentColor" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="InmoMaps">' +
      '<path fill-rule="evenodd" clip-rule="evenodd" d="' + BRAND_MARK_PATH + '"></path></svg>';
  }

  // Marca completa "Inm[o]Maps": el texto rodea el mismo SVG de brandMark(),
  // dimensionado en em para que escale con el font-size del elemento que lo contiene.
  function logoHTML(opts) {
    opts = opts || {};
    var light = opts.tone === 'light';
    var markColor = light ? '#fff' : 'var(--color-primary)';
    var textColor = light ? '#fff' : 'var(--color-ink)';
    return '<span class="brand-logo" style="color:' + textColor + '">Inm' +
      brandMark({ style: 'width:0.494em;height:0.494em;margin:0 0.0005em 0 0.0495em;color:' + markColor + ';flex-shrink:0' }) +
      'Maps</span>';
  }

  function formatPrice(value, opts) {
    opts = opts || {};
    var n = Math.round(value);
    var formatted = n.toLocaleString('es-MX');
    return '$' + formatted + (opts.suffix ? ' ' + opts.suffix : '');
  }

  function formatCompact(n) {
    if (n >= 1000000) return (Math.round((n / 1000000) * 10) / 10) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'k';
    return String(n);
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('es-MX');
  }

  function distanceKm(a, b) {
    var R = 6371;
    var dLat = (b[1] - a[1]) * Math.PI / 180;
    var dLon = (b[0] - a[0]) * Math.PI / 180;
    var lat1 = a[1] * Math.PI / 180, lat2 = b[1] * Math.PI / 180;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // Encuentra la ciudad del catálogo nacional (window.APP_CONFIG.MEXICO_STATES)
  // más cercana a un punto [lng, lat]; null si ninguna cae dentro de radiusKm
  // (evita forzar una ubicación a alguien lejos de cualquier ciudad conocida).
  function nearestMexicoLocation(coords, radiusKm) {
    var states = window.APP_CONFIG.MEXICO_STATES;
    var best = null, bestDist = Infinity;
    Object.keys(states).forEach(function (sk) {
      var cities = states[sk].cities;
      Object.keys(cities).forEach(function (ck) {
        var d = distanceKm(coords, cities[ck].center);
        if (d < bestDist) { bestDist = d; best = { stateKey: sk, cityKey: ck }; }
      });
    });
    return (radiusKm == null || bestDist <= radiusKm) ? best : null;
  }

  function slugify(str) {
    var normalized = String(str).toLowerCase().normalize('NFD');
    var stripped = '';
    for (var i = 0; i < normalized.length; i++) {
      var code = normalized.charCodeAt(i);
      if (code >= 0x0300 && code <= 0x036f) continue; // marcas diacríticas combinadas
      stripped += normalized[i];
    }
    return stripped.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // Campo de contraseña con botón de ojo para mostrar/ocultar el texto
  // mientras se escribe. wirePasswordToggles(root) debe llamarse después de
  // insertar el HTML en el DOM para que el botón funcione.
  function passwordFieldHTML(dataAttr, placeholder, autocomplete) {
    return '<div class="password-field">' +
      '<input type="password" data-' + dataAttr + ' placeholder="' + (placeholder || '') + '"' + (autocomplete ? ' autocomplete="' + autocomplete + '"' : '') + ' />' +
      '<button type="button" class="password-field__toggle" data-toggle-password aria-label="Mostrar contraseña" tabindex="-1">' + icon('eye', { size: 16 }) + '</button>' +
      '</div>';
  }
  function wirePasswordToggles(root) {
    qsa('[data-toggle-password]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.previousElementSibling;
        if (!input) return;
        var showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.innerHTML = icon(showing ? 'eye' : 'eyeOff', { size: 16 });
        btn.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');
      });
    });
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function relativeTime(iso) {
    var diff = Date.now() - new Date(iso).getTime();
    var min = Math.floor(diff / 60000);
    if (min < 1) return 'hace un momento';
    if (min < 60) return 'hace ' + min + ' min';
    var hr = Math.floor(min / 60);
    if (hr < 24) return 'hace ' + hr + ' h';
    var day = Math.floor(hr / 24);
    if (day === 1) return 'ayer';
    return 'hace ' + day + ' días';
  }

  var PROPERTY_TYPES = [
    { value: "casa", label: "Casa", icon: "home" },
    { value: "departamento", label: "Departamento", icon: "layers" },
    { value: "terreno", label: "Terreno", icon: "map" },
    { value: "local", label: "Local comercial", icon: "store" },
    { value: "bodega", label: "Bodega", icon: "store" },
    { value: "quinta", label: "Quinta", icon: "home" },
    { value: "edificio", label: "Edificio", icon: "layers" },
    { value: "nave_industrial", label: "Nave industrial", icon: "store" },
    { value: "consultorio", label: "Consultorio", icon: "briefcase" },
    { value: "oficina", label: "Oficina", icon: "briefcase" },
    { value: "otro", label: "Otro", icon: "home" }
  ];

  // Directorio de servicios inmobiliarios (notario, valuadores, etc.), usado
  // tanto por las tarjetas de categoría en Explorar como por el directorio
  // público (js/views/serviceDirectory.js) y el panel admin que lo administra.
  var SERVICE_CATEGORIES = [
    { key: "notario", label: "Notario", icon: "award", color: "var(--color-otro)", bg: "var(--color-otro-bg)" },
    { key: "valuadores", label: "Valuadores", icon: "clipboard", color: "var(--color-terreno)", bg: "var(--color-terreno-bg)" },
    { key: "arquitectos", label: "Arquitectos", icon: "penTool", color: "var(--color-renta)", bg: "var(--color-renta-bg)" },
    { key: "servicios", label: "Servicios", icon: "tool", color: "var(--color-venta)", bg: "var(--color-venta-bg)" },
    { key: "sofom", label: "SOFOM", icon: "dollar", color: "var(--color-primary)", bg: "var(--color-primary-light)" }
  ];

  var CREDIT_TYPES = [
    { value: "infonavit", label: "Infonavit" },
    { value: "fovissste", label: "FOVISSSTE" },
    { value: "bancario", label: "Crédito bancario" },
    { value: "contado", label: "Recurso propio (contado)" },
    { value: "pemex", label: "Crédito PEMEX" },
    { value: "cfe", label: "Crédito CFE" },
    { value: "imss", label: "Crédito IMSS" },
    { value: "issfam", label: "Crédito ISSFAM" },
    { value: "otro", label: "Otro" }
  ];

  var AMENITIES = [
    "Alberca", "Jardín", "Terraza", "Roof garden", "Cocina integral", "Closet vestidor", "Área de lavado",
    "Cuarto de servicio", "Bodega", "Aire acondicionado", "Paneles solares", "Cisterna", "Tinaco",
    "Portón eléctrico", "Seguridad 24 horas", "Acceso controlado", "Elevador", "Gimnasio", "Salón de eventos",
    "Canchas deportivas", "Área infantil", "Pet friendly", "Internet", "Gas estacionario", "Otro"
  ];

  var RENTAL_DEPOSIT_OPTIONS = [
    { value: "sin_deposito", label: "Sin depósito" },
    { value: "1_mes", label: "1 mes de renta" },
    { value: "2_meses", label: "2 meses de renta" },
    { value: "3_meses", label: "3 meses de renta" }
  ];

  var RENTAL_FURNISHED_OPTIONS = [
    { value: "sin_amueblar", label: "Sin amueblar" },
    { value: "semi_amueblado", label: "Semi-amueblado" },
    { value: "amueblado", label: "Amueblado" }
  ];

  var RENTAL_GUARANTEES = [
    { value: "aval", label: "Aval (propietario con escritura)" },
    { value: "fiador_solidario", label: "Fiador solidario" },
    { value: "poliza_juridica", label: "Póliza jurídica de arrendamiento" },
    { value: "sin_aval", label: "Sin aval (depósito adicional)" }
  ];

  var RENTAL_SERVICES = [
    "Agua", "Luz", "Gas", "Internet", "Mantenimiento", "TV de paga"
  ];

  var SPECIAL_TAGS = [
    { value: "oportunidad", label: "🔥 Oportunidad" },
    { value: "exclusiva", label: "⭐ Exclusiva" },
    { value: "precio_rebajado", label: "💰 Precio rebajado" },
    { value: "nueva", label: "🆕 Nueva" },
    { value: "urge_vender", label: "🚨 Urge vender" },
    { value: "acepta_creditos", label: "🏡 Acepta créditos" },
    { value: "inversion", label: "📈 Ideal para inversión" }
  ];

  function agentTitleLabel(agent) {
    if (agent.plan === 'propietario') return 'Propietario';
    return [agent.specialty, agent.company].filter(Boolean).join(' · ') || agent.title;
  }

  function propertyTypeLabel(type) {
    var found = PROPERTY_TYPES.filter(function (t) { return t.value === type; })[0];
    return found ? found.label : type;
  }

  function operationLabel(op) {
    if (op === 'venta_renta') return 'Venta y renta';
    return op === 'renta' ? 'En renta' : 'En venta';
  }

  function operationColorVar(op) {
    return op === 'renta' ? '--color-renta' : '--color-venta';
  }

  function typeColorVar(type, operation) {
    if (type === 'terreno') return '--color-terreno';
    if (type === 'local' || type === 'oficina' || type === 'bodega' || type === 'nave_industrial' || type === 'consultorio') return '--color-otro';
    return operationColorVar(operation);
  }

  function badgeClassFor(operation) {
    return operation === 'renta' ? 'op-renta' : 'op-venta';
  }

  // Pide una versión reducida de una foto para miniaturas (tarjetas, tablas
  // admin) en vez de la imagen completa que ya se sube hasta 1600px — usa la
  // transformación de imágenes de Supabase Storage, que solo aplica a URLs
  // públicas de ese bucket; cualquier otra URL (p. ej. la foto de respaldo de
  // Unsplash) se regresa igual, sin tocar.
  // "resize=cover" solo recorta a una caja fija si se le da ancho Y alto —
  // con solo el ancho, Supabase solo escala preservando la proporción
  // original de la foto, así que una foto tomada en vertical sale enorme y
  // descuadra cualquier fila/cuadrícula de tarjetas. Por eso height es
  // obligatorio: todo llamador debe decir a qué caja recorta la miniatura.
  function thumbUrl(url, width, height) {
    if (!url || url.indexOf('/storage/v1/object/public/') === -1) return url;
    return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') +
      (url.indexOf('?') === -1 ? '?' : '&') + 'width=' + width + '&height=' + height + '&resize=cover&quality=75';
  }

  function toast(message, opts) {
    opts = opts || {};
    var root = qs('#toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast' + (opts.tone ? ' toast--' + opts.tone : '');
    el.setAttribute('role', 'status');
    el.textContent = message;
    root.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-visible'); });
    setTimeout(function () {
      el.classList.remove('is-visible');
      setTimeout(function () { el.remove(); }, 250);
    }, opts.duration || 2400);
  }

  function youtubeEmbedUrl(url) {
    if (!url) return null;
    var match = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
    return match ? 'https://www.youtube.com/embed/' + match[1] : null;
  }

  function whatsappLink(phone, message) {
    var digits = String(phone).replace(/\D/g, '');
    return 'https://wa.me/' + digits + (message ? '?text=' + encodeURIComponent(message) : '');
  }

  // coords viene como [lng, lat] (convención de Mapbox); Google Maps espera "lat,lng".
  function directionsLink(coords) {
    if (!coords) return '';
    return 'https://www.google.com/maps/dir/?api=1&destination=' + coords[1] + ',' + coords[0] + '&travelmode=driving';
  }

  var PRICE_MAX = 5000000;

  // Las propiedades solo en renta guardan su precio en priceRent (price queda en
  // 0/null); esta función centraliza "cuál es el precio que corresponde mostrar
  // o comparar" para no repetir ese if en cada lugar que muestra o filtra precios.
  function effectivePrice(p) {
    if (p.operation === 'renta') return p.priceRent || p.price || 0;
    return p.price || 0;
  }

  function defaultFilters() {
    return { operation: 'todas', types: [], priceMin: 0, priceMax: PRICE_MAX, bedrooms: 0, bathrooms: 0, parking: 0, searchText: '', stateKey: null, cityKey: null, creditsAccepted: [], rentalFurnished: null };
  }

  function normalizeText(s) {
    return String(s || '').toLowerCase()
      .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n');
  }

  // city/municipality/state son texto libre que el asesor escribe a mano (no
  // un catálogo fijo), así que en vez de comparar exacto se busca coincidencia
  // parcial. Con cityKey elegido se compara contra "matchTokens" de esa ciudad
  // — así "San Francisco ", "san fransisco" (con error de dedo) o "Campeche" a
  // secas siguen cayendo dentro de la misma ciudad. Si solo hay stateKey (sin
  // ciudad elegida) se compara el campo state contra el nombre del estado.
  function matchesLocation(property, stateKey, cityKey) {
    var state = stateKey && window.APP_CONFIG.MEXICO_STATES[stateKey];
    if (!state) return true;
    if (cityKey) {
      var city = state.cities[cityKey];
      if (!city || !city.matchTokens) return true;
      var haystack = normalizeText((property.city || '') + ' ' + (property.municipality || ''));
      return city.matchTokens.some(function (token) { return haystack.indexOf(normalizeText(token)) !== -1; });
    }
    return normalizeText(property.state || '').indexOf(normalizeText(state.label)) !== -1;
  }

  function applyFilters(list, filters) {
    filters = filters || defaultFilters();
    return list.filter(function (p) {
      if (filters.operation !== 'todas' && p.operation !== filters.operation) return false;
      if (filters.types && filters.types.length && filters.types.indexOf(p.type) === -1) return false;
      if (filters.stateKey && !matchesLocation(p, filters.stateKey, filters.cityKey)) return false;
      if (filters.creditsAccepted && filters.creditsAccepted.length && !filters.creditsAccepted.some(function (c) { return (p.creditsAccepted || []).indexOf(c) !== -1; })) return false;
      if (filters.rentalFurnished && p.rentalFurnished !== filters.rentalFurnished) return false;
      var price = effectivePrice(p);
      if (price < filters.priceMin) return false;
      if (filters.priceMax < PRICE_MAX && price > filters.priceMax) return false;
      if (filters.bedrooms > 0 && !(p.bedrooms >= filters.bedrooms)) return false;
      if (filters.bathrooms > 0 && !(p.bathrooms >= filters.bathrooms)) return false;
      if (filters.parking > 0 && !(p.parking >= filters.parking)) return false;
      return true;
    });
  }

  // --- SEO: meta tags dinámicos por vista (título ya lo pone cada vista con
  // document.title; esto cubre descripción + Open Graph/Twitter, que antes
  // se quedaban con el valor genérico de index.html en todas las páginas) ---
  var DEFAULT_META = {
    description: "InmoMaps: explora propiedades en venta y renta directamente sobre un mapa interactivo. Para compradores y asesores inmobiliarios.",
    image: "https://www.inmomaps.com.mx/icons/icon-512.png",
    type: "website"
  };

  function metaTag(selector, attr, value) {
    var el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      if (selector.indexOf('property=') !== -1) el.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
      else if (selector.indexOf('name=') !== -1) el.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }

  // opts: { title, description, image, url, type }. Cualquiera que no se
  // mande usa el valor genérico del sitio, así una página que no llama esto
  // no se queda pegada con los datos de la página anterior.
  function setMeta(opts) {
    opts = opts || {};
    var title = opts.title || document.title;
    var description = opts.description || DEFAULT_META.description;
    var image = opts.image || DEFAULT_META.image;
    var url = opts.url || window.location.href;
    var type = opts.type || DEFAULT_META.type;

    metaTag('meta[name="description"]', 'content', description);
    metaTag('meta[property="og:title"]', 'content', title);
    metaTag('meta[property="og:description"]', 'content', description);
    metaTag('meta[property="og:image"]', 'content', image);
    metaTag('meta[property="og:url"]', 'content', url);
    metaTag('meta[property="og:type"]', 'content', type);
    metaTag('meta[property="og:site_name"]', 'content', 'InmoMaps');
    metaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    metaTag('meta[name="twitter:title"]', 'content', title);
    metaTag('meta[name="twitter:description"]', 'content', description);
    metaTag('meta[name="twitter:image"]', 'content', image);
  }

  function resetMeta() {
    setMeta({ title: 'InmoMaps — La plataforma inmobiliaria donde el mapa es el centro' });
  }

  // Datos estructurados (JSON-LD): una sola etiqueta que cada vista
  // reemplaza o quita según lo que esté mostrando.
  function setJsonLd(obj) {
    var el = document.getElementById('jsonld-main');
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = 'jsonld-main';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(obj);
  }
  function clearJsonLd() {
    var el = document.getElementById('jsonld-main');
    if (el) el.remove();
  }

  window.App = window.App || {};
  window.App.utils = {
    icon: icon,
    brandMark: brandMark,
    logoHTML: logoHTML,
    setMeta: setMeta,
    resetMeta: resetMeta,
    setJsonLd: setJsonLd,
    clearJsonLd: clearJsonLd,
    formatPrice: formatPrice,
    agentTitleLabel: agentTitleLabel,
    passwordFieldHTML: passwordFieldHTML,
    wirePasswordToggles: wirePasswordToggles,
    formatCompact: formatCompact,
    formatNumber: formatNumber,
    effectivePrice: effectivePrice,
    distanceKm: distanceKm,
    nearestMexicoLocation: nearestMexicoLocation,
    slugify: slugify,
    uid: uid,
    escapeHtml: escapeHtml,
    qs: qs,
    qsa: qsa,
    debounce: debounce,
    relativeTime: relativeTime,
    propertyTypeLabel: propertyTypeLabel,
    operationLabel: operationLabel,
    operationColorVar: operationColorVar,
    typeColorVar: typeColorVar,
    toast: toast,
    whatsappLink: whatsappLink,
    directionsLink: directionsLink,
    youtubeEmbedUrl: youtubeEmbedUrl,
    badgeClassFor: badgeClassFor,
    thumbUrl: thumbUrl,
    PRICE_MAX: PRICE_MAX,
    defaultFilters: defaultFilters,
    matchesLocation: matchesLocation,
    applyFilters: applyFilters,
    PROPERTY_TYPES: PROPERTY_TYPES,
    SERVICE_CATEGORIES: SERVICE_CATEGORIES,
    CREDIT_TYPES: CREDIT_TYPES,
    AMENITIES: AMENITIES,
    SPECIAL_TAGS: SPECIAL_TAGS,
    RENTAL_DEPOSIT_OPTIONS: RENTAL_DEPOSIT_OPTIONS,
    RENTAL_FURNISHED_OPTIONS: RENTAL_FURNISHED_OPTIONS,
    RENTAL_GUARANTEES: RENTAL_GUARANTEES,
    RENTAL_SERVICES: RENTAL_SERVICES
  };
})();
