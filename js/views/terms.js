// Vista "Términos y condiciones": documento legal público, sin depender de sesión.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;

  function render(params, root) {
    var content =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Términos y condiciones</h1>' +
      '</div>' +
      '<div class="legal-content">' +
      '<p class="legal-content__updated">Última actualización: 17 de agosto de 2026</p>' +

      '<h2>1. Quiénes somos</h2>' +
      '<p>InmoMaps ("nosotros", "la plataforma") es un servicio en línea que permite a compradores y arrendatarios explorar propiedades inmobiliarias sobre un mapa interactivo, a asesores inmobiliarios y propietarios publicar y administrar sus propiedades, y a notarios, valuadores, arquitectos, SOFOM y otros profesionales del sector publicar su ficha en el directorio de servicios. Al usar InmoMaps, aceptas estos términos.</p>' +

      '<h2>2. Qué es InmoMaps (y qué no es)</h2>' +
      '<p>InmoMaps es un espacio de exhibición y contacto: mostramos propiedades publicadas por asesores y propietarios, y fichas de profesionales del directorio de servicios (notarios, valuadores, arquitectos, SOFOM y similares), y facilitamos que los interesados se comuniquen directamente con ellos por WhatsApp o llamada.</p>' +
      '<p><strong>InmoMaps no es parte de ninguna compraventa, renta, negociación, ni de los servicios profesionales que ofrecen los proveedores del directorio.</strong> No somos inmobiliaria ni prestamos esos servicios, no gestionamos pagos entre partes, no verificamos la titularidad legal de las propiedades publicadas ni las credenciales o autorizaciones profesionales de los proveedores del directorio, y no garantizamos que una propiedad esté disponible, en las condiciones descritas o al precio anunciado, ni la calidad o el resultado de los servicios que ofrecen los proveedores. Toda negociación o contratación ocurre directamente entre el interesado y el asesor, propietario o proveedor correspondiente.</p>' +

      '<h2>3. Cuentas de usuario</h2>' +
      '<p>Cualquier persona puede explorar propiedades y el directorio de servicios sin crear una cuenta. Para publicar propiedades se requiere una cuenta de asesor (con el Plan Asesor, ver sección 6) o de propietario individual (publicación gratuita de una propiedad); para publicar una ficha en el directorio de servicios se requiere una cuenta de proveedor (con el Plan Directorio, ver sección 6). Cada tipo de cuenta tiene sus propias características y límites.</p>' +
      '<ul>' +
      '<li>Eres responsable de la información que registras y de mantener segura tu contraseña.</li>' +
      '<li>Nos reservamos el derecho de suspender cuentas que incumplan estos términos.</li>' +
      '</ul>' +

      '<h2>4. Contenido que publicas</h2>' +
      '<p>Si publicas una propiedad o una ficha en el directorio de servicios, eres responsable de que la información que registras (precio, características, fotos y ubicación de una propiedad; o descripción, categoría y datos de contacto de una ficha del directorio) sea veraz, y de contar con la autorización o las credenciales necesarias para ofrecer la propiedad en venta o renta, o para prestar el servicio profesional que anuncias. No está permitido publicar:</p>' +
      '<ul>' +
      '<li>Propiedades o servicios inexistentes, duplicados o que no estén realmente disponibles.</li>' +
      '<li>Información falsa o engañosa sobre precio, superficie, ubicación, estado legal, o sobre tus credenciales y experiencia profesional.</li>' +
      '<li>Contenido ofensivo, discriminatorio o que infrinja derechos de terceros (incluidas fotografías que no te pertenezcan).</li>' +
      '</ul>' +
      '<p>InmoMaps puede revisar, ocultar o eliminar publicaciones que incumplan lo anterior, con o sin previo aviso.</p>' +

      '<h2>5. Bolsa Compartida y colaboración entre asesores</h2>' +
      '<p>La función "Bolsa Compartida" permite que un asesor autorice a otros a ofrecer su propiedad a cambio de una comisión de colaboración que el propio asesor define. InmoMaps solo facilita la visibilidad de este acuerdo entre asesores; no participa en la negociación, el cobro ni el cumplimiento de la comisión pactada — eso es responsabilidad exclusiva de los asesores involucrados.</p>' +

      '<h2>6. Planes y pagos</h2>' +
      '<p>El Plan Asesor y el Plan Directorio (para proveedores de servicios) tienen un costo fijo mensual o anual; los precios vigentes se muestran en la sección de Planes correspondiente y en tu panel de Suscripción. Los pagos se procesan a través de Stripe, un proveedor externo de pagos; InmoMaps no almacena los datos completos de tu tarjeta.</p>' +
      '<p>La suscripción se renueva automáticamente al final de cada periodo (mensual o anual, según lo que hayas elegido) hasta que la canceles. Puedes cancelarla en cualquier momento desde tu panel (Suscripción → Gestionar pago); la cancelación aplica a partir del siguiente cobro — no se hacen reembolsos por el periodo ya pagado, salvo que la ley aplicable indique lo contrario.</p>' +
      '<p>Si un cobro falla o tu suscripción vence sin renovarse, tu cuenta pierde temporalmente el acceso a publicar contenido nuevo (propiedades o tu ficha del directorio, según tu plan) y a las demás funciones del plan, hasta que se regularice el pago.</p>' +

      '<h2>7. Propiedad intelectual</h2>' +
      '<p>El diseño, la marca InmoMaps y el software de la plataforma nos pertenecen. El contenido que tú publicas (fotos, descripciones) sigue siendo tuyo; al publicarlo nos das permiso para mostrarlo dentro de la plataforma con el fin de operar el servicio.</p>' +

      '<h2>8. Limitación de responsabilidad</h2>' +
      '<p>InmoMaps se ofrece "tal cual". No garantizamos que el servicio esté libre de errores o interrupciones, ni somos responsables de daños derivados de negociaciones, acuerdos o transacciones realizadas entre usuarios fuera de la plataforma.</p>' +

      '<h2>9. Cambios a estos términos</h2>' +
      '<p>Podemos actualizar este documento cuando el servicio cambie. Si los cambios son importantes, lo indicaremos dentro de la plataforma. El uso continuo de InmoMaps después de un cambio implica su aceptación.</p>' +

      '<h2>10. Ley aplicable</h2>' +
      '<p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.</p>' +

      '<h2>11. Contacto</h2>' +
      '<p>¿Dudas sobre estos términos? Escríbenos desde <a href="#/soporte" style="color:var(--color-primary);font-weight:700">Soporte y contacto</a>.</p>' +
      '</div>';

    root.innerHTML = content;
    c.mountChrome('explore');
    document.title = 'Términos y condiciones — InmoMaps';
  }

  window.App.views = window.App.views || {};
  window.App.views.terms = { render: render };
})();
