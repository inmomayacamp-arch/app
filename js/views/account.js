// Vista "Perfil": página de cuenta para el usuario normal (comprador), con acceso
// aparte para asesores inmobiliarios que quieran entrar a su panel de trabajo.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;

  function render(params, root) {
    var favCount = state.favorites.count();

    root.innerHTML =
      '<div class="page-header"><h1 class="page-header__title">Mi cuenta</h1></div>' +
      '<div class="page-wrap">' +

      '  <div class="empty-state" style="padding:32px 20px 8px">' +
      '    <span class="empty-state__icon">' + u.icon('user', { size: 32 }) + '</span>' +
      '    <h3>Explora InmoMap</h3>' +
      '    <p>Encuentra propiedades en venta y renta, guarda tus favoritas y contacta directo por WhatsApp con el asesor.</p>' +
      '  </div>' +

      '  <div class="dashboard-grid" style="grid-template-columns:repeat(2,1fr)">' +
      '    <a class="dashboard-card" href="#/favoritos"><span class="dashboard-card__icon">' + u.icon('heart', { size: 18 }) + '</span><strong>Favoritos</strong><span>' + favCount + ' guardadas</span></a>' +
      '    <a class="dashboard-card" href="#/propiedades"><span class="dashboard-card__icon">' + u.icon('list', { size: 18 }) + '</span><strong>Propiedades</strong><span>Ver todas</span></a>' +
      '  </div>' +

      '  <div class="promo-card promo-card--agent" style="margin-top:28px">' +
      '    <span class="promo-card__icon">' + u.icon('briefcase', { size: 28 }) + '</span>' +
      '    <div class="promo-card__body">' +
      '      <strong>¿Eres asesor inmobiliario?</strong>' +
      '      <p>¿Quieres que tus propiedades aparezcan aquí? Publícalas, comparte enlaces personalizados con tus clientes y revisa tus estadísticas desde tu propio panel.</p>' +
      '      <a class="btn btn--primary btn--sm" href="#/planes">' + u.icon('crown', { size: 14 }) + ' Ver planes para agentes</a>' +
      '      <a class="promo-card__login-link" href="#/dashboard/login">¿Ya tienes cuenta? Inicia sesión</a>' +
      '    </div>' +
      '  </div>' +

      '  <p class="text-muted" style="font-size:0.78rem;margin-top:20px;text-align:center">¿Tienes una propiedad para vender o rentar? <a href="#/dashboard/publicar" style="color:var(--color-primary);font-weight:700">Publícala aquí</a></p>' +
      '</div>';

    c.mountChrome('perfil');
    document.title = 'Mi cuenta — InmoMap';
  }

  window.App.views = window.App.views || {};
  window.App.views.account = { render: render };
})();
