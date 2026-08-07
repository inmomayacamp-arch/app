// Configuración global de InmoMaps.
// Para ver el mapa interactivo, crea una cuenta gratuita en https://account.mapbox.com/
// y pega tu "Default public token" aquí abajo.
window.APP_CONFIG = {
  MAPBOX_TOKEN: "pk.eyJ1Ijoib3N3YWxkb2NoYWJsZTE5OTMiLCJhIjoiY21zZXZqODRqMDR0NjJ5b3N2dHJlZXFybCJ9.mc1Zc3tY4UWMmXK1qcgEoA",
  SUPABASE_URL: "https://ypmvyyzmxrwusapjxsrz.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwbXZ5eXpteHJ3dXNhcGp4c3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NzQ4NjcsImV4cCI6MjEwMTQ1MDg2N30.8BKlzAmv9O-S8JJhH5uj5djhAOjfYJxvw_Li3j7pXbw",
  DEFAULT_CENTER: [-90.5349, 19.8301], // Campeche, Camp.
  DEFAULT_ZOOM: 13,
  CITY_CENTERS: {
    campeche: { center: [-90.5349, 19.8301], zoom: 13, label: "San Francisco de Campeche", matchTokens: ["campeche", "san francisco"] },
    merida: { center: [-89.6237, 20.9674], zoom: 12, label: "Mérida", matchTokens: ["merida"] },
    carmen: { center: [-91.8299, 18.6459], zoom: 13, label: "Cd. del Carmen", matchTokens: ["carmen"] }
  },
  CURRENT_AGENT_SLUG: "oswaldochable"
};
