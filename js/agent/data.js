// Datos de ejemplo (mock) para el panel del asesor: clientes (CRM), calendario,
// notificaciones y conversaciones. Sembrados para la cuenta demo "oswaldochable".
(function () {
  "use strict";

  var CLIENTS = [
    {
      id: "c1", agentSlug: "oswaldochable", name: "Familia García", phone: "9811114444", email: "familia.garcia@example.com",
      budget: 2800000, notes: "Buscan casa con alberca cerca del malecón. Presupuesto flexible +10%.",
      status: "activo", createdAt: "2026-07-20T10:00:00Z",
      activity: [
        { type: "llamada", note: "Primer contacto, interesados en Vista Alegre", date: "2026-07-20T10:00:00Z" },
        { type: "visita", note: "Visita a Casa moderna en Fracc. Vista Alegre", date: "2026-07-25T16:00:00Z" },
        { type: "seguimiento", note: "Enviar 2 opciones más esta semana", date: "2026-08-01T09:00:00Z" }
      ],
      linkedClientSlug: "familia-garcia"
    },
    {
      id: "c2", agentSlug: "oswaldochable", name: "Roberto Uc Mena", phone: "9991115555", email: "roberto.uc@example.com",
      budget: 1500000, notes: "Quiere invertir en terreno para construir después.",
      status: "activo", createdAt: "2026-07-15T10:00:00Z",
      activity: [
        { type: "llamada", note: "Preguntó por terrenos en Dzitya", date: "2026-07-15T10:00:00Z" }
      ],
      linkedClientSlug: null
    },
    {
      id: "c3", agentSlug: "oswaldochable", name: "Ana Sofía Dzul", phone: "9991116666", email: "ana.dzul@example.com",
      budget: 15000, notes: "Renta departamento amueblado, necesita mudarse antes de fin de mes.",
      status: "cerrado", createdAt: "2026-06-01T10:00:00Z",
      activity: [
        { type: "visita", note: "Visitó depto en Lerma, le gustó", date: "2026-06-05T10:00:00Z" },
        { type: "seguimiento", note: "Firmó contrato de renta", date: "2026-06-10T10:00:00Z" }
      ],
      linkedClientSlug: null
    }
  ];

  var CALENDAR_EVENTS = [
    { id: "ev1", agentSlug: "oswaldochable", type: "visita", title: "Visita con Familia García", clientId: "c1", date: "2026-08-06T17:00:00Z", done: false },
    { id: "ev2", agentSlug: "oswaldochable", type: "llamada", title: "Llamada de seguimiento a Roberto Uc", clientId: "c2", date: "2026-08-05T13:00:00Z", done: false },
    { id: "ev3", agentSlug: "oswaldochable", type: "recordatorio", title: "Renovar publicación de Casa en San Román", clientId: null, date: "2026-08-08T09:00:00Z", done: false },
    { id: "ev4", agentSlug: "oswaldochable", type: "tarea", title: "Tomar fotos nuevas del Terreno en Dzitya", clientId: null, date: "2026-08-04T09:00:00Z", done: true }
  ];

  var NOTIFICATIONS = [
    { id: "an1", agentSlug: "oswaldochable", type: "visita", text: "Familia García visitó tu enlace personalizado", createdAt: "2026-08-02T18:20:00Z", read: false },
    { id: "an2", agentSlug: "oswaldochable", type: "favorito", text: "Un cliente marcó como favorita: Casa moderna en Fracc. Vista Alegre", createdAt: "2026-08-02T18:10:00Z", read: false },
    { id: "an3", agentSlug: "oswaldochable", type: "whatsapp", text: "Nuevo clic en WhatsApp desde Casa en San Román", createdAt: "2026-08-01T12:00:00Z", read: true },
    { id: "an4", agentSlug: "oswaldochable", type: "suscripcion", text: "Tu plan Profesional se renueva en 30 días", createdAt: "2026-07-30T09:00:00Z", read: true }
  ];

  var CONVERSATIONS = [
    {
      id: "conv1", agentSlug: "oswaldochable", clientId: "c1", clientName: "Familia García",
      messages: [
        { from: "cliente", text: "Hola, nos interesa la casa de Vista Alegre, ¿sigue disponible?", at: "2026-08-01T10:00:00Z" },
        { from: "asesor", text: "¡Hola! Sí, sigue disponible. ¿Quieren agendar una visita esta semana?", at: "2026-08-01T10:05:00Z" },
        { from: "cliente", text: "Sí, el sábado por la tarde nos funciona", at: "2026-08-01T10:10:00Z" }
      ]
    }
  ];

  // --- Bolsa Inmobiliaria Compartida (solo Plan Profesional) ---
  var COLLABORATIONS = [
    {
      id: "col1", propertyId: "p9", ownerSlug: "danielacanul", collaboratorSlug: "oswaldochable",
      status: "activa", requestStatus: "aprobada", clientId: null, createdAt: "2026-07-29T10:00:00Z",
      sentCount: 2, viewsCount: 14, contactsCount: 1, visitsScheduled: 1,
      history: [{ action: "Agregada al catálogo", date: "2026-07-29T10:00:00Z" }]
    }
  ];

  var SHARE_REQUESTS = [];

  var SETTLEMENTS = [];

  window.App.agent = window.App.agent || {};
  window.App.agent.data = {
    CLIENTS: CLIENTS,
    CALENDAR_EVENTS: CALENDAR_EVENTS,
    NOTIFICATIONS: NOTIFICATIONS,
    CONVERSATIONS: CONVERSATIONS,
    COLLABORATIONS: COLLABORATIONS,
    SHARE_REQUESTS: SHARE_REQUESTS,
    SETTLEMENTS: SETTLEMENTS
  };
})();
