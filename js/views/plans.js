// Vista "Planes para agentes": página pública de precios y beneficios para
// convertirse en asesor inmobiliario. Desde aquí se elige un plan y se pasa
// al registro (con el espacio ya listo para conectar una pasarela de pagos).
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;

  function houseArtSVG() {
    return (
      '<svg class="plan-card__art" viewBox="0 0 320 96" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<line x1="4" y1="86" x2="316" y2="86" stroke-dasharray="1,7" />' +
      '<path d="M22 86V52l28-19 28 19v34" /><rect x="40" y="64" width="10" height="22" />' +
      '<path d="M112 86V40l26-17 26 17v46" /><rect x="124" y="56" width="9" height="9" /><rect x="141" y="56" width="9" height="9" /><rect x="124" y="71" width="9" height="9" />' +
      '<path d="M232 42a16 16 0 1 0-32 0c0 11 16 30 16 30s16-19 16-30z" /><circle cx="216" cy="42" r="5.5" />' +
      '<path d="M262 86V58l24-16 24 16v28" /><rect x="277" y="68" width="9" height="18" />' +
      '</svg>'
    );
  }

  function trustBarHTML() {
    var items = [
      { icon: "shield", text: "Todos los planes incluyen soporte y actualizaciones constantes" },
      { icon: "check", text: "Sin permanencia forzosa: cambia o cancela cuando quieras" },
      { icon: "sparkles", text: "Activación inmediata al crear tu cuenta" }
    ];
    return items.map(function (it) {
      return '<div class="plans-trust__item">' + u.icon(it.icon, { size: 16 }) + '<span>' + it.text + '</span></div>';
    }).join('');
  }

  function benefitsFor(planId) {
    if (planId === "profesional") {
      return [
        { icon: "eye", title: "Más visibilidad", text: "Tus propiedades aparecen primero en las búsquedas." },
        { icon: "exchange", title: "Bolsa Compartida entre agentes", text: "Accede a propiedades de otros asesores y expande tu inventario." },
        { icon: "users", title: "Comparte comisión", text: "Colabora con otros agentes y reparte comisiones sin fricción." },
        { icon: "megaphone", title: "Publicaciones destacadas", text: "Destaca tus propiedades y recibe más visitas y contactos." }
      ];
    }
    return [
      { icon: "user", title: "Crea tu perfil profesional", text: "Destaca tu experiencia y genera confianza con tus clientes." },
      { icon: "briefcase", title: "Comparte tus propiedades", text: "Publica y comparte tus mejores opciones en minutos." },
      { icon: "link", title: "Enlaces personalizados", text: "Crea catálogos privados para cada cliente." },
      { icon: "chart", title: "Estadísticas de tus enlaces", text: "Conoce el interés real de tus clientes en tiempo real." }
    ];
  }

  function planCardHTML(plan, opts) {
    opts = opts || {};
    var isPro = plan.id === "profesional";
    var badge = isPro
      ? '<span class="plan-card__badge plan-card__badge--gold">' + u.icon("crown", { size: 13 }) + ' Mejor opción</span>'
      : '<span class="plan-card__badge">' + u.icon("starFilled", { size: 12 }) + ' Más popular</span>';
    var includeLabel = isPro ? "Incluye todo lo del plan Básico, más:" : "Incluye todo lo siguiente:";
    var proTag = function (idx) { return isPro && idx === 3 ? ' <span class="plan-card__soloPro">SOLO PRO</span>' : ''; };

    var featuresHTML = plan.features.map(function (f, idx) {
      return '<li>' + u.icon("check", { size: 14 }) + '<span>' + u.escapeHtml(f) + proTag(idx) + '</span></li>';
    }).join('');

    return (
      '<div class="plan-card' + (isPro ? ' plan-card--dark' : '') + '">' +
      badge +
      '<h3 class="plan-card__name">' + u.escapeHtml(plan.name.replace('Plan ', '')) + '</h3>' +
      '<p class="plan-card__tagline">' + u.escapeHtml(plan.tagline) + '</p>' +
      '<div class="plan-card__price"><span class="plan-card__price-currency">$</span>' + plan.price + '<span class="plan-card__price-period">/ al mes</span></div>' +
      '<a class="btn btn--primary btn--block" href="#/registro-agente/' + plan.id + '">Contratar plan ' + u.escapeHtml(plan.name.replace('Plan ', '')) + '</a>' +
      '<div class="plan-card__divider"></div>' +
      '<div class="plan-card__include">' + includeLabel + '</div>' +
      '<ul class="plan-card__features">' + featuresHTML + '</ul>' +
      houseArtSVG() +
      '</div>'
    );
  }

  function benefitsHTML(plan) {
    var items = benefitsFor(plan.id).map(function (b) {
      return (
        '<div class="plan-benefit">' +
        '<span class="plan-benefit__icon">' + u.icon(b.icon, { size: 18 }) + '</span>' +
        '<div><strong>' + u.escapeHtml(b.title) + '</strong><p>' + u.escapeHtml(b.text) + '</p></div>' +
        '</div>'
      );
    }).join('');
    return (
      '<div class="plan-benefits">' +
      '<div class="plan-benefits__title">Beneficios del plan ' + u.escapeHtml(plan.name.replace('Plan ', '')) + '</div>' +
      '<div class="plan-benefits__grid">' + items + '</div>' +
      '</div>'
    );
  }

  function render(params, root) {
    var plans = window.App.admin.data.PLANS;

    root.innerHTML =
      '<div class="page-header"><h1 class="page-header__title">Planes para agentes</h1></div>' +
      '<div class="plans-page">' +
      '  <div class="container plans-hero">' +
      '    <span class="plans-hero__eyebrow">' + u.icon("briefcase", { size: 14 }) + ' Planes para agentes</span>' +
      '    <h2 class="plans-hero__title">Elige el plan ideal para hacer crecer <span>tu negocio</span></h2>' +
      '    <p class="plans-hero__subtitle">Potencia tu trabajo, llega a más clientes y cierra más ventas con InmoMap.</p>' +
      '    <div class="plans-trust">' + trustBarHTML() + '</div>' +
      '  </div>' +

      '  <div class="container plans-grid">' +
      plans.map(function (plan) {
        return '<div class="plan-column">' + planCardHTML(plan) + benefitsHTML(plan) + '</div>';
      }).join('') +
      '  </div>' +

      '  <div class="container">' +
      '    <div class="plans-footnote">' + u.icon("shield", { size: 16 }) + ' Puedes cambiar de plan o cancelarlo en cualquier momento.</div>' +
      '  </div>' +
      '</div>';

    c.mountChrome('perfil');
    document.title = 'Planes para agentes — InmoMap';
  }

  window.App.views = window.App.views || {};
  window.App.views.plans = { render: render };
})();
