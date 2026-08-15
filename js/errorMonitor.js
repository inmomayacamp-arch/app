// Monitoreo global de errores de JavaScript: antes, un error en producción
// se perdía por completo salvo que la persona afectada lo reportara a mano
// desde Soporte. Esto manda un resumen a Supabase (agrupado por huella, sin
// crear una fila nueva por cada ocurrencia del mismo error) para verlo
// desde #/admin/errores. Se carga primero que todo lo demás para no
// perderse errores que ocurran durante la carga de otros scripts.
(function () {
  "use strict";

  var reported = {};

  function truncate(str, n) {
    str = String(str == null ? "" : str);
    return str.length > n ? str.slice(0, n) : str;
  }

  function report(type, message, source, line, stack) {
    if (!message) return;
    // Ruido típico de extensiones del navegador o de scripts cross-origin
    // sin detalle real (el navegador los oculta por seguridad) — no aporta
    // nada reportarlos.
    if (message === "Script error." || /extension:\/\//.test(String(source))) return;

    var fp = truncate(type + "|" + message + "|" + source + "|" + line, 200);
    if (reported[fp]) return; // ya se mandó esta huella en esta carga de página
    reported[fp] = true;

    try {
      if (!window.App || !window.App.supabase) return;
      var agent = (window.App.state && window.App.state.agents.isLoggedIn()) ? window.App.state.agents.current() : null;
      window.App.supabase.rpc("log_client_error", {
        p_fingerprint: fp,
        p_message: truncate(message, 500),
        p_stack: truncate(stack, 4000),
        p_url: truncate(window.location.href, 500),
        p_user_agent: truncate(navigator.userAgent, 300),
        p_agent_id: agent ? agent.id : null
      }).catch(function () { /* no-op: el monitoreo nunca debe romper la app */ });
    } catch (e) { /* no-op */ }
  }

  window.addEventListener("error", function (e) {
    report("error", e.message, e.filename, e.lineno, e.error && e.error.stack);
  });
  window.addEventListener("unhandledrejection", function (e) {
    var reason = e.reason;
    var message = (reason && reason.message) ? reason.message : String(reason);
    var stack = (reason && reason.stack) ? reason.stack : "";
    report("unhandledrejection", message, window.location.href, "", stack);
  });
})();
