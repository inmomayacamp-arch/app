// Vista "Publicidad": destacar propiedades y promociones (según el plan del asesor).
(function () {
  "use strict";

  var u = window.App.utils;
  var state = window.App.state;
  var ac = window.App.agent.components;

  function render(params, root) {
    var agent = state.agents.current();
    var adminInfo = window.App.admin.state.agents.all().filter(function (a) { return a.slug === agent.slug; })[0];
    var allowed = !adminInfo || adminInfo.plan === 'profesional';

    function refresh() {
      var properties = state.properties.byAgent(agent.slug);
      var featured = properties.filter(function (p) { return p.featured; });

      var content = !allowed
        ? '<div class="promo-card"><span class="promo-card__icon">' + u.icon('megaphone', { size: 28 }) + '</span>' +
          '<div class="promo-card__body"><strong>Disponible en el Plan Profesional</strong>' +
          '<p>Destacar propiedades, comprar promociones y aparecer primero en las búsquedas son beneficios del Plan Profesional.</p>' +
          '<a class="btn btn--primary btn--sm" href="#/dashboard/suscripcion">Mejorar mi plan</a></div></div>'
        : (
          '<div class="admin-section"><div class="admin-section__head"><div><div class="admin-section__title">Propiedades destacadas (' + featured.length + ')</div>' +
          '<div class="admin-section__subtitle">Aparecen primero en los resultados de búsqueda y en la portada</div></div></div>' +
          (properties.length
            ? '<div class="stack gap-2">' + properties.map(function (p) {
              return '<div class="ranked-row"><img src="' + p.photos[0] + '" alt="" style="width:48px;height:48px;border-radius:8px;object-fit:cover" />' +
                '<div class="ranked-row__info"><strong>' + u.escapeHtml(p.title) + '</strong><span>' + u.formatPrice(p.price) + '</span></div>' +
                '<button type="button" class="btn btn--sm ' + (p.featured ? 'btn--primary' : 'btn--outline') + '" data-toggle="' + p.id + '">' + (p.featured ? '★ Destacada' : 'Destacar') + '</button></div>';
            }).join('') + '</div>'
            : '<p class="text-muted" style="font-size:0.85rem">Publica una propiedad para poder destacarla.</p>') +
          '</div>' +

          '<div class="admin-section"><div class="admin-section__head"><div class="admin-section__title">Campañas promocionales</div></div>' +
          '  <p class="text-secondary" style="font-size:0.86rem;margin-bottom:12px">Compra una promoción para que una propiedad aparezca primero en los resultados de tu ciudad durante 7 días.</p>' +
          '  <div class="form-row">' +
          '  <select data-campaign-property style="border:1px solid var(--color-border-strong);border-radius:8px;padding:10px">' +
          properties.map(function (p) { return '<option value="' + p.id + '">' + u.escapeHtml(p.title) + '</option>'; }).join('') +
          '  </select>' +
          '  <button type="button" class="btn btn--primary" data-buy-campaign style="height:44px">Comprar promoción ($149 MXN)</button>' +
          '  </div>' +
          '</div>'
        );

      ac.mount('publicidad', 'Publicidad', content, root);

      u.qsa('[data-toggle]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-toggle');
          var p = properties.filter(function (x) { return x.id === id; })[0];
          state.properties.update(id, { featured: !p.featured });
          refresh();
        });
      });
      var buyBtn = u.qs('[data-buy-campaign]', root);
      if (buyBtn) buyBtn.addEventListener('click', function () {
        var propId = u.qs('[data-campaign-property]', root).value;
        state.properties.update(propId, { featured: true });
        u.toast('Promoción activada por 7 días', { tone: 'success' });
        refresh();
      });
    }

    refresh();
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.advertising = { render: render };
})();
