// Navegación por deslizamiento: arrastrar horizontalmente sobre el contenido
// cambia entre las secciones principales de la barra inferior del sitio
// público (Explorar / Propiedades / Favoritos / Publicar-o-Panel), con el
// contenido siguiendo al dedo y terminando de deslizarse solo al soltar
// pasada la mitad del recorrido — como un carrusel, no como un salto
// instantáneo. El botón central (+) queda fuera de la secuencia: es una
// acción, no una sección. No interfiere con el mapa, los carruseles de fotos
// ni las listas que ya se desplazan horizontalmente: si el toque empieza
// ahí, o si la pantalla actual no es una de estas secciones, se deja el
// gesto nativo intacto y no se anima nada. El panel del asesor (/dashboard/*)
// ya no tiene una barra de pestañas fija (usa una sidebar), así que no
// participa de este gesto.
(function () {
  "use strict";

  var EXCLUDE_SELECTOR =
    '.explore-map, .detail-map, .map-canvas, .map-picker, .map-chip-overlay, ' +
    '.property-scroller, .carousel, .chip-row, .admin-table-wrap, ' +
    'input, textarea, select, [data-carousel]';

  var DIRECTION_LOCK = 12;   // px para decidir si el gesto es horizontal o vertical
  var ANGLE_RATIO = 1.4;     // qué tan más horizontal que vertical debe ser
  var COMMIT_DISTANCE = 70;  // px de recorrido total considerado "completo"
  var EDGE_RESISTANCE = 3;   // divisor de arrastre cuando no hay sección a donde ir

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
    // El panel del asesor ya no tiene pestañas fijas (usa una sidebar), así
    // que no participa del gesto de deslizamiento — solo el sitio público.
    return currentPath().indexOf("/dashboard") === 0 ? [] : publicTabs();
  }

  function init() {
    var viewRoot = document.getElementById("view-root");
    if (!viewRoot) return;

    var startX = 0, startY = 0, tracking = false, deciding = false, horizontal = false;
    var tabs = [], fromIdx = -1;

    function setTransform(px, transition) {
      viewRoot.style.transition = transition || "none";
      viewRoot.style.transform = px ? "translateX(" + px + "px)" : "";
    }

    function endTransition() {
      setTimeout(function () { viewRoot.style.transition = ""; viewRoot.style.transform = ""; }, 260);
    }

    function snapBack() {
      setTransform(0, "transform 0.22s cubic-bezier(.22,.68,0,1.01)");
      endTransition();
    }

    function completeSwipe(dir, targetPath) {
      var w = window.innerWidth;
      setTransform(dir === 1 ? -w : w, "transform 0.16s ease-in");
      setTimeout(function () {
        window.location.hash = "#" + targetPath;
        setTransform(dir === 1 ? w : -w, "none");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            setTransform(0, "transform 0.2s cubic-bezier(.22,.68,0,1.01)");
            endTransition();
          });
        });
      }, 160);
    }

    document.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      if (e.target.closest(EXCLUDE_SELECTOR)) { tracking = false; return; }
      tabs = activeTabs();
      fromIdx = tabs.indexOf(currentPath());
      if (fromIdx === -1) { tracking = false; return; } // no es una de las secciones con pestaña
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
      if (!horizontal) return;
      if (e.cancelable) e.preventDefault();
      var dir = dx < 0 ? 1 : -1;
      var hasTarget = (fromIdx + dir) >= 0 && (fromIdx + dir) < tabs.length;
      setTransform(hasTarget ? dx : dx / EDGE_RESISTANCE, "none");
    }, { passive: false });

    document.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      if (!horizontal) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dir = dx < 0 ? 1 : -1;
      var targetIdx = fromIdx + dir;
      var hasTarget = targetIdx >= 0 && targetIdx < tabs.length;
      if (hasTarget && Math.abs(dx) >= COMMIT_DISTANCE / 2) {
        completeSwipe(dir, tabs[targetIdx]);
      } else {
        snapBack();
      }
    }, { passive: true });

    document.addEventListener("touchcancel", function () {
      if (tracking && horizontal) snapBack();
      tracking = false;
    }, { passive: true });
  }

  window.App.swipeNav = { init: init };
})();
