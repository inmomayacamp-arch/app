// Vista "¿Cómo quieres publicar?": paso previo al asistente de publicación
// para cuentas de propietario, para elegir entre publicar gratis o ir
// directo a pagar el destacado al terminar de llenar la ficha. Los asesores
// no pasan por aquí — sus tiles siguen apuntando directo a #/dashboard/publicar.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.agent.components;

  function render(params, root) {
    var addon = window.App.admin.data.OWNER_PLAN.featuredAddon;
    var content =
      '<p class="text-secondary" style="font-size:0.88rem;margin-bottom:16px">Elige cómo quieres publicar tu propiedad.</p>' +
      '<a class="attention-card attention-card--neutral" href="#/dashboard/publicar">' +
      '  <span class="attention-card__icon">' + u.icon('home', { size: 18 }) + '</span>' +
      '  <div class="attention-card__text"><strong>Publicar gratis</strong><span>Aparece en el mapa y en las búsquedas normales</span></div>' +
      u.icon('chevronRight', { size: 18, class: 'text-muted' }) +
      '</a>' +
      '<a class="attention-card" href="#/dashboard/publicar?intent=featured">' +
      '  <span class="attention-card__icon">' + u.icon('starFilled', { size: 18 }) + '</span>' +
      '  <div class="attention-card__text"><strong>Destacar mi propiedad (+$' + addon.price + ')</strong><span>' + u.escapeHtml(addon.description) + '</span></div>' +
      u.icon('chevronRight', { size: 18, class: 'text-muted' }) +
      '</a>';
    ac.mount('propiedades', '¿Cómo quieres publicar?', content, root);
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.publishChoice = { render: render };
})();
