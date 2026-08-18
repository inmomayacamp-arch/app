// Router SPA basado en rutas reales (/ruta, sin "#"). Necesita que el
// hosting redirija cualquier ruta a index.html (ver vercel.json) -- a
// cambio, cada propiedad/enlace/perfil puede tener su propia vista previa
// al compartirse (foto, precio, descripción), cosa que con "#/ruta" nunca
// era posible porque el servidor jamás llega a ver esa parte de la URL.
//
// Compatibilidad con enlaces viejos: en vez de reescribir los cientos de
// "href=\"#/...\"" y "window.location.hash = ..." que ya existen en todo
// el código, el router detecta cualquier cambio de hash (los de siempre
// siguen funcionando tal cual) y lo convierte de inmediato a una ruta
// limpia con history.replaceState, sin recargar la página.
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
      { pattern: "/planes-proveedor", view: v.providerPlans.render, key: "perfil" },
      { pattern: "/plan-detalle/:tipo", view: v.planDetalle.render, key: "perfil" },
      { pattern: "/registro-proveedor/:billing", view: window.App.agent.views.registerProviderPlan.render, key: "dashboard" },
      { pattern: "/solicitud", view: v.propertyRequest.render, key: "explore" },
      { pattern: "/soporte", view: v.support.render, key: "explore" },
      { pattern: "/terminos", view: v.terms.render, key: "explore" },
      { pattern: "/privacidad", view: v.privacy.render, key: "explore" },
      { pattern: "/confirmar-cuenta", view: v.confirmAccount.render, key: "explore" },
      { pattern: "/restablecer-contrasena", view: v.resetPassword.render, key: "explore" },
      { pattern: "/pago-exitoso", view: v.paymentResult.renderSuccess, key: "explore" },
      { pattern: "/pago-cancelado", view: v.paymentResult.renderCancel, key: "explore" },
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
      { pattern: "/dashboard/mi-ficha", view: window.App.agent.views.providerListing.render, key: "dashboard" },
      { pattern: "/dashboard/suscripcion", view: window.App.agent.views.subscription.render, key: "dashboard" },
      { pattern: "/admin/login", view: window.App.admin.views.login.render, key: "admin" },
      { pattern: "/admin", view: window.App.admin.views.dashboard.render, key: "admin" },
      { pattern: "/admin/agentes", view: window.App.admin.views.agents.render, key: "admin" },
      { pattern: "/admin/propietarios", view: window.App.admin.views.owners.render, key: "admin" },
      { pattern: "/admin/propiedades", view: window.App.admin.views.properties.render, key: "admin" },
      { pattern: "/admin/pagos", view: window.App.admin.views.payments.render, key: "admin" },
      { pattern: "/admin/estadisticas", view: window.App.admin.views.stats.render, key: "admin" },
      { pattern: "/admin/solicitudes", view: window.App.admin.views.leads.render, key: "admin" },
      { pattern: "/admin/directorio", view: window.App.admin.views.directory.render, key: "admin" },
      { pattern: "/admin/reportes", view: window.App.admin.views.reports.render, key: "admin" },
      { pattern: "/admin/seguridad", view: window.App.admin.views.security.render, key: "admin" },
      { pattern: "/admin/errores", view: window.App.admin.views.errors.render, key: "admin" },
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
    var path = window.location.pathname;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path || "/";
  }

  function currentQuery() {
    var search = window.location.search || "";
    var query = {};
    if (!search) return query;
    search.slice(1).split("&").forEach(function (pair) {
      if (!pair) return;
      var eq = pair.indexOf("=");
      var key = eq === -1 ? pair : pair.slice(0, eq);
      var value = eq === -1 ? "" : pair.slice(eq + 1);
      query[decodeURIComponent(key)] = decodeURIComponent(value);
    });
    return query;
  }

  // Si hay un "#/..." en la URL (enlace viejo, o cualquier código existente
  // que todavía haga window.location.hash = "#/..."), lo convierte a una
  // ruta real sin tocar el historial (no se agrega una entrada nueva, la
  // que ya puso el navegador al cambiar el hash se reemplaza tal cual).
  function convertHashIfPresent() {
    var hash = window.location.hash;
    if (!hash || hash === "#") return false;
    var raw = hash.slice(1);
    if (!raw.startsWith("/")) raw = "/" + raw;
    history.replaceState(null, "", raw);
    return true;
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
    u.resetMeta();
    u.clearJsonLd();
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

    // Las cuentas de proveedor (directorio de servicios) solo ven su propia
    // ficha y su suscripción — nada del panel de propiedades de un asesor.
    var PROVIDER_ALLOWED_DASHBOARD_PREFIXES = ["/dashboard/mi-ficha", "/dashboard/suscripcion"];
    if (path.indexOf("/dashboard") === 0 && path !== "/dashboard/login") {
      var loggedProvider = window.App.state.agents.current();
      if (loggedProvider && loggedProvider.plan === "proveedor") {
        var providerAllowed = path === "/dashboard" || PROVIDER_ALLOWED_DASHBOARD_PREFIXES.some(function (prefix) {
          return path === prefix || path.indexOf(prefix + "/") === 0;
        });
        if (!providerAllowed) {
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

  function onHashChange() {
    convertHashIfPresent();
    render();
  }

  function init() {
    convertHashIfPresent();
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", render);
    render();
  }

  window.App.router = { init: init, onLeave: onLeave, render: render };
})();
