// Vista "Destacar mi propiedad": pantalla de cobro para el addon de destacado
// de una cuenta de propietario. El cobro real con Stripe todavía no está
// conectado, así que por ahora solo explica el precio y manda a Soporte —
// pero ya existe como pantalla propia en vez de un simple aviso, lista para
// enchufar Stripe cuando esté listo.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var ac = window.App.agent.components;

  var PAYMENT_METHODS = [
    { icon: "dollar", label: "Tarjeta de crédito o débito" },
    { icon: "exchange", label: "Transferencia bancaria" },
    { icon: "store", label: "Pago en OXXO" }
  ];

  function render(params, root) {
    var agent = state.agents.current();
    var property = state.properties.get(params.id);
    var addon = window.App.admin.data.OWNER_PLAN.featuredAddon;

    if (!property || property.agentSlug !== agent.slug) {
      ac.mount('propiedades', 'Propiedad no encontrada', '<div class="empty-state"><h3>Propiedad no encontrada</h3><a class="btn btn--primary" href="#/dashboard/propiedades">Volver</a></div>', root);
      return;
    }

    if (property.featured) {
      ac.mount('propiedades', 'Destacar mi propiedad',
        '<div class="empty-state" style="padding-top:24px"><span class="empty-state__icon" style="color:var(--color-venta)">' + u.icon('starFilled', { size: 30 }) + '</span>' +
        '<h3>Tu propiedad ya está destacada</h3><a class="btn btn--primary" href="#/dashboard/propiedades">Volver a Mis propiedades</a></div>', root);
      return;
    }

    function paymentMethodsHTML() {
      return PAYMENT_METHODS.map(function (m) {
        return '<div class="payment-option" aria-disabled="true">' +
          '<span class="payment-option__icon">' + u.icon(m.icon, { size: 16 }) + '</span>' +
          '<span>' + m.label + '</span>' +
          '<span class="payment-option__soon">' + u.icon('clock', { size: 12 }) + ' Próximamente</span>' +
          '</div>';
      }).join('');
    }

    var content =
      '<div class="signup-checkout" style="padding:0">' +
      '  <div class="signup-checkout__card" style="box-shadow:none;padding:0">' +

      '    <div class="plan-summary">' +
      '      <div class="plan-summary__head">' +
      '        <div><span class="plan-summary__label">' + u.escapeHtml(addon.label) + '</span>' +
      '        <strong class="plan-summary__name">' + u.escapeHtml(property.title) + '</strong></div>' +
      '        <div class="plan-summary__price">$' + addon.price + '<span>/ ' + addon.period + '</span></div>' +
      '      </div>' +
      '      <p class="text-secondary" style="font-size:0.86rem;margin:8px 0 0">' + u.escapeHtml(addon.description) + '</p>' +
      '    </div>' +

      '    <div class="payment-section">' +
      '      <div class="payment-section__title">' + u.icon('shield', { size: 15 }) + ' Método de pago</div>' +
      '      <div class="payment-options">' + paymentMethodsHTML() + '</div>' +
      '      <p class="payment-section__note">Estamos integrando el cobro en línea con Stripe. Mientras tanto, escríbenos a Soporte y te ayudamos a destacar tu propiedad.</p>' +
      '    </div>' +

      '    <a class="btn btn--primary btn--block" href="#/soporte">' + u.icon('flag', { size: 15 }) + ' Escríbenos a Soporte</a>' +
      '  </div>' +
      '</div>';

    ac.mount('propiedades', 'Destacar mi propiedad', content, root);
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.featurePay = { render: render };
})();
