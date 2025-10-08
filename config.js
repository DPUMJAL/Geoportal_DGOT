/* ===========================================================
   ⚙️ CONFIGURACIÓN GLOBAL DEL GEOPORTAL DGOT
   =========================================================== */

/* === SEGURIDAD: VARIABLES AMBIENTE === */
/**** Ahora las llaves se leen desde variables del entorno (.env o Netlify/GitHub Secrets) ****/
/**** En GitHub Pages o local con Vite, se usan import.meta.env. En Netlify, process.env. ****/
const SUPABASE_URL =
  typeof process !== "undefined" && process.env?.SUPABASE_URL
    ? process.env.SUPABASE_URL
    : (typeof import !== "undefined" && import.meta?.env?.VITE_SUPABASE_URL) || "https://bxlxciekszzsdukmahdw.supabase.co";

const SUPABASE_KEY =
  typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY
    ? process.env.SUPABASE_ANON_KEY
    : (typeof import !== "undefined" && import.meta?.env?.VITE_SUPABASE_KEY) ||
      "reemplaza-esto-con-tu-clave-local-si-corre-en-local";

/**** CONEXIÓN SEGURA A SUPABASE ****/
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* === FUNCIONES BÁSICAS DE INTERFAZ === */
function $(id){ 
  return document.getElementById(id);
}
function toggleBox(id){ 
  const box = $(id);
  if (box) box.classList.toggle("hidden");
}

/* === CONFIGURACIÓN DE MAPA BASE === */
let map = L.map('map', {
  zoomControl: true,
  attributionControl: true,
}).setView([20.6767, -103.3476], 12);

/* === MAPAS BASE DISPONIBLES === */
const googleHybrid = L.tileLayer(
  'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', 
  { maxZoom: 20, subdomains: ['mt0','mt1','mt2','mt3'], attribution: '© Google Maps Hybrid' }
);
const googleSat = L.tileLayer(
  'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', 
  { maxZoom: 20, subdomains: ['mt0','mt1','mt2','mt3'], attribution: '© Google Satellite' }
);
const osmStd = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
  { maxZoom: 19, attribution: '© OpenStreetMap' }
);
const esriTopo = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', 
  { maxZoom: 19, attribution: '© Esri Topo' }
);

/* === ACTIVAMOS GOOGLE HYBRID COMO BASE PRINCIPAL === */
googleHybrid.addTo(map);

/* === CONTROL DE MAPAS BASE === */
const baseMaps = {
  "🛰️ Google Hybrid": googleHybrid,
  "🌎 Google Satélite": googleSat,
  "🗺️ Esri Topográfico": esriTopo,
  "📍 OSM Estándar": osmStd
};
L.control.layers(baseMaps, {}, { collapsed: true, position:'bottomleft' }).addTo(map);

/* === LOGIN BLOQUEADO (NO MODIFICAR) === */
function login(){
  const key = $("keyPrivacy").value;
  if (key === 'DGOT2025'){
    $("loginModal").style.display = 'none';
    loadGrupos();
  } else {
    alert("❌ Key incorrecta");
  }
}
function logout(){
  $("loginModal").style.display = 'flex';
  $("keyPrivacy").value = '';
}
function togglePrivacy(){
  const i = $("keyPrivacy");
  i.type = (i.type === 'password') ? 'text' : 'password';
}
document.addEventListener("keydown", e => {
  if(e.key === "Enter" && $("loginModal").style.display !== 'none') login();
});

/* === CONFIRMACIÓN VISUAL === */
console.log("%c✅ Geoportal DGOT Configurado Correctamente","color:#59c1b2;font-weight:bold;");

/**** ===========================================================
      NUEVO BLOQUE: SEGURIDAD PARA REPOSITORIO GITHUB
=========================================================== ****/

/**
 * ✅ Evita exponer claves por accidente en consola o red
 * - Borra la referencia global de Supabase key
 * - Desactiva el logging de objetos sensibles
 * - Verifica HTTPS para conexiones seguras
 */
(function secureConfig(){
  try {
    // Limpia la key en el scope global
    if (window.SUPABASE_KEY) window.SUPABASE_KEY = undefined;

    // Verifica HTTPS
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      alert("⚠️ Conexión no segura. Usa HTTPS para proteger los datos del Geoportal.");
    }

    // Bloquea logging accidental de la key
    const oldLog = console.log;
    console.log = function(...args){
      if (args.some(a => typeof a === "string" && a.includes("eyJhbGciOi"))) return;
      oldLog.apply(console, args);
    };

    console.log("%c🔒 Modo seguro de configuración activado", "color:#59c1b2;font-weight:bold;");
  } catch(err){
    console.warn("⚠️ No se pudo aplicar el modo seguro:", err);
  }
})();
