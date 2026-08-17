// Vista "Qué incluye el plan": página informativa a fondo, con cada
// herramienta real del Plan Asesor y del Plan Directorio (proveedor)
// explicada a detalle, más una recreación fiel de la pantalla donde vive
// cada una. Pensada para alguien que ya vio el precio y quiere saber
// exactamente qué va a poder hacer antes de pagar.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;

  function icon(name, size) { return u.icon(name, { size: size || 16 }); }

  function sectionHead(num, title, text) {
    return (
      '<div class="plandetail-head">' +
      '  <div class="plandetail-head__num"><span>' + num + '</span>' + u.escapeHtml(title.split('§')[0]) + '</div>' +
      '  <h2>' + title.split('§')[1] + '</h2>' +
      '  <p>' + text + '</p>' +
      '</div>'
    );
  }

  function detailList(items) {
    return '<ul class="plandetail-list">' + items.map(function (it) {
      return '<li><span class="plandetail-list__ic">' + icon(it.icon, 15) + '</span><div><b>' + it.title + '</b><span>' + it.text + '</span></div></li>';
    }).join('') + '</ul>';
  }

  function denseGrid(items) {
    return '<div class="plandetail-dense">' + items.map(function (it) {
      return '<div class="plandetail-dense__item"><span class="plandetail-dense__ic tool-mini__icon--' + (it.tone || 'primary') + '">' + icon(it.icon, 17) + '</span><div><h4>' + it.title + '</h4><p>' + it.text + '</p></div></div>';
    }).join('') + '</div>';
  }

  function frame(iconName, title, bodyHtml) {
    return (
      '<div class="plandetail-frame">' +
      '  <div class="plandetail-frame__bar">' + icon(iconName, 16) + '<b>' + title + '</b></div>' +
      '  <div class="plandetail-frame__body">' + bodyHtml + '</div>' +
      '</div>'
    );
  }

  function priceReminder() {
    return '<div class="container"><div class="plandetail-price-reminder">' + icon('dollar', 14) + ' $299 MXN/mes <span>· o $2,999 al año, ahorra 2 meses</span></div></div>';
  }

  function layout(num, title, text, listHtml, frameHtml, reverse) {
    return (
      '<div class="plandetail-section">' +
      '  <div class="container">' + sectionHead(num, title, text) + '</div>' +
      '  <div class="container plandetail-layout' + (reverse ? ' plandetail-layout--rev' : '') + '">' +
      (reverse ? frameHtml + '<div>' + listHtml + '</div>' : '<div>' + listHtml + '</div>' + frameHtml) +
      '  </div>' +
      priceReminder() +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // ASESOR
  // ---------------------------------------------------------------------
  function asesorHTML() {
    var s = '';

    s += '<div class="plans-hero">' +
      '  <span class="plans-hero__eyebrow">' + icon('briefcase', 14) + ' Plan Asesor · $299 MXN/mes</span>' +
      '  <h2 class="plans-hero__title">Todo lo que necesitas para<br /><span>vender más, en un solo lugar.</span></h2>' +
      '  <p class="plans-hero__subtitle">No es un anuncio suelto en un mapa: es un panel de trabajo completo — publicación, CRM, enlaces con seguimiento, colaboración entre asesores y estadísticas reales.</p>' +
      '  <a class="btn btn--primary" href="#/registro-agente/mensual" data-cta-top style="margin-top:22px">Empezar por $299/mes</a>' +
      '</div>' +
      '<div class="plandetail-stats">' +
      '  <div><b>15</b><span>Propiedades activas</span></div>' +
      '  <div><b>∞</b><span>Enlaces personalizados</span></div>' +
      '  <div><b>1</b><span>Destacado gratis</span></div>' +
      '  <div><b>6</b><span>Etapas de tu CRM</span></div>' +
      '</div>';

    s += layout(1, 'Tu panel de control§Todo tu negocio, resumido cada mañana',
      'Al entrar ves exactamente lo que necesita tu atención hoy — no un muro de datos genéricos.',
      detailList([
        { icon: 'clock', title: 'Saludo y avisos según la hora', text: 'Un resumen de lo que pasa en tu negocio, apenas entras.' },
        { icon: 'bell', title: 'Avisos que sí importan', text: 'Pago pendiente o clientes nuevos sin contactar, arriba de todo.' },
        { icon: 'grid', title: '4 accesos directos', text: 'Propiedades, Clientes, Bolsa Compartida y Enlaces, a un toque.' },
        { icon: 'share', title: 'Comparte tu perfil con 1 toque', text: 'Copia el enlace de tu perfil público listo para WhatsApp o redes.' },
        { icon: 'eye', title: 'Contactos recientes y propiedades más vistas', text: 'Sabes quién te llamó o escribió, y qué propiedad tiene más movimiento.' }
      ]),
      frame('grid', 'Buenas tardes, Oswaldo', (
        '<div class="attention-card" style="margin-bottom:10px"><span class="attention-card__icon">' + icon('bell', 17) + '</span><div class="attention-card__text"><strong>Tienes 2 clientes nuevos sin contactar</strong><span>Contáctalos pronto para no perder la oportunidad</span></div></div>' +
        '<div class="plandetail-tilegrid">' +
        '  <div class="dashboard-card" style="padding:14px"><span class="dashboard-card__icon dashboard-card__icon--otro">' + icon('home', 18) + '</span><strong>Propiedades</strong><span>Administra tus publicaciones</span></div>' +
        '  <div class="dashboard-card" style="padding:14px"><span class="badge-count" style="position:absolute;top:10px;right:10px;background:var(--color-primary)">2</span><span class="dashboard-card__icon dashboard-card__icon--renta">' + icon('users', 18) + '</span><strong>Clientes</strong><span>2 sin contactar</span></div>' +
        '  <div class="dashboard-card" style="padding:14px"><span class="dashboard-card__icon dashboard-card__icon--terreno">' + icon('exchange', 18) + '</span><strong>Bolsa Compartida</strong><span>Colabora con otros asesores</span></div>' +
        '  <div class="dashboard-card" style="padding:14px"><span class="dashboard-card__icon">' + icon('link', 18) + '</span><strong>Enlaces</strong><span>Selecciones para clientes</span></div>' +
        '</div>'
      ))
    );

    s += '<div class="plandetail-section plandetail-section--alt"><div class="container">' +
      sectionHead(2, 'Publicar una propiedad§Un formulario de 9 pasos que no se salta nada', 'Desde el tipo de inmueble hasta el pin exacto en el mapa — cada dato relevante para vender tiene su lugar.') +
      '<div class="plandetail-steps">' +
      [
        ['Tipo y operación', 'Venta, renta o ambas · 11 tipos de inmueble · título automático si no escribes uno.'],
        ['Precio', 'MXN o USD · precio de venta y/o renta · qué créditos acepta (Infonavit, FOVISSSTE, bancario y más).'],
        ['Condiciones de renta', 'Depósito, amueblado, contrato mínimo, garantías aceptadas y servicios incluidos.'],
        ['Ubicación', 'Estado/ciudad, colonia, calle, mapa interactivo para el pin exacto, y privacidad de ubicación.'],
        ['Características', 'Recámaras, baños, construcción, terreno, niveles, antigüedad, frente y fondo.'],
        ['Amenidades y descripción', '25 amenidades + botón para generar la descripción automáticamente con IA.'],
        ['Fotografías', 'Sube, reordena y elige la portada. Espacio para video o recorrido virtual.'],
        ['Publicación', 'Inmediata, borrador, programada u oculta · destacado gratis · etiquetas · Bolsa Compartida.'],
        ['Vista previa', 'Exactamente como la va a ver un comprador, antes de publicar.']
      ].map(function (st, i) {
        return '<div class="plandetail-step"><span class="plandetail-step__n">' + (i + 1) + '</span><h4>' + st[0] + '</h4><p>' + st[1] + '</p></div>';
      }).join('') +
      '</div>' +
      '<div class="plans-footnote" style="margin-top:18px">' + icon('shield', 16) + ' Solo es obligatorio el precio, la ciudad y 1 foto — todo lo demás es opcional.</div>' +
      '</div>' + priceReminder() + '</div>';

    s += layout(3, 'Administrar tus propiedades§12 acciones sobre cada propiedad, sin salir de la tarjeta',
      'Cada ficha muestra su estado real de un vistazo, y el menú "⋯" cubre todo lo que necesitas después de publicar.',
      detailList([
        { icon: 'eye', title: 'Estado siempre visible', text: 'Publicada, Borrador, Programada, Oculta, Apartada, Vendida, Rentada o Pausada.' },
        { icon: 'chart', title: 'Vistas por propiedad, en la misma tarjeta', text: 'Cuántas veces la han visto, sin entrar a estadísticas aparte.' },
        { icon: 'copy', title: 'Duplicar en 1 toque', text: 'Copia fotos y configuración completa para publicar algo similar rapidísimo.' },
        { icon: 'briefcase', title: 'Hasta 15 propiedades activas', text: 'El límite de tu plan — suficiente para un catálogo real de trabajo.' }
      ]),
      frame('list', 'Casa Residencial Norte', (
        '<div class="plandetail-actions">' +
        ['eye,Ver ficha pública', 'edit,Editar', 'download,Descargar PDF', 'check,Marcar como vendida', 'starFilled,Destacar (1 gratis incluida)', 'exchange,Compartir con asesores'].map(function (a) {
          var parts = a.split(','); return '<div class="plandetail-action">' + icon(parts[0], 14) + parts[1] + '</div>';
        }).join('') +
        '<div class="plandetail-action plandetail-action--danger">' + icon('x', 14) + 'Eliminar</div>' +
        '</div>'
      )),
      true
    );

    s += layout(4, 'CRM de clientes§Cada cliente, en la etapa correcta',
      'No es una libreta: 6 etapas reales de venta, ficha completa por cliente, y un WhatsApp con el mensaje ya listo.',
      '<div class="chip-cloud" style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px">' +
      ['Nuevo', 'Contactado', 'Visita agendada', 'Negociación', 'Cerrado', 'Perdido'].map(function (st) {
        return '<span style="font-size:0.72rem;font-weight:700;color:var(--color-ink-secondary);background:var(--color-bg);border:1px solid var(--color-border);padding:5px 12px;border-radius:999px">' + st + '</span>';
      }).join('') + '</div>' +
      detailList([
        { icon: 'user', title: 'Ficha completa por cliente', text: 'Nombre, teléfono, correo, presupuesto y notas privadas.' },
        { icon: 'chat', title: 'WhatsApp con mensaje pre-escrito', text: 'Un toque y ya está listo para enviar.' },
        { icon: 'clock', title: 'Historial de actividad', text: 'Registra llamadas, visitas y seguimientos, fechados y ordenados.' },
        { icon: 'link', title: 'Conectado con tus enlaces', text: 'Al mandar un enlace, la ficha del cliente se crea sola.' }
      ]),
      frame('user', 'María González', (
        '<div class="client-row" style="margin-bottom:8px"><div class="client-row__head"><span class="client-row__name">María González</span><span class="status-pill status-pill--activo">Visita agendada</span></div><div class="client-row__meta"><span>$2,800,000</span><span>9811234567</span></div></div>' +
        '<div class="plandetail-chat">📞 Llamada — "Confirmó visita el sábado" · hace 1 día</div>' +
        '<div class="plandetail-chat">📍 Visita — "Le encantó el jardín" · hace 3h</div>' +
        '<div class="plandetail-wa">' + icon('chat', 14) + ' Escribir por WhatsApp</div>'
      ))
    );

    s += '<div class="plandetail-section plandetail-section--alt"><div class="container">' +
      sectionHead(5, 'Bolsa Compartida§Cierra tratos de propiedades que no son tuyas', 'Comparte una de tus propiedades con otros asesores a cambio de una comisión que tú defines, o encuentra propiedades de otros para tus clientes.') +
      denseGrid([
        { icon: 'search', tone: 'renta', title: 'Buscar', text: 'Filtra por ciudad, tipo, operación y comisión mínima.' },
        { icon: 'exchange', tone: 'otro', title: 'Mis compartidas', text: 'Define comisión total, % del colaborador y quién puede verla.' },
        { icon: 'clipboard', tone: 'terreno', title: 'Mi catálogo', text: 'Inclúyelas directo en un enlace, con precio y fotos sincronizados.' },
        { icon: 'dollar', tone: 'venta', title: 'Liquidaciones', text: 'Registra el reparto de cada comisión y márcala como pagada.' }
      ]) +
      '<div class="plans-footnote" style="margin-top:18px">' + icon('shield', 16) + ' Tú decides quién ve tu propiedad: todos, una lista, tu inmobiliaria, o solo quien tú apruebes.</div>' +
      '</div>' + priceReminder() + '</div>';

    s += layout(6, 'Enlaces personalizados§Un enlace con el nombre de tu cliente',
      'Arma una selección de propiedades y mándasela como un enlace propio, con seguimiento real de qué hace tu cliente ahí.',
      detailList([
        { icon: 'link', title: 'Enlaces ilimitados', text: 'Uno por cliente, con mensaje de bienvenida editable y tu marca.' },
        { icon: 'eye', title: 'Sabes qué le interesa', text: 'Propiedades más vistas, favoritas, y cuántas veces volvió a entrar.' },
        { icon: 'chat', title: 'Envío directo', text: 'Por WhatsApp o correo, con el mensaje ya armado.' }
      ]),
      frame('chart', 'Últimos 7 días', (
        '<div class="plandetail-statrow">' +
        '<div class="stat-card" style="padding:10px"><span class="stat-card__label">Vistas</span><span class="stat-card__value" style="font-size:1.1rem">47</span></div>' +
        '<div class="stat-card" style="padding:10px"><span class="stat-card__label">Tiempo prom.</span><span class="stat-card__value" style="font-size:1.1rem">3.2 min</span></div>' +
        '</div>' +
        '<div class="plandetail-statrow" style="margin-top:8px">' +
        '<div class="stat-card" style="padding:10px"><span class="stat-card__label">Propiedades vistas</span><span class="stat-card__value" style="font-size:1.1rem">6</span></div>' +
        '<div class="stat-card" style="padding:10px"><span class="stat-card__label">Contactos</span><span class="stat-card__value" style="font-size:1.1rem">2</span></div>' +
        '</div>'
      )),
      true
    );

    s += layout(7, 'Ficha en PDF§Una ficha profesional lista para enviar',
      'Un clic desde "Mis propiedades" genera un PDF de una página con mosaico de fotos, toda la info clave y un QR que abre la ficha en InmoMaps.',
      detailList([
        { icon: 'camera', title: 'Mosaico de 4 fotos', text: 'Recortadas automáticamente, sin estirarse ni deformarse.' },
        { icon: 'grid', title: 'Código QR incluido', text: 'Escanearlo abre la ficha completa dentro de InmoMaps.' },
        { icon: 'phone', title: 'Tu contacto, siempre visible', text: 'Tu nombre y WhatsApp quedan impresos — te escriben a ti.' }
      ]),
      '<div class="plandetail-pdf">' +
      '  <div class="plandetail-pdf__mosaic"><div>' + icon('camera', 20) + '</div><div>' + icon('camera', 20) + '</div><div>' + icon('camera', 20) + '</div><div>' + icon('camera', 20) + '</div></div>' +
      '  <div class="plandetail-pdf__body">' +
      '    <div class="plandetail-pdf__tag">CASA · EN VENTA</div>' +
      '    <div class="plandetail-pdf__title">Casa Residencial Norte</div>' +
      '    <div class="plandetail-pdf__loc">Residencial Norte, Campeche</div>' +
      '    <div class="plandetail-pdf__price">$2,450,000 MXN</div>' +
      '    <div class="plandetail-pdf__contact"><span class="plandetail-pdf__qr"></span><div><b>Oswaldo Chable</b><span>WhatsApp: 9991521585</span></div></div>' +
      '  </div>' +
      '</div>'
    );

    s += '<div class="plandetail-section plandetail-section--alt"><div class="container">' +
      sectionHead(8, 'Destacar tus propiedades§Aparece primero en los resultados', 'Tienes 1 destacado incluido en tu plan — y 3 formas de usarlo o de ampliarlo.') +
      denseGrid([
        { icon: 'plus', tone: 'venta', title: 'Gratis, al publicar', text: 'Actívalo con un checkbox en el paso final del formulario.' },
        { icon: 'starFilled', tone: 'renta', title: 'Gratis, después', text: 'Actívalo o cámbialo de propiedad desde el menú "⋯".' },
        { icon: 'dollar', tone: 'primary', title: '+$100 MXN, si quieres más', text: '¿Ya usaste tu destacado gratis? Destaca otra por $100/mes.' }
      ]) +
      '</div>' + priceReminder() + '</div>';

    s += layout(9, 'Tu perfil y tu suscripción§Tu presencia profesional, y el control de tu pago',
      'Un perfil público completo, y un panel de suscripción claro — sin sorpresas.',
      detailList([
        { icon: 'user', title: 'Perfil completo', text: 'Foto, empresa, especialidad, ciudad, biografía, horario, WhatsApp, Facebook, Instagram, TikTok y sitio web.' },
        { icon: 'shield', title: 'Cambia tu contraseña cuando quieras', text: 'Directo desde tu perfil, sin depender de un correo.' },
        { icon: 'dollar', title: 'Facturación con Stripe', text: 'Gestiona tu método de pago y descarga tus facturas desde un portal seguro.' }
      ]),
      frame('dollar', 'Tu plan', (
        '<div class="dashboard-card" style="padding:16px"><span class="status-pill status-pill--activo" style="margin-bottom:8px;display:inline-flex">Activo</span><br /><strong style="font-size:1rem">Plan Asesor</strong><span>$299 MXN/mes</span></div>'
      ))
    );

    s += '<div class="plandetail-price"><div class="container" style="max-width:460px">' +
      '  <div class="price-block">' +
      '    <div class="price-block__label">Plan Asesor · resumen completo</div>' +
      '    <div class="price-block__price"><span>$299</span><span>/mes</span></div>' +
      '    <div><span class="plandetail-annual-badge">' + icon('starFilled', 13) + ' Paga $2,999 al año y ahorra 2 meses</span></div>' +
      '    <ul class="plandetail-checklist">' +
      ['Hasta 15 propiedades activas', '1 publicación destacada incluida', 'Perfil profesional público', 'Enlaces personalizados ilimitados', 'Estadísticas completas de tus enlaces', 'CRM de clientes con seguimiento', 'Bolsa Compartida entre asesores', 'Soporte directo por WhatsApp'].map(function (f) {
        return '<li>' + icon('check', 14) + f + '</li>';
      }).join('') +
      '    </ul>' +
      '    <a class="btn btn--primary btn--block" href="#/registro-agente/mensual">Quiero publicar en InmoMaps</a>' +
      '    <div class="price-block__note">Sin permanencia forzosa · cancela cuando quieras</div>' +
      '  </div>' +
      '  <p class="plandetail-wa-note"><a href="' + u.whatsappLink(window.APP_CONFIG.SUPPORT_WHATSAPP, 'Hola, tengo dudas sobre el Plan Asesor de InmoMaps.') + '" target="_blank" rel="noopener">' + icon('chat', 15) + ' ¿Dudas? Escríbenos por WhatsApp</a></p>' +
      '</div></div>';

    s += '<div class="plandetail-finalcta">' +
      '  <h2>Tu próximo cliente ya está buscando en el mapa</h2>' +
      '  <p>Publica tu primera propiedad hoy mismo.</p>' +
      '  <a class="btn btn--primary" href="#/registro-agente/mensual">Quiero publicar en InmoMaps</a>' +
      '</div>';

    return s;
  }

  // ---------------------------------------------------------------------
  // PROVEEDOR
  // ---------------------------------------------------------------------
  function proveedorHTML() {
    var s = '';

    s += '<div class="plans-hero plandetail-hero--terreno">' +
      '  <span class="plans-hero__eyebrow">' + icon('award', 14) + ' Plan Directorio · $299 MXN/mes</span>' +
      '  <h2 class="plans-hero__title">Que te encuentren<br /><span>justo cuando te necesitan.</span></h2>' +
      '  <p class="plans-hero__subtitle">Notarios, valuadores, arquitectos, SOFOM y servicios: tu propia ficha, con pin en el mismo mapa donde la gente ya busca propiedad.</p>' +
      '  <a class="btn btn--primary" href="#/registro-proveedor/mensual" data-cta-top style="margin-top:22px">Empezar por $299/mes</a>' +
      '</div>' +
      '<div class="plandetail-stats">' +
      '  <div><b>1</b><span>Ficha propia, sin duplicados</span></div>' +
      '  <div><b>100%</b><span>Contacto directo</span></div>' +
      '  <div><b>0</b><span>Espera para publicar</span></div>' +
      '  <div><b>∞</b><span>Fotos y ediciones</span></div>' +
      '</div>';

    s += layout(1, 'Tu ficha§Todo lo que necesitas para presentarte bien',
      'Editable por ti mismo, cuando quieras — sin pedirle nada al administrador.',
      detailList([
        { icon: 'award', title: 'Categoría propia', text: 'Notario, valuador, arquitecto, SOFOM o servicios.' },
        { icon: 'camera', title: 'Varias fotos, no solo un logo', text: 'Muestra tu oficina, tu equipo o tu trabajo.' },
        { icon: 'pin', title: 'Ubicación exacta en el mapa', text: 'Colocas tu pin arrastrando el mapa.' },
        { icon: 'chat', title: 'Descripción + contacto directo', text: 'Te escriben por WhatsApp o te llaman directo.' }
      ]),
      frame('award', 'Mi ficha', (
        '<div class="f-card-mini" style="background:var(--color-terreno-bg);border-radius:12px;padding:14px;margin-bottom:8px"><strong style="display:block;font-size:0.85rem">Sofom DeCapital</strong><span style="font-size:0.72rem;color:var(--color-ink-muted)">Campeche · Sofom</span></div>' +
        '<div class="dashboard-card" style="padding:12px;margin-bottom:6px"><span class="dashboard-card__icon dashboard-card__icon--terreno">' + icon('camera', 16) + '</span><strong style="font-size:0.8rem">4 fotos subidas</strong><span>Toca para agregar más</span></div>' +
        '<div class="dashboard-card" style="padding:12px"><span class="dashboard-card__icon" style="background:var(--color-primary)">' + icon('pin', 16) + '</span><strong style="font-size:0.8rem">Ubicación exacta</strong><span>Pin colocado en el mapa</span></div>'
      ))
    );

    s += '<div class="plandetail-section plandetail-section--alt"><div class="container">' +
      sectionHead(2, 'Visibilidad§Compartes mapa con las propiedades', 'Tu ficha no se queda escondida en una lista que nadie visita: aparece justo donde la gente ya está mirando.') +
      denseGrid([
        { icon: 'map', tone: 'terreno', title: 'Pin propio en Explorar', text: 'Junto a las propiedades, no en una pestaña aparte.' },
        { icon: 'search', tone: 'otro', title: 'Listado en tu categoría', text: 'Filtrable por ciudad y tipo de servicio.' },
        { icon: 'navigation', tone: 'renta', title: 'Carrusel automático', text: 'Tu ficha pasa sola frente a todos los que visitan la app.' }
      ]) +
      '</div>' + priceReminder() + '</div>';

    s += layout(3, 'Contacto y control§Te escriben a ti — InmoMaps no se queda en medio',
      'Publicas, editas y recibes el contacto directo, sin pasos extra ni depender del administrador.',
      detailList([
        { icon: 'chat', title: 'WhatsApp y llamadas directas', text: 'El botón de contacto va directo a tu número.' },
        { icon: 'edit', title: 'Edita cuando quieras', text: 'Fotos, descripción y ubicación, sin pedirle nada a nadie.' },
        { icon: 'clock', title: 'Alta inmediata', text: 'Pagas y tu ficha queda activa al momento.' },
        { icon: 'shield', title: 'Cuenta propia y segura', text: 'Login y contraseña propia, 1 ficha por cuenta.' }
      ]),
      frame('chat', 'Sofom DeCapital', (
        '<div class="plandetail-chat">¡Hola! 👋 Vi tu ficha en InmoMaps, me interesa su servicio.</div>' +
        '<div class="plandetail-wa">' + icon('chat', 14) + ' Contacto directo por WhatsApp</div>' +
        '<div class="plandetail-statrow" style="margin-top:10px">' +
        '<div class="stat-card" style="padding:10px"><span class="stat-card__label">Vistas este mes</span><span class="stat-card__value" style="font-size:1.1rem">34</span></div>' +
        '<div class="stat-card" style="padding:10px"><span class="stat-card__label">Contactos</span><span class="stat-card__value" style="font-size:1.1rem">5</span></div>' +
        '</div>'
      )),
      true
    );

    s += '<div class="plandetail-price"><div class="container" style="max-width:460px">' +
      '  <div class="price-block">' +
      '    <div class="price-block__label">Plan Directorio · resumen completo</div>' +
      '    <div class="price-block__price"><span>$299</span><span>/mes</span></div>' +
      '    <div><span class="plandetail-annual-badge">' + icon('starFilled', 13) + ' Paga $2,999 al año y ahorra 2 meses</span></div>' +
      '    <ul class="plandetail-checklist">' +
      ['Tu ficha propia en el directorio', 'Pin propio en el mapa de Explorar', 'Fotos y ubicación exacta', 'Contacto directo por WhatsApp y llamadas', 'Carrusel automático en Explorar', 'Soporte directo por WhatsApp'].map(function (f) {
        return '<li>' + icon('check', 14) + f + '</li>';
      }).join('') +
      '    </ul>' +
      '    <a class="btn btn--primary btn--block" href="#/registro-proveedor/mensual">Quiero publicar mi ficha en InmoMaps</a>' +
      '    <div class="price-block__note">Sin permanencia forzosa · cancela cuando quieras</div>' +
      '  </div>' +
      '  <p class="plandetail-wa-note"><a href="' + u.whatsappLink(window.APP_CONFIG.SUPPORT_WHATSAPP, 'Hola, tengo dudas sobre el Plan Directorio de InmoMaps.') + '" target="_blank" rel="noopener">' + icon('chat', 15) + ' ¿Dudas? Escríbenos por WhatsApp</a></p>' +
      '</div></div>';

    s += '<div class="plandetail-finalcta">' +
      '  <h2>Tu próximo cliente ya está viendo el mapa</h2>' +
      '  <p>Crea tu ficha hoy mismo y empieza a aparecer.</p>' +
      '  <a class="btn btn--primary" href="#/registro-proveedor/mensual">Quiero publicar mi ficha en InmoMaps</a>' +
      '</div>';

    return s;
  }

  function render(params, root) {
    var tipo = params.tipo === 'proveedor' ? 'proveedor' : 'asesor';

    root.innerHTML =
      '<div class="page-header"><a class="btn btn--icon" href="#/perfil" aria-label="Volver">' + icon('chevronLeft', 18) + '</a><h1 class="page-header__title">Qué incluye el plan</h1></div>' +
      '<div class="plandetail">' +
      '  <div class="billing-toggle plandetail-switcher" data-switcher>' +
      '    <button type="button" class="billing-toggle__opt' + (tipo === 'asesor' ? ' is-active' : '') + '" data-tipo="asesor">Para asesores</button>' +
      '    <button type="button" class="billing-toggle__opt' + (tipo === 'proveedor' ? ' is-active' : '') + '" data-tipo="proveedor">Para proveedores</button>' +
      '  </div>' +
      '  <div data-panel-asesor style="display:' + (tipo === 'asesor' ? 'block' : 'none') + '">' + asesorHTML() + '</div>' +
      '  <div data-panel-proveedor style="display:' + (tipo === 'proveedor' ? 'block' : 'none') + '">' + proveedorHTML() + '</div>' +
      '</div>';

    c.mountChrome('perfil');
    document.title = 'Qué incluye el plan — InmoMaps';

    u.qsa('[data-switcher] button', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-tipo');
        u.qsa('[data-switcher] button', root).forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        u.qs('[data-panel-asesor]', root).style.display = next === 'asesor' ? 'block' : 'none';
        u.qs('[data-panel-proveedor]', root).style.display = next === 'proveedor' ? 'block' : 'none';
        window.location.hash = '#/plan-detalle/' + next;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  window.App.views = window.App.views || {};
  window.App.views.planDetalle = { render: render };
})();
