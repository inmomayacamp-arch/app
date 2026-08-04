// Punto de entrada de la aplicación.
(function () {
  "use strict";

  function applyBrandColor(hex) {
    if (!hex) return;
    document.documentElement.style.setProperty('--color-primary', hex);
  }
  window.App.applyBrandColor = applyBrandColor;

  document.addEventListener("DOMContentLoaded", function () {
    var c = window.App.components;

    // Delegación global: funciona sin importar qué vista esté montada.
    c.bindFavoriteButtons(document.body);
    c.bindCopyButtons(document.body);

    if (window.App.admin && window.App.admin.state) {
      applyBrandColor(window.App.admin.state.settings.get().primaryColor);
    }

    window.App.router.init();

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () { /* PWA opcional: se ignora si falla */ });
      });
    }
  });
})();
