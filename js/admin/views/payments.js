// Vista "Administración de Pagos".
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  var TABS = [
    { key: "todos", label: "Todos" },
    { key: "pagado", label: "Realizados" },
    { key: "pendiente", label: "Pendientes" },
    { key: "rechazado", label: "Rechazados" },
    { key: "reembolsado", label: "Reembolsos" }
  ];

  function render(params, root) {
    var activeTab = "todos";

    function refresh() {
      var all = s.payments.all();
      var totalPagado = all.filter(function (p) { return p.status === 'pagado'; }).reduce(function (sum, p) { return sum + p.amount; }, 0);
      var list = activeTab === 'todos' ? all : all.filter(function (p) { return p.status === activeTab; });

      var rows = list.map(function (p) {
        var agent = window.App.data.getAgent(p.agentSlug);
        return '<tr>' +
          '<td class="admin-table__name">' + u.escapeHtml(agent ? agent.name : p.agentSlug) + '</td>' +
          '<td>' + u.escapeHtml(p.plan) + '</td>' +
          '<td>' + u.formatPrice(p.amount) + '</td>' +
          '<td class="admin-table__meta">' + u.escapeHtml(p.method) + '</td>' +
          '<td class="admin-table__meta">' + new Date(p.date).toLocaleDateString('es-MX') + '</td>' +
          '<td>' + ac.statusPill(p.status) + '</td></tr>';
      }).join('');

      var content =
        '<div class="admin-kpi-grid">' +
        ac.kpiCardHTML('dollar', u.formatPrice(totalPagado), 'Total facturado') +
        ac.kpiCardHTML('dollar', u.formatNumber(all.filter(function (p) { return p.status === 'pagado'; }).length), 'Pagos realizados') +
        ac.kpiCardHTML('clock', u.formatNumber(all.filter(function (p) { return p.status === 'pendiente'; }).length), 'Pagos pendientes') +
        ac.kpiCardHTML('x', u.formatNumber(all.filter(function (p) { return p.status === 'rechazado'; }).length), 'Pagos rechazados') +
        ac.kpiCardHTML('logout', u.formatNumber(all.filter(function (p) { return p.status === 'reembolsado'; }).length), 'Reembolsos') +
        '</div>' +
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Historial financiero</div><div class="admin-section__subtitle">Pagos de suscripciones de agentes</div></div>' +
        '  <a class="btn btn--outline btn--sm" href="#/admin/reportes">' + u.icon('download', { size: 14 }) + ' Descargar reporte</a></div>' +
        '  <div class="tabs" style="padding:0 0 12px">' + TABS.map(function (t) { return '<button type="button" class="tab' + (t.key === activeTab ? ' is-active' : '') + '" data-tab="' + t.key + '">' + t.label + '</button>'; }).join('') + '</div>' +
        '  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Agente</th><th>Plan</th><th>Monto</th><th>Método</th><th>Fecha</th><th>Estado</th></tr></thead>' +
        '  <tbody>' + (rows || '<tr><td colspan="6" class="admin-table__meta">Sin registros</td></tr>') + '</tbody></table></div>' +
        '</div>';

      ac.mount('pagos', 'Pagos', content, root);

      u.qsa('[data-tab]', root).forEach(function (btn) {
        btn.addEventListener('click', function () { activeTab = btn.getAttribute('data-tab'); refresh(); });
      });
    }

    refresh();
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.payments = { render: render };
})();
