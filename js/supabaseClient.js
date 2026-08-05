// Cliente de Supabase (base de datos + autenticación real).
(function () {
  "use strict";

  var cfg = window.APP_CONFIG;
  var client = null;

  if (window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  window.App = window.App || {};
  window.App.supabase = client;
})();
