// Datos de ejemplo (mock) para el prototipo de InmoMap.
// En una versión con backend real, este módulo se reemplazaría por llamadas a la API.
(function () {
  "use strict";

  var AGENTS = [
    {
      slug: "oswaldochable",
      name: "Oswaldo Chablé",
      photo: "https://i.pravatar.cc/160?img=12",
      title: "Asesor inmobiliario",
      bio: "Te ayudo a encontrar la propiedad ideal en Campeche. Asesoría personalizada en todo el proceso de compra, venta o renta.",
      whatsapp: "9811234567",
      phone: "9811234567",
      city: "Campeche",
      rating: 4.9,
      reviews: 128,
      yearsExperience: 7,
      clientsCount: 86,
      social: { facebook: "#", instagram: "#" }
    },
    {
      slug: "danielacanul",
      name: "Daniela Canul",
      photo: "https://i.pravatar.cc/160?img=47",
      title: "Asesora inmobiliaria",
      bio: "Especialista en propiedades residenciales en Mérida. 5 años ayudando a familias a encontrar su hogar ideal.",
      whatsapp: "9991234567",
      phone: "9991234567",
      city: "Mérida",
      rating: 4.8,
      reviews: 74,
      yearsExperience: 5,
      clientsCount: 52,
      social: { facebook: "#", instagram: "#" }
    }
  ];

  var PROPERTIES = [
    {
      id: "p1",
      featured: true,
      agentSlug: "oswaldochable",
      title: "Casa moderna en Fracc. Vista Alegre",
      type: "casa",
      operation: "venta",
      price: 2450000,
      city: "Campeche",
      neighborhood: "Vista Alegre",
      addressNote: "A 5 min del malecón",
      coords: [-90.5280, 19.8420],
      bedrooms: 3,
      bathrooms: 2.5,
      builtArea: 160,
      lotArea: 200,
      parking: 2,
      description: "Hermosa casa moderna con acabados de lujo, excelente ubicación, cerca de escuelas, plazas y avenidas principales. Cuenta con amplios espacios iluminados, cocina integral y jardín privado.",
      features: ["Alberca", "Cocina equipada", "A/C en todas las áreas", "Estacionamiento techado"],
      photos: [
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
      ],
      createdAt: "2026-07-20T10:00:00Z"
    },
    {
      id: "p2",
      featured: true,
      agentSlug: "oswaldochable",
      title: "Casa en San Román",
      type: "casa",
      operation: "venta",
      price: 1850000,
      city: "Campeche",
      neighborhood: "San Román",
      addressNote: "Cerca del centro histórico",
      coords: [-90.5420, 19.8360],
      bedrooms: 3,
      bathrooms: 2,
      builtArea: 120,
      lotArea: 150,
      parking: 1,
      description: "Casa familiar en una de las colonias más tradicionales de Campeche, a unos pasos de comercios y transporte público.",
      features: ["Patio trasero", "Cocina integral", "Cisterna"],
      photos: [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80"
      ],
      createdAt: "2026-07-18T10:00:00Z"
    },
    {
      id: "p3",
      featured: true,
      agentSlug: "oswaldochable",
      title: "Departamento amueblado en Lerma",
      type: "departamento",
      operation: "renta",
      price: 15000,
      city: "Campeche",
      neighborhood: "Lerma",
      addressNote: "Frente a zona comercial",
      coords: [-90.5510, 19.8115],
      bedrooms: 2,
      bathrooms: 1,
      builtArea: 80,
      lotArea: null,
      parking: 1,
      description: "Departamento totalmente amueblado, listo para habitar. Incluye internet y mantenimiento del edificio.",
      features: ["Amueblado", "Elevador", "Seguridad 24h"],
      photos: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"
      ],
      createdAt: "2026-07-25T10:00:00Z"
    },
    {
      id: "p4",
      featured: true,
      agentSlug: "oswaldochable",
      title: "Terreno en Dzitya",
      type: "terreno",
      operation: "venta",
      price: 850000,
      city: "Campeche",
      neighborhood: "Dzitya",
      addressNote: "Uso de suelo habitacional",
      coords: [-90.5610, 19.8480],
      bedrooms: null,
      bathrooms: null,
      builtArea: null,
      lotArea: 300,
      parking: null,
      description: "Terreno plano, listo para construir, con todos los servicios sobre la calle principal.",
      features: ["Servicios sobre calle", "Uso habitacional"],
      photos: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80"
      ],
      createdAt: "2026-07-10T10:00:00Z"
    },
    {
      id: "p5",
      featured: true,
      agentSlug: "oswaldochable",
      title: "Casa en Fracc. Malecón",
      type: "casa",
      operation: "venta",
      price: 3500000,
      city: "Campeche",
      neighborhood: "Malecón",
      addressNote: "Vista al mar",
      coords: [-90.5195, 19.8455],
      bedrooms: 4,
      bathrooms: 3.5,
      builtArea: 220,
      lotArea: 260,
      parking: 3,
      description: "Residencia de lujo con vista al malecón de Campeche, acabados premium y área social amplia.",
      features: ["Vista al mar", "Alberca", "Roof garden", "Cuarto de servicio"],
      photos: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80"
      ],
      createdAt: "2026-07-28T10:00:00Z"
    },
    {
      id: "p6",
      featured: true,
      agentSlug: "oswaldochable",
      title: "Departamento en Centro Histórico",
      type: "departamento",
      operation: "renta",
      price: 12000,
      city: "Campeche",
      neighborhood: "Centro Histórico",
      addressNote: "A pie del Zócalo",
      coords: [-90.5347, 19.8451],
      bedrooms: 2,
      bathrooms: 1,
      builtArea: 70,
      lotArea: null,
      parking: 0,
      description: "Departamento con encanto colonial, remodelado, ideal para vivir en el corazón de la ciudad.",
      features: ["Balcón", "Remodelado", "Zona peatonal"],
      photos: [
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80"
      ],
      createdAt: "2026-07-22T10:00:00Z"
    },
    {
      id: "p7",
      featured: false,
      agentSlug: "oswaldochable",
      title: "Local comercial en Av. López Mateos",
      type: "local",
      operation: "renta",
      price: 7500,
      city: "Campeche",
      neighborhood: "Centro",
      addressNote: "Avenida principal, alto tráfico",
      coords: [-90.5390, 19.8285],
      bedrooms: null,
      bathrooms: 1,
      builtArea: 60,
      lotArea: null,
      parking: 2,
      description: "Local en planta baja sobre avenida principal, ideal para comercio o servicios.",
      features: ["Vitrina a la calle", "Baño propio"],
      photos: [
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80"
      ],
      createdAt: "2026-07-15T10:00:00Z"
    },
    {
      id: "p8",
      featured: false,
      agentSlug: "oswaldochable",
      title: "Oficina en corporativo Pedro Sainz",
      type: "oficina",
      operation: "venta",
      price: 1200000,
      city: "Campeche",
      neighborhood: "Buenavista",
      addressNote: "Edificio corporativo",
      coords: [-90.5250, 19.8365],
      bedrooms: null,
      bathrooms: 1,
      builtArea: 45,
      lotArea: null,
      parking: 1,
      description: "Oficina en edificio corporativo con recepción compartida, ideal para despachos o startups.",
      features: ["Recepción compartida", "Sala de juntas común"],
      photos: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80"
      ],
      createdAt: "2026-07-12T10:00:00Z"
    },
    {
      id: "p9",
      featured: true,
      sharing: { enabled: true, totalCommission: 5, collaboratorCommission: 50, fixedAmount: null, conditions: "Solo clientes nuevos.", expiresAt: "2026-12-31T00:00:00Z", visibility: "todos", selectedAgentSlugs: [] },
      agentSlug: "danielacanul",
      title: "Casa en Fracc. Las Américas",
      type: "casa",
      operation: "venta",
      price: 2800000,
      city: "Mérida",
      neighborhood: "Las Américas",
      addressNote: "Cerca de Plaza Las Américas",
      coords: [-89.6120, 20.9720],
      bedrooms: 3,
      bathrooms: 2.5,
      builtArea: 170,
      lotArea: 200,
      parking: 2,
      description: "Casa moderna en fraccionamiento consolidado, a minutos de centros comerciales y colegios.",
      features: ["Cocina integral", "Jardín", "A/C"],
      photos: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80"
      ],
      createdAt: "2026-07-19T10:00:00Z"
    },
    {
      id: "p10",
      featured: true,
      sharing: { enabled: true, totalCommission: 4, collaboratorCommission: 50, fixedAmount: null, conditions: "", expiresAt: null, visibility: "invitacion", selectedAgentSlugs: [] },
      agentSlug: "danielacanul",
      title: "Departamento en Altabrisa",
      type: "departamento",
      operation: "renta",
      price: 18000,
      city: "Mérida",
      neighborhood: "Altabrisa",
      addressNote: "Junto a zona hospitalaria",
      coords: [-89.5860, 20.9950],
      bedrooms: 2,
      bathrooms: 2,
      builtArea: 95,
      lotArea: null,
      parking: 1,
      description: "Departamento en torre con amenidades, alberca y gimnasio, en una de las zonas más exclusivas de Mérida.",
      features: ["Alberca común", "Gimnasio", "Seguridad 24h"],
      photos: [
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=80"
      ],
      createdAt: "2026-07-24T10:00:00Z"
    },
    {
      id: "p11",
      featured: true,
      agentSlug: "danielacanul",
      title: "Terreno en Cholul",
      type: "terreno",
      operation: "venta",
      price: 1400000,
      city: "Mérida",
      neighborhood: "Cholul",
      addressNote: "Zona de plusvalía en crecimiento",
      coords: [-89.5650, 21.0180],
      bedrooms: null,
      bathrooms: null,
      builtArea: null,
      lotArea: 400,
      parking: null,
      description: "Terreno en zona norte de Mérida, ideal para inversión residencial.",
      features: ["Zona en crecimiento", "Cerca de Periférico"],
      photos: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80"
      ],
      createdAt: "2026-07-08T10:00:00Z"
    },
    {
      id: "p12",
      featured: true,
      agentSlug: "danielacanul",
      title: "Casa en San Ramón Norte",
      type: "casa",
      operation: "renta",
      price: 22000,
      city: "Mérida",
      neighborhood: "San Ramón Norte",
      addressNote: "Colonia residencial tranquila",
      coords: [-89.6300, 20.9800],
      bedrooms: 3,
      bathrooms: 3,
      builtArea: 190,
      lotArea: 220,
      parking: 2,
      description: "Casa amplia en colonia residencial, ideal para familias, cercana a escuelas privadas.",
      features: ["Jardín amplio", "Cuarto de TV", "Cocina equipada"],
      photos: [
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80"
      ],
      createdAt: "2026-07-27T10:00:00Z"
    }
  ];

  var CLIENT_LINKS = [
    {
      agentSlug: "oswaldochable",
      clientSlug: "familia-garcia",
      clientLabel: "Familia García",
      message: "Hola, les comparto estas opciones que seleccioné pensando en lo que buscan cerca del malecón.",
      propertyIds: ["p1", "p2", "p5", "p6", "p4"],
      createdAt: "2026-07-26T15:00:00Z",
      stats: {
        views: 32,
        viewsDelta: 12,
        avgTimeMinutes: 4.58,
        avgTimeDelta: 8,
        propertiesViewed: 18,
        propertiesViewedDelta: 15,
        contacts: 3,
        contactsDelta: 50,
        lastVisit: "2026-08-02T18:20:00Z",
        returningVisits: 4,
        mostViewed: [
          { propertyId: "p1", views: 8 },
          { propertyId: "p2", views: 5 },
          { propertyId: "p4", views: 3 }
        ],
        favoritePropertyIds: ["p1", "p4"]
      }
    }
  ];

  function getAllAgents() {
    var s = window.App.state;
    return (s && s.agents) ? s.agents.registered() : [];
  }

  window.App = window.App || {};
  window.App.data = {
    AGENTS: AGENTS,
    PROPERTIES: PROPERTIES,
    CLIENT_LINKS: CLIENT_LINKS,
    getAllAgents: getAllAgents,
    getAgent: function (slug) {
      return getAllAgents().filter(function (a) { return a.slug === slug; })[0] || null;
    },
    getProperty: function (id) {
      return PROPERTIES.filter(function (p) { return p.id === id; })[0] || null;
    },
    getPropertiesByAgent: function (slug) {
      return PROPERTIES.filter(function (p) { return p.agentSlug === slug; });
    },
    getClientLink: function (agentSlug, clientSlug) {
      return CLIENT_LINKS.filter(function (l) { return l.agentSlug === agentSlug && l.clientSlug === clientSlug; })[0] || null;
    },
    getClientLinksByAgent: function (slug) {
      return CLIENT_LINKS.filter(function (l) { return l.agentSlug === slug; });
    }
  };
})();
