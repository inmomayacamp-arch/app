// Configuración global de InmoMap.
// Para ver el mapa interactivo, crea una cuenta gratuita en https://account.mapbox.com/
// y pega tu "Default public token" aquí abajo.
window.APP_CONFIG = {
  MAPBOX_TOKEN: "pk.eyJ1Ijoib3N3YWxkb2NoYWJsZTE5OTMiLCJhIjoiY21zZXZqODRqMDR0NjJ5b3N2dHJlZXFybCJ9.mc1Zc3tY4UWMmXK1qcgEoA",
  DEFAULT_CENTER: [-90.5349, 19.8301], // Campeche, Camp.
  DEFAULT_ZOOM: 13,
  CITY_CENTERS: {
    campeche: { center: [-90.5349, 19.8301], zoom: 13, label: "Campeche" },
    merida: { center: [-89.6237, 20.9674], zoom: 12, label: "Mérida" }
  },
  CURRENT_AGENT_SLUG: "oswaldochable"
};
