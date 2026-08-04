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

    // Ícono central del nav inferior: abre el panel de búsqueda y filtros
    // de la vista actual: si no existe ahí, navega a Explorar y lo abre.
    document.body.addEventListener("click", function (e) {
      var btn = e.target.closest('[data-nav-action="open-search"]');
      if (!btn) return;
      var existing = document.querySelector('[data-open-filters]');
      if (existing) {
        existing.click();
        return;
      }
      window.location.hash = "#/";
      setTimeout(function () {
        var filtersBtn = document.querySelector('[data-open-filters]');
        if (filtersBtn) filtersBtn.click();
      }, 60);
    });

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
