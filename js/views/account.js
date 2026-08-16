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

      '  <div class="account-welcome">' +
      '    <span class="account-welcome__icon">' + u.icon('pin', { size: 24 }) + '</span>' +
      '    <h2>Bienvenido a InmoMaps</h2>' +
      '    <p>¿Cómo quieres usar la plataforma?</p>' +
      '  </div>' +

      '  <a class="account-row account-row--agent" href="#/planes">' +
      '    <span class="account-row__icon">' + u.icon('briefcase', { size: 20 }) + '</span>' +
      '    <div class="account-row__body"><h4>Soy asesor inmobiliario</h4><p>Publica, comparte enlaces y da seguimiento a tus clientes</p></div>' +
      '    <span class="account-row__chev">' + u.icon('chevronRight', { size: 18 }) + '</span>' +
      '  </a>' +

      '  <a class="account-row account-row--owner" href="#/planes-propietario">' +
      '    <span class="account-row__icon">' + u.icon('home', { size: 20 }) + '</span>' +
      '    <div class="account-row__body"><h4>Quiero publicar mi propiedad</h4><p>Sin cuenta de asesor, contacto directo por WhatsApp</p></div>' +
      '    <span class="account-row__chev">' + u.icon('chevronRight', { size: 18 }) + '</span>' +
      '  </a>' +

      '  <a class="account-row account-row--provider" href="#/planes-proveedor">' +
      '    <span class="account-row__icon">' + u.icon('award', { size: 20 }) + '</span>' +
      '    <div class="account-row__body"><h4>Doy un servicio inmobiliario</h4><p>Notario, valuador, arquitecto, SOFOM u otro — aparece en el directorio</p></div>' +
      '    <span class="account-row__chev">' + u.icon('chevronRight', { size: 18 }) + '</span>' +
      '  </a>' +

      '  <div class="account-sep">O si ya tienes cuenta</div>' +
      '  <a class="btn btn--outline btn--block" href="#/dashboard/login">Iniciar sesión</a>' +

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
