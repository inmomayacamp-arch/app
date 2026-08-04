// Punto de entrada de la aplicación.
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var c = window.App.components;

    // Delegación global: funciona sin importar qué vista esté montada.
    c.bindFavoriteButtons(document.body);
    c.bindCopyButtons(document.body);

    window.App.router.init();

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () { /* PWA opcional: se ignora si falla */ });
      });
    }
  });
})();
