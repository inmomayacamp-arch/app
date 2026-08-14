// Vista "Destacar mi propiedad": cobro real (Checkout de Stripe) del addon
// de destacado para una cuenta de propietario.
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var ac = window.App.agent.components;

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
      '      <div class="payment-section__title">' + u.icon('shield', { size: 15 }) + ' Pago seguro con Stripe</div>' +
      '      <p class="payment-section__note">Al continuar te llevamos a la página segura de pago. Aceptamos tarjeta, transferencia y OXXO.</p>' +
      '    </div>' +

      '    <button type="button" class="btn btn--primary btn--block" data-pay>' + u.icon('starFilled', { size: 15 }) + ' Pagar $' + addon.price + ' y destacar</button>' +
      '  </div>' +
      '</div>';

    ac.mount('propiedades', 'Destacar mi propiedad', content, root);

    var payBtn = u.qs('[data-pay]', root);
    payBtn.addEventListener('click', async function () {
      payBtn.disabled = true;
      try {
        await state.payments.startCheckout('featured', { propertyId: property.id });
      } catch (err) {
        payBtn.disabled = false;
        u.toast(err.message || 'No se pudo iniciar el pago');
      }
    });
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.featurePay = { render: render };
})();
