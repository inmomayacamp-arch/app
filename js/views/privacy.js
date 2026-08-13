// Vista "Aviso de privacidad": documento legal público, sin depender de sesión.
(function () {
  "use strict";

  var u = window.App.utils;
  var c = window.App.components;

  function render(params, root) {
    var content =
      '<div class="page-header">' +
      '  <a class="btn btn--icon" href="#/" aria-label="Volver">' + u.icon('chevronLeft', { size: 18 }) + '</a>' +
      '  <h1 class="page-header__title">Aviso de privacidad</h1>' +
      '</div>' +
      '<div class="legal-content">' +
      '<p class="legal-content__updated">Última actualización: 13 de agosto de 2026</p>' +

      '<div class="legal-content__notice">' + u.icon('flag', { size: 14 }) + ' Este documento es una base de trabajo conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). Antes de publicarlo como definitivo, hazlo revisar por un abogado especializado en protección de datos en México, y completa los datos de contacto del responsable que falten.</div>' +

      '<h2>1. Responsable del tratamiento de tus datos</h2>' +
      '<p>InmoMaps (en adelante, "el responsable") es el operador de esta plataforma y es responsable del tratamiento de tus datos personales conforme a este aviso. Puedes contactarnos a través de la sección <a href="#/soporte" style="color:var(--color-primary);font-weight:700">Soporte y contacto</a>.</p>' +

      '<h2>2. Datos personales que recabamos</h2>' +
      '<p>Dependiendo de cómo uses InmoMaps, podemos recabar:</p>' +
      '<ul>' +
      '<li><strong>Visitantes:</strong> ubicación aproximada (si la compartes voluntariamente para buscar propiedades cercanas), y los datos que escribas al contactar a un asesor o dejar una solicitud (nombre, teléfono, correo, mensaje).</li>' +
      '<li><strong>Asesores y propietarios:</strong> nombre, correo, teléfono, fotografía de perfil, ciudad, y los datos de las propiedades que publiques.</li>' +
      '<li><strong>Clientes que un asesor registra en su CRM:</strong> nombre, teléfono, correo y notas de seguimiento, capturados por el propio asesor.</li>' +
      '</ul>' +
      '<p>No solicitamos ni tratamos datos personales sensibles (salud, creencias religiosas, origen étnico, entre otros) para operar el servicio.</p>' +

      '<h2>3. Para qué usamos tus datos (finalidades)</h2>' +
      '<p><strong>Finalidades primarias</strong> (necesarias para el servicio):</p>' +
      '<ul>' +
      '<li>Mostrarte propiedades relevantes a tu ubicación o búsqueda.</li>' +
      '<li>Conectar tu solicitud de contacto con el asesor o propietario correspondiente.</li>' +
      '<li>Crear y administrar tu cuenta si eres asesor o propietario.</li>' +
      '<li>Dar seguimiento a solicitudes de soporte, reportes o dudas sobre tu cuenta.</li>' +
      '</ul>' +
      '<p><strong>Finalidades secundarias</strong> (puedes oponerte sin que afecte el servicio principal):</p>' +
      '<ul>' +
      '<li>Enviarte comunicaciones sobre mejoras del servicio o nuevas funciones.</li>' +
      '<li>Elaborar estadísticas internas de uso de la plataforma.</li>' +
      '</ul>' +

      '<h2>4. Con quién compartimos tus datos</h2>' +
      '<p>Cuando contactas a un asesor sobre una propiedad, tu nombre, teléfono y mensaje se comparten directamente con ese asesor para que pueda responderte — ese es el propósito del servicio. También usamos proveedores de infraestructura (como hospedaje de base de datos y almacenamiento de imágenes) que procesan datos en nuestro nombre bajo sus propias medidas de seguridad. No vendemos tus datos personales a terceros.</p>' +

      '<h2>5. Derechos ARCO</h2>' +
      '<p>Tienes derecho a Acceder, Rectificar y Cancelar tus datos personales, así como a Oponerte al uso de los mismos para finalidades secundarias ("derechos ARCO"). También puedes revocar tu consentimiento en cualquier momento.</p>' +
      '<p>Para ejercer estos derechos, escríbenos desde <a href="#/soporte" style="color:var(--color-primary);font-weight:700">Soporte y contacto</a> indicando tu nombre, el derecho que deseas ejercer y una forma de contactarte. Responderemos en un plazo razonable conforme a la ley aplicable.</p>' +

      '<h2>6. Conservación de datos</h2>' +
      '<p>Conservamos tus datos mientras tu cuenta esté activa o sea necesario para cumplir las finalidades de este aviso. Si solicitas la cancelación de tu cuenta, eliminaremos o anonimizaremos tus datos salvo que exista una obligación legal de conservarlos por más tiempo.</p>' +

      '<h2>7. Seguridad</h2>' +
      '<p>Aplicamos medidas técnicas y organizativas razonables para proteger tus datos contra pérdida, acceso no autorizado o uso indebido. Ningún sistema es 100% infalible, por lo que te recomendamos usar una contraseña única para tu cuenta.</p>' +

      '<h2>8. Cambios a este aviso</h2>' +
      '<p>Podemos actualizar este aviso de privacidad. Los cambios relevantes se indicarán dentro de la plataforma con la fecha de la última actualización visible arriba.</p>' +
      '</div>';

    root.innerHTML = content;
    c.mountChrome('explore');
    document.title = 'Aviso de privacidad — InmoMaps';
  }

  window.App.views = window.App.views || {};
  window.App.views.privacy = { render: render };
})();
