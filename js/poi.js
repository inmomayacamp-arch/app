// Puntos de interés cercanos a una propiedad: usa la API Tilequery de Mapbox
// (incluida con el mismo token del mapa) para encontrar escuelas, hospitales,
// supermercados, parques, bancos, centros comerciales y transporte público.
(function () {
  "use strict";

  var CATEGORY_MAP = [
    { key: "escuelas", label: "Escuelas", icon: "briefcase", classes: ["school", "college", "university"] },
    { key: "salud", label: "Hospitales y salud", icon: "shield", classes: ["hospital", "medical", "pharmacy", "clinic"] },
    { key: "super", label: "Supermercados", icon: "store", classes: ["grocery", "supermarket", "convenience"] },
    { key: "parques", label: "Parques", icon: "map", classes: ["park", "garden"] },
    { key: "bancos", label: "Bancos", icon: "dollar", classes: ["bank", "atm"] },
    { key: "centros", label: "Centros comerciales", icon: "grid", classes: ["shopping", "mall"] },
    { key: "transporte", label: "Transporte público", icon: "locate", classes: ["bus", "rail", "airport"] }
  ];

  function categoryFor(cls) {
    for (var i = 0; i < CATEGORY_MAP.length; i++) {
      if (CATEGORY_MAP[i].classes.indexOf(cls) !== -1) return CATEGORY_MAP[i];
    }
    return null;
  }

  async function fetchNearby(coords, radiusMeters) {
    var token = window.APP_CONFIG.MAPBOX_TOKEN;
    if (!token || !coords) return [];
    var url = "https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/" + coords[0] + "," + coords[1] +
      ".json?radius=" + (radiusMeters || 1500) + "&limit=50&layers=poi_label&access_token=" + token;
    try {
      var res = await fetch(url);
      if (!res.ok) return [];
      var data = await res.json();
      var byCategory = {};
      (data.features || []).forEach(function (f) {
        var props = f.properties || {};
        var cat = categoryFor(props.class);
        if (!cat || !props.name) return;
        byCategory[cat.key] = byCategory[cat.key] || { label: cat.label, icon: cat.icon, items: [] };
        if (byCategory[cat.key].items.indexOf(props.name) === -1 && byCategory[cat.key].items.length < 4) {
          byCategory[cat.key].items.push(props.name);
        }
      });
      return CATEGORY_MAP.map(function (c) { return byCategory[c.key]; }).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  window.App.poi = { fetchNearby: fetchNearby };
})();
