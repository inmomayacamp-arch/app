// Routing Middleware de Vercel: cuando un bot de vista previa (WhatsApp,
// Facebook, Twitter/X, etc.) pide una página de propiedad, perfil de asesor,
// ficha de proveedor o enlace de cliente, le devolvemos una página mínima
// con las etiquetas Open Graph correctas (foto real, título, descripción)
// en vez del index.html genérico -- esos bots no ejecutan JavaScript, así
// que nunca llegan a ver lo que arma utils.js/setMeta() en un navegador
// real. Cualquier otra visita (una persona real, o un bot pidiendo una
// ruta que no reconocemos) pasa de largo exactamente igual que si este
// archivo no existiera -- ver next() al final de cada camino.
import { next } from "@vercel/functions";

var SUPABASE_URL = "https://ypmvyyzmxrwusapjxsrz.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwbXZ5eXpteHJ3dXNhcGp4c3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NzQ4NjcsImV4cCI6MjEwMTQ1MDg2N30.8BKlzAmv9O-S8JJhH5uj5djhAOjfYJxvw_Li3j7pXbw";
var SITE_URL = "https://www.inmomaps.com.mx";
var DEFAULT_IMAGE = SITE_URL + "/icons/icon-512.png";
var FALLBACK_PHOTO = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80";

// El patron de WhatsApp exige la barra y el numero de version (formato real
// de su rastreador: "WhatsApp/2.23.20.0 A") en vez de solo la palabra
// "WhatsApp" -- el navegador interno que abre WhatsApp cuando una persona
// real toca un enlace dentro de un chat no debe caer aqui por error.
var BOT_UA = /facebookexternalhit|Facebot|WhatsApp\/[\d.]+|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|SkypeUriPreview|Pinterest|redditbot|vkShare|Applebot/i;

// Primer segmento de cada ruta fija del sitio (todo lo demás de uno o dos
// segmentos se trata como slug de asesor / enlace de cliente, igual que
// hace el router del lado del cliente en js/router.js).
var RESERVED_FIRST_SEGMENT = new Set([
  "propiedades", "favoritos", "perfil", "planes", "planes-propietario", "registro-propietario",
  "planes-proveedor", "plan-detalle", "solicitud", "soporte", "terminos", "privacidad",
  "confirmar-cuenta", "restablecer-contrasena", "pago-exitoso", "pago-cancelado", "anunciate",
  "registro-agente", "registro-proveedor", "propiedad", "servicios", "dashboard", "admin"
]);

var PROPERTY_TYPE_LABELS = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local comercial",
  bodega: "Bodega", quinta: "Quinta", edificio: "Edificio", nave_industrial: "Nave industrial",
  consultorio: "Consultorio", oficina: "Oficina", otro: "Otro"
};

function operationLabel(op) {
  if (op === "venta_renta") return "Venta y renta";
  return op === "renta" ? "En renta" : "En venta";
}

function formatPrice(value) {
  return "$" + Math.round(Number(value) || 0).toLocaleString("es-MX");
}

function priceLabel(row) {
  var currency = row.currency && row.currency !== "MXN" ? " " + row.currency : " MXN";
  if (row.operation === "renta") return formatPrice(row.price_rent || row.price) + currency + "/mes";
  return formatPrice(row.price) + currency;
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function ogPage(opts) {
  var title = escapeHtml(opts.title);
  var description = escapeHtml((opts.description || "").slice(0, 200));
  var image = escapeHtml(opts.image || DEFAULT_IMAGE);
  var url = escapeHtml(opts.url);
  var type = opts.type || "website";
  return (
    "<!DOCTYPE html><html lang=\"es\"><head>" +
    "<meta charset=\"UTF-8\" />" +
    "<title>" + title + "</title>" +
    "<meta name=\"description\" content=\"" + description + "\" />" +
    "<meta property=\"og:site_name\" content=\"InmoMaps\" />" +
    "<meta property=\"og:title\" content=\"" + title + "\" />" +
    "<meta property=\"og:description\" content=\"" + description + "\" />" +
    "<meta property=\"og:image\" content=\"" + image + "\" />" +
    "<meta property=\"og:url\" content=\"" + url + "\" />" +
    "<meta property=\"og:type\" content=\"" + type + "\" />" +
    "<meta name=\"twitter:card\" content=\"summary_large_image\" />" +
    "<meta name=\"twitter:title\" content=\"" + title + "\" />" +
    "<meta name=\"twitter:description\" content=\"" + description + "\" />" +
    "<meta name=\"twitter:image\" content=\"" + image + "\" />" +
    "</head><body></body></html>"
  );
}

function ogResponse(opts) {
  return new Response(ogPage(opts), { headers: { "content-type": "text/html; charset=utf-8" } });
}

async function sbGet(path) {
  var res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY }
  });
  if (!res.ok) return null;
  var data = await res.json();
  return Array.isArray(data) ? (data[0] || null) : data;
}

async function sbRpc(name, params) {
  var res = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify(params)
  });
  if (!res.ok) return null;
  var data = await res.json();
  return Array.isArray(data) ? (data[0] || null) : data;
}

async function handleProperty(id, pathname) {
  var row = await sbGet("properties?id=eq." + encodeURIComponent(id) + "&select=title,description,photos,price,price_rent,currency,operation,type,city,neighborhood");
  if (!row) return null;
  var typeLabel = PROPERTY_TYPE_LABELS[row.type] || row.type || "";
  var description = row.description
    ? row.description
    : (typeLabel + " " + operationLabel(row.operation).toLowerCase() + " en " +
       [row.neighborhood, row.city].filter(Boolean).join(", ") + " — " + priceLabel(row) + ".");
  return ogResponse({
    title: row.title + " — InmoMaps",
    description: description,
    image: (row.photos && row.photos[0]) || FALLBACK_PHOTO,
    url: SITE_URL + pathname,
    type: "product"
  });
}

async function handleProvider(id, pathname) {
  var row = await sbGet("service_providers?id=eq." + encodeURIComponent(id) + "&select=name,description,photo,photos,city");
  if (!row) return null;
  var cover = (row.photos && row.photos[0]) || row.photo;
  return ogResponse({
    title: row.name + " — InmoMaps",
    description: row.description || ("Directorio de servicios en " + (row.city || "InmoMaps") + "."),
    image: cover || DEFAULT_IMAGE,
    url: SITE_URL + pathname
  });
}

async function handleAgentProfile(slug, pathname) {
  var row = await sbGet("profiles_public?slug=eq." + encodeURIComponent(slug) + "&select=name,title,bio,photo,city");
  if (!row) return null;
  var subtitle = row.title || "Asesor inmobiliario";
  return ogResponse({
    title: row.name + " — " + subtitle + " en InmoMaps",
    description: row.bio || ("Propiedades de " + row.name + (row.city ? " en " + row.city : "") + ", en InmoMaps."),
    image: row.photo || DEFAULT_IMAGE,
    url: SITE_URL + pathname,
    type: "profile"
  });
}

async function handleClientLink(agentSlug, clientSlug, pathname) {
  var link = await sbRpc("get_client_link", { p_agent_slug: agentSlug, p_client_slug: clientSlug });
  if (!link) return null;
  var agent = await sbGet("profiles_public?slug=eq." + encodeURIComponent(agentSlug) + "&select=name");
  var agentName = (agent && agent.name) || "tu asesor";
  var propertyIds = link.property_ids || [];
  var image = DEFAULT_IMAGE;
  if (propertyIds.length) {
    var firstProp = await sbGet("properties?id=eq." + encodeURIComponent(propertyIds[0]) + "&select=photos");
    if (firstProp && firstProp.photos && firstProp.photos[0]) image = firstProp.photos[0];
  }
  return ogResponse({
    title: "Selección de " + agentName + " para " + link.client_label + " — InmoMaps",
    description: link.message || ("Selección de " + propertyIds.length + " propiedad" + (propertyIds.length === 1 ? "" : "es") + " preparada por " + agentName + " en InmoMaps."),
    image: image,
    url: SITE_URL + pathname
  });
}

export const config = {
  matcher: ["/((?!css/|js/|icons/|manifest\\.json|sw\\.js|robots\\.txt|favicon).*)"]
};

export default async function middleware(request) {
  if (request.method !== "GET") return next();

  var ua = request.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) return next();

  var url = new URL(request.url);
  var segs = url.pathname.split("/").filter(Boolean);
  if (!segs.length) return next();

  try {
    var response = null;
    if (segs[0] === "propiedad" && segs[1]) {
      response = await handleProperty(segs[1], url.pathname);
    } else if (segs[0] === "servicios" && segs[1] && segs[2]) {
      response = await handleProvider(segs[2], url.pathname);
    } else if (segs.length === 1 && !RESERVED_FIRST_SEGMENT.has(segs[0])) {
      response = await handleAgentProfile(segs[0], url.pathname);
    } else if (segs.length === 2 && !RESERVED_FIRST_SEGMENT.has(segs[0])) {
      response = await handleClientLink(segs[0], segs[1], url.pathname);
    }
    return response || next();
  } catch (err) {
    console.error("Error en middleware de Open Graph:", err);
    return next();
  }
}
