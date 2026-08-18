// Service worker mínimo: cachea el "app shell" para que InmoMaps sea instalable
// y cargue rápido en visitas repetidas. Los mapas y fotos siempre van a la red.
var CACHE_NAME = "inmomaps-shell-v184";
var APP_SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "css/styles.css",
  "css/admin.css",
  "js/config.js",
  "js/geoMexico.js",
  "js/supabaseClient.js",
  "js/utils.js",
  "js/data.js",
  "js/state.js",
  "js/map.js",
  "js/poi.js",
  "js/photoUpload.js",
  "js/pdfFicha.js",
  "js/components.js",
  "js/views/explore.js",
  "js/views/propertyList.js",
  "js/views/propertyDetail.js",
  "js/views/favorites.js",
  "js/views/account.js",
  "js/views/plans.js",
  "js/views/planDetalle.js",
  "js/views/ownerPlan.js",
  "js/views/ownerRegister.js",
  "js/views/providerPlans.js",
  "js/views/propertyRequest.js",
  "js/views/support.js",
  "js/views/terms.js",
  "js/views/privacy.js",
  "js/views/confirmAccount.js",
  "js/views/paymentResult.js",
  "js/views/resetPassword.js",
  "js/views/serviceDirectory.js",
  "js/views/serviceProviderDetail.js",
  "js/views/advertiseWithUs.js",
  "js/views/agentProfile.js",
  "js/views/clientLink.js",
  "js/views/publishWizard.js",
  "js/admin/data.js",
  "js/admin/state.js",
  "js/admin/components.js",
  "js/admin/views/login.js",
  "js/admin/views/dashboard.js",
  "js/admin/views/agents.js",
  "js/admin/views/owners.js",
  "js/admin/views/properties.js",
  "js/admin/views/payments.js",
  "js/admin/views/stats.js",
  "js/admin/views/leads.js",
  "js/admin/views/directory.js",
  "js/admin/views/reports.js",
  "js/admin/views/security.js",
  "js/admin/views/errors.js",
  "js/errorMonitor.js",
  "js/agent/state.js",
  "js/agent/components.js",
  "js/agent/views/login.js",
  "js/agent/views/registerPlan.js",
  "js/agent/views/registerProviderPlan.js",
  "js/agent/views/dashboardHome.js",
  "js/agent/views/properties.js",
  "js/agent/views/featurePay.js",
  "js/agent/views/publishChoice.js",
  "js/agent/views/clients.js",
  "js/agent/views/sharedPool.js",
  "js/agent/views/linksManage.js",
  "js/agent/views/linkStats.js",
  "js/agent/views/profile.js",
  "js/agent/views/providerListing.js",
  "js/agent/views/subscription.js",
  "js/router.js",
  "js/swipeNav.js",
  "js/app.js",
  "icons/favicon.svg",
  "icons/favicon-32x32.png",
  "icons/favicon-16x16.png",
  "icons/favicon.ico",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) { return key !== CACHE_NAME; }).map(function (key) { return caches.delete(key); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Con rutas reales (sin "#"), entrar sin internet directo a algo como
  // /propiedad/123 no tiene un archivo exacto en caché (nunca se guardó esa
  // ruta puntual) -- si además falla la red, se sirve el index.html ya
  // cacheado en vez de nada, para que la app arranque y pinte esa pantalla
  // por su cuenta en cuanto tenga los datos.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        return response;
      }).catch(function () {
        if (event.request.mode === "navigate") return caches.match("index.html");
        return cached;
      });
    })
  );
});
