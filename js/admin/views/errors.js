// Vista "Errores": errores de JavaScript reportados automáticamente desde
// el navegador de quien sea que los tope (js/errorMonitor.js), agrupados
// por huella para no repetir la misma fila por cada ocurrencia.
(function () {
  "use strict";

  var u = window.App.utils;
  var ac = window.App.admin.components;
  var s = window.App.admin.state;

  function render(params, root) {
    ac.mount('errores', 'Errores', '<div class="empty-state" style="padding-top:40px"><span class="spinner"></span></div>', root);

    s.clientErrors.all().then(function (errors) {
      var agentsById = {};
      window.App.data.getAllAgents().forEach(function (a) { agentsById[a.id] = a; });

      var rows = errors.map(function (err) {
        var person = err.agent_id ? agentsById[err.agent_id] : null;
        return (
          '<div class="admin-row-card">' +
          '  <div class="admin-row-card__body">' +
          '    <strong>' + u.escapeHtml(err.message) + '</strong>' +
          '    <span class="admin-row-card__meta admin-row-card__meta--wrap">' + u.escapeHtml(err.url || '') + '</span>' +
          '    <span class="admin-row-card__meta">' + u.formatNumber(err.occurrences) + ' vez(es) · última ' + u.relativeTime(err.last_seen) +
          (person ? ' · ' + u.escapeHtml(person.name) : '') + '</span>' +
          '  </div>' +
          '  <div class="admin-row-card__foot">' +
          '    <button type="button" class="btn btn--sm btn--outline" data-remove="' + err.id + '">Descartar</button>' +
          '  </div>' +
          '</div>'
        );
      }).join('');

      var content =
        '<div class="admin-section">' +
        '  <div class="admin-section__head"><div><div class="admin-section__title">Errores reportados (' + errors.length + ')</div>' +
        '  <div class="admin-section__subtitle">Se agrupan por tipo de error — "Descartar" borra el registro; si vuelve a pasar, se crea uno nuevo</div></div></div>' +
        '  <div class="admin-row-list">' + (rows || '<p class="text-muted" style="font-size:0.85rem">No hay errores reportados. Buena señal.</p>') + '</div>' +
        '</div>';

      ac.mount('errores', 'Errores', content, root);

      u.qsa('[data-remove]', root).forEach(function (btn) {
        btn.addEventListener('click', async function () {
          btn.disabled = true;
          try { await s.clientErrors.remove(btn.getAttribute('data-remove')); render(params, root); }
          catch (err) { btn.disabled = false; u.toast(err.message || 'No se pudo descartar'); }
        });
      });
    }).catch(function (err) {
      ac.mount('errores', 'Errores', '<div class="empty-state"><h3>No se pudo cargar</h3><p>' + u.escapeHtml(err.message || '') + '</p></div>', root);
    });
  }

  window.App.admin.views = window.App.admin.views || {};
  window.App.admin.views.errors = { render: render };
})();
