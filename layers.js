/* === FUNCIONES DE CAPAS (idénticas al HTML original) === */

/* ************** FIX: Esperador infinito silencioso ************** */
(function waitForDeps() {
  const tryInit = () => {
    if (typeof window.supa !== "undefined" && typeof window.map !== "undefined") {
      if (window.map && typeof window.map.addLayer === "function") {
        console.log("✅ Dependencias detectadas: Supabase + mapa listos.");
        initLayers();
        return; // ✅ sale tras inicializar
      }
    }
    // 🔁 Reintenta cada 500 ms sin mostrar warnings
    setTimeout(tryInit, 500);
  };
  tryInit();
})();
/* ************** FIN FIX ************** */


/* ************** NUEVO CONTENEDOR: inicializa solo cuando deps estén listas ************** */
function initLayers() {

  const layers = {};
  const layerStyle = {
    barrios: {
      color: "#59c1b2",
      weight: 1,
      fillColor: "#59c1b2",
      opacity: 1,
      fillOpacity: 1,
      type: "polygon",
      table: "barrios",
    },
    salud: {
      color: "#ed8832",
      radius: 5,
      opacity: 1,
      fillOpacity: 1,
      type: "point",
      table: "salud",
    },
  };

  async function toggleLayer(name) {
    const chk = document.getElementById("chk_" + name);
    if (chk && chk.checked) {
      if (!layers[name]) {
        await loadLayer(name);
      }
      if (layers[name]) layers[name].addTo(map);
    } else {
      if (layers[name]) map.removeLayer(layers[name]);
    }
  }
  window.toggleLayer = toggleLayer; // 👈 expone la función globalmente

  async function loadLayer(name) {
    const meta = layerStyle[name];
    if (!meta) return;

    try {
      const { data, error } = await supa.from(meta.table).select("geom");
      if (error || !data) return;

      const styleFn = (feature) => {
        if (meta.type === "polygon") {
          return {
            color: meta.color,
            weight: meta.weight || 1,
            fillColor: meta.color,
            opacity: meta.opacity,
            fillOpacity: meta.fillOpacity,
          };
        } else if (meta.type === "line") {
          return {
            color: meta.color,
            weight: meta.weight || 2,
            opacity: meta.opacity,
          };
        } else {
          return {};
        }
      };

      const ptToLayer = (feature, latlng) => {
        if (meta.type === "point") {
          return L.circleMarker(latlng, {
            radius: meta.radius || 5,
            color: meta.color,
            fillColor: meta.color,
            opacity: meta.opacity,
            fillOpacity: meta.fillOpacity,
          });
        } else {
          return null;
        }
      };

      layers[name] = L.geoJSON(data.map((d) => d.geom), {
        style: meta.type !== "point" ? styleFn : undefined,
        pointToLayer: meta.type === "point" ? ptToLayer : undefined,
      });
      layers[name].addTo(map);
    } catch (err) {
      console.error("❌ Error al procesar capa:", name, err);
    }
  }

  async function updateLayerStyle(name) {
    const meta = layerStyle[name];
    if (!meta) return;
    const col = document.getElementById("col_" + name)?.value || meta.color;
    const op = parseFloat(document.getElementById("op_" + name)?.value || 1);

    meta.color = col;
    meta.opacity = op;
    meta.fillOpacity = op;

    if (!layers[name]) return;

    if (meta.type === "point") {
      layers[name].eachLayer((m) => {
        if (m.setStyle)
          m.setStyle({
            color: col,
            fillColor: col,
            opacity: op,
            fillOpacity: op,
          });
      });
    } else if (meta.type === "line") {
      layers[name].setStyle({ color: col, opacity: op });
    } else if (meta.type === "polygon") {
      layers[name].setStyle({
        color: col,
        fillColor: col,
        opacity: op,
        fillOpacity: op,
      });
    }
  }
  window.updateLayerStyle = updateLayerStyle; // 👈 expone función global

} // 👈 cierre de initLayers()
/* ************** FIN NUEVO CONTENEDOR ************** */
