// Service worker mínimo: cachea el "app shell" para que InmoMap sea instalable
// y cargue rápido en visitas repetidas. Los mapas y fotos siempre van a la red.
var CACHE_NAME = "inmomap-shell-v21";
var APP_SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "css/styles.css",
  "css/admin.css",
  "js/config.js",
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
  "js/views/ownerPlan.js",
  "js/views/ownerRegister.js",
  "js/views/propertyRequest.js",
  "js/views/support.js",
  "js/views/agentProfile.js",
  "js/views/clientLink.js",
  "js/views/dashboardHome.js",
  "js/views/publishWizard.js",
  "js/views/linksManage.js",
  "js/views/linkStats.js",
  "js/admin/data.js",
  "js/admin/state.js",
  "js/admin/components.js",
  "js/admin/views/login.js",
  "js/admin/views/dashboard.js",
  "js/admin/views/users.js",
  "js/admin/views/agents.js",
  "js/admin/views/properties.js",
  "js/admin/views/mapAdmin.js",
  "js/admin/views/subscriptions.js",
  "js/admin/views/payments.js",
  "js/admin/views/stats.js",
  "js/admin/views/moderation.js",
  "js/admin/views/leads.js",
  "js/admin/views/marketing.js",
  "js/admin/views/notifications.js",
  "js/admin/views/settings.js",
  "js/admin/views/reports.js",
  "js/admin/views/security.js",
  "js/agent/state.js",
  "js/agent/components.js",
  "js/agent/views/login.js",
  "js/agent/views/registerPlan.js",
  "js/agent/views/properties.js",
  "js/agent/views/clients.js",
  "js/agent/views/sharedPool.js",
  "js/agent/views/calendar.js",
  "js/agent/views/profile.js",
  "js/agent/views/stats.js",
  "js/agent/views/subscription.js",
  "js/agent/views/advertising.js",
  "js/agent/views/notifications.js",
  "js/agent/views/menu.js",
  "js/router.js",
  "js/app.js",
  "icons/icon.svg"
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

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        return response;
      }).catch(function () { return cached; });
    })
  );
});
