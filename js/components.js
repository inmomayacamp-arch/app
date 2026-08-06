// Componentes de interfaz reutilizables: navegación, tarjetas, hoja inferior (sheet),
// filtros, carrusel de fotos y barra para compartir.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;

  /* ---------------------------------------------------------------------
   * Navegación (header de escritorio + bottom nav móvil)
   * ------------------------------------------------------------------- */

  var NAV_ITEMS = [
    { route: "explore", href: "#/", label: "Explorar", icon: "home" },
    { route: "properties", href: "#/propiedades", label: "Propiedades", icon: "list" },
    { route: "search", label: "Buscar", icon: "search", fab: true, action: "open-search" },
    { route: "favorites", href: "#/favoritos", label: "Favoritos", icon: "heart", badge: true },
    { route: "perfil", href: "#/perfil", label: "Publicar", icon: "plus" }
  ];

  // Si hay un asesor con sesión iniciada, esa última pestaña se convierte en
  // acceso directo a su panel de trabajo en vez de la invitación a publicar.
  function navItems() {
    var isAgent = window.App.state.agents && window.App.state.agents.isLoggedIn();
    if (!isAgent) return NAV_ITEMS;
    return NAV_ITEMS.map(function (item) {
      return item.route === "perfil"
        ? { route: "perfil", href: "#/dashboard", label: "Panel", icon: "briefcase" }
        : item;
    });
  }

  function renderHeader(activeRoute) {
    var links = navItems().filter(function (i) { return !i.fab; }).map(function (item) {
      var cls = "site-header__link" +
        (item.icon === "plus" ? " site-header__link--cta" : "") +
        (item.route === activeRoute ? " is-active" : "");
      var badge = item.badge && state.favorites.count() ? ' (' + state.favorites.count() + ')' : '';
      return '<a class="' + cls + '" href="' + item.href + '">' + u.escapeHtml(item.label) + badge + '</a>';
    }).join("");

    return (
      '<a class="site-header__logo" href="#/">' + u.logoHTML() + '</a>' +
      '<nav class="site-header__nav">' + links + '</nav>'
    );
  }

  function renderBottomNav(activeRoute) {
    return navItems().map(function (item) {
      if (item.fab) {
        return '<button type="button" class="bottom-nav__item" data-nav-action="' + item.action + '" aria-label="' + item.label + '">' +
          '<span class="bottom-nav__fab">' + u.brandMark({ size: 22, style: 'color:#fff' }) + '</span></button>';
      }
      var cls = "bottom-nav__item" +
        (item.icon === "plus" ? " bottom-nav__item--cta" : "") +
        (item.route === activeRoute ? " is-active" : "");
      var count = item.badge ? state.favorites.count() : 0;
      var badgeHtml = count ? '<span class="bottom-nav__badge">' + count + '</span>' : '';
      return '<a class="' + cls + '" href="' + item.href + '" aria-current="' + (item.route === activeRoute ? 'page' : 'false') + '">' +
        badgeHtml + u.icon(item.icon, { size: 21 }) + '<span>' + u.escapeHtml(item.label) + '</span></a>';
    }).join("");
  }

  function mountChrome(activeRoute) {
    document.body.classList.remove('is-admin');
    u.qs('#site-header').innerHTML = renderHeader(activeRoute);
    u.qs('#bottom-nav').innerHTML = renderBottomNav(activeRoute);
  }

  function refreshFavoriteUI() {
    var count = state.favorites.count();
    u.qsa('.bottom-nav__item[href="#/favoritos"] .bottom-nav__badge').forEach(function (b) { b.remove(); });
    var favTab = u.qs('.bottom-nav__item[href="#/favoritos"]');
    if (favTab && count) {
      var b = document.createElement('span');
      b.className = 'bottom-nav__badge';
      b.textContent = String(count);
      favTab.insertBefore(b, favTab.firstChild);
    }
    u.qsa('[data-fav-id]').forEach(function (btn) {
      var id = btn.getAttribute('data-fav-id');
      var active = state.favorites.has(id);
      btn.innerHTML = u.icon(active ? 'heartFilled' : 'heart', { size: 16 });
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* ---------------------------------------------------------------------
   * Chips rápidos de operación (Todos / Venta / Renta). El resto de los
   * filtros (tipo, recámaras, precio, etc.) vive en la hoja de filtros.
   * ------------------------------------------------------------------- */

  var QUICK_CHIPS = [
    { op: "todas", label: "Todos", color: "var(--color-primary)" },
    { op: "venta", label: "Venta", color: "var(--color-venta)" },
    { op: "renta", label: "Renta", color: "var(--color-renta)" }
  ];

  function quickFilterChipsHTML() {
    return QUICK_CHIPS.map(function (chip) {
      var isActive = chip.op === "todas";
      return '<button type="button" class="chip' + (isActive ? ' is-active' : '') + '" data-op="' + chip.op + '" style="--chip-color:' + chip.color + '">' + chip.label + '</button>';
    }).join('');
  }

  function bindQuickFilterChips(root, filters, onChange) {
    u.qsa('[data-op]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.operation = btn.getAttribute('data-op');
        u.qsa('[data-op]', root).forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        onChange();
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Tarjeta de propiedad
   * ------------------------------------------------------------------- */

  function specsRowHTML(p) {
    var parts = [];
    if (p.bedrooms) parts.push(u.icon('bed', { size: 14 }) + '<span>' + p.bedrooms + '</span>');
    if (p.bathrooms) parts.push(u.icon('bath', { size: 14 }) + '<span>' + p.bathrooms + '</span>');
    if (p.builtArea) parts.push(u.icon('ruler', { size: 14 }) + '<span>' + p.builtArea + ' m²</span>');
    if (!p.builtArea && p.lotArea) parts.push(u.icon('ruler', { size: 14 }) + '<span>' + p.lotArea + ' m² terreno</span>');
    return parts.map(function (part) { return '<span>' + part + '</span>'; }).join('');
  }

  function propertyPriceLabel(p) {
    var currency = p.currency && p.currency !== 'MXN' ? ' ' + p.currency : ' MXN';
    if (p.operation === 'venta_renta') {
      var parts = [];
      if (p.price) parts.push(u.formatPrice(p.price) + currency + ' venta');
      if (p.priceRent) parts.push(u.formatPrice(p.priceRent) + currency + '/mes renta');
      return parts.join(' · ') || (u.formatPrice(p.price) + currency);
    }
    if (p.operation === 'renta') return u.formatPrice(p.priceRent || p.price) + currency + '/mes';
    return u.formatPrice(p.price) + currency;
  }

  function propertyCardHTML(p, opts) {
    opts = opts || {};
    var variant = opts.variant || 'grid';
    var isFav = state.favorites.has(p.id);
    var priceLabel = propertyPriceLabel(p);
    return (
      '<a class="property-card property-card--' + variant + (opts.highlight ? ' is-highlighted' : '') + '" href="#/propiedad/' + p.id + '" data-property-id="' + p.id + '">' +
      '<div class="property-card__media">' +
      '<img src="' + p.photos[0] + '" alt="" loading="lazy" />' +
      '<span class="property-card__badge badge badge--' + u.badgeClassFor(p.type, p.operation) + '">' + u.operationLabel(p.operation) + '</span>' +
      (p.tags && p.tags.length ? '<span class="property-card__tag">' + u.escapeHtml((u.SPECIAL_TAGS.filter(function (t) { return t.value === p.tags[0]; })[0] || {}).label || '') + '</span>' : '') +
      (opts.showFavorite === false ? '' : '<button type="button" class="property-card__fav' + (isFav ? ' is-active' : '') + '" data-fav-id="' + p.id + '"' + (opts.linkId ? ' data-track-link="' + opts.linkId + '"' : '') + ' aria-pressed="' + isFav + '" aria-label="Guardar en favoritos">' + u.icon(isFav ? 'heartFilled' : 'heart', { size: 16 }) + '</button>') +
      '</div>' +
      '<div class="property-card__body">' +
      '<div class="property-card__price">' + priceLabel + '</div>' +
      '<div class="property-card__title">' + u.escapeHtml(p.title) + '</div>' +
      '<div class="property-card__location">' + u.icon('pin', { size: 12 }) + ' ' + u.escapeHtml(p.neighborhood) + ', ' + u.escapeHtml(p.city) + '</div>' +
      '<div class="property-card__specs">' + specsRowHTML(p) + '</div>' +
      '</div></a>'
    );
  }

  function bindFavoriteButtons(root) {
    (root || document).addEventListener('click', function (e) {
      var btn = e.target.closest('[data-fav-id]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var id = btn.getAttribute('data-fav-id');
      var linkId = btn.getAttribute('data-track-link') || null;
      var nowActive = state.favorites.toggle(id, { linkId: linkId });
      u.toast(nowActive ? 'Guardado en favoritos' : 'Se quitó de favoritos');
      refreshFavoriteUI();
    });
  }

  function bindContactButtons(root) {
    (root || document).addEventListener('click', function (e) {
      var btn = e.target.closest('[data-track-property],[data-track-link],[data-track-agent]');
      if (!btn) return;
      var href = btn.getAttribute('href') || '';
      var isWhatsapp = btn.classList.contains('btn--whatsapp');
      var isCall = href.indexOf('tel:') === 0;
      if (!isWhatsapp && !isCall) return;
      state.tracking.logContactClick({
        propertyId: btn.getAttribute('data-track-property'),
        linkId: btn.getAttribute('data-track-link'),
        agentId: btn.getAttribute('data-track-agent'),
        channel: isWhatsapp ? 'whatsapp' : 'call'
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Sheet (hoja inferior / modal)
   * ------------------------------------------------------------------- */

  var sheetCloseHandlers = [];

  function closeSheet() {
    var root = u.qs('#sheet-root');
    var sheetEl = u.qs('.sheet', root);
    var backdrop = u.qs('.sheet-backdrop', root);
    if (!sheetEl) return;
    sheetEl.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-visible');
    // Si mientras tanto se abrió otra hoja (p. ej. Editar desde el menú de
    // acciones), no borrar su contenido: solo limpiar si sigue siendo esta.
    setTimeout(function () { if (u.qs('.sheet', root) === sheetEl) root.innerHTML = ''; }, 220);
    sheetCloseHandlers.forEach(function (fn) { fn(); });
    sheetCloseHandlers = [];
    document.removeEventListener('keydown', onEscape);
  }

  function onEscape(e) { if (e.key === 'Escape') closeSheet(); }

  function openSheet(opts) {
    opts = opts || {};
    var root = u.qs('#sheet-root');
    root.innerHTML =
      '<div class="sheet-backdrop"></div>' +
      '<div class="sheet ' + (opts.className || '') + '" role="dialog" aria-modal="true" aria-label="' + u.escapeHtml(opts.title || '') + '">' +
      '<div class="sheet__handle"></div>' +
      (opts.title ? '<div class="sheet__header"><h2 class="sheet__title">' + u.escapeHtml(opts.title) + '</h2><button type="button" class="btn btn--icon" data-sheet-close aria-label="Cerrar">' + u.icon('x', { size: 18 }) + '</button></div>' : '') +
      '<div class="sheet__body">' + opts.body + '</div>' +
      '</div>';

    var backdrop = u.qs('.sheet-backdrop', root);
    var sheetEl = u.qs('.sheet', root);
    requestAnimationFrame(function () {
      sheetEl.classList.add('is-open');
      backdrop.classList.add('is-visible');
    });

    backdrop.addEventListener('click', closeSheet);
    var closeBtn = u.qs('[data-sheet-close]', root);
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);
    document.addEventListener('keydown', onEscape);

    // Deslizar hacia abajo desde el "handle" para cerrar (móvil)
    var handle = u.qs('.sheet__handle', sheetEl);
    var startY = null;
    handle.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY; }, { passive: true });
    handle.addEventListener('touchmove', function (e) {
      if (startY == null) return;
      var dy = e.touches[0].clientY - startY;
      if (dy > 0) sheetEl.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    handle.addEventListener('touchend', function (e) {
      var dy = (e.changedTouches[0].clientY - startY);
      sheetEl.style.transform = '';
      if (dy > 80) closeSheet();
      startY = null;
    });

    if (opts.onClose) sheetCloseHandlers.push(opts.onClose);
    return closeSheet;
  }

  /* ---------------------------------------------------------------------
   * Vista previa de propiedad al tocar un pin del mapa
   * ------------------------------------------------------------------- */

  function openPropertyPeek(property) {
    var root = u.qs('#sheet-root');
    root.innerHTML =
      '<div class="sheet sheet--peek is-open" role="dialog" aria-label="Vista previa de propiedad">' +
      '<div class="sheet__handle"></div>' +
      propertyCardHTML(property, { variant: 'row', highlight: false }) +
      '</div>';
    bindFavoriteButtons(root);
  }

  function closePropertyPeek() {
    var root = u.qs('#sheet-root');
    var peek = u.qs('.sheet--peek', root);
    if (peek) root.innerHTML = '';
  }

  /* ---------------------------------------------------------------------
   * Filtros
   * ------------------------------------------------------------------- */

  var TYPE_OPTIONS = [
    { value: 'casa', label: 'Casa' },
    { value: 'departamento', label: 'Depto.' },
    { value: 'terreno', label: 'Terreno' },
    { value: 'local', label: 'Local' },
    { value: 'oficina', label: 'Oficina' }
  ];

  function openFilterSheet(currentFilters, allProperties, onApply) {
    var working = Object.assign({}, u.defaultFilters(), currentFilters, {
      types: (currentFilters.types || []).slice(),
      searchText: currentFilters.searchText || ''
    });

    function countMatches() { return u.applyFilters(allProperties, working).length; }

    function bodyHTML() {
      return (
        '<div class="filter-sheet__section">' +
        '<span class="filter-sheet__label">Buscar</span>' +
        '<div class="search-bar" style="box-shadow:none;border:1px solid var(--color-border-strong)">' +
        u.icon('search', { size: 18, class: 'text-muted' }) +
        '<input type="text" placeholder="Colonia, ciudad o nombre" data-search-text value="' + u.escapeHtml(working.searchText) + '" />' +
        '</div></div>' +

        '<div class="filter-sheet__section">' +
        '<span class="filter-sheet__label">Operación</span>' +
        '<div class="filter-options" data-group="operation">' +
        ['todas', 'venta', 'renta'].map(function (op) {
          var label = op === 'todas' ? 'Ambas' : (op === 'venta' ? 'Venta' : 'Renta');
          return '<button type="button" class="filter-option' + (working.operation === op ? ' is-active' : '') + '" data-op="' + op + '">' + label + '</button>';
        }).join('') + '</div></div>' +

        '<div class="filter-sheet__section">' +
        '<span class="filter-sheet__label">Tipo de propiedad</span>' +
        '<div class="filter-options" data-group="type">' +
        TYPE_OPTIONS.map(function (t) {
          return '<button type="button" class="filter-option' + (working.types.indexOf(t.value) !== -1 ? ' is-active' : '') + '" data-type="' + t.value + '">' + t.label + '</button>';
        }).join('') + '</div></div>' +

        '<div class="filter-sheet__section">' +
        '<span class="filter-sheet__label">Rango de precio</span>' +
        '<div class="range-row"><span>' + u.formatPrice(working.priceMin) + '</span><span>' + (working.priceMax >= u.PRICE_MAX ? u.formatPrice(u.PRICE_MAX) + '+' : u.formatPrice(working.priceMax)) + '</span></div>' +
        '<div class="range-slider">' +
        '<div class="range-slider__track"></div><div class="range-slider__fill" data-fill></div>' +
        '<input type="range" min="0" max="' + u.PRICE_MAX + '" step="50000" value="' + working.priceMin + '" data-range="min" aria-label="Precio mínimo" />' +
        '<input type="range" min="0" max="' + u.PRICE_MAX + '" step="50000" value="' + working.priceMax + '" data-range="max" aria-label="Precio máximo" />' +
        '</div></div>' +

        '<div class="filter-sheet__section stack gap-3">' +
        stepperHTML('bedrooms', 'Recámaras', working.bedrooms) +
        stepperHTML('bathrooms', 'Baños', working.bathrooms) +
        stepperHTML('parking', 'Estacionamientos', working.parking) +
        '</div>' +

        '<div class="filter-footer row gap-2">' +
        '<button type="button" class="btn btn--outline" data-clear>Limpiar</button>' +
        '<button type="button" class="btn btn--primary btn--block" data-apply>Ver ' + countMatches() + ' propiedades</button>' +
        '</div>'
      );
    }

    function stepperHTML(key, label, value) {
      return (
        '<div class="stepper-row" data-stepper="' + key + '">' +
        '<span style="font-weight:700;font-size:0.86rem">' + label + '</span>' +
        '<div class="stepper">' +
        '<button type="button" class="stepper__btn" data-step="-1">−</button>' +
        '<span class="stepper__value">' + (value > 0 ? value + '+' : 'Todos') + '</span>' +
        '<button type="button" class="stepper__btn" data-step="1">+</button>' +
        '</div></div>'
      );
    }

    function refreshFill(root) {
      var min = Number(working.priceMin), max = Number(working.priceMax);
      var pctMin = (min / u.PRICE_MAX) * 100, pctMax = (max / u.PRICE_MAX) * 100;
      var fill = u.qs('[data-fill]', root);
      if (fill) { fill.style.left = pctMin + '%'; fill.style.width = Math.max(0, pctMax - pctMin) + '%'; }
    }

    function rerender() {
      var root = u.qs('#sheet-root .sheet__body');
      root.innerHTML = bodyHTML();
      wire(root);
      refreshFill(root);
    }

    function wire(root) {
      u.qsa('[data-op]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { working.operation = btn.getAttribute('data-op'); rerender(); });
      });
      u.qsa('[data-type]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var val = btn.getAttribute('data-type');
          var idx = working.types.indexOf(val);
          if (idx === -1) working.types.push(val); else working.types.splice(idx, 1);
          rerender();
        });
      });
      u.qsa('[data-stepper]', root).forEach(function (row) {
        var key = row.getAttribute('data-stepper');
        u.qsa('[data-step]', row).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var delta = Number(btn.getAttribute('data-step'));
            working[key] = Math.max(0, (working[key] || 0) + delta);
            rerender();
          });
        });
      });
      var minInput = u.qs('[data-range="min"]', root);
      var maxInput = u.qs('[data-range="max"]', root);
      if (minInput && maxInput) {
        var onRange = u.debounce(function () {
          var min = Number(minInput.value), max = Number(maxInput.value);
          if (min > max) min = max;
          working.priceMin = min; working.priceMax = max;
          rerender();
        }, 120);
        [minInput, maxInput].forEach(function (input) {
          input.addEventListener('input', function () {
            refreshFill(root);
            var row = u.qs('.range-row', root);
            if (row) row.innerHTML = '<span>' + u.formatPrice(minInput.value) + '</span><span>' + (Number(maxInput.value) >= u.PRICE_MAX ? u.formatPrice(u.PRICE_MAX) + '+' : u.formatPrice(maxInput.value)) + '</span>';
          });
          input.addEventListener('change', onRange);
        });
      }
      var searchInput = u.qs('[data-search-text]', root);
      if (searchInput) searchInput.addEventListener('input', function (e) { working.searchText = e.target.value; });

      var clearBtn = u.qs('[data-clear]', root);
      if (clearBtn) clearBtn.addEventListener('click', function () { working = Object.assign(u.defaultFilters(), { searchText: '' }); rerender(); });
      var applyBtn = u.qs('[data-apply]', root);
      if (applyBtn) applyBtn.addEventListener('click', function () { closeSheet(); onApply(working); });
    }

    openSheet({ title: 'Filtros', body: bodyHTML() });
    var bodyRoot = u.qs('#sheet-root .sheet__body');
    wire(bodyRoot);
    refreshFill(bodyRoot);
  }

  /* ---------------------------------------------------------------------
   * Carrusel de fotos
   * ------------------------------------------------------------------- */

  function carouselHTML(photos, opts) {
    opts = opts || {};
    var slides = photos.map(function (src, i) {
      return '<div class="carousel__slide"><img src="' + src + '" alt="Fotografía ' + (i + 1) + ' de la propiedad" loading="' + (i === 0 ? 'eager' : 'lazy') + '" /></div>';
    }).join('');
    return (
      '<div class="carousel" data-carousel>' +
      '<div class="carousel__track" data-track>' + slides + '</div>' +
      (photos.length > 1 ? '<span class="carousel__counter" data-counter>1 / ' + photos.length + '</span>' : '') +
      (photos.length > 1 ? '<button type="button" class="btn btn--icon carousel__arrow carousel__arrow--prev" data-prev aria-label="Foto anterior">' + u.icon('chevronLeft', { size: 18 }) + '</button>' : '') +
      (photos.length > 1 ? '<button type="button" class="btn btn--icon carousel__arrow carousel__arrow--next" data-next aria-label="Foto siguiente">' + u.icon('chevronRight', { size: 18 }) + '</button>' : '') +
      '</div>'
    );
  }

  function initCarousel(root) {
    var carousel = u.qs('[data-carousel]', root);
    if (!carousel) return;
    var track = u.qs('[data-track]', carousel);
    var counter = u.qs('[data-counter]', carousel);
    var total = u.qsa('.carousel__slide', track).length;

    function goTo(index) {
      index = Math.max(0, Math.min(total - 1, index));
      track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
    }
    function currentIndex() { return Math.round(track.scrollLeft / track.clientWidth); }

    var prev = u.qs('[data-prev]', carousel);
    var next = u.qs('[data-next]', carousel);
    if (prev) prev.addEventListener('click', function () { goTo(currentIndex() - 1); });
    if (next) next.addEventListener('click', function () { goTo(currentIndex() + 1); });
    track.addEventListener('scroll', u.debounce(function () {
      if (counter) counter.textContent = (currentIndex() + 1) + ' / ' + total;
    }, 80));
  }

  /* ---------------------------------------------------------------------
   * Barra para compartir enlaces
   * ------------------------------------------------------------------- */

  function shareBarHTML(url) {
    return (
      '<div class="share-bar">' +
      u.icon('link', { size: 16 }) +
      '<span class="share-bar__link">' + u.escapeHtml(url) + '</span>' +
      '<button type="button" class="btn btn--sm" data-copy-text="' + u.escapeHtml(url) + '">Copiar</button>' +
      '</div>'
    );
  }

  function bindCopyButtons(root) {
    (root || document).addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy-text]');
      if (!btn) return;
      var text = btn.getAttribute('data-copy-text');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { u.toast('Enlace copiado'); });
      } else {
        u.toast('Copia el enlace: ' + text, { duration: 4000 });
      }
    });
  }

  /* ---------------------------------------------------------------------
   * Estadísticas
   * ------------------------------------------------------------------- */

  function statCardHTML(label, value, delta) {
    var hasDelta = typeof delta === 'number';
    var isUp = hasDelta && delta >= 0;
    return (
      '<div class="stat-card">' +
      '<span class="stat-card__label">' + u.escapeHtml(label) + '</span>' +
      '<span class="stat-card__value">' + value + '</span>' +
      (hasDelta ? '<span class="stat-card__delta ' + (isUp ? 'stat-card__delta--up' : 'stat-card__delta--down') + '">' + u.icon(isUp ? 'arrowUp' : 'arrowDown', { size: 12 }) + ' ' + Math.abs(delta) + '%</span>' : '') +
      '</div>'
    );
  }

  window.App.components = {
    mountChrome: mountChrome,
    refreshFavoriteUI: refreshFavoriteUI,
    propertyCardHTML: propertyCardHTML,
    propertyPriceLabel: propertyPriceLabel,
    bindFavoriteButtons: bindFavoriteButtons,
    bindContactButtons: bindContactButtons,
    quickFilterChipsHTML: quickFilterChipsHTML,
    bindQuickFilterChips: bindQuickFilterChips,
    openSheet: openSheet,
    closeSheet: closeSheet,
    openPropertyPeek: openPropertyPeek,
    closePropertyPeek: closePropertyPeek,
    openFilterSheet: openFilterSheet,
    carouselHTML: carouselHTML,
    initCarousel: initCarousel,
    shareBarHTML: shareBarHTML,
    bindCopyButtons: bindCopyButtons,
    statCardHTML: statCardHTML,
    specsRowHTML: specsRowHTML
  };
})();
