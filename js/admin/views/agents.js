// Vista "Agentes": lista de las cuentas de asesor y proveedor reales, con
// opción de crear una cuenta ya activa sin pasar por Stripe (cortesía, uso
// propio) y de marcar/quitar el pago pendiente de una cuenta existente.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;
  var d = window.App.admin.data;

  function contactHTML(a) {
    var parts = [];
    if (a.phone) parts.push('<a href="tel:' + u.escapeHtml(a.phone) + '">' + u.escapeHtml(a.phone) + '</a>');
    if (a.email) parts.push('<a href="mailto:' + u.escapeHtml(a.email) + '">' + u.escapeHtml(a.email) + '</a>');
    return parts.join(' · ') || 'Sin datos de contacto';
  }

  function newAccountSheet(refresh) {
    c.openSheet({
      title: "Nueva cuenta sin pago",
      body:
        '<p class="text-muted" style="font-size:0.82rem;margin-bottom:12px">Crea una cuenta ya activa (cortesía, prueba propia, etc.) sin que pase por Stripe.</p>' +
        '<div class="form-field"><label>Tipo de cuenta</label><select data-f="plan">' +
        '<option value="asesor">Asesor</option><option value="propietario">Propietario</option><option value="proveedor">Proveedor (directorio)</option>' +
        '</select></div>' +
        '<div class="form-field" data-category-field style="display:none"><label>Categoría</label><select data-f="category">' +
        u.SERVICE_CATEGORIES.map(function (cat) { return '<option value="' + cat.key + '">' + cat.label + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="form-field"><label>Nombre completo</label><input type="text" data-f="name" placeholder="Nombre" /></div>' +
        '<div class="form-row">' +
        '<div class="form-field"><label>Correo</label><input type="email" data-f="email" placeholder="correo@ejemplo.com" /></div>' +
        '<div class="form-field"><label>Teléfono</label><input type="text" data-f="phone" placeholder="9811234567" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Ciudad</label><input type="text" data-f="city" placeholder="Campeche" /></div>' +
        '<div class="form-field"><label>Contraseña</label><input type="text" data-f="password" placeholder="Mínimo 6 caracteres" /></div>' +
        '<div class="form-field"><label>Confirmar contraseña</label><input type="text" data-f="password2" placeholder="Repite la contraseña" /></div>' +
        '<button type="button" class="btn btn--primary btn--block" data-save>Crear cuenta activa</button>'
    });
    var sheetRoot = u.qs('#sheet-root');
    var planSelect = u.qs('[data-f="plan"]', sheetRoot);
    var categoryField = u.qs('[data-category-field]', sheetRoot);
    function toggleCategoryField() { categoryField.style.display = planSelect.value === 'proveedor' ? '' : 'none'; }
    planSelect.addEventListener('change', toggleCategoryField);
    toggleCategoryField();

    var saveBtn = u.qs('[data-save]', sheetRoot);
    saveBtn.addEventListener('click', async function () {
      var fields = {
        plan: planSelect.value,
        name: u.qs('[data-f="name"]', sheetRoot).value.trim(),
        email: u.qs('[data-f="email"]', sheetRoot).value.trim(),
        phone: u.qs('[data-f="phone"]', sheetRoot).value.trim(),
        city: u.qs('[data-f="city"]', sheetRoot).value.trim(),
        password: u.qs('[data-f="password"]', sheetRoot).value,
        category: planSelect.value === 'proveedor' ? u.qs('[data-f="category"]', sheetRoot).value : null
      };
      var password2 = u.qs('[data-f="password2"]', sheetRoot).value;
      if (!fields.name || !fields.email || !fields.password) { u.toast('Completa nombre, correo y contraseña'); return; }
      if (fields.password !== password2) { u.toast('Las contraseñas no coinciden'); return; }
      saveBtn.disabled = true;
      try {
        await s.agents.createFree(fields);
        c.closeSheet();
        u.toast('Cuenta creada y activa', { tone: 'success' });
        await window.App.state.agents.bootstrap();
        refresh();
      } catch (err) {
        saveBtn.disabled = false;
        u.toast(err.message || 'No se pudo crear la cuenta');
      }
    });
  }

  function cardHTML(a, planName, refresh) {
    var propsCount = window.App.state.properties.byAgent(a.slug).length;
    var isActive = a.status === 'activo';
    return (
      '<div class="admin-row-card">' +
      '  <div class="admin-row-card__main">' +
      '    <img class="admin-row-card__avatar" src="' + u.thumbUrl(a.photo, 88, 88) + '" alt="" loading="lazy" />' +
      '    <div class="admin-row-card__body">' +
      '      <strong>' + u.escapeHtml(a.name) + '</strong>' +
      '      <span class="admin-row-card__meta">' + u.escapeHtml(a.city || 'Sin ciudad') + ' · ' + u.escapeHtml(planName) + '</span>' +
      '      <span class="admin-row-card__meta">' + contactHTML(a) + '</span>' +
      '      <span class="admin-row-card__meta admin-row-card__meta--wrap">' + propsCount + ' propiedad' + (propsCount === 1 ? '' : 'es') +
      (a.createdAt ? ' · registrado ' + new Date(a.createdAt).toLocaleDateString('es-MX') : '') +
      (a.planExpiresAt ? ' · vence ' + new Date(a.planExpiresAt).toLocaleDateString('es-MX') : '') + '</span>' +
      '    </div>' +
      '  </div>' +
      '  <div class="admin-row-card__foot">' +
      (a.status ? ac.statusPill(a.status) : '<span></span>') +
      '    <div class="row gap-2">' +
      '      <button type="button" class="btn btn--sm btn--outline" data-toggle-status="' + a.id + '" data-next-status="' + (isActive ? 'pendiente_pago' : 'activo') + '">' + (isActive ? 'Marcar pendiente de pago' : 'Reactivar sin pago') + '</button>' +
      '      <a class="btn btn--sm btn--outline" href="#/' + a.slug + '" target="_blank" rel="noopener">Ver perfil</a>' +
      '    </div>' +
      '  </div>' +
      '</div>'
    );
  }

  function bindStatusToggles(root, refresh) {
    u.qsa('[data-toggle-status]', root).forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var profileId = btn.getAttribute('data-toggle-status');
        var nextStatus = btn.getAttribute('data-next-status');
        btn.disabled = true;
        try {
          await s.agents.setStatus(profileId, nextStatus);
          u.toast(nextStatus === 'activo' ? 'Cuenta reactivada' : 'Cuenta marcada pendiente de pago', { tone: 'success' });
          await window.App.state.agents.bootstrap();
          refresh();
        } catch (err) {
          btn.disabled = false;
          u.toast(err.message || 'No se pudo actualizar la cuenta');
        }
      });
    });
  }

  function render(params, root) {
    function refresh() {
      var agents = s.agents.all();
      var providers = s.agents.allProviders();

      var agentRows = agents.map(function (a) {
        var planName = (d.PLANS.filter(function (p) { return p.id === a.plan; })[0] || {}).name || a.plan || '—';
        return cardHTML(a, planName, refresh);
      }).join('');

      var providerRows = providers.map(function (a) {
        return cardHTML(a, d.PROVIDER_PLAN.name, refresh);
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Agentes activos (' + agents.length + ')</div>' +
        '  <button type="button" class="btn btn--primary btn--sm" data-new-account>' + u.icon('plus', { size: 14 }) + ' Nueva cuenta</button></div>' +
        '  <div class="admin-row-list">' + (agentRows || '<p class="text-muted" style="font-size:0.85rem">Aún no hay agentes registrados.</p>') + '</div>' +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Proveedores del directorio (' + providers.length + ')</div></div>' +
        '  <div class="admin-row-list">' + (providerRows || '<p class="text-muted" style="font-size:0.85rem">Aún no hay proveedores con cuenta propia.</p>') + '</div>' +
        '</div>';

      ac.mount('agentes', 'Agentes', content, root);
      u.qs('[data-new-account]', root).addEventListener('click', function () { newAccountSheet(refresh); });
      bindStatusToggles(root, refresh);
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.agents = { render: render };
})();
