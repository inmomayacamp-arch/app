// Vista "Administración de Suscripciones": planes y cupones.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function editPlanSheet(plan, refresh) {
    c.openSheet({
      title: "Editar " + plan.name,
      body:
        '<div class="form-field"><label>Precio mensual (MXN)</label><input type="number" data-f="price" value="' + plan.price + '" /></div>' +
        '<div class="form-field"><label>Beneficios (uno por línea)</label><textarea rows="6" data-f="features">' + plan.features.join('\n') + '</textarea></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Guardar cambios</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      s.plans.update(plan.id, {
        price: Number(u.qs('[data-f="price"]', sheetRoot).value),
        features: u.qs('[data-f="features"]', sheetRoot).value.split('\n').map(function (f) { return f.trim(); }).filter(Boolean)
      });
      c.closeSheet();
      u.toast('Plan actualizado');
      refresh();
    });
  }

  function newCouponSheet(refresh) {
    c.openSheet({
      title: "Nuevo cupón",
      body:
        '<div class="form-field"><label>Código</label><input type="text" data-f="code" placeholder="PROMO30" /></div>' +
        '<div class="form-field"><label>Descuento (%)</label><input type="number" min="1" max="100" data-f="discount" value="20" /></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Crear cupón</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    u.qs('[data-save]', sheetRoot).addEventListener('click', function () {
      var code = u.qs('[data-f="code"]', sheetRoot).value.trim().toUpperCase();
      if (!code) { u.toast('Escribe un código'); return; }
      s.coupons.add({ code: code, discountPercent: Number(u.qs('[data-f="discount"]', sheetRoot).value), active: true, uses: 0 });
      c.closeSheet();
      u.toast('Cupón creado');
      refresh();
    });
  }

  function render(params, root) {
    function refresh() {
      var plans = s.plans.all();
      var coupons = s.coupons.all();

      var planCards = plans.map(function (p) {
        return '<div class="dashboard-card" style="align-items:flex-start">' +
          '<strong>' + u.escapeHtml(p.name) + '</strong>' +
          '<span style="font-size:1.2rem;font-weight:800;color:var(--color-ink)">' + u.formatPrice(p.price) + ' <span style="font-size:0.7rem;font-weight:600;color:var(--color-ink-muted)">MXN/' + p.period + '</span></span>' +
          '<ul style="margin:6px 0 10px;padding-left:16px;font-size:0.78rem;color:var(--color-ink-secondary)">' + p.features.map(function (f) { return '<li>' + u.escapeHtml(f) + '</li>'; }).join('') + '</ul>' +
          '<button type="button" class="btn btn--outline btn--sm" data-edit-plan="' + p.id + '">Editar plan</button>' +
          '</div>';
      }).join('');

      var couponRows = coupons.map(function (co) {
        return '<tr><td class="admin-table__name">' + co.code + '</td><td>' + co.discountPercent + '%</td><td>' + co.uses + '</td>' +
          '<td>' + (co.active ? ac.statusPill('activo') : ac.statusPill('inactivo')) + '</td>' +
          '<td class="actions"><button type="button" class="btn btn--sm btn--outline" data-toggle-coupon="' + co.code + '">' + (co.active ? 'Desactivar' : 'Activar') + '</button></td></tr>';
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Planes</div></div>' +
        '  <div class="dashboard-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">' + planCards + '</div>' +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Cupones y promociones</div><div class="admin-section__subtitle">Incluye meses gratis usando 100% de descuento</div></div>' +
        '  <button type="button" class="btn btn--primary btn--sm" data-new-coupon>' + u.icon('plus', { size: 14 }) + ' Nuevo cupón</button></div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Código</th><th>Descuento</th><th>Usos</th><th>Estado</th><th></th></tr></thead>' +
        '  <tbody>' + (couponRows || '<tr><td colspan="5" class="admin-table__meta">Sin cupones</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('suscripciones', 'Suscripciones', content, root);

      u.qsa('[data-edit-plan]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { editPlanSheet(plans.filter(function (p) { return p.id === btn.getAttribute('data-edit-plan'); })[0], refresh); });
      });
      u.qs('[data-new-coupon]', root).addEventListener('click', function () { newCouponSheet(refresh); });
      u.qsa('[data-toggle-coupon]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { s.coupons.toggle(btn.getAttribute('data-toggle-coupon')); refresh(); });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.subscriptions = { render: render };
})();
