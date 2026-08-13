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

  function contactRowHTML(contact) {
    var isCall = contact.channel === 'call';
    var label = contact.propertyTitle || contact.clientLabel || 'Tu perfil público';
    var meta = (isCall ? 'Llamada' : 'WhatsApp') + ' · ' + u.relativeTime(contact.createdAt);
    return (
      '<div class="ranked-row">' +
      '<span class="dashboard-card__icon' + (isCall ? '' : ' dashboard-card__icon--venta') + '">' + u.icon(isCall ? 'phone' : 'chat', { size: 16 }) + '</span>' +
      '<div class="ranked-row__info"><strong>' + u.escapeHtml(label) + '</strong><span>' + meta + '</span></div>' +
      '</div>'
    );
  }

  function tileHTML(opts) {
    return '<a class="dashboard-card" href="' + opts.href + '">' +
      '<span class="dashboard-card__icon' + (opts.iconClass ? ' ' + opts.iconClass : '') + '">' + u.icon(opts.icon, { size: 26 }) + '</span>' +
      (opts.badge ? '<span class="dashboard-card__badge badge-count">' + opts.badge + '</span>' : '') +
      '<strong>' + opts.title + '</strong><span>' + opts.desc + '</span></a>';
  }

  function render(params, root) {
    var agent = state.agents.current();
    var myLinks = state.links.byAgent(agent.slug);
    var myClients = agentState.clients.all();
    var uncontacted = myClients.filter(function (cl) { return cl.status === 'nuevo'; }).length;
    var pendingPoolRequests = agentState.sharedPool.isPremium(agent.slug) ? agentState.sharedPool.pendingRequests().length : 0;

    var topProperties = state.tracking.topPropertiesForAgent(agent.slug, 5);
    var recentContacts = state.tracking.recentContactsForAgent(agent.slug, 5);
    var profileUrl = window.location.origin + window.location.pathname + '#/' + agent.slug;

    var pipeline = PIPELINE_STAGES.map(function (s, i) {
      return { label: s.label, value: myClients.filter(function (c) { return c.status === s.value; }).length, opacity: (0.35 + i * 0.16).toFixed(2) };
    });
    var pipelineTotal = pipeline.reduce(function (sum, s) { return sum + s.value; }, 0);

    var content =
      '<div class="agent-greeting">' +
      '  <div class="agent-greeting__text"><strong>' + greetingWord() + ', ' + u.escapeHtml(agent.name.split(' ')[0]) + '</strong><span>Esto es lo que pasa en tu negocio hoy</span></div>' +
      '</div>' +

      (uncontacted
        ? '<a class="attention-card" href="#/dashboard/clientes">' +
          '  <span class="attention-card__icon">' + u.icon('bell', { size: 18 }) + '</span>' +
          '  <div class="attention-card__text"><strong>Tienes ' + uncontacted + (uncontacted === 1 ? ' cliente nuevo' : ' clientes nuevos') + ' sin contactar</strong><span>Contáctalos pronto para no perder la oportunidad</span></div>' +
          u.icon('chevronRight', { size: 18, class: 'text-muted' }) +
          '</a>'
        : '') +

      '<div class="agent-cta-row">' +
      '  <a class="agent-cta-btn" href="#/dashboard/publicar">' + u.icon('plus', { size: 16 }) + ' Publicar propiedad</a>' +
      '  <a class="agent-cta-btn" href="#/dashboard/enlaces/nuevo">' + u.icon('link', { size: 16 }) + ' Crear enlace personalizado</a>' +
      '</div>' +

      '<div class="agent-tile-group"><div class="agent-tile-group__label">Tu negocio</div><div class="dashboard-grid">' +
      tileHTML({ href: '#/dashboard/propiedades', icon: 'home', iconClass: 'dashboard-card__icon--otro', title: 'Propiedades', desc: 'Administra tus publicaciones' }) +
      tileHTML({ href: '#/dashboard/clientes', icon: 'users', iconClass: 'dashboard-card__icon--renta', title: 'Clientes', desc: uncontacted ? uncontacted + ' sin contactar' : 'Tu CRM de clientes', badge: uncontacted || null }) +
      tileHTML({ href: '#/dashboard/bolsa', icon: 'exchange', iconClass: 'dashboard-card__icon--terreno', title: 'Bolsa Compartida', desc: 'Colabora con otros asesores', badge: pendingPoolRequests || null }) +
      tileHTML({ href: '#/dashboard/enlaces', icon: 'link', title: 'Enlaces', desc: 'Selecciones para tus clientes' }) +
      '</div></div>' +

      '<div class="agent-tile-group"><div class="agent-tile-group__label">Tu cuenta</div><div class="dashboard-grid">' +
      tileHTML({ href: '#/dashboard/perfil-profesional', icon: 'user', title: 'Perfil profesional', desc: 'Tu información pública' }) +
      tileHTML({ href: '#/dashboard/suscripcion', icon: 'dollar', title: 'Suscripción', desc: agent.plan === 'profesional' ? 'Plan Profesional' : 'Plan Básico' }) +
      '</div></div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Contactos recientes</div></div>' +
      (recentContacts.length
        ? '<div class="stack gap-2">' + recentContacts.map(contactRowHTML).join('') + '</div>'
        : '<p class="text-muted" style="font-size:0.85rem">Aún no has recibido contactos por WhatsApp o llamada.</p>') +
      '</div>' +

      '<div class="admin-section" style="margin-top:20px">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Comparte tu perfil</div></div>' +
      '  <p class="text-secondary" style="font-size:0.85rem;margin-bottom:10px">Comparte tu perfil público de InmoMaps con tus clientes y en tus redes.</p>' +
      c.shareBarHTML(profileUrl) +
      '</div>' +

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
      '</div>' +

      '<div class="agent-footer-links">' +
      '  <a href="#/' + agent.slug + '">' + u.icon('eye', { size: 16 }) + ' Ver mi perfil público</a>' +
      '  <a href="#/">' + u.icon('chevronLeft', { size: 16 }) + ' Ir al sitio público</a>' +
      '  <a href="#/soporte">' + u.icon('flag', { size: 16 }) + ' Soporte</a>' +
      '  <a href="#" data-agent-logout>' + u.icon('logout', { size: 16 }) + ' Cerrar sesión</a>' +
      '</div>';

    ac.mount('dashboard', 'Dashboard', content, root);
  }

  window.App.agent.views = window.App.agent.views || {};
  window.App.agent.views.dashboardHome = { render: render };
})();
