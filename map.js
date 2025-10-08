/* === MAP.JS — VERSIÓN ULTRA ESTABLE === */
console.log("📦 Iniciando map.js...");

if (window.__MAP_LOADED__) {
  console.warn("⚠️ map.js ya fue cargado, se omite nueva ejecución.");
} else {
  window.__MAP_LOADED__ = true;
  console.log("🧩 Primera carga de map.js confirmada.");

  // Esperar hasta que el DOM tenga el contenedor #map
  const waitForMap = setInterval(() => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return; // aún no existe, esperar

    // Si el mapa ya está inicializado, no volver a crear
    if (mapContainer._leaflet_id || window.map) {
      console.log("⛔ El mapa ya estaba inicializado, se cancela nueva instancia.");
      clearInterval(waitForMap);
      return;
    }

    clearInterval(waitForMap);
    console.log("🟢 #map detectado. Inicializando Leaflet…");

    // ===================================================
    // CAPAS BASE
    // ===================================================
    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 19, attribution: "© OpenStreetMap" }
    );

    const googleHybrid = L.tileLayer(
      "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      { maxZoom: 20, attribution: "© Google Maps" }
    );

    // ===================================================
    // CREACIÓN DEL MAPA
    // ===================================================
    const map = L.map(mapContainer, {
      center: [20.6767, -103.3476],
      zoom: 12,
      layers: [googleHybrid],
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    });

    window.map = map;

    // ===================================================
    // CONTROL DE CAPAS
    // ===================================================
    const baseMaps = {
      "🛰️ Google Hybrid": googleHybrid,
      "📍 OpenStreetMap": osm,
    };
    L.control.layers(baseMaps, {}, { collapsed: true }).addTo(map);

    // ===================================================
    // INTERACCIÓN TOTAL
    // ===================================================
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if (map.tap) map.tap.enable();

    const mapDiv = document.getElementById("map");
    mapDiv.style.pointerEvents = "auto";
    mapDiv.style.userSelect = "auto";
    mapDiv.style.zIndex = "0";
    mapDiv.style.opacity = "1";
    mapDiv.style.visibility = "visible";

    // ===================================================
    // FIX VISUAL — Z-INDEX DE PANELES
    // ===================================================
    function bringDrawLayersToFront() {
      const panes = map.getPanes();
      if (!panes) return;

      if (panes.tilePane) panes.tilePane.style.zIndex = "200";
      if (panes.overlayPane) panes.overlayPane.style.zIndex = "800";
      if (panes.markerPane) panes.markerPane.style.zIndex = "850";
      if (panes.popupPane) panes.popupPane.style.zIndex = "900";

      document.querySelectorAll(".leaflet-overlay-pane path, .leaflet-marker-icon").forEach(el => {
        el.style.opacity = "1";
        el.style.display = "block";
        el.style.visibility = "visible";
        el.style.pointerEvents = "auto";
      });
    }

    map.on("layeradd", () => setTimeout(bringDrawLayersToFront, 200));
    map.on(L.Draw.Event.CREATED, () => setTimeout(bringDrawLayersToFront, 200));
    map.on("zoomend", bringDrawLayersToFront);
    map.on("moveend", bringDrawLayersToFront);
    setTimeout(bringDrawLayersToFront, 800);

    // ===================================================
    // LOG FINAL
    // ===================================================
    console.log("✅ Mapa cargado correctamente, sin duplicados ni parpadeos.");
  }, 500);
}
