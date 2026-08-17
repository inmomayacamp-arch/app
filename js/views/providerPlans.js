// Vista "Plan para el directorio de servicios": landing para notarios,
// valuadores, arquitectos, proveedores de servicios y SOFOM que quieren
// pagar su propia ficha en el directorio, sin depender del admin. Mismo
// patrón que js/views/plans.js (el equivalente para asesores).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;

  var TOOLS = [
    { icon: "award", tone: "", title: "Tu ficha propia", text: "Nombre, descripción, fotos y contacto en el directorio." },
    { icon: "pin", tone: "terreno", title: "Pin en el mapa", text: "Aparece en Explorar, no solo en la lista del directorio." },
    { icon: "camera", tone: "otro", title: "Varias fotos", text: "Sube las que quieras, no solo un logo." },
    { icon: "chat", tone: "venta", title: "Contacto directo", text: "Te escriben por WhatsApp o te llaman directo." }
  ];

  function toolsGridHTML() {
    return TOOLS.map(function (t) {
      return '<div class="tool-mini">' +
        '<span class="tool-mini__icon' + (t.tone ? ' tool-mini__icon--' + t.tone : '') + '">' + u.icon(t.icon, { size: 16 }) + '</span>' +
        '<h4>' + u.escapeHtml(t.title) + '</h4><p>' + u.escapeHtml(t.text) + '</p>' +
        '</div>';
    }).join('');
  }

  function render(params, root) {
    var plan = window.App.admin.data.PROVIDER_PLAN;
    var annualMonthly = Math.round(plan.priceAnnual / 12);

    root.innerHTML =
      '<div class="page-header"><h1 class="page-header__title">Plan para el directorio</h1></div>' +
      '<div class="plans-page">' +
      '  <div class="container plans-hero">' +
      '    <a class="signup-checkout__back" style="display:flex;justify-content:center" href="#/perfil">' + u.icon("chevronLeft", { size: 16 }) + ' Volver</a>' +
      '    <span class="plans-hero__eyebrow">' + u.icon("award", { size: 14 }) + ' Para notarios, valuadores, arquitectos, SOFOM y servicios</span>' +
      '    <h2 class="plans-hero__title">Tu ficha en el<br /><span>directorio de InmoMaps.</span></h2>' +
      '    <p class="plans-hero__subtitle">Publica tú mismo, sin esperar a que el admin te dé de alta.</p>' +
      '  </div>' +

      '  <div class="container" style="max-width:640px">' +
      '    <div class="plans-section-label">Todo lo que incluye</div>' +
      '    <div class="tool-grid">' + toolsGridHTML() + '</div>' +
      '  </div>' +

      '  <div class="container" style="max-width:420px">' +
      '    <div class="billing-toggle" data-billing-toggle>' +
      '      <button type="button" class="billing-toggle__opt is-active" data-billing="mensual">Mensual</button>' +
      '      <button type="button" class="billing-toggle__opt" data-billing="anual">Anual <span class="billing-toggle__save">-16%</span></button>' +
      '    </div>' +

      '    <div class="price-block">' +
      '      <div class="price-block__label">' + u.escapeHtml(plan.name) + '</div>' +
      '      <div class="price-block__price" data-price-display>' +
      '        <span class="price-block__amount" data-price-amount>$' + plan.price + '</span><span data-price-period>/mes</span>' +
      '      </div>' +
      '      <div class="price-block__alt" data-price-alt style="visibility:hidden">o $' + plan.priceAnnual + ' al año (' + annualMonthly + '/mes)</div>' +
      '      <a class="btn btn--primary btn--block" href="#/registro-proveedor/mensual" data-price-cta>Crear mi cuenta</a>' +
      '      <div class="price-block__note">Sin permanencia forzosa · cancela cuando quieras</div>' +
      '    </div>' +
      '  </div>' +

      '  <div class="container">' +
      '    <div class="plans-footnote">' + u.icon("shield", { size: 16 }) + ' Puedes cancelar tu plan en cualquier momento.</div>' +
      '    <p class="text-muted" style="text-align:center;font-size:0.85rem;margin-top:14px">¿Dudas antes de registrarte? <a href="' + u.whatsappLink(window.APP_CONFIG.SUPPORT_WHATSAPP, 'Hola, tengo dudas sobre el plan del directorio de InmoMaps.') + '" target="_blank" rel="noopener" style="color:var(--color-primary);font-weight:700">Escríbenos por WhatsApp</a></p>' +
      '    <p class="text-muted" style="text-align:center;font-size:0.85rem;margin-top:6px">¿Ya tienes cuenta? <a href="#/dashboard/login" style="color:var(--color-primary);font-weight:700">Inicia sesión</a></p>' +
      '  </div>' +
      '</div>';

    c.mountChrome('perfil');
    document.title = 'Plan para el directorio de servicios — InmoMaps';

    var priceAmount = u.qs('[data-price-amount]', root);
    var pricePeriod = u.qs('[data-price-period]', root);
    var priceAlt = u.qs('[data-price-alt]', root);
    var priceCta = u.qs('[data-price-cta]', root);

    u.qsa('[data-billing]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        u.qsa('[data-billing]', root).forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var billing = btn.getAttribute('data-billing');
        if (billing === 'anual') {
          priceAmount.textContent = '$' + plan.priceAnnual;
          pricePeriod.textContent = '/año';
          priceAlt.style.visibility = 'visible';
          priceAlt.textContent = 'equivale a $' + annualMonthly + '/mes';
          priceCta.setAttribute('href', '#/registro-proveedor/anual');
        } else {
          priceAmount.textContent = '$' + plan.price;
          pricePeriod.textContent = '/mes';
          priceAlt.style.visibility = 'hidden';
          priceCta.setAttribute('href', '#/registro-proveedor/mensual');
        }
      });
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.providerPlans = { render: render };
})();
