// Vista "Dashboard del asesor": resumen de actividad con indicadores y accesos rápidos.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;
  var state = window.App.state;
  var agentState = window.App.agent.state;
  var ac = window.App.agent.components;

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

  // Panel reducido para cuentas de propietario (publicación individual):
  // nada de CRM, Bolsa Compartida ni enlaces — solo su propiedad, su perfil
  // y quién lo ha contactado.
  function renderOwner(root, agent) {
    var myProperty = state.properties.byAgent(agent.slug)[0] || null;
    var isExpired = myProperty && myProperty.expiresAt && new Date(myProperty.expiresAt) <= new Date();
    var recentContacts = state.tracking.recentContactsForAgent(agent.slug, 5);
    var profileUrl = window.location.origin + window.location.pathname + '#/' + agent.slug;

    var content =
      '<div class="agent-greeting">' +
      '  <div class="agent-greeting__text"><strong>' + greetingWord() + ', ' + u.escapeHtml(agent.name.split(' ')[0]) + '</strong><span>Así va tu propiedad en InmoMaps</span></div>' +
      '</div>' +

      '<div class="agent-cta-row">' +
      (myProperty
        ? '  <a class="agent-cta-btn" href="#/dashboard/propiedades">' + u.icon('home', { size: 16 }) + ' Ver mi propiedad</a>'
        : '  <a class="agent-cta-btn" href="#/dashboard/publicar-elegir">' + u.icon('plus', { size: 16 }) + ' Publicar mi propiedad</a>') +
      '</div>' +

      (isExpired
        ? '<a class="attention-card" href="#/dashboard/propiedades">' +
          '  <span class="attention-card__icon">' + u.icon('clock', { size: 18 }) + '</span>' +
          '  <div class="attention-card__text"><strong>Tu publicación venció</strong><span>Renuévala gratis para que vuelva a aparecer</span></div>' +
          u.icon('chevronRight', { size: 18, class: 'text-muted' }) +
          '</a>'
        : (myProperty && !myProperty.featured
          ? '<a class="attention-card" href="#/dashboard/destacar/' + myProperty.id + '">' +
            '  <span class="attention-card__icon">' + u.icon('starFilled', { size: 18 }) + '</span>' +
            '  <div class="attention-card__text"><strong>Destaca tu propiedad</strong><span>Aparece primero en los resultados de búsqueda</span></div>' +
            u.icon('chevronRight', { size: 18, class: 'text-muted' }) +
            '</a>'
          : '')) +

      '<div class="agent-tile-group"><div class="agent-tile-group__label">Tu cuenta</div><div class="dashboard-grid">' +
      tileHTML({ href: '#/dashboard/propiedades', icon: 'home', iconClass: 'dashboard-card__icon--otro', title: 'Mi propiedad', desc: isExpired ? 'Venció — renuévala' : (myProperty ? 'Editar o destacar' : 'Aún no has publicado') }) +
      tileHTML({ href: '#/dashboard/perfil-profesional', icon: 'user', title: 'Mi perfil', desc: 'Tu foto y datos de contacto' }) +
      '</div></div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Comparte tu perfil</div></div>' +
      '  <p class="text-secondary" style="font-size:0.85rem;margin-bottom:10px">Comparte tu perfil público de InmoMaps con quien pueda estar interesado.</p>' +
      c.shareBarHTML(profileUrl) +
      '</div>' +

      '<div class="admin-section" style="margin-top:20px">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Contactos recientes</div></div>' +
      (recentContacts.length
        ? '<div class="stack gap-2">' + recentContacts.map(contactRowHTML).join('') + '</div>'
        : '<p class="text-muted" style="font-size:0.85rem">Aún no has recibido contactos por WhatsApp o llamada.</p>') +
      '</div>' +

      '<div class="agent-footer-links">' +
      '  <a href="#/' + agent.slug + '">' + u.icon('eye', { size: 16 }) + ' Ver mi perfil público</a>' +
      '  <a href="#/">' + u.icon('chevronLeft', { size: 16 }) + ' Ir al sitio público</a>' +
      '  <a href="#/soporte">' + u.icon('flag', { size: 16 }) + ' Soporte</a>' +
      '  <a href="#" data-agent-logout>' + u.icon('logout', { size: 16 }) + ' Cerrar sesión</a>' +
      '</div>';

    ac.mount('dashboard', 'Dashboard', content, root);
  }

  // Panel reducido para cuentas de proveedor (directorio de servicios):
  // solo su ficha y su suscripción — nada del panel de propiedades de un
  // asesor, que no aplica aquí.
  function renderProvider(root, agent) {
    var myListing = state.providers.all().filter(function (p) { return p.profileId === agent.id; })[0] || null;
    var listingUrl = myListing ? (window.location.origin + window.location.pathname + '#/servicios/' + myListing.category + '/' + myListing.id) : null;

    var content =
      '<div class="agent-greeting">' +
      '  <div class="agent-greeting__text"><strong>' + greetingWord() + ', ' + u.escapeHtml(agent.name.split(' ')[0]) + '</strong><span>Así va tu ficha en el directorio de InmoMaps</span></div>' +
      '</div>' +

      '<div class="agent-cta-row">' +
      '  <a class="agent-cta-btn" href="#/dashboard/mi-ficha">' + u.icon('edit', { size: 16 }) + ' Editar mi ficha</a>' +
      '</div>' +

      (agent.status !== 'activo'
        ? '<a class="attention-card" href="#/dashboard/suscripcion">' +
          '  <span class="attention-card__icon">' + u.icon('dollar', { size: 18 }) + '</span>' +
          '  <div class="attention-card__text"><strong>Completa tu pago para activar tu cuenta</strong><span>Sin esto tu ficha no aparece en el directorio ni en el mapa</span></div>' +
          u.icon('chevronRight', { size: 18, class: 'text-muted' }) +
          '</a>'
        : (myListing && (!myListing.photos || !myListing.photos.length)
          ? '<a class="attention-card" href="#/dashboard/mi-ficha">' +
            '  <span class="attention-card__icon">' + u.icon('camera', { size: 18 }) + '</span>' +
            '  <div class="attention-card__text"><strong>Agrega fotos a tu ficha</strong><span>Las fichas con fotos generan más contactos</span></div>' +
            u.icon('chevronRight', { size: 18, class: 'text-muted' }) +
            '</a>'
          : '')) +

      '<div class="agent-tile-group"><div class="agent-tile-group__label">Tu cuenta</div><div class="dashboard-grid">' +
      tileHTML({ href: '#/dashboard/mi-ficha', icon: 'award', iconClass: 'dashboard-card__icon--terreno', title: 'Mi ficha', desc: myListing ? 'Fotos, contacto y ubicación' : 'Aún no se ha creado' }) +
      tileHTML({ href: '#/dashboard/suscripcion', icon: 'dollar', title: 'Suscripción', desc: agent.status === 'activo' ? 'Plan Directorio activo' : 'Pendiente de pago' }) +
      '</div></div>' +

      (listingUrl
        ? '<div class="admin-section">' +
          '  <div class="admin-section__head"><div class="admin-section__title">Comparte tu ficha</div></div>' +
          '  <p class="text-secondary" style="font-size:0.85rem;margin-bottom:10px">Comparte tu ficha del directorio de InmoMaps con quien pueda estar interesado.</p>' +
          c.shareBarHTML(listingUrl) +
          '</div>'
        : '') +

      '<div class="agent-footer-links">' +
      (listingUrl ? '  <a href="' + listingUrl + '" target="_blank" rel="noopener">' + u.icon('eye', { size: 16 }) + ' Ver mi ficha pública</a>' : '') +
      '  <a href="#/">' + u.icon('chevronLeft', { size: 16 }) + ' Ir al sitio público</a>' +
      '  <a href="#/soporte">' + u.icon('flag', { size: 16 }) + ' Soporte</a>' +
      '  <a href="#" data-agent-logout>' + u.icon('logout', { size: 16 }) + ' Cerrar sesión</a>' +
      '</div>';

    ac.mount('dashboard', 'Dashboard', content, root);
  }

  function render(params, root) {
    var agent = state.agents.current();
    if (agent.plan === 'propietario') { renderOwner(root, agent); return; }
    if (agent.plan === 'proveedor') { renderProvider(root, agent); return; }
    var myClients = agentState.clients.all();
    var uncontacted = myClients.filter(function (cl) { return cl.status === 'nuevo'; }).length;
    var pendingPoolRequests = agentState.sharedPool.isPremium(agent.slug) ? agentState.sharedPool.pendingRequests().length : 0;

    var topProperties = state.tracking.topPropertiesForAgent(agent.slug, 5);
    var recentContacts = state.tracking.recentContactsForAgent(agent.slug, 5);
    var profileUrl = window.location.origin + window.location.pathname + '#/' + agent.slug;

    var content =
      '<div class="agent-greeting">' +
      '  <div class="agent-greeting__text"><strong>' + greetingWord() + ', ' + u.escapeHtml(agent.name.split(' ')[0]) + '</strong><span>Esto es lo que pasa en tu negocio hoy</span></div>' +
      '</div>' +

      (agent.status !== 'activo'
        ? '<a class="attention-card" href="#/dashboard/suscripcion">' +
          '  <span class="attention-card__icon">' + u.icon('dollar', { size: 18 }) + '</span>' +
          '  <div class="attention-card__text"><strong>Completa tu pago para activar tu cuenta</strong><span>Sin esto no puedes publicar propiedades nuevas</span></div>' +
          u.icon('chevronRight', { size: 18, class: 'text-muted' }) +
          '</a>'
        : '') +

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
      tileHTML({ href: '#/dashboard/suscripcion', icon: 'dollar', title: 'Suscripción', desc: agent.status === 'activo' ? 'Plan Asesor activo' : 'Pendiente de pago' }) +
      '</div></div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Comparte tu perfil</div></div>' +
      '  <p class="text-secondary" style="font-size:0.85rem;margin-bottom:10px">Comparte tu perfil público de InmoMaps con tus clientes y en tus redes.</p>' +
      c.shareBarHTML(profileUrl) +
      '</div>' +

      '<div class="admin-section" style="margin-top:20px">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Contactos recientes</div></div>' +
      (recentContacts.length
        ? '<div class="stack gap-2">' + recentContacts.map(contactRowHTML).join('') + '</div>'
        : '<p class="text-muted" style="font-size:0.85rem">Aún no has recibido contactos por WhatsApp o llamada.</p>') +
      '</div>' +

      '<div class="admin-section">' +
      '  <div class="admin-section__head"><div class="admin-section__title">Propiedades más vistas</div></div>' +
      (topProperties.length ? ac.hbarListHTML(topProperties) : '<p class="text-muted" style="font-size:0.85rem">Comparte enlaces personalizados para empezar a ver estadísticas.</p>') +
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
