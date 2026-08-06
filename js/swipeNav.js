// Navegación por deslizamiento: mantener el dedo y arrastrar hacia los lados
// cambia entre las secciones principales de la barra inferior (Explorar /
// Propiedades / Favoritos / Publicar-o-Panel en el sitio público; Inicio /
// Propiedades / Clientes / Menú en el panel del asesor), sin el botón central
// (es una acción, no una sección). No interfiere con el mapa, los carruseles
// de fotos ni las listas que ya se desplazan horizontalmente: si el toque
// empieza ahí, se deja el gesto nativo intacto.
(function () {
  "use strict";

  var AGENT_TABS = ["/dashboard", "/dashboard/propiedades", "/dashboard/clientes", "/dashboard/menu"];

  var EXCLUDE_SELECTOR =
    '.explore-map, .detail-map, .map-canvas, .map-picker, .map-chip-overlay, ' +
    '.property-scroller, .carousel, .chip-row, .admin-table-wrap, ' +
    'input, textarea, select, [data-carousel]';

  var DIRECTION_LOCK = 12;  // px para decidir si el gesto es horizontal o vertical
  var ANGLE_RATIO = 1.4;    // qué tan más horizontal que vertical debe ser
  var MIN_DISTANCE = 60;    // px para confirmar el cambio de sección

  function currentPath() {
    var hash = window.location.hash || "#/";
    var path = hash.slice(1).split("?")[0];
    if (path.indexOf("/") !== 0) path = "/" + path;
    if (path.length > 1 && path.charAt(path.length - 1) === "/") path = path.slice(0, -1);
    return path || "/";
  }

  function publicTabs() {
    var isAgent = window.App.state.agents && window.App.state.agents.isLoggedIn();
    return ["/", "/propiedades", "/favoritos", isAgent ? "/dashboard" : "/perfil"];
  }

  function activeTabs() {
    return currentPath().indexOf("/dashboard") === 0 ? AGENT_TABS : publicTabs();
  }

  function init() {
    var startX = 0, startY = 0, tracking = false, deciding = false, horizontal = false;

    document.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      if (e.target.closest(EXCLUDE_SELECTOR)) { tracking = false; return; }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
      deciding = true;
      horizontal = false;
    }, { passive: true });

    document.addEventListener("touchmove", function (e) {
      if (!tracking || e.touches.length !== 1) return;
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      if (deciding) {
        if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return;
        horizontal = Math.abs(dx) > Math.abs(dy) * ANGLE_RATIO;
        deciding = false;
        if (!horizontal) { tracking = false; return; }
      }
      if (horizontal && e.cancelable) e.preventDefault();
    }, { passive: false });

    document.addEventListener("touchend", function (e) {
      if (!tracking || !horizontal) { tracking = false; return; }
      tracking = false;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < MIN_DISTANCE) return;
      var tabs = activeTabs();
      var idx = tabs.indexOf(currentPath());
      if (idx === -1) return;
      var nextIdx = idx + (dx < 0 ? 1 : -1);
      if (nextIdx < 0 || nextIdx >= tabs.length) return;
      window.location.hash = "#" + tabs[nextIdx];
    }, { passive: true });

    document.addEventListener("touchcancel", function () { tracking = false; }, { passive: true });
  }

  window.App.swipeNav = { init: init };
})();
