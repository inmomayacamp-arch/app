// Punto de entrada de la aplicación.
(function () {
  "use strict";

  function applyBrandColor(hex) {
    if (!hex) return;
    document.documentElement.style.setProperty('--color-primary', hex);
  }
  window.App.applyBrandColor = applyBrandColor;

  document.addEventListener("DOMContentLoaded", function () {
    boot();
  });

  async function boot() {
    var c = window.App.components;
    var viewRoot = document.getElementById("view-root");
    if (viewRoot) viewRoot.innerHTML = '<div class="empty-state" style="padding-top:80px"><p class="text-muted">Cargando…</p></div>';

    // Delegación global: funciona sin importar qué vista esté montada.
    c.bindFavoriteButtons(document.body);
    c.bindContactButtons(document.body);
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

    await window.App.state.agents.bootstrap();
    await Promise.all([
      window.App.state.properties.bootstrap(),
      window.App.state.links.bootstrap(),
      window.App.state.leads.bootstrap()
    ]);

    async function bootstrapAgentPanel() {
      await Promise.all([
        window.App.state.tracking.bootstrap(),
        window.App.agent.state.clients.bootstrap(),
        window.App.agent.state.calendar.bootstrap(),
        window.App.agent.state.notifications.bootstrap(),
        window.App.agent.state.sharedPool.bootstrap()
      ]);
    }
    window.App.state.on("agent:session", function (profile) {
      if (profile) {
        bootstrapAgentPanel().catch(function () { /* se ignora: las vistas reintentan al navegar */ });
      } else {
        window.App.agent.state.clearCaches();
        window.App.state.tracking.clear();
      }
    });
    if (window.App.state.agents.isLoggedIn()) {
      await bootstrapAgentPanel();
    }

    window.App.router.init();

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () { /* PWA opcional: se ignora si falla */ });
      });
    }
  }
})();
