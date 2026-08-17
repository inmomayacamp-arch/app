// Vista "Planes para agentes": landing con un solo plan (mensual/anual) que
// explica las herramientas incluidas antes del precio. Desde aquí se elige
// la forma de pago y se pasa al registro (con el espacio ya listo para
// conectar una pasarela de pagos real más adelante).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;

  var TOOLS = [
    { icon: "user", tone: "", title: "Perfil profesional", text: "Tu página pública con tu experiencia y contacto." },
    { icon: "home", tone: "otro", title: "Hasta 15 propiedades", text: "Publica y administra tu inventario activo." },
    { icon: "starFilled", tone: "primary", title: "1 destacada incluida", text: "Aparece primero en resultados de búsqueda." },
    { icon: "link", tone: "renta", title: "Enlaces personalizados", text: "Catálogos privados con estadísticas por cliente." },
    { icon: "users", tone: "venta", title: "CRM de clientes", text: "Etapas, notas y calendario de visitas." },
    { icon: "exchange", tone: "terreno", title: "Bolsa Compartida", text: "Colabora y reparte comisión con otros asesores." },
    { icon: "bell", tone: "", title: "Notificaciones", text: "Entérate al instante de cada contacto nuevo." },
    { icon: "chat", tone: "", title: "Soporte", text: "Ayuda directa cuando la necesites." }
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
    var plan = window.App.admin.data.PLANS[0];
    var annualMonthly = Math.round(plan.priceAnnual / 12);

    root.innerHTML =
      '<div class="page-header"><h1 class="page-header__title">Plan para agentes</h1></div>' +
      '<div class="plans-page">' +
      '  <div class="container plans-hero">' +
      '    <a class="signup-checkout__back" style="display:flex;justify-content:center" href="#/perfil">' + u.icon("chevronLeft", { size: 16 }) + ' Volver</a>' +
      '    <span class="plans-hero__eyebrow">' + u.icon("briefcase", { size: 14 }) + ' Para agentes inmobiliarios</span>' +
      '    <h2 class="plans-hero__title">Un solo plan.<br /><span>Todo incluido.</span></h2>' +
      '    <p class="plans-hero__subtitle">Sin niveles que confundan: paga una vez y usa todas las herramientas de InmoMaps.</p>' +
      '  </div>' +

      '  <div class="container" style="max-width:640px">' +
      '    <div class="plans-section-label">Todo lo que incluye</div>' +
      '    <div class="tool-grid">' + toolsGridHTML() + '</div>' +
      '    <div style="text-align:center;margin-top:16px"><a class="btn btn--outline btn--sm" href="#/plan-detalle/asesor">' + u.icon('list', { size: 14 }) + ' Ver todo lo que incluye el plan, a detalle</a></div>' +
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
      '      <a class="btn btn--primary btn--block" href="#/registro-agente/mensual" data-price-cta>Crear mi cuenta</a>' +
      '      <div class="price-block__note">Sin permanencia forzosa · cancela cuando quieras</div>' +
      '    </div>' +
      '  </div>' +

      '  <div class="container">' +
      '    <div class="plans-footnote">' + u.icon("shield", { size: 16 }) + ' Puedes cancelar tu plan en cualquier momento.</div>' +
      '    <p class="text-muted" style="text-align:center;font-size:0.85rem;margin-top:14px">¿Ya tienes cuenta? <a href="#/dashboard/login" style="color:var(--color-primary);font-weight:700">Inicia sesión</a></p>' +
      '  </div>' +
      '</div>';

    c.mountChrome('perfil');
    document.title = 'Plan para agentes — InmoMaps';

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
          priceCta.setAttribute('href', '#/registro-agente/anual');
        } else {
          priceAmount.textContent = '$' + plan.price;
          pricePeriod.textContent = '/mes';
          priceAlt.style.visibility = 'hidden';
          priceCta.setAttribute('href', '#/registro-agente/mensual');
        }
      });
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.plans = { render: render };
})();
