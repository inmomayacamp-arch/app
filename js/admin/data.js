// Configuración real de planes, compartida por el sitio público, el panel
// de agente y el panel admin (no son datos de prueba: son los planes reales
// de asesor, propietario y proveedor de servicios que usa la app en vivo).
(function () {
  "use strict";

  // Un solo plan de agente (antes había Básico/Profesional separados): todo
  // asesor paga lo mismo y tiene acceso a todas las herramientas, incluida
  // la Bolsa Compartida. priceAnnual es el precio de lista al año (se
  // muestra en la landing con el selector mensual/anual); featuredIncluded
  // es cuántas propiedades puede tener destacadas gratis al mismo tiempo.
  var PLANS = [
    {
      id: "asesor", name: "Plan Asesor", price: 299, priceAnnual: 2999, period: "mensual", limit: 15, featuredIncluded: 1,
      tagline: "Un solo plan, todo incluido — sin niveles que confundan.",
      features: [
        "Hasta 15 propiedades activas", "1 publicación destacada incluida", "Perfil profesional del agente",
        "Enlaces personalizados ilimitados", "Estadísticas completas de tus enlaces", "Clientes y seguimiento (CRM)",
        "Calendario de visitas y recordatorios", "Bolsa Compartida entre agentes", "Notificaciones en tiempo real",
        "Soporte"
      ]
    }
  ];

  // Plan simple para propietarios que solo quieren publicar una propiedad,
  // sin crear una cuenta de asesor ni acceder a un panel de trabajo.
  var OWNER_PLAN = {
    id: "propietario", name: "Publicación individual", price: 0, period: "1 mes", limit: 1,
    tagline: "Publica tu propiedad en venta o renta, gratis y sin necesidad de una cuenta de asesor.",
    features: [
      "1 propiedad publicada por 30 días, gratis", "Confirmas tu correo para activarla",
      "Aparece en el mapa y en las búsquedas", "Contacto directo por WhatsApp y llamadas"
    ],
    featuredAddon: { price: 100, period: "1 mes", label: "Destacar mi propiedad", description: "Aparece primero en los resultados de búsqueda durante 1 mes." }
  };

  // Plan para el directorio de servicios (notario, valuadores, arquitectos,
  // servicios, SOFOM): mismo precio que el plan de asesor, una sola ficha
  // por cuenta (no un panel de propiedades).
  var PROVIDER_PLAN = {
    id: "proveedor", name: "Directorio de servicios", price: 299, priceAnnual: 2999, period: "mensual", limit: 1,
    tagline: "Tu ficha en el directorio de servicios de InmoMaps.",
    features: [
      "Tu ficha en el directorio de servicios", "Aparece con pin propio en el mapa de Explorar",
      "Fotos y ubicación exacta", "Contacto directo por WhatsApp y llamadas", "Soporte"
    ]
  };

  window.App = window.App || {};
  window.App.admin = window.App.admin || {};
  window.App.admin.data = {
    PLANS: PLANS,
    OWNER_PLAN: OWNER_PLAN,
    PROVIDER_PLAN: PROVIDER_PLAN
  };
})();
