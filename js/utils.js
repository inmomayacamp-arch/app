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
    megaphone: '<polygon points="3,10 3,14 8,14 15,19 15,5 8,10"/><line x1="17" y1="7" x2="19" y2="5"/><line x1="17" y1="17" x2="19" y2="19"/>',
    bell: '<polygon points="7,16 7,10 9,6 15,6 17,10 17,16 19,18 5,18"/><path d="M10 20a2 2 0 0 0 4 0" fill="none"/>',
    download: '<line x1="12" y1="3" x2="12" y2="15"/><polyline points="7,10 12,15 17,10"/><line x1="4" y1="20" x2="20" y2="20"/>',
    shield: '<polygon points="12,3 19,6 19,12 12,21 5,12 5,6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    grid: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>'
  };

  function icon(name, opts) {
    opts = opts || {};
    var size = opts.size || 20;
    var cls = opts.class ? ' ' + opts.class : '';
    var body = ICONS[name] || '';
    return '<svg class="icon' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
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

  function propertyTypeLabel(type) {
    var map = { casa: 'Casa', departamento: 'Departamento', terreno: 'Terreno', local: 'Local comercial', oficina: 'Oficina' };
    return map[type] || type;
  }

  function operationLabel(op) {
    return op === 'renta' ? 'En renta' : 'En venta';
  }

  function operationColorVar(op) {
    return op === 'renta' ? '--color-renta' : '--color-venta';
  }

  function typeColorVar(type, operation) {
    if (type === 'terreno') return '--color-terreno';
    if (type === 'local' || type === 'oficina') return '--color-otro';
    return operationColorVar(operation);
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

  function whatsappLink(phone, message) {
    var digits = String(phone).replace(/\D/g, '');
    return 'https://wa.me/' + digits + (message ? '?text=' + encodeURIComponent(message) : '');
  }

  var PRICE_MAX = 5000000;

  function defaultFilters() {
    return { operation: 'todas', types: [], priceMin: 0, priceMax: PRICE_MAX, bedrooms: 0, bathrooms: 0, parking: 0, searchText: '' };
  }

  function applyFilters(list, filters) {
    filters = filters || defaultFilters();
    return list.filter(function (p) {
      if (filters.operation !== 'todas' && p.operation !== filters.operation) return false;
      if (filters.types && filters.types.length && filters.types.indexOf(p.type) === -1) return false;
      if (p.price < filters.priceMin) return false;
      if (filters.priceMax < PRICE_MAX && p.price > filters.priceMax) return false;
      if (filters.bedrooms > 0 && !(p.bedrooms >= filters.bedrooms)) return false;
      if (filters.bathrooms > 0 && !(p.bathrooms >= filters.bathrooms)) return false;
      if (filters.parking > 0 && !(p.parking >= filters.parking)) return false;
      return true;
    });
  }

  window.App = window.App || {};
  window.App.utils = {
    icon: icon,
    formatPrice: formatPrice,
    formatCompact: formatCompact,
    formatNumber: formatNumber,
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
    PRICE_MAX: PRICE_MAX,
    defaultFilters: defaultFilters,
    applyFilters: applyFilters
  };
})();
