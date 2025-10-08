/* === AUTH.JS === */
console.log("✅ auth.js cargado correctamente, listo para iniciar sesión.");

/* ************** UTIL: helpers seguros ************** */
function $(id){ return document.getElementById(id); }
function show(el){ if(el){ el.style.display = ""; } }
function hide(el){ if(el){ el.style.display = "none"; } }

/* ************** TOGGLE VISIBILIDAD DE CONTRASEÑA (ADMIN) ************** */
function togglePrivacy() {
  const input = $("keyPrivacy");
  const eyeBtn = $("eyeBtn");
  if (!input || !eyeBtn) return;
  if (input.type === "password") {
    input.type = "text";
    eyeBtn.textContent = "🙈";
  } else {
    input.type = "password";
    eyeBtn.textContent = "👁";
  }
}

/* ************** APLICAR ROL (muestra/oculta secciones) ************** */
function applyRole(role) {
  const loginModal = $("loginModal");
  const panel = $("panel");
  const logoutBtn = $("logout");
  const h3Grupos = document.querySelector(`h3[onclick="toggleBox('gruposBox')"]`);
  const h3Capas  = document.querySelector(`h3[onclick="toggleBox('capasBox')"]`);
  const gruposBox = $("gruposBox");
  const capasBox  = $("capasBox");

  hide(loginModal);
  show(panel);
  show(logoutBtn);

  if (role === "admin") {
    show(h3Grupos); show(gruposBox);
    show(h3Capas);  show(capasBox);
  } else {
    hide(h3Grupos); hide(gruposBox);
    hide(h3Capas);  hide(capasBox);
  }

  panel.style.pointerEvents = "auto";
  panel.querySelectorAll("input, textarea, select, button").forEach(el => {
    el.disabled = false;
    el.style.pointerEvents = "auto";
  });
  document.body.style.pointerEvents = "auto";

  panel.dataset.role = role;
  enablePanelUX();
}

/* ************** CIERRE DE LOGIN & LOGOUT ************** */
function logout(){
  localStorage.removeItem("role");
  const loginModal = $("loginModal");
  if (loginModal){ loginModal.style.display = "flex"; }
}

/* ************** PESTAÑAS DEL LOGIN (tabs) ************** */
function initLoginTabs(){
  const btns = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");
  if (!btns.length || !contents.length) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const targetId = "tab-" + btn.dataset.tab;
      const target = $(targetId);
      if (target){ target.classList.add("active"); }
      const firstInput = target?.querySelector("input");
      if (firstInput) firstInput.focus();
    });
  });
}

/* ************** ENTER = login de la pestaña activa ************** */
function initEnterKeyLogin(){
  document.addEventListener("keydown", (e) => {
    const modal = $("loginModal");
    if (!modal) return;
    const visible = modal.style.display !== "none";
    if (!visible) return;

    if (e.key !== "Enter") return;
    const activeBtn = document.querySelector(".tab-btn.active");
    const tab = activeBtn ? activeBtn.dataset.tab : "admin";
    if (tab === "admin")      loginAdmin();
    else if (tab === "servidores") loginServidor();
    else if (tab === "publico")    loginPublico();
  });
}

/* === LOADER DGOT === */
/*** NUEVO ***/
function showLoader() {
  const loader = document.getElementById("loaderOverlay");
  if (loader) loader.classList.remove("hidden");
}
function hideLoader() {
  const loader = document.getElementById("loaderOverlay");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.classList.add("hidden"), 600);
  }
}
/*** FIN NUEVO ***/

/* ************** LOGIN: ADMIN ************** */
function loginAdmin() {
  /*** NUEVO ***/ showLoader();
  const key = ($("keyPrivacy")?.value || "").trim();
  if (key === "DGOT2025") {
    localStorage.setItem("role","admin");
    applyRole("admin");
    closeLogin();
    alert("Bienvenido Administrador DGOT 🌎");
    /*** NUEVO ***/ setTimeout(hideLoader, 800);
  } else {
    alert("Clave incorrecta. Acceso denegado ❌");
    /*** NUEVO ***/ hideLoader();
  }
}

/* ************** LOGIN: SERVIDORES PÚBLICOS ************** */
function loginServidor() {
  /*** NUEVO ***/ showLoader();
  const user = ($("userServidor")?.value || "").trim();
  const pass = ($("passServidor")?.value || "").trim();
  if (user === "servidor" && pass === "12345") {
    localStorage.setItem("role","servidor");
    applyRole("servidor");
    closeLogin();
    alert("Acceso como Servidor Público 👷‍♂️");
    /*** NUEVO ***/ setTimeout(hideLoader, 800);
  } else {
    alert("Usuario o contraseña incorrectos ❌");
    /*** NUEVO ***/ hideLoader();
  }
}

/* ************** LOGIN: PÚBLICO ************** */
function loginPublico() {
  /*** NUEVO ***/ showLoader();
  const user = ($("userPublico")?.value || "").trim();
  const pass = ($("passPublico")?.value || "").trim();
  if (user === "publico" && pass === "123") {
    localStorage.setItem("role","publico");
    applyRole("publico");
    closeLogin();
    alert("Acceso público general 👥");
    /*** NUEVO ***/ setTimeout(hideLoader, 800);
  } else {
    alert("Usuario o contraseña incorrectos ❌");
    /*** NUEVO ***/ hideLoader();
  }
}

/* ************** COMPAT: alias login() → admin ************** */
function login(){ loginAdmin(); }

/* ************** RESTAURAR SESIÓN AL CARGAR ************** */
function restoreSession(){
  const role = localStorage.getItem("role");
  if (!role) return;
  if (role === "admin")   applyRole("admin");
  if (role === "servidor")applyRole("servidor");
  if (role === "publico") applyRole("publico");
}

/* ************** INICIALIZACIÓN ************** */
(function initAuth(){
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initLoginTabs();
      initEnterKeyLogin();
      restoreSession();
    });
  } else {
    initLoginTabs();
    initEnterKeyLogin();
    restoreSession();
  }
})();

/* ************** EXPONER A WINDOW ************** */
window.loginAdmin = loginAdmin;
window.loginServidor = loginServidor;
window.loginPublico = loginPublico;
window.logout = logout;
window.togglePrivacy = togglePrivacy;
window.login = login;

/******** NUEVO FIX FINAL: cierre completo del login y desbloqueo ********/
function closeLogin() {
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
    modal.style.visibility = "hidden";
    modal.style.opacity = "0";
    modal.style.pointerEvents = "none";
    modal.style.zIndex = "-9999";
  }
  const map = document.getElementById("map");
  const panel = document.getElementById("panel");
  if (map) map.style.pointerEvents = "auto";
  if (panel) {
    panel.style.pointerEvents = "auto";
    panel.querySelectorAll("input, textarea, select, button").forEach(el => {
      el.disabled = false;
      el.readOnly = false;
      el.style.pointerEvents = "auto";
    });
  }
  document.body.style.pointerEvents = "auto";
  console.log("✅ Modal cerrado y mapa desbloqueado correctamente.");

  setTimeout(()=>{
    const first = document.querySelector("#reportesBox input, #reportesBox textarea, #reportesBox select");
    if (first) first.focus();
  }, 50);
}
window.closeLogin = closeLogin;
/******** FIN NUEVO FIX FINAL ********/

/*************** FIX DEFINITIVO INTERACTIVIDAD PANEL + MAPA ***************/
function fullUnlockInteractive() {
  const modal = document.getElementById("loginModal");
  const panel = document.getElementById("panel");
  const map = document.getElementById("map");

  if (modal) {
    modal.style.display = "none";
    modal.style.pointerEvents = "none";
    modal.style.visibility = "hidden";
    modal.style.opacity = "0";
    modal.style.zIndex = "-9999";
  }

  if (map) {
    map.style.pointerEvents = "auto";
    map.style.zIndex = "1";
  }

  if (panel) {
    panel.style.pointerEvents = "auto";
    panel.querySelectorAll("input, textarea, select, button").forEach(el => {
      el.disabled = false;
      el.readOnly = false;
      el.style.pointerEvents = "auto";
    });
    panel.style.zIndex = "1500";
  }

  document.body.style.pointerEvents = "auto";
  console.log("✅ Interactividad total restaurada: mapa y panel activos.");
}

["loginAdmin", "loginServidor", "loginPublico"].forEach(fnName => {
  const fn = window[fnName];
  if (typeof fn === "function") {
    window[fnName] = function(...args) {
      const result = fn.apply(this, args);
      setTimeout(fullUnlockInteractive, 400);
      return result;
    };
  }
});
/*************** FIN FIX DEFINITIVO INTERACTIVIDAD PANEL + MAPA ***************/

function enablePanelUX(){
  const panel = document.getElementById("panel");
  if (!panel) return;

  try {
    if (window.L && L.DomEvent) {
      L.DomEvent.disableClickPropagation(panel);
      L.DomEvent.disableScrollPropagation(panel);
    }
  } catch(e){}

  panel.querySelectorAll("input[type=text], input[type=password], textarea, select")
    .forEach(el=>{
      ["mousedown","mouseup","click","focus"].forEach(evt=>{
        el.addEventListener(evt,(ev)=>{
          ev.stopPropagation();
        }, true);
      });
    });

  panel.querySelectorAll("button, input[type=checkbox], input[type=color], input[type=range]")
    .forEach(el=>{
      ["click","change"].forEach(evt=>{
        el.addEventListener(evt,()=>{}, false);
      });
    });
}
window.addEventListener("load", () => {
  enablePanelUX();
});

/* === CERRAR SESIÓN === */
async function logout() {
  try {
    console.log("🚪 Cerrando sesión...");
    if (window.supa) await supa.auth.signOut();
    document.getElementById("panel").style.display = "none";
    document.getElementById("loginModal").classList.add("active");
    localStorage.clear();
    sessionStorage.clear();
    console.log("✅ Sesión cerrada correctamente");
    alert("Has cerrado sesión correctamente.");
  } catch (err) {
    console.error("❌ Error al cerrar sesión:", err);
    alert("No se pudo cerrar sesión.");
  }
}
