// Vista "Publica tu propiedad": página pública de precio para propietarios
// que quieren publicar una sola propiedad, sin crear una cuenta de asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;

  function houseArtSVG() {
    return (
      '<svg class="plan-card__art" viewBox="0 0 320 96" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<line x1="4" y1="86" x2="316" y2="86" stroke-dasharray="1,7" />' +
      '<path d="M112 86V40l26-17 26 17v46" /><rect x="124" y="56" width="9" height="9" /><rect x="141" y="56" width="9" height="9" /><rect x="124" y="71" width="9" height="9" />' +
      '<path d="M232 42a16 16 0 1 0-32 0c0 11 16 30 16 30s16-19 16-30z" /><circle cx="216" cy="42" r="5.5" />' +
      '</svg>'
    );
  }

  function trustBarHTML() {
    var items = [
      { icon: "clock", text: "Publica en minutos, sin trámites" },
      { icon: "chat", text: "Los interesados te contactan directo" },
      { icon: "shield", text: "Activación inmediata al publicar" }
    ];
    return items.map(function (it) {
      return '<div class="plans-trust__item">' + u.icon(it.icon, { size: 16 }) + '<span>' + it.text + '</span></div>';
    }).join('');
  }

  function render(params, root) {
    var plan = window.App.admin.data.OWNER_PLAN;
    var addon = plan.featuredAddon;

    var featuresHTML = plan.features.map(function (f) {
      return '<li>' + u.icon('check', { size: 14 }) + '<span>' + u.escapeHtml(f) + '</span></li>';
    }).join('');

    root.innerHTML =
      '<div class="page-header"><h1 class="page-header__title">Publica tu propiedad</h1></div>' +
      '<div class="plans-page">' +
      '  <div class="container plans-hero">' +
      '    <span class="plans-hero__eyebrow">' + u.icon('home', { size: 14 }) + ' Para propietarios</span>' +
      '    <h2 class="plans-hero__title">Vende o renta tu propiedad <span>directo, sin intermediarios</span></h2>' +
      '    <p class="plans-hero__subtitle">Publica tu propiedad en el mapa de InmoMap y recibe contactos directo a tu WhatsApp y teléfono.</p>' +
      '    <div class="plans-trust">' + trustBarHTML() + '</div>' +
      '  </div>' +

      '  <div class="container" style="max-width:480px">' +
      '  <div class="plan-column">' +
      '    <div class="plan-card">' +
      '      <span class="plan-card__badge">' + u.icon('home', { size: 12 }) + ' Publicación individual</span>' +
      '      <h3 class="plan-card__name">' + u.escapeHtml(plan.name) + '</h3>' +
      '      <p class="plan-card__tagline">' + u.escapeHtml(plan.tagline) + '</p>' +
      '      <div class="plan-card__price"><span class="plan-card__price-currency">$</span>' + plan.price + '<span class="plan-card__price-period">/ por ' + plan.period + '</span></div>' +
      '      <a class="btn btn--primary btn--block" href="#/registro-propietario">Publicar mi propiedad</a>' +
      '      <div class="plan-card__divider"></div>' +
      '      <div class="plan-card__include">Incluye:</div>' +
      '      <ul class="plan-card__features">' + featuresHTML + '</ul>' +
      houseArtSVG() +
      '    </div>' +

      '    <div class="promo-card">' +
      '      <span class="promo-card__icon">' + u.icon('megaphone', { size: 28 }) + '</span>' +
      '      <div class="promo-card__body">' +
      '        <strong>' + u.escapeHtml(addon.label) + ' (+$' + addon.price + ' MXN)</strong>' +
      '        <p>' + u.escapeHtml(addon.description) + ' Puedes activarlo al publicar tu propiedad.</p>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  </div>' +

      '  <div class="container">' +
      '    <div class="plans-footnote">' + u.icon('shield', { size: 16 }) + ' No necesitas ser asesor inmobiliario para publicar tu propiedad.</div>' +
      '  </div>' +
      '</div>';

    c.mountChrome('perfil');
    document.title = 'Publica tu propiedad — InmoMap';
  }

  window.App.views = window.App.views || {};
  window.App.views.ownerPlan = { render: render };
})();
