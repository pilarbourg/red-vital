
function getSavedUser() {
  const u = localStorage.getItem("user");
  if (!u) return null;
  return JSON.parse(u);
}
document.getElementById("btnConfirmarCodigo")
        .addEventListener("click", verificarCodigo);
document.getElementById("btnConfirmarCambios")
        .addEventListener("click", solicitarCambioCredenciales);

let DONANTE_ID = null;

async function resolveDonanteId() {
  const savedUser = getSavedUser();
  if (!savedUser) {
    console.error("❌ No hay usuario logueado");
    window.location.href = "login.html";
    return null;
  }

  try {
    const res = await fetch(`/api/donantes/byUsuario/${savedUser.id}`);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      console.error("❌ No existe un DONANTE para este usuario", data);
      return null;
    }

    DONANTE_ID = data.id;
    console.log("✔ DONANTE_ID =", DONANTE_ID);
    return DONANTE_ID;

  } catch (err) {
    console.error("❌ Error resolviendo DONANTE_ID:", err);
    return null;
  }
}

function calcularEdad(dob) {
  const n = new Date(dob);
  const h = new Date();
  let edad = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() ||
      (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) {
    edad--;
  }
  return edad;
}


async function cargarPerfil() {
  const res = await fetch(`/api/donantes/${DONANTE_ID}/perfil`);
  const d = await res.json();

  document.getElementById("donante-nombre").textContent = `${d.nombre} ${d.apellidos}`;
  document.getElementById("donante-email").textContent = d.usuario.email;
  document.getElementById("donante-telefono").textContent = d.usuario.telefono;
  document.getElementById("donante-direccion").textContent = d.usuario.direccion;

  document.getElementById("donante-sexo").textContent = d.genero;
  document.getElementById("donante-grupo").textContent = d.grupo_sanguineo;
  document.getElementById("donante-edad").textContent = calcularEdad(d.dob);

  document.getElementById("user-email").textContent = d.usuario.email;
  document.getElementById("user-rol").textContent = "DONANTE";
  
  const lista = document.getElementById("donante-afecciones");
  lista.innerHTML = "";
  if (d.condiciones) {
    d.condiciones.split(",").forEach(c => {
      lista.innerHTML += `<li>${c.trim()}</li>`;
    });
  }
}


async function cargarCentros() {
  try {
    const res = await fetch(`/api/donantes/${DONANTE_ID}/hospitales_cercanos`);
    const lista = await res.json();

    const cont = document.getElementById("centros-list");
    cont.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
      cont.innerHTML = `<p>No hay centros disponibles.</p>`;
      return;
    }

    lista.forEach(h => {
      cont.innerHTML += `
        <button class="center-btn">
          ${h.nombre} — <span class="distance">${h.distancia_km} km</span>
        </button>
      `;
    });

  } catch (err) {
    console.error(" ERROR al cargar centros:", err);
  }
}

async function cargarCredenciales() {
  try {
    const res = await fetch(`/api/donantes/${DONANTE_ID}/credenciales`);
    const data = await res.json();

    if (!data.ok) {
      console.error(" Error credenciales", data);
      return;
    }
  

  } catch (err) {
    console.error(" Error cargando credenciales:", err);
  }
}
let codigoPendiente = false;

async function solicitarCambioCredenciales() {
  const form = document.getElementById("credencialesForm");
  if (!form) return
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  const body = {};
  if (email) body.newEmail = email;
  if (password) body.newPassword = password;


  const res = await fetch(`/api/donantes/${DONANTE_ID}/credenciales/solicitar`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!data.ok) {
    showToast(data.error || "Error solicitando cambios", "error");
    return;
  }

  showToast("Código enviado a tu correo.", "success");

  document.getElementById("credenciales-step1").classList.add("hidden");
  document.getElementById("credenciales-step2").classList.remove("hidden");

  codigoPendiente = true;
}

async function verificarCodigo() {
  const codigo = document.getElementById("codigo-verificacion").value;

  if (!codigo) {
    showToast("Introduce el código", "error");
    return;
  }

  const res = await fetch(`/api/donantes/${DONANTE_ID}/credenciales/verificar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo })
  });

  const data = await res.json();

  if (!data.ok) {
    showToast(data.error || "Código incorrecto", "error");
    return;
  }

  showToast("Datos actualizados correctamente", "success");

  // Volvemos al step1 y recargamos credenciales visibles
  document.getElementById("credenciales-step1").classList.remove("hidden");
  document.getElementById("credenciales-step2").classList.add("hidden");

  cargarCredenciales();
  cargarPerfil();
}

function activarFormularioPerfil() {
  const form = document.getElementById("credencialesFormPerfil");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const direccion = document.getElementById("direccion")?.value.trim();
    const telefono = document.getElementById("telefono")?.value.trim();
    const afecciones = document.getElementById("afecciones")?.value.trim();

    const body = { direccion, telefono, condiciones: afecciones };

    const res = await fetch(`/api/donantes/${DONANTE_ID}/perfil`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.ok) {
      showToast("Perfil actualizado correctamente 👍", "success");

      // Refrescar vista actual
      setTimeout(() => location.reload(), 800);
    } else {
      showToast(data.error || "Error actualizando perfil", "error");
    }
  });
}

// Seleccionamos los botones del menú lateral
const navItems = document.querySelectorAll(".nav-item-card");

// Seleccionamos TODAS las secciones de contenido
const contentSections = document.querySelectorAll(".content-section");

// Asignamos evento click a cada botón
navItems.forEach(item => {
    item.addEventListener("click", () => {
        
        // 1) Quitar clase activa de todos los botones
        navItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        
        // 2) Ocultar todas las secciones
        contentSections.forEach(sec => sec.classList.remove("active-section"));
        
        // 3) Mostrar solo la sección clicada
        const target = item.dataset.target; // ejemplo: "perfil"
        const sectionToShow = document.getElementById(target);
        
        if (sectionToShow) {
            sectionToShow.classList.add("active-section");
            sectionToShow.scrollIntoView({ behavior: "smooth" });
        }
    });
});

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;

    toast.className = "toast";
    toast.classList.add(type);
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  
async function cargarNotificaciones() {
  try {
    const res = await fetch(`/api/donantes/${DONANTE_ID}/notificaciones`);
    const data = await res.json();

    const box = document.getElementById("notificaciones-list");
    box.innerHTML = "";

    if (!data.ok) {
      box.innerHTML = "<p>Error al cargar notificaciones.</p>";
      return;
    }

    const { personales, globales, solicitudes } = data;

    // Si no hay nada
    if ((!personales || !personales.length) && 
    (!globales || !globales.length) &&
        (!solicitudes || !solicitudes.length)) {
      box.innerHTML = "<p>No tienes notificaciones.</p>";
      return;
    }

    
    if (data.personales.length === 0) {
      box.innerHTML += "<p>No tienes notificaciones personales.</p>";
    } else {
      box.innerHTML += `<h3>🔔 Notificaciones personales</h3>`;
      data.personales.forEach(n => {
        box.innerHTML += `
          <div class="notification-item personal">
            <h4>${n.titulo || "Aviso"}</h4>
            <p>${n.mensaje}</p>
          </div>`;
      });
    }


    if (solicitudes.length) {
      box.innerHTML += `<h3>🩸 Solicitudes Urgentes de Hospitales</h3>`;

      solicitudes.forEach(s => {
        box.innerHTML += `
          <div class="notification-item urgent">
            <h4>URGENTE: Se necesita sangre ${s.grupo_sanguineo}</h4>
            <p><strong>Hospital:</strong> ${s.hospital.nombre}</p>
            <p><strong>Motivo:</strong> ${s.motivo || "—"}</p>
            <p><strong>Fecha:</strong> ${new Date(s.createdAt).toLocaleDateString()}</p>
          </div>
        `;
      });
    }

  } catch (err) {
    console.error("❌ Error cargando notificaciones:", err);
  }
}


function formatDate(dateStr) {
  if (!dateStr) return "—";

  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


async function cargarHistorial() {
  if (!DONANTE_ID) return console.error("❌ No hay DONANTE_ID");

  try {
    const res = await fetch(`/api/donantes/${DONANTE_ID}/dashboard`);
    const data = await res.json();

    const cont = document.getElementById("donation-list");
    cont.innerHTML = "";

    if (!data.ok) {
      cont.innerHTML = "<p>Error cargando historial.</p>";
      return;
    }

    const { donaciones, citas } = data;

    
    cont.innerHTML += `<h3 class="section-title">Donaciones previas</h3>`;

    if (!donaciones.length) {
      cont.innerHTML += "<p>No tienes donaciones registradas.</p>";
    } else {
      donaciones.forEach(d => {
        cont.innerHTML += `
          <div class="donation-item">
            <p><strong>Fecha:</strong> ${formatDate(d.fecha)}</p>
            <p><strong>Cantidad:</strong> ${d.cantidad_ml} ml</p>
            <p><strong>Centro:</strong> ${d.solicitud?.hospital?.nombre || "—"}</p>
          </div>
        `;
      });
    }

    
    cont.innerHTML += `<h3 class="section-title">Próximas citas</h3>`;

    if (!citas.length) {
      cont.innerHTML += "<p>No tienes citas programadas.</p>";
    } else {
      citas.forEach(c => {
        cont.innerHTML += `
          <div class="donation-item future">
            <p><strong>Fecha:</strong> ${formatDate(c.fecha)}</p>
            <p><strong>Hora:</strong> ${c.hora || "—"}</p>
            <p><strong>Centro:</strong> ${c.hospital?.nombre || "—"}</p>
          </div>
        `;
      });
    }

  } catch (err) {
    console.error("Error cargando historial:", err);
  }
}


function activarNavegacion() {
  const navItems = document.querySelectorAll(".nav-item-card");
  const sections = document.querySelectorAll(".content-section");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      sections.forEach(s => s.classList.remove("active-section"));

      const target = item.dataset.target;
      document.getElementById(target).classList.add("active-section");
    });
  });
}


document.addEventListener("DOMContentLoaded", async () => {

  // 1) Comprobar rol
  if (typeof requireRole === "function") {
    const saved = requireRole("DONANTE", "/frontend/pages/areadonante.html");
    if (!saved) return; // te redirige a login si no toca estar aquí
  }

  // 2) Activar botón Logout
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("user");
      const next = encodeURIComponent("/frontend/pages/areadonante.html");
      window.location.href = `login.html?role=DONANTE&next=${next}`;
    });
  }

  // 3) Resto de inicialización de la página

  const resolved = await resolveDonanteId();
  if (!resolved) return;
  activarFormularioPerfil();
  cargarPerfil();
  cargarCentros();
  cargarHistorial();
  cargarNotificaciones();
  cargarCredenciales();
  activarNavegacion();
});
