// Router SPA basado en el hash de la URL (#/ruta). No requiere servidor:
// funciona igual abriendo el archivo directamente o publicándolo en cualquier hosting estático.
(function () {
  "use strict";

  var u = window.App.utils;

  function compile(pattern) {
    var paramNames = [];
    var regexStr = pattern.replace(/:[a-zA-Z]+/g, function (match) {
      paramNames.push(match.slice(1));
      return "([^/]+)";
    });
    return { regex: new RegExp("^" + regexStr + "$"), paramNames: paramNames };
  }

  function routeTable() {
    var v = window.App.views;
    return [
      { pattern: "/", view: v.explore.render, key: "explore" },
      { pattern: "/propiedades", view: v.propertyList.render, key: "properties" },
      { pattern: "/propiedad/:id", view: v.propertyDetail.render, key: "explore" },
      { pattern: "/favoritos", view: v.favorites.render, key: "favorites" },
      { pattern: "/dashboard", view: v.dashboardHome.render, key: "dashboard" },
      { pattern: "/dashboard/publicar", view: v.publishWizard.render, key: "publish" },
      { pattern: "/dashboard/enlaces/nuevo", view: v.linksManage.renderCreate, key: "dashboard" },
      { pattern: "/dashboard/enlaces/:clientSlug", view: v.linkStats.render, key: "dashboard" },
      { pattern: "/dashboard/enlaces", view: v.linksManage.renderList, key: "dashboard" },
      { pattern: "/admin/login", view: window.App.admin.views.login.render, key: "admin" },
      { pattern: "/admin", view: window.App.admin.views.dashboard.render, key: "admin" },
      { pattern: "/admin/usuarios", view: window.App.admin.views.users.render, key: "admin" },
      { pattern: "/admin/agentes", view: window.App.admin.views.agents.render, key: "admin" },
      { pattern: "/admin/propiedades", view: window.App.admin.views.properties.render, key: "admin" },
      { pattern: "/admin/mapa", view: window.App.admin.views.mapAdmin.render, key: "admin" },
      { pattern: "/admin/suscripciones", view: window.App.admin.views.subscriptions.render, key: "admin" },
      { pattern: "/admin/pagos", view: window.App.admin.views.payments.render, key: "admin" },
      { pattern: "/admin/estadisticas", view: window.App.admin.views.stats.render, key: "admin" },
      { pattern: "/admin/moderacion", view: window.App.admin.views.moderation.render, key: "admin" },
      { pattern: "/admin/publicidad", view: window.App.admin.views.marketing.render, key: "admin" },
      { pattern: "/admin/notificaciones", view: window.App.admin.views.notifications.render, key: "admin" },
      { pattern: "/admin/configuracion", view: window.App.admin.views.settings.render, key: "admin" },
      { pattern: "/admin/reportes", view: window.App.admin.views.reports.render, key: "admin" },
      { pattern: "/admin/seguridad", view: window.App.admin.views.security.render, key: "admin" },
      { pattern: "/:agentSlug/:clientSlug", view: v.clientLink.render, key: "explore" },
      { pattern: "/:agentSlug", view: v.agentProfile.render, key: "explore" }
    ].map(function (r) {
      var compiled = compile(r.pattern);
      r.regex = compiled.regex;
      r.paramNames = compiled.paramNames;
      return r;
    });
  }

  function currentPath() {
    var hash = window.location.hash || "#/";
    var path = hash.slice(1);
    if (!path.startsWith("/")) path = "/" + path;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path || "/";
  }

  function matchRoute(path) {
    var routes = routeTable();
    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      var m = path.match(r.regex);
      if (m) {
        var params = {};
        r.paramNames.forEach(function (name, idx) { params[name] = decodeURIComponent(m[idx + 1]); });
        return { view: r.view, key: r.key, params: params };
      }
    }
    return null;
  }

  var leaveCallbacks = [];
  function onLeave(fn) { leaveCallbacks.push(fn); }
  function runLeaveCallbacks() {
    leaveCallbacks.forEach(function (fn) { try { fn(); } catch (e) { /* no-op */ } });
    leaveCallbacks = [];
  }

  function render() {
    runLeaveCallbacks();
    window.App.components.closeSheet();
    var root = u.qs("#view-root");
    var path = currentPath();

    if (path.indexOf("/admin") === 0 && path !== "/admin/login" && !window.App.admin.state.auth.isAuthed()) {
      window.location.hash = "#/admin/login";
      return;
    }

    var match = matchRoute(path);

    if (!match) {
      root.innerHTML = '<div class="empty-state" style="padding-top:80px"><h3>Página no encontrada</h3><p>La ruta "' + u.escapeHtml(path) + '" no existe.</p><a class="btn btn--primary" href="#/">Ir al inicio</a></div>';
      window.App.components.mountChrome("explore");
    } else {
      try {
        match.view(match.params, root);
      } catch (err) {
        console.error("Error al renderizar la vista:", err);
        root.innerHTML = '<div class="empty-state" style="padding-top:80px"><h3>Ocurrió un error al cargar esta pantalla</h3><p>' + u.escapeHtml(err.message || "") + '</p><a class="btn btn--primary" href="#/">Ir al inicio</a></div>';
      }
    }

    window.scrollTo(0, 0);
    root.focus();
  }

  function init() {
    if (!window.location.hash) window.location.hash = "#/";
    window.addEventListener("hashchange", render);
    render();
  }

  window.App.router = { init: init, onLeave: onLeave, render: render };
})();
