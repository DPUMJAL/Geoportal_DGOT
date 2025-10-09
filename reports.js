/* === FIX DEFINITIVO: asegurar que drawnItems se cree después del mapa === */
function ensureDrawnLayer() {
  if (!window.map) {
    console.warn("⏳ Esperando que el mapa se cargue...");
    setTimeout(ensureDrawnLayer, 400);
    return;
  }
  if (!window.drawnItems) {
    window.drawnItems = new L.FeatureGroup();
    map.addLayer(window.drawnItems);
    console.log("✅ drawnItems inicializado correctamente.");
  }
}
ensureDrawnLayer();


/* === REPORTES (DIBUJO Y GUARDADO) === */

let drawn = null;
let activeDraw = null;
let saving = false;

if (!window.drawnItems) {
  window.drawnItems = new L.FeatureGroup();
  if (window.map && typeof window.map.addLayer === "function") {
    window.map.addLayer(window.drawnItems);
  } else {
    console.warn("⚠️ Mapa aún no disponible. Se agregará luego.");
    const waitMap = setInterval(() => {
      if (window.map && typeof window.map.addLayer === "function") {
        window.map.addLayer(window.drawnItems);
        clearInterval(waitMap);
        console.log("✅ Capa global agregada al mapa tras esperar.");
      }
    }, 500);
  }
}


/* === INICIAR DIBUJO === */
function startDraw(type) {
  console.log("✏️ Iniciando dibujo:", type);
  if (drawn) window.drawnItems.removeLayer(drawn);
  if (activeDraw) activeDraw.disable();

  let drawTool = null;
  if (type === "Point") drawTool = new L.Draw.Marker(map);
  else if (type === "LineString") drawTool = new L.Draw.Polyline(map);
  else if (type === "Polygon") drawTool = new L.Draw.Polygon(map);

  if (!drawTool) return;
  activeDraw = drawTool;
  drawTool.enable();

  map.once(L.Draw.Event.CREATED, (e) => {
  console.log("🎨 Nueva geometría creada:", e.layerType);

  drawn = e.layer;
  window.drawnItems.addLayer(drawn);

  // Estilo visual más visible
  if (drawn.setStyle) drawn.setStyle({
    color: "#ff3333",
    weight: 2.5,
    fillColor: "#ff6666",
    fillOpacity: 0.45
  });

  // Ajuste suave al área dibujada (sin irse de foco)
  if (drawn.getBounds) {
    const b = drawn.getBounds();
    if (b.isValid()) {
      map.flyToBounds(b, { padding: [50, 50], duration: 0.7 });
    }
  } else if (drawn.getLatLng) {
    map.flyTo(drawn.getLatLng(), 14);
  }

  // Desactiva herramienta de dibujo, pero no borra nada
  if (activeDraw) activeDraw.disable();

  console.log("✅ Geometría agregada correctamente al mapa.");
});

}

/* === GUARDAR REPORTE === */
async function saveReporte() {
  if (saving) return;
  saving = true;
  try {
    if (!drawn) {
      alert("⚠️ Dibuja algo primero");
      return;
    }

    const nombre = document.getElementById("nombre").value.trim();
    const tipo = document.getElementById("tipo").value.trim();
    const comentarios = document.getElementById("comentarios").value.trim();
    const grupoSel = document.getElementById("grupoSelectBtn").dataset.id;
    const grupo_id = grupoSel ? parseInt(grupoSel) : null;
    const geom = drawn.toGeoJSON().geometry;

    if (!nombre || !tipo || !grupo_id) {
      alert("⚠️ Llena todos los campos y selecciona un grupo");
      return;
    }

    const { error } = await supa.from("reportes").insert([
      { nombre, tipo_requerimiento: tipo, comentarios, geom, geom_tipo: geom.type, grupo_id },
    ]);

    if (error) throw error;
    alert("✅ Reporte guardado correctamente");

    ["nombre", "tipo", "comentarios"].forEach(id => (document.getElementById(id).value = ""));
    window.drawnItems.removeLayer(drawn);
    drawn = null;
    await loadGrupos();
  } catch (err) {
    console.error("❌ Error al guardar:", err);
    alert("❌ " + err.message);
  } finally {
    saving = false;
  }
}

/* === CREAR GRUPO === */
async function addGrupo() {
  const input = document.getElementById("grupoNombre");
  const nombre = input.value.trim();
  if (!nombre) return alert("⚠️ Escribe un nombre de grupo o municipio");

  try {
    const { error } = await supa.from("grupos").insert([{ nombre }]);
    if (error) throw error;
    alert("✅ Grupo creado correctamente");
    input.value = "";
    await loadGrupos();
  } catch (err) {
    console.error("❌ Error al crear grupo:", err);
  }
}

/* === CARGAR GRUPOS === */
async function loadGrupos() {
  try {
    const { data, error } = await supa.from("grupos").select("id, nombre");
    if (error) throw error;

    const lista = document.getElementById("listaGrupos");
    if (!lista) return;

    lista.innerHTML = "";

    if (!data || !data.length) {
      const vacio = document.createElement("li");
      vacio.textContent = "Sin grupos registrados aún";
      vacio.style.color = "#bbb";
      vacio.style.padding = "6px";
      lista.appendChild(vacio);
    } else {
      data.forEach((g) => {
        const li = document.createElement("li");
        li.className = "grupo-item";

        const header = document.createElement("div");
        header.className = "grupo-header";
        header.innerHTML = `<span class="grupo-nombre">${g.nombre}</span>`;

        const btnDel = document.createElement("button");
        btnDel.innerHTML = "🗑️";
        btnDel.className = "btn-del";
        btnDel.onclick = async () => {
          if (confirm(`¿Eliminar grupo "${g.nombre}"?`)) {
            await supa.from("grupos").delete().eq("id", g.id);
            await loadGrupos();
          }
        };
        header.appendChild(btnDel);

        const subList = document.createElement("ul");
        subList.className = "reportes-sublist hidden";

        header.onclick = async (e) => {
          if (e.target === btnDel) return;
          subList.classList.toggle("hidden");
          if (!subList.classList.contains("hidden")) {
            const { data: reps, error: repErr } = await supa
              .from("reportes")
              .select("id, nombre, tipo_requerimiento, geom, grupo_id")
              .eq("grupo_id", g.id);
            if (repErr) return console.error(repErr);

            subList.innerHTML = "";
            window.drawnItems.clearLayers();

            if (!reps.length) {
              subList.innerHTML = `<li class="reporte-vacio">Sin reportes</li>`;
            } else {
              reps.forEach((r) => {
                const item = document.createElement("li");
                item.className = "reporte-item";

                const chk = document.createElement("input");
                chk.type = "checkbox";
                chk.checked = true;
                chk.className = "reporte-toggle";

                const span = document.createElement("span");
                span.className = "reporte-nombre";
                span.textContent = `${r.nombre} — ${r.tipo_requerimiento}`;

                const del = document.createElement("button");
                del.innerHTML = "🗑️";
                del.className = "btn-del";

                let layer = null;
                if (r.geom) {
                  layer = L.geoJSON(r.geom, {
                    style: { color: "#ff5555", weight: 3, fillOpacity: 0.4 },
                  }).addTo(window.drawnItems);
                }

                chk.onchange = () => {
                  if (chk.checked) layer && layer.addTo(window.drawnItems);
                  else if (layer) window.drawnItems.removeLayer(layer);
                };

                del.onclick = async () => {
                  if (confirm(`¿Eliminar el reporte "${r.nombre}"?`)) {
                    const { error } = await supa.from("reportes").delete().eq("id", r.id);
                    if (error) return alert("❌ No se pudo eliminar: " + error.message);
                    if (layer) window.drawnItems.removeLayer(layer);
                    item.remove();
                    console.log(`🗑️ Reporte "${r.nombre}" eliminado`);
                  }
                };

                item.appendChild(chk);
                item.appendChild(span);
                item.appendChild(del);
                subList.appendChild(item);
              });
            }
          }
        };

        li.appendChild(header);
        li.appendChild(subList);
        lista.appendChild(li);
      });
    }

    console.log("✅ Grupos y reportes cargados");
    actualizarMenuGrupos(data);
  } catch (err) {
    console.error("❌ Error en loadGrupos:", err);
  }
}

/* === MENÚ PERSONALIZADO === */
function actualizarMenuGrupos(grupos) {
  const btn = document.getElementById("grupoSelectBtn");
  const menu = document.getElementById("grupoDropdown");
  if (!btn || !menu) return;

  menu.innerHTML = "";
  grupos.forEach(g => {
    const div = document.createElement("div");
    div.textContent = g.nombre;
    div.onclick = () => {
      btn.textContent = `📂 ${g.nombre}`;
      btn.dataset.id = g.id;
      menu.classList.add("hidden");
    };
    menu.appendChild(div);
  });

  btn.onclick = () => menu.classList.toggle("hidden");
  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) menu.classList.add("hidden");
  });
}

/* === GLOBAL === */
window.startDraw = startDraw;
window.saveReporte = saveReporte;
window.addGrupo = addGrupo;
window.loadGrupos = loadGrupos;

window.addEventListener("load", async () => {
  for (let i = 0; i < 20; i++) {
    if (window.supa && document.getElementById("grupoSelectBtn")) break;
    await new Promise(r => setTimeout(r, 400));
  }
  await loadGrupos();
});



