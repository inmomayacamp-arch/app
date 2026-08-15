// Vista "Dashboard" del admin: KPIs reales + tarjetas de acceso a cada
// sección, igual que la pantalla de inicio del panel del asesor.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function render(params, root) {
    var k = s.kpis();
    var properties = s.properties.all();

    var byCity = {};
    properties.forEach(function (p) { byCity[p.city] = (byCity[p.city] || 0) + 1; });
    var cityData = Object.keys(byCity).map(function (city) { return { label: city, value: byCity[city] }; });

    var byType = {};
    properties.forEach(function (p) { byType[u.propertyTypeLabel(p.type)] = (byType[u.propertyTypeLabel(p.type)] || 0) + 1; });
    var typeData = Object.keys(byType).map(function (type) { return { label: type, value: byType[type] }; });

    var tiles = ac.NAV.filter(function (item) { return item.route !== 'dashboard'; }).map(function (item) {
      return '<a class="dashboard-card" href="' + item.href + '"><span class="dashboard-card__icon">' + u.icon(item.icon, { size: 26 }) + '</span><strong>' + item.label + '</strong></a>';
    }).join('');

    function issueRowHTML(issue) {
      return (
        '<div class="admin-row-card">' +
        '  <div class="admin-row-card__body">' +
        '    <strong>' + u.escapeHtml(issue.name || issue.email) + '</strong>' +
        '    <span class="admin-row-card__meta">' + u.escapeHtml(issue.email) + (issue.phone ? ' · ' + u.escapeHtml(issue.phone) : '') + '</span>' +
        '    <span class="admin-row-card__meta admin-row-card__meta--wrap">' + u.escapeHtml(issue.error_message || '') + ' · ' + u.relativeTime(issue.created_at) + '</span>' +
        '    <span class="admin-row-card__meta">Ya se le cobró — "Reintentar" crea su cuenta conectada a esa suscripción real, sin cobrarle otra vez.</span>' +
        '  </div>' +
        '  <div class="admin-row-card__foot">' +
        '    <button type="button" class="btn btn--sm btn--primary" data-retry-issue="' + issue.id + '">Reintentar</button>' +
        '    <button type="button" class="btn btn--sm btn--outline" data-resolve-issue="' + issue.id + '">Marcar resuelto sin reintentar</button>' +
        '  </div>' +
        '</div>'
      );
    }

    function baseContent(issuesHtml) {
      return (
        issuesHtml +
        '<div class="admin-kpi-grid">' +
        ac.kpiCardHTML('briefcase', u.formatNumber(k.totalAgents), 'Agentes inmobiliarios') +
        ac.kpiCardHTML('home', u.formatNumber(k.totalOwners), 'Propietarios particulares') +
        ac.kpiCardHTML('map', u.formatNumber(k.totalProperties), 'Propiedades publicadas') +
        ac.kpiCardHTML('chart', u.formatNumber(k.forSale), 'En venta') +
        ac.kpiCardHTML('chart', u.formatNumber(k.forRent), 'En renta') +
        ac.kpiCardHTML('starFilled', u.formatNumber(k.featured), 'Destacadas') +
        '</div>' +

        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div class="admin-section__title">Secciones</div></div>' +
        '  <div class="dashboard-grid">' + tiles + '</div>' +
        '</div>' +

        (cityData.length ?
          '<div class="admin-section">' +
          '  <div class="admin-section__head"><div class="admin-section__title">Propiedades por ciudad</div></div>' +
          ac.hbarListHTML(cityData) +
          '</div>' : '') +

        (typeData.length ?
          '<div class="admin-section">' +
          '  <div class="admin-section__head"><div class="admin-section__title">Propiedades por tipo</div></div>' +
          ac.hbarListHTML(typeData) +
          '</div>' : '')
      );
    }

    ac.mount('dashboard', 'Dashboard', baseContent(''), root);

    s.signupIssues.unresolved().then(function (issues) {
      if (!issues.length) return;
      var issuesHtml =
        '<div class="admin-section" style="border-color:var(--color-primary)">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">⚠ Pagos sin cuenta creada (' + issues.length + ')</div>' +
        '  <div class="admin-section__subtitle">Se cobró pero la cuenta no se pudo crear — créala a mano con estos datos</div></div></div>' +
        '  <div class="admin-row-list">' + issues.map(issueRowHTML).join('') + '</div>' +
        '</div>';
      ac.mount('dashboard', 'Dashboard', baseContent(issuesHtml), root);

      u.qsa('[data-resolve-issue]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (!window.confirm('¿Marcar como resuelto sin crear la cuenta? Solo hazlo si ya lo resolviste de otra forma.')) return;
          btn.disabled = true;
          try { await s.signupIssues.resolve(btn.getAttribute('data-resolve-issue')); render(params, root); }
          catch (err) { btn.disabled = false; u.toast(err.message || 'No se pudo actualizar'); }
        });
      });
      u.qsa('[data-retry-issue]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          btn.disabled = true;
          try {
            await s.signupIssues.retry(btn.getAttribute('data-retry-issue'));
            u.toast('Cuenta creada y conectada a su suscripción', { tone: 'success' });
            render(params, root);
          } catch (err) {
            btn.disabled = false;
            u.toast(err.message || 'No se pudo reintentar');
          }
        });
      });
    }).catch(function () { /* silencioso: no bloquea el resto del dashboard */ });
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.dashboard = { render: render };
})();
