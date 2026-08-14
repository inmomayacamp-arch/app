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
      { pattern: "/perfil", view: v.account.render, key: "perfil" },
      { pattern: "/planes", view: v.plans.render, key: "perfil" },
      { pattern: "/planes-propietario", view: v.ownerPlan.render, key: "perfil" },
      { pattern: "/registro-propietario", view: v.ownerRegister.render, key: "perfil" },
      { pattern: "/solicitud", view: v.propertyRequest.render, key: "explore" },
      { pattern: "/soporte", view: v.support.render, key: "explore" },
      { pattern: "/terminos", view: v.terms.render, key: "explore" },
      { pattern: "/privacidad", view: v.privacy.render, key: "explore" },
      { pattern: "/confirmar-cuenta", view: v.confirmAccount.render, key: "explore" },
      { pattern: "/restablecer-contrasena", view: v.resetPassword.render, key: "explore" },
      { pattern: "/servicios/:category/:id", view: v.serviceProviderDetail.render, key: "explore" },
      { pattern: "/servicios/:category", view: v.serviceDirectory.render, key: "explore" },
      { pattern: "/anunciate", view: v.advertiseWithUs.render, key: "explore" },
      { pattern: "/registro-agente/:billing", view: window.App.agent.views.registerPlan.render, key: "dashboard" },
      { pattern: "/dashboard/login", view: window.App.agent.views.login.render, key: "dashboard" },
      { pattern: "/dashboard", view: window.App.agent.views.dashboardHome.render, key: "dashboard" },
      { pattern: "/dashboard/publicar-elegir", view: window.App.agent.views.publishChoice.render, key: "dashboard" },
      { pattern: "/dashboard/publicar", view: v.publishWizard.render, key: "publish" },
      { pattern: "/dashboard/publicar/:id", view: v.publishWizard.render, key: "publish" },
      { pattern: "/dashboard/propiedades", view: window.App.agent.views.properties.render, key: "dashboard" },
      { pattern: "/dashboard/destacar/:id", view: window.App.agent.views.featurePay.render, key: "dashboard" },
      { pattern: "/dashboard/clientes/:id", view: window.App.agent.views.clients.renderDetail, key: "dashboard" },
      { pattern: "/dashboard/clientes", view: window.App.agent.views.clients.renderList, key: "dashboard" },
      { pattern: "/dashboard/bolsa", view: window.App.agent.views.sharedPool.render, key: "dashboard" },
      { pattern: "/dashboard/enlaces/nuevo", view: window.App.agent.views.linksManage.renderCreate, key: "dashboard" },
      { pattern: "/dashboard/enlaces/:clientSlug", view: window.App.agent.views.linkStats.render, key: "dashboard" },
      { pattern: "/dashboard/enlaces", view: window.App.agent.views.linksManage.renderList, key: "dashboard" },
      { pattern: "/dashboard/perfil-profesional", view: window.App.agent.views.profile.render, key: "dashboard" },
      { pattern: "/dashboard/suscripcion", view: window.App.agent.views.subscription.render, key: "dashboard" },
      { pattern: "/admin/login", view: window.App.admin.views.login.render, key: "admin" },
      { pattern: "/admin", view: window.App.admin.views.dashboard.render, key: "admin" },
      { pattern: "/admin/agentes", view: window.App.admin.views.agents.render, key: "admin" },
      { pattern: "/admin/propietarios", view: window.App.admin.views.owners.render, key: "admin" },
      { pattern: "/admin/propiedades", view: window.App.admin.views.properties.render, key: "admin" },
      { pattern: "/admin/estadisticas", view: window.App.admin.views.stats.render, key: "admin" },
      { pattern: "/admin/solicitudes", view: window.App.admin.views.leads.render, key: "admin" },
      { pattern: "/admin/directorio", view: window.App.admin.views.directory.render, key: "admin" },
      { pattern: "/admin/reportes", view: window.App.admin.views.reports.render, key: "admin" },
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
    var path = hash.slice(1).split("?")[0];
    if (!path.startsWith("/")) path = "/" + path;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path || "/";
  }

  function currentQuery() {
    var hash = window.location.hash || "#/";
    var qIndex = hash.indexOf("?");
    var query = {};
    if (qIndex === -1) return query;
    hash.slice(qIndex + 1).split("&").forEach(function (pair) {
      if (!pair) return;
      var eq = pair.indexOf("=");
      var key = eq === -1 ? pair : pair.slice(0, eq);
      var value = eq === -1 ? "" : pair.slice(eq + 1);
      query[decodeURIComponent(key)] = decodeURIComponent(value);
    });
    return query;
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

    if (path.indexOf("/dashboard") === 0 && path !== "/dashboard/login" && !window.App.state.agents.isLoggedIn()) {
      window.location.hash = "#/dashboard/login";
      return;
    }

    // Las cuentas de propietario (publicación individual) solo ven su propio
    // panel reducido: propiedades, publicar y su perfil. Nada de clientes,
    // Bolsa Compartida, enlaces ni suscripción — eso es solo para asesores.
    var OWNER_ALLOWED_DASHBOARD_PREFIXES = ["/dashboard/propiedades", "/dashboard/publicar", "/dashboard/publicar-elegir", "/dashboard/perfil-profesional", "/dashboard/destacar"];
    if (path.indexOf("/dashboard") === 0 && path !== "/dashboard/login") {
      var loggedAgent = window.App.state.agents.current();
      if (loggedAgent && loggedAgent.plan === "propietario") {
        var allowed = path === "/dashboard" || OWNER_ALLOWED_DASHBOARD_PREFIXES.some(function (prefix) {
          return path === prefix || path.indexOf(prefix + "/") === 0;
        });
        if (!allowed) {
          window.location.hash = "#/dashboard";
          return;
        }
      }
    }

    var match = matchRoute(path);

    if (!match) {
      root.innerHTML = '<div class="empty-state" style="padding-top:80px"><h3>Página no encontrada</h3><p>La ruta "' + u.escapeHtml(path) + '" no existe.</p><a class="btn btn--primary" href="#/">Ir al inicio</a></div>';
      window.App.components.mountChrome("explore");
    } else {
      try {
        match.params.query = currentQuery();
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
