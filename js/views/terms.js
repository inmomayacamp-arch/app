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
      '<p class="legal-content__updated">Última actualización: 13 de agosto de 2026</p>' +

      '<div class="legal-content__notice">' + u.icon('flag', { size: 14 }) + ' Este documento es una base de trabajo. Antes de considerarlo definitivo, hazlo revisar por un abogado especializado en México — no sustituye asesoría legal profesional.</div>' +

      '<h2>1. Quiénes somos</h2>' +
      '<p>InmoMaps ("nosotros", "la plataforma") es un servicio en línea que permite a compradores y arrendatarios explorar propiedades inmobiliarias sobre un mapa interactivo, y a asesores inmobiliarios y propietarios publicar y administrar sus propiedades. Al usar InmoMaps, aceptas estos términos.</p>' +

      '<h2>2. Qué es InmoMaps (y qué no es)</h2>' +
      '<p>InmoMaps es un espacio de exhibición y contacto: mostramos propiedades publicadas por asesores y propietarios, y facilitamos que los interesados se comuniquen directamente con ellos por WhatsApp o llamada.</p>' +
      '<p><strong>InmoMaps no es parte de ninguna compraventa, renta o negociación.</strong> No somos inmobiliaria, no gestionamos pagos entre partes, no verificamos la titularidad legal de las propiedades publicadas y no garantizamos que una propiedad esté disponible, en las condiciones descritas o al precio anunciado. Toda negociación ocurre directamente entre el interesado y el asesor o propietario.</p>' +

      '<h2>3. Cuentas de usuario</h2>' +
      '<p>Cualquier persona puede explorar propiedades sin crear una cuenta. Para publicar propiedades se requiere una cuenta de asesor o de propietario individual, sujeta a un plan (básico, profesional o propietario) con sus propias características.</p>' +
      '<ul>' +
      '<li>Eres responsable de la información que registras y de mantener segura tu contraseña.</li>' +
      '<li>Las cuentas de asesor pueden requerir aprobación del equipo de InmoMaps antes de poder publicar.</li>' +
      '<li>Nos reservamos el derecho de suspender cuentas que incumplan estos términos.</li>' +
      '</ul>' +

      '<h2>4. Contenido que publicas</h2>' +
      '<p>Si publicas una propiedad, eres responsable de que la información (precio, características, fotos, ubicación) sea veraz y de que cuentes con autorización para ofrecerla en venta o renta. No está permitido publicar:</p>' +
      '<ul>' +
      '<li>Propiedades inexistentes, duplicadas o que no estén realmente disponibles.</li>' +
      '<li>Información falsa o engañosa sobre precio, superficie, ubicación o estado legal.</li>' +
      '<li>Contenido ofensivo, discriminatorio o que infrinja derechos de terceros (incluidas fotografías que no te pertenezcan).</li>' +
      '</ul>' +
      '<p>InmoMaps puede revisar, ocultar o eliminar publicaciones que incumplan lo anterior, con o sin previo aviso.</p>' +

      '<h2>5. Bolsa Compartida y colaboración entre asesores</h2>' +
      '<p>La función "Bolsa Compartida" permite que un asesor autorice a otros a ofrecer su propiedad a cambio de una comisión de colaboración que el propio asesor define. InmoMaps solo facilita la visibilidad de este acuerdo entre asesores; no participa en la negociación, el cobro ni el cumplimiento de la comisión pactada — eso es responsabilidad exclusiva de los asesores involucrados.</p>' +

      '<h2>6. Planes y pagos</h2>' +
      '<p>Algunos planes de asesor pueden tener costo. Los precios, periodicidad y método de cobro vigentes se muestran en la sección de Suscripción dentro del panel del asesor. Los pagos, cuando existan, se procesan a través de un proveedor externo; InmoMaps no almacena datos completos de tarjetas de pago.</p>' +

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
