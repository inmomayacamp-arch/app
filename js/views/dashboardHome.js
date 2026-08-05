// Vista "Dashboard del asesor": resumen de actividad con indicadores y accesos rápidos.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var agentState = window.App.agent.state;
  var ac = window.App.agent.components;

  var PIPELINE_STAGES = [
    { value: "nuevo", label: "Nuevo" },
    { value: "contactado", label: "Contactado" },
    { value: "visita", label: "Visita" },
    { value: "negociacion", label: "Negociación" },
    { value: "cerrado", label: "Cerrado" }
  ];

  function greetingWord() {
    var h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }

  function render(params, root) {
    var agent = state.agents.current();
    var myLinks = state.links.byAgent(agent.slug);
    var myClients = agentState.clients.all();
    var unread = agentState.notifications.unreadCount();
    var uncontacted = myClients.filter(function (cl) { return cl.status === 'nuevo'; }).length;

    var topProperties = state.tracking.topPropertiesForAgent(agent.slug, 5);
    var profileUrl = window.location.origin + window.location.pathname + '#/' + agent.slug;
    var poolPremium = agentState.sharedPool.isPremium(agent.slug);
    var poolCount = poolPremium ? agentState.sharedPool.search({}).length : 0;

    var pipeline = PIPELINE_STAGES.map(function (s, i) {
      return { label: s.label, value: myClients.filter(function (c) { return c.status === s.value; }).length, opacity: (0.35 + i * 0.16).toFixed(2) };
    });
    var pipelineTotal = pipeline.reduce(function (sum, s) { return sum + s.value; }, 0);

    var content =
      '<div class="agent-greeting">' +
      '  <img src="' + agent.photo + '" width="44" height="44" alt="" />' +
      '  <div class="agent-greeting__text"><strong>' + greetingWord() + ', ' + u.escapeHtml(agent.name.split(' ')[0]) + '</strong><span>Esto es lo que pasa en tu negocio hoy</span></div>' +
      '  <a class="agent-greeting__bell" href="#/dashboard/notificaciones" aria-label="Notificaciones">' + u.icon('bell', { size: 19 }) + (unread ? '<span class="badge-count">' + unread + '</span>' : '') + '</a>' +
      '</div>' +

      (uncontacted
        ? '<a class="attention-card" href="#/dashboard/clientes">' +
          '  <span class="attention-card__icon">' + u.icon('bell', { size: 18 }) + '</span>' +
          '  <div class="attention-card__text"><strong>Tienes ' + uncontacted + (uncontacted === 1 ? ' cliente nuevo' : ' clientes nuevos') + ' sin contactar</strong><span>Contáctalos pronto para no perder la oportunidad</span></div>' +
          u.icon('chevronRight', { size: 18, class: 'text-muted' }) +
          '</a>'
        : '') +

      '<div class="dashboard-grid">' +
      '  <a class="dashboard-card" href="#/dashboard/perfil-profesional"><span class="dashboard-card__icon dashboard-card__icon--renta">' + u.icon('user', { size: 18 }) + '</span><strong>Editar perfil</strong><span>Tu información pública</span></a>' +
      '  <a class="dashboard-card" href="#/dashboard/publicar"><span class="dashboard-card__icon">' + u.icon('plus', { size: 18 }) + '</span><strong>Publicar propiedad</strong><span>Sube una propiedad nueva</span></a>' +
      '  <a class="dashboard-card" href="#/dashboard/enlaces/nuevo"><span class="dashboard-card__icon dashboard-card__icon--terreno">' + u.icon('link', { size: 18 }) + '</span><strong>Crear enlace</strong><span>Comparte propiedades con un cliente</span></a>' +
      '  <a class="dashboard-card" href="#/dashboard/calendario"><span class="dashboard-card__icon dashboard-card__icon--otro">' + u.icon('calendar', { size: 18 }) + '</span><strong>Calendario</strong><span>Citas, visitas y tareas</span></a>' +
      '</div>' +

      '<div class="admin-section" style="margin-top:20px">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Comparte tu perfil</div></div>' +
      '  <p class="text-secondary" style="font-size:0.85rem;margin-bottom:10px">Comparte tu perfil público de InmoMap con tus clientes y en tus redes.</p>' +
      c.shareBarHTML(profileUrl) +
      '</div>' +

      '<a class="pool-promo-card" href="#/dashboard/bolsa" style="margin-top:16px">' +
      '  <span class="pool-promo-card__icon">' + u.icon('exchange', { size: 20 }) + '</span>' +
      '  <div class="pool-promo-card__text">' +
      '    <strong>Bolsa Inmobiliaria Compartida</strong>' +
      '    <span>' + (poolPremium
        ? (poolCount ? poolCount + (poolCount === 1 ? ' propiedad disponible' : ' propiedades disponibles') + ' para compartir comisión' : 'Descubre propiedades de otros asesores y gana comisión')
        : 'Colabora con otros asesores y gana comisión por cada operación conjunta') + '</span>' +
      '  </div>' +
      '  <span class="pool-promo-card__arrow">' + u.icon('chevronRight', { size: 18 }) + '</span>' +
      '</a>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div><div class="admin-section__title">Pipeline de clientes</div><div class="admin-section__subtitle">' + myClients.length + ' clientes en tu CRM</div></div><a href="#/dashboard/clientes" class="btn btn--outline btn--sm">Ver tablero</a></div>' +
      (pipelineTotal
        ? '<div class="crm-pipeline-bar">' + pipeline.map(function (s) { return '<span style="flex:' + (s.value || 0.001) + ';opacity:' + s.opacity + '"></span>'; }).join('') + '</div>' +
          '<div class="crm-pipeline-legend">' + pipeline.map(function (s) { return '<span><i style="opacity:' + s.opacity + '"></i>' + s.label + ' · ' + s.value + '</span>'; }).join('') + '</div>'
        : '<p class="text-muted" style="font-size:0.85rem">Aún no tienes clientes en tu CRM.</p>') +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Propiedades más vistas</div></div>' +
      (topProperties.length ? ac.hbarListHTML(topProperties) : '<p class="text-muted" style="font-size:0.85rem">Comparte enlaces personalizados para empezar a ver estadísticas.</p>') +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="row" style="justify-content:space-between;align-items:center">' +
      '    <div class="admin-section__title">Enlaces recientes</div>' +
      '    <a href="#/dashboard/enlaces/nuevo" class="btn btn--primary btn--sm">' + u.icon('plus', { size: 14 }) + ' Nuevo enlace</a>' +
      '  </div>' +
      (myLinks.length
        ? '<div class="stack gap-2" style="margin-top:12px">' + myLinks.slice(0, 5).map(function (link) {
          return '<a class="ranked-row" href="#/dashboard/enlaces/' + link.clientSlug + '">' +
            '<span class="dashboard-card__icon">' + u.icon('user', { size: 16 }) + '</span>' +
            '<div class="ranked-row__info"><strong>' + u.escapeHtml(link.clientLabel) + '</strong><span>' + link.propertyIds.length + ' propiedades · ' + state.tracking.statsForLink(link.id).views + ' vistas</span></div>' +
            u.icon('chevronRight', { size: 16 }) +
            '</a>';
        }).join('') + '</div>'
        : '<p class="text-muted" style="font-size:0.85rem;margin-top:10px">Aún no has creado enlaces personalizados para clientes.</p>') +
      '</div>';

    ac.mount('dashboard', 'Dashboard', content, root);
  }

  window.App.views = window.App.views || {};
  window.App.views.dashboardHome = { render: render };
})();
