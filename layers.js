/* === LAYERS.JS — Geoportal DGOT === */
console.log("🧩 layers.js cargado correctamente");

/* === Espera a que Supabase y el mapa estén listos === */
(function waitForDeps() {
  const tryInit = () => {
    if (window.supa && window.map && typeof map.addLayer === "function") {
      console.log("✅ Dependencias listas: Supabase + mapa detectados");
      initLayers();
    } else setTimeout(tryInit, 400);
  };
  tryInit();
})();

/* === Inicialización de capas === */
function initLayers() {
  const layers = {};
  const layerStyle = {
    barrios: {
      color: "#59c1b2",
      weight: 1.2,
      fillColor: "#59c1b2",
      opacity: 1,
      fillOpacity: 0.9,
      type: "polygon",
      table: "barrios",
    },
    salud: {
      color: "#ed8832",
      radius: 5,
      opacity: 1,
      fillOpacity: 0.9,
      type: "point",
      table: "salud",
    },
  };

  /* === Activar/desactivar capas con fade === */
  async function toggleLayer(name) {
    const chk = document.getElementById("chk_" + name);
    if (!chk) return;
    if (chk.checked) {
      console.log(`🗺️ Activando capa: ${name}`);
      if (!layers[name]) await loadLayer(name);
      if (layers[name]) fadeLayer(layers[name], true);
    } else {
      if (layers[name]) fadeLayer(layers[name], false);
    }
  }
  window.toggleLayer = toggleLayer;

  /* === Cargar capa desde Supabase === */
  async function loadLayer(name) {
    const meta = layerStyle[name];
    if (!meta) return;
    showLoader(true, name);

    try {
      const { data, error } = await supa.from(meta.table).select("geom");
      if (error || !data) {
        console.warn(`⚠️ Sin datos o error al cargar capa ${name}`, error);
        showLoader(false);
        return;
      }

      const styleFn = () =>
        meta.type === "polygon"
          ? {
              color: meta.color,
              weight: meta.weight,
              fillColor: meta.fillColor,
              fillOpacity: meta.fillOpacity,
            }
          : meta.type === "line"
          ? { color: meta.color, weight: 2, opacity: meta.opacity }
          : {};

      const ptToLayer = (feature, latlng) =>
        meta.type === "point"
          ? L.circleMarker(latlng, {
              radius: meta.radius,
              color: meta.color,
              fillColor: meta.color,
              fillOpacity: meta.fillOpacity,
            })
          : null;

      layers[name] = L.geoJSON(data.map((d) => d.geom), {
        style: styleFn,
        pointToLayer: meta.type === "point" ? ptToLayer : undefined,
      });

      fadeLayer(layers[name], true);
      console.log(`✅ Capa ${name} cargada (${data.length} registros)`);
    } catch (err) {
      console.error("❌ Error procesando capa:", name, err);
    } finally {
      showLoader(false);
    }
  }

  /* === Actualizar color/opacidad === */
  function updateLayerStyle(name) {
    const meta = layerStyle[name];
    if (!meta || !layers[name]) return;
    const color = document.getElementById("col_" + name)?.value || meta.color;
    const op = parseFloat(document.getElementById("op_" + name)?.value || 1);
    meta.color = color;
    meta.fillOpacity = op;
    layers[name].setStyle?.({
      color,
      fillColor: color,
      opacity: op,
      fillOpacity: op,
    });
  }
  window.updateLayerStyle = updateLayerStyle;

  /* === Animación de aparición/desaparición === */
  function fadeLayer(layer, show = true) {
    if (!layer) return;
    if (show) {
      layer.setStyle?.({ opacity: 0, fillOpacity: 0 });
      layer.addTo(map);
      let op = 0;
      const fadeIn = setInterval(() => {
        op += 0.1;
        if (op >= 1) clearInterval(fadeIn);
        layer.setStyle?.({ opacity: op, fillOpacity: op * 0.9 });
      }, 40);
    } else {
      let op = 1;
      const fadeOut = setInterval(() => {
        op -= 0.1;
        if (op <= 0) {
          clearInterval(fadeOut);
          map.removeLayer(layer);
        } else {
          layer.setStyle?.({ opacity: op, fillOpacity: op * 0.9 });
        }
      }, 40);
    }
  }

  /* === Indicador animado de carga (blur elegante) === */
  function showLoader(state, name) {
    let loader = document.getElementById("layerLoader");
    if (!loader && state) {
      loader = document.createElement("div");
      loader.id = "layerLoader";
      loader.innerHTML = `<div class="spinner"></div><p>Cargando ${name}...</p>`;
      document.body.appendChild(loader);
    }
    if (loader) loader.style.display = state ? "flex" : "none";
  }

  console.log("🌐 Capas inicializadas.");
}

/* === Estilos CSS inyectados dinámicamente === */
const styleTag = document.createElement("style");
styleTag.textContent = `
#layerLoader {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: none;
  align-items: center; justify-content: center;
  backdrop-filter: blur(6px);
  background: rgba(255,255,255,0.1);
  z-index: 9999;
  flex-direction: column;
  gap: 10px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: #222;
  letter-spacing: 0.3px;
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(89,193,178,0.3);
  border-top: 3px solid #59c1b2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(styleTag);
