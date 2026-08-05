// Datos de ejemplo (mock) para el panel de administración (back office).
(function () {
  "use strict";

  var USERS = [
    { id: "u1", name: "María Fernanda López", email: "maria.lopez@example.com", phone: "9811112222", role: "usuario", status: "activo", city: "Campeche", createdAt: "2026-06-02T10:00:00Z", lastActivity: "2026-08-02T09:00:00Z" },
    { id: "u2", name: "Juan Carlos Pérez", email: "juan.perez@example.com", phone: "9811113333", role: "usuario", status: "activo", city: "Mérida", createdAt: "2026-06-10T10:00:00Z", lastActivity: "2026-08-01T09:00:00Z" },
    { id: "u3", name: "Familia García", email: "familia.garcia@example.com", phone: "9811114444", role: "usuario", status: "activo", city: "Campeche", createdAt: "2026-07-01T10:00:00Z", lastActivity: "2026-08-02T18:20:00Z" },
    { id: "u4", name: "Roberto Uc Mena", email: "roberto.uc@example.com", phone: "9991115555", role: "propietario", status: "activo", city: "Mérida", createdAt: "2026-05-20T10:00:00Z", lastActivity: "2026-07-29T09:00:00Z" },
    { id: "u5", name: "Ana Sofía Dzul", email: "ana.dzul@example.com", phone: "9991116666", role: "usuario", status: "suspendido", city: "Mérida", createdAt: "2026-04-15T10:00:00Z", lastActivity: "2026-06-10T09:00:00Z" },
    { id: "u6", name: "Pedro Interián", email: "pedro.interian@example.com", phone: "9811117777", role: "propietario", status: "inactivo", city: "Campeche", createdAt: "2026-03-11T10:00:00Z", lastActivity: "2026-05-02T09:00:00Z" }
  ];

  var AGENT_ADMIN_INFO = {
    oswaldochable: { status: "activo", plan: "profesional", planExpiresAt: "2026-09-04T00:00:00Z", documentsSubmitted: true, joinedAt: "2025-08-01T00:00:00Z" },
    danielacanul: { status: "activo", plan: "basico", planExpiresAt: "2026-08-20T00:00:00Z", documentsSubmitted: true, joinedAt: "2025-11-15T00:00:00Z" }
  };

  var PENDING_AGENTS = [
    { slug: "carlosmendez", name: "Carlos Méndez", email: "carlos.mendez@example.com", phone: "9811118888", city: "Campeche", requestedAt: "2026-08-01T12:00:00Z", documentsSubmitted: true }
  ];

  var PENDING_PROPERTIES = [
    {
      id: "pend-1", agentSlug: "oswaldochable", title: "Departamento en Fracc. Costa Dorada",
      type: "departamento", operation: "renta", price: 9500, city: "Campeche", neighborhood: "Costa Dorada",
      photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80"],
      submittedAt: "2026-08-03T16:00:00Z"
    },
    {
      id: "pend-2", agentSlug: "danielacanul", title: "Terreno en Temozón Norte",
      type: "terreno", operation: "venta", price: 1750000, city: "Mérida", neighborhood: "Temozón Norte",
      photos: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80"],
      submittedAt: "2026-08-02T11:30:00Z"
    }
  ];

  var PLANS = [
    {
      id: "basico", name: "Plan Básico", price: 299, period: "mensual", limit: 10,
      tagline: "Todo lo que necesitas para comenzar y profesionalizar tu negocio.",
      features: [
        "Hasta 10 propiedades activas", "Perfil profesional del agente", "Enlaces personalizados ilimitados",
        "Estadísticas de tus enlaces", "Clientes y seguimiento (CRM básico)", "Calendario de visitas y recordatorios",
        "Notificaciones en tiempo real", "Contacto directo por WhatsApp"
      ]
    },
    {
      id: "profesional", name: "Plan Profesional", price: 499, period: "mensual", limit: null,
      tagline: "Potencia total para llevar tu negocio al siguiente nivel.",
      features: [
        "Propiedades ilimitadas", "Bolsa Compartida entre agentes", "Compartir comisión con otros agentes",
        "Publicaciones destacadas", "Aparecer primero en búsquedas", "Estadísticas completas y detalladas",
        "Publicidad y promociones de propiedades", "Soporte prioritario"
      ]
    }
  ];

  // Plan simple para propietarios que solo quieren publicar una propiedad,
  // sin crear una cuenta de asesor ni acceder a un panel de trabajo.
  var OWNER_PLAN = {
    id: "propietario", name: "Publicación individual", price: 100, period: "1 mes", limit: 1,
    tagline: "Publica tu propiedad en venta o renta, sin necesidad de una cuenta de asesor.",
    features: [
      "1 propiedad publicada por 30 días", "Aparece en el mapa y en las búsquedas",
      "Contacto directo por WhatsApp y llamadas", "Sin necesidad de crear un negocio"
    ],
    featuredAddon: { price: 200, period: "1 mes", label: "Destacar mi propiedad", description: "Aparece primero en los resultados de búsqueda durante 1 mes." }
  };

  var COUPONS = [
    { code: "BIENVENIDA20", discountPercent: 20, active: true, uses: 14 },
    { code: "MESGRATIS", discountPercent: 100, active: false, uses: 3 }
  ];

  var PAYMENTS = [
    { id: "pay1", agentSlug: "oswaldochable", plan: "profesional", amount: 499, status: "pagado", method: "Tarjeta ****4242", date: "2026-08-01T09:00:00Z" },
    { id: "pay2", agentSlug: "danielacanul", plan: "basico", amount: 299, status: "pagado", method: "Tarjeta ****1187", date: "2026-08-01T09:00:00Z" },
    { id: "pay3", agentSlug: "danielacanul", plan: "basico", amount: 299, status: "pendiente", method: "Transferencia", date: "2026-08-04T09:00:00Z" },
    { id: "pay4", agentSlug: "oswaldochable", plan: "profesional", amount: 499, status: "pagado", method: "Tarjeta ****4242", date: "2026-07-01T09:00:00Z" },
    { id: "pay5", agentSlug: "carlosmendez", plan: "basico", amount: 299, status: "rechazado", method: "Tarjeta ****9021", date: "2026-08-02T09:00:00Z" },
    { id: "pay6", agentSlug: "oswaldochable", plan: "profesional", amount: 499, status: "reembolsado", method: "Tarjeta ****4242", date: "2026-06-01T09:00:00Z" }
  ];

  var CITIES = [
    { id: "campeche", name: "Campeche", state: "Campeche", active: true, zones: ["Centro Histórico", "Vista Alegre", "San Román", "Lerma", "Malecón", "Buenavista", "Dzitya"] },
    { id: "merida", name: "Mérida", state: "Yucatán", active: true, zones: ["Las Américas", "Altabrisa", "Cholul", "San Ramón Norte", "Temozón Norte"] },
    { id: "cdmx", name: "Ciudad de México", state: "CDMX", active: false, zones: [] }
  ];

  var REPORTS = [
    { id: "r1", type: "foto", targetLabel: "Casa moderna en Fracc. Vista Alegre", reporterNote: "La foto no corresponde a la propiedad", status: "pendiente", createdAt: "2026-08-03T10:00:00Z" },
    { id: "r2", type: "info_falsa", targetLabel: "Departamento en Altabrisa", reporterNote: "El precio anunciado no coincide con lo que cobra el asesor", status: "pendiente", createdAt: "2026-08-02T15:00:00Z" },
    { id: "r3", type: "spam", targetLabel: "Usuario: carlosmendez", reporterNote: "Envía mensajes repetidos por WhatsApp", status: "pendiente", createdAt: "2026-08-01T08:00:00Z" },
    { id: "r4", type: "duplicado", targetLabel: "Casa en San Román", reporterNote: "Publicada dos veces por el mismo asesor", status: "resuelto", createdAt: "2026-07-28T08:00:00Z" }
  ];

  var ADS = [
    { id: "ad1", title: "Banner: Estrena tu casa en Vista Alegre", placement: "home_top", city: "Campeche", active: true, startDate: "2026-08-01", endDate: "2026-08-31" },
    { id: "ad2", title: "Propiedad patrocinada: Casa en Fracc. Malecón", placement: "sponsored", city: "Campeche", active: true, startDate: "2026-07-15", endDate: "2026-08-15" },
    { id: "ad3", title: "Banner: Planes para agentes -20%", placement: "home_top", city: "Todas", active: false, startDate: "2026-06-01", endDate: "2026-06-30" }
  ];

  var NOTIFICATIONS_LOG = [
    { id: "n1", channel: "push", audience: "Todos los usuarios", subject: "Nuevas propiedades en Campeche", sentAt: "2026-08-01T09:00:00Z" },
    { id: "n2", channel: "correo", audience: "Agentes", subject: "Recordatorio: renueva tu plan", sentAt: "2026-07-28T09:00:00Z" }
  ];

  var DEFAULT_SETTINGS = {
    platformName: "InmoMap",
    tagline: "La plataforma inmobiliaria donde el mapa es el centro de la experiencia.",
    logoUrl: "",
    primaryColor: "#DC2626",
    facebook: "https://facebook.com/inmomap",
    instagram: "https://instagram.com/inmomap",
    supportEmail: "soporte@inmomap.mx",
    supportPhone: "9811234567",
    termsText: "Términos y condiciones de InmoMap (texto de ejemplo para el prototipo).",
    privacyText: "Política de privacidad de InmoMap (texto de ejemplo para el prototipo)."
  };

  var ROLES = [
    { id: "owner", name: "Propietario", description: "Acceso total al sistema" },
    { id: "moderador", name: "Moderador", description: "Aprueba propiedades y agentes, revisa reportes" },
    { id: "soporte", name: "Soporte", description: "Gestiona usuarios y responde tickets" }
  ];

  var ADMIN_USERS = [
    { id: "a1", name: "Oswaldo (Dueño)", email: "admin@inmomap.mx", role: "owner" },
    { id: "a2", name: "Equipo de moderación", email: "moderacion@inmomap.mx", role: "moderador" }
  ];

  window.App = window.App || {};
  window.App.admin = window.App.admin || {};
  window.App.admin.data = {
    USERS: USERS,
    AGENT_ADMIN_INFO: AGENT_ADMIN_INFO,
    PENDING_AGENTS: PENDING_AGENTS,
    PENDING_PROPERTIES: PENDING_PROPERTIES,
    PLANS: PLANS,
    OWNER_PLAN: OWNER_PLAN,
    COUPONS: COUPONS,
    PAYMENTS: PAYMENTS,
    CITIES: CITIES,
    REPORTS: REPORTS,
    ADS: ADS,
    NOTIFICATIONS_LOG: NOTIFICATIONS_LOG,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    ROLES: ROLES,
    ADMIN_USERS: ADMIN_USERS,
    DEMO_LOGIN: { email: "admin@inmomap.mx", password: "admin123" }
  };
})();
