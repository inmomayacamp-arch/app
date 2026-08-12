// Catálogo de estados y ciudades de México para el selector de ubicación
// (Explorar, Propiedades, filtro, y el paso "Ubicación" de publicar).
// Es un catálogo curado (capital + algunas ciudades conocidas por estado),
// no un padrón oficial exhaustivo: coordenadas a nivel "centro de la
// ciudad", suficientes para centrar el mapa, no para límites precisos.
// matchTokens sirve para el filtro por coincidencia parcial contra el texto
// libre que el asesor ya escribe en city/municipality (ver u.matchesLocation
// en utils.js) — Campeche/Cd. del Carmen/Mérida conservan exactamente las
// mismas claves, coordenadas y matchTokens que ya tenían en CITY_CENTERS,
// porque ya hay propiedades reales publicadas apuntando a esas 3.
window.APP_CONFIG.MEXICO_STATES = {
  aguascalientes: {
    label: "Aguascalientes", center: [-102.2916, 21.8853], zoom: 7,
    cities: {
      aguascalientes_city: { label: "Aguascalientes", center: [-102.2916, 21.8853], zoom: 13, matchTokens: ["aguascalientes"] }
    }
  },
  baja_california: {
    label: "Baja California", center: [-115.4523, 32.6245], zoom: 6,
    cities: {
      mexicali: { label: "Mexicali", center: [-115.4523, 32.6245], zoom: 12, matchTokens: ["mexicali"] },
      tijuana: { label: "Tijuana", center: [-117.0382, 32.5149], zoom: 12, matchTokens: ["tijuana"] },
      ensenada: { label: "Ensenada", center: [-116.6056, 31.8667], zoom: 12, matchTokens: ["ensenada"] }
    }
  },
  baja_california_sur: {
    label: "Baja California Sur", center: [-110.3128, 24.1426], zoom: 6,
    cities: {
      la_paz: { label: "La Paz", center: [-110.3128, 24.1426], zoom: 12, matchTokens: ["la paz"] },
      los_cabos: { label: "Los Cabos", center: [-109.9167, 22.8905], zoom: 12, matchTokens: ["cabos", "cabo san lucas"] }
    }
  },
  campeche: {
    label: "Campeche", center: [-90.5349, 19.8301], zoom: 7,
    cities: {
      campeche_city: { label: "San Francisco de Campeche", center: [-90.5349, 19.8301], zoom: 13, matchTokens: ["campeche", "san francisco"] },
      carmen: { label: "Cd. del Carmen", center: [-91.8299, 18.6459], zoom: 13, matchTokens: ["carmen"] },
      champoton: { label: "Champotón", center: [-90.7233, 19.3505], zoom: 13, matchTokens: ["champoton"] }
    }
  },
  chiapas: {
    label: "Chiapas", center: [-93.1156, 16.7516], zoom: 7,
    cities: {
      tuxtla_gutierrez: { label: "Tuxtla Gutiérrez", center: [-93.1156, 16.7516], zoom: 12, matchTokens: ["tuxtla"] },
      san_cristobal: { label: "San Cristóbal de las Casas", center: [-92.6376, 16.7370], zoom: 13, matchTokens: ["san cristobal"] },
      tapachula: { label: "Tapachula", center: [-92.2569, 14.9036], zoom: 12, matchTokens: ["tapachula"] }
    }
  },
  chihuahua: {
    label: "Chihuahua", center: [-106.0691, 28.6353], zoom: 6,
    cities: {
      chihuahua_city: { label: "Chihuahua", center: [-106.0691, 28.6353], zoom: 12, matchTokens: ["chihuahua"] },
      ciudad_juarez: { label: "Ciudad Juárez", center: [-106.4245, 31.6904], zoom: 12, matchTokens: ["juarez"] }
    }
  },
  coahuila: {
    label: "Coahuila", center: [-101.0053, 25.4232], zoom: 6,
    cities: {
      saltillo: { label: "Saltillo", center: [-101.0053, 25.4232], zoom: 12, matchTokens: ["saltillo"] },
      torreon: { label: "Torreón", center: [-103.4068, 25.5428], zoom: 12, matchTokens: ["torreon"] },
      monclova: { label: "Monclova", center: [-101.4212, 26.9078], zoom: 12, matchTokens: ["monclova"] }
    }
  },
  colima: {
    label: "Colima", center: [-103.7241, 19.2433], zoom: 8,
    cities: {
      colima_city: { label: "Colima", center: [-103.7241, 19.2433], zoom: 13, matchTokens: ["colima"] },
      manzanillo: { label: "Manzanillo", center: [-104.3186, 19.1138], zoom: 12, matchTokens: ["manzanillo"] }
    }
  },
  cdmx: {
    label: "Ciudad de México", center: [-99.1332, 19.4326], zoom: 10,
    cities: {
      cdmx_city: { label: "Ciudad de México", center: [-99.1332, 19.4326], zoom: 11, matchTokens: ["ciudad de mexico", "cdmx", "df"] }
    }
  },
  durango: {
    label: "Durango", center: [-104.6532, 24.0277], zoom: 6,
    cities: {
      durango_city: { label: "Durango", center: [-104.6532, 24.0277], zoom: 12, matchTokens: ["durango"] },
      gomez_palacio: { label: "Gómez Palacio", center: [-103.4967, 25.5672], zoom: 12, matchTokens: ["gomez palacio"] }
    }
  },
  guanajuato: {
    label: "Guanajuato", center: [-101.2574, 21.0190], zoom: 7,
    cities: {
      guanajuato_city: { label: "Guanajuato", center: [-101.2574, 21.0190], zoom: 13, matchTokens: ["guanajuato"] },
      leon: { label: "León", center: [-101.6740, 21.1250], zoom: 12, matchTokens: ["leon"] },
      irapuato: { label: "Irapuato", center: [-101.3563, 20.6767], zoom: 12, matchTokens: ["irapuato"] }
    }
  },
  guerrero: {
    label: "Guerrero", center: [-99.5009, 17.5514], zoom: 7,
    cities: {
      chilpancingo: { label: "Chilpancingo", center: [-99.5009, 17.5514], zoom: 12, matchTokens: ["chilpancingo"] },
      acapulco: { label: "Acapulco", center: [-99.8901, 16.8531], zoom: 12, matchTokens: ["acapulco"] }
    }
  },
  hidalgo: {
    label: "Hidalgo", center: [-98.7591, 20.1011], zoom: 7,
    cities: {
      pachuca: { label: "Pachuca", center: [-98.7591, 20.1011], zoom: 12, matchTokens: ["pachuca"] },
      tulancingo: { label: "Tulancingo", center: [-98.3667, 20.0833], zoom: 12, matchTokens: ["tulancingo"] }
    }
  },
  jalisco: {
    label: "Jalisco", center: [-103.3496, 20.6597], zoom: 7,
    cities: {
      guadalajara: { label: "Guadalajara", center: [-103.3496, 20.6597], zoom: 12, matchTokens: ["guadalajara"] },
      zapopan: { label: "Zapopan", center: [-103.3947, 20.7236], zoom: 12, matchTokens: ["zapopan"] },
      puerto_vallarta: { label: "Puerto Vallarta", center: [-105.2253, 20.6534], zoom: 12, matchTokens: ["vallarta"] }
    }
  },
  edomex: {
    label: "Estado de México", center: [-99.6532, 19.2926], zoom: 8,
    cities: {
      toluca: { label: "Toluca", center: [-99.6532, 19.2926], zoom: 12, matchTokens: ["toluca"] },
      ecatepec: { label: "Ecatepec", center: [-99.0600, 19.6018], zoom: 12, matchTokens: ["ecatepec"] },
      naucalpan: { label: "Naucalpan", center: [-99.2394, 19.4772], zoom: 12, matchTokens: ["naucalpan"] }
    }
  },
  michoacan: {
    label: "Michoacán", center: [-101.1949, 19.7008], zoom: 7,
    cities: {
      morelia: { label: "Morelia", center: [-101.1949, 19.7008], zoom: 12, matchTokens: ["morelia"] },
      uruapan: { label: "Uruapan", center: [-102.0631, 19.4203], zoom: 12, matchTokens: ["uruapan"] }
    }
  },
  morelos: {
    label: "Morelos", center: [-99.2216, 18.9186], zoom: 9,
    cities: {
      cuernavaca: { label: "Cuernavaca", center: [-99.2216, 18.9186], zoom: 13, matchTokens: ["cuernavaca"] }
    }
  },
  nayarit: {
    label: "Nayarit", center: [-104.8946, 21.5041], zoom: 7,
    cities: {
      tepic: { label: "Tepic", center: [-104.8946, 21.5041], zoom: 12, matchTokens: ["tepic"] },
      bahia_banderas: { label: "Bahía de Banderas", center: [-105.3000, 20.7500], zoom: 12, matchTokens: ["bahia de banderas", "nuevo vallarta"] }
    }
  },
  nuevo_leon: {
    label: "Nuevo León", center: [-100.3161, 25.6866], zoom: 7,
    cities: {
      monterrey: { label: "Monterrey", center: [-100.3161, 25.6866], zoom: 12, matchTokens: ["monterrey"] },
      san_pedro: { label: "San Pedro Garza García", center: [-100.4020, 25.6512], zoom: 12, matchTokens: ["san pedro garza"] }
    }
  },
  oaxaca: {
    label: "Oaxaca", center: [-96.7266, 17.0732], zoom: 7,
    cities: {
      oaxaca_city: { label: "Oaxaca de Juárez", center: [-96.7266, 17.0732], zoom: 12, matchTokens: ["oaxaca"] },
      puerto_escondido: { label: "Puerto Escondido", center: [-97.0667, 15.8500], zoom: 12, matchTokens: ["puerto escondido"] },
      huatulco: { label: "Huatulco", center: [-96.1333, 15.7667], zoom: 12, matchTokens: ["huatulco"] }
    }
  },
  puebla: {
    label: "Puebla", center: [-98.2063, 19.0414], zoom: 7,
    cities: {
      puebla_city: { label: "Puebla", center: [-98.2063, 19.0414], zoom: 12, matchTokens: ["puebla"] },
      cholula: { label: "Cholula", center: [-98.3053, 19.0639], zoom: 13, matchTokens: ["cholula"] }
    }
  },
  queretaro: {
    label: "Querétaro", center: [-100.3899, 20.5888], zoom: 8,
    cities: {
      queretaro_city: { label: "Santiago de Querétaro", center: [-100.3899, 20.5888], zoom: 12, matchTokens: ["queretaro"] }
    }
  },
  quintana_roo: {
    label: "Quintana Roo", center: [-88.3055, 19.5000], zoom: 6,
    cities: {
      cancun: { label: "Cancún", center: [-86.8515, 21.1619], zoom: 12, matchTokens: ["cancun"] },
      playa_del_carmen: { label: "Playa del Carmen", center: [-87.0739, 20.6296], zoom: 12, matchTokens: ["playa del carmen"] },
      tulum: { label: "Tulum", center: [-87.4653, 20.2114], zoom: 13, matchTokens: ["tulum"] },
      chetumal: { label: "Chetumal", center: [-88.3055, 18.5001], zoom: 12, matchTokens: ["chetumal"] }
    }
  },
  san_luis_potosi: {
    label: "San Luis Potosí", center: [-100.9855, 22.1565], zoom: 7,
    cities: {
      slp_city: { label: "San Luis Potosí", center: [-100.9855, 22.1565], zoom: 12, matchTokens: ["san luis potosi"] }
    }
  },
  sinaloa: {
    label: "Sinaloa", center: [-107.3940, 24.8091], zoom: 6,
    cities: {
      culiacan: { label: "Culiacán", center: [-107.3940, 24.8091], zoom: 12, matchTokens: ["culiacan"] },
      mazatlan: { label: "Mazatlán", center: [-106.4111, 23.2494], zoom: 12, matchTokens: ["mazatlan"] }
    }
  },
  sonora: {
    label: "Sonora", center: [-110.9559, 29.0729], zoom: 6,
    cities: {
      hermosillo: { label: "Hermosillo", center: [-110.9559, 29.0729], zoom: 12, matchTokens: ["hermosillo"] },
      ciudad_obregon: { label: "Ciudad Obregón", center: [-109.9420, 27.4829], zoom: 12, matchTokens: ["obregon"] }
    }
  },
  tabasco: {
    label: "Tabasco", center: [-92.9475, 17.9895], zoom: 8,
    cities: {
      villahermosa: { label: "Villahermosa", center: [-92.9475, 17.9895], zoom: 12, matchTokens: ["villahermosa"] }
    }
  },
  tamaulipas: {
    label: "Tamaulipas", center: [-98.7500, 24.5000], zoom: 6,
    cities: {
      ciudad_victoria: { label: "Ciudad Victoria", center: [-99.1332, 23.7369], zoom: 12, matchTokens: ["victoria"] },
      tampico: { label: "Tampico", center: [-97.8614, 22.2331], zoom: 12, matchTokens: ["tampico"] },
      reynosa: { label: "Reynosa", center: [-98.2775, 26.0806], zoom: 12, matchTokens: ["reynosa"] },
      nuevo_laredo: { label: "Nuevo Laredo", center: [-99.5075, 27.4764], zoom: 12, matchTokens: ["nuevo laredo"] }
    }
  },
  tlaxcala: {
    label: "Tlaxcala", center: [-98.2375, 19.3182], zoom: 9,
    cities: {
      tlaxcala_city: { label: "Tlaxcala", center: [-98.2375, 19.3182], zoom: 13, matchTokens: ["tlaxcala"] }
    }
  },
  veracruz: {
    label: "Veracruz", center: [-96.9167, 19.5333], zoom: 6,
    cities: {
      xalapa: { label: "Xalapa", center: [-96.9167, 19.5333], zoom: 12, matchTokens: ["xalapa"] },
      veracruz_port: { label: "Veracruz", center: [-96.1342, 19.1738], zoom: 12, matchTokens: ["puerto de veracruz", "veracruz"] },
      coatzacoalcos: { label: "Coatzacoalcos", center: [-94.4166, 18.1500], zoom: 12, matchTokens: ["coatzacoalcos"] }
    }
  },
  yucatan: {
    label: "Yucatán", center: [-89.6237, 20.9674], zoom: 7,
    cities: {
      merida: { label: "Mérida", center: [-89.6237, 20.9674], zoom: 12, matchTokens: ["merida"] },
      valladolid: { label: "Valladolid", center: [-88.2019, 20.6900], zoom: 13, matchTokens: ["valladolid"] },
      progreso: { label: "Progreso", center: [-89.6633, 21.2833], zoom: 13, matchTokens: ["progreso"] }
    }
  },
  zacatecas: {
    label: "Zacatecas", center: [-102.5832, 22.7709], zoom: 7,
    cities: {
      zacatecas_city: { label: "Zacatecas", center: [-102.5832, 22.7709], zoom: 13, matchTokens: ["zacatecas"] },
      fresnillo: { label: "Fresnillo", center: [-102.8697, 23.1739], zoom: 12, matchTokens: ["fresnillo"] }
    }
  }
};
