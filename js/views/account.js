// Vista "Perfil": página de cuenta para el usuario normal (comprador), con acceso
// aparte para asesores inmobiliarios que quieran entrar a su panel de trabajo.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;

  function render(params, root) {
    root.innerHTML =
      '<div class="page-header"><h1 class="page-header__title">Mi cuenta</h1></div>' +
      '<div class="page-wrap">' +

      '  <div class="promo-card promo-card--agent">' +
      '    <span class="promo-card__icon">' + u.icon('briefcase', { size: 28 }) + '</span>' +
      '    <div class="promo-card__body">' +
      '      <strong>¿Eres asesor inmobiliario?</strong>' +
      '      <p>¿Quieres que tus propiedades aparezcan aquí? Publícalas, comparte enlaces personalizados con tus clientes y revisa tus estadísticas desde tu propio panel.</p>' +
      '      <a class="btn btn--primary btn--sm" href="#/planes">' + u.icon('crown', { size: 14 }) + ' Ver planes para agentes</a>' +
      '      <a class="promo-card__login-link" href="#/dashboard/login">¿Ya tienes cuenta? Inicia sesión</a>' +
      '    </div>' +
      '  </div>' +

      '  <div class="promo-card promo-card--agent" style="margin-top:16px">' +
      '    <span class="promo-card__icon">' + u.icon('home', { size: 28 }) + '</span>' +
      '    <div class="promo-card__body">' +
      '      <strong>¿Eres propietario y quieres publicar tu propiedad?</strong>' +
      '      <p>Publica tu propiedad en venta o renta sin necesidad de una cuenta de asesor. Recibe contactos directo a tu WhatsApp y teléfono.</p>' +
      '      <a class="btn btn--primary btn--sm" href="#/planes-propietario">' + u.icon('home', { size: 14 }) + ' Publicar mi propiedad</a>' +
      '    </div>' +
      '  </div>' +

      '  <div class="promo-card promo-card--agent" style="margin-top:16px">' +
      '    <span class="promo-card__icon">' + u.icon('user', { size: 28 }) + '</span>' +
      '    <div class="promo-card__body">' +
      '      <strong>¿Ya tienes una cuenta?</strong>' +
      '      <p>Inicia sesión para acceder a tu panel de asesor o administrar tu propiedad publicada.</p>' +
      '      <a class="btn btn--primary btn--sm" href="#/dashboard/login">' + u.icon('user', { size: 14 }) + ' Iniciar sesión</a>' +
      '    </div>' +
      '  </div>' +

      '  <div class="account-brand">' +
      '    <span class="account-brand__logo">' + u.logoHTML() + '</span>' +
      '    <p>La plataforma inmobiliaria donde el mapa es el centro.</p>' +
      '  </div>' +
      '</div>';

    c.mountChrome('perfil');
    document.title = 'Mi cuenta — InmoMaps';
  }

  window.App.views = window.App.views || {};
  window.App.views.account = { render: render };
})();
