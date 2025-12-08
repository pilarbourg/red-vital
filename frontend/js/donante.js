/* ==========================================================
   OBTENER DONANTE_ID DESDE LOGIN REAL
========================================================== */


let DONANTE_ID = null;

async function resolveDonanteId(savedUser) {
  try {
    const res = await fetch(`/api/donantes/byUsuario/${savedUser.id}`);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      console.error("No hay donante asociado a este usuario", data);
      return null;
    }

    DONANTE_ID = data.id;
    return DONANTE_ID;
  } catch (err) {
    console.error("Error resolviendo DONANTE_ID:", err);
    return null;
  }
}


/* ==========================================================
   INICIO GLOBAL
========================================================== */
document.addEventListener("DOMContentLoaded", async () => {

   // 1) Comprobar que soy DONANTE, si no → login
  const savedUser = requireRole("DONANTE", "/frontend/pages/areadonante.html");
  if (!savedUser) return; // requireRole ya redirige

  // 2) Sacar DONANTE_ID real desde el backend
  await resolveDonanteId(savedUser);

  if (!DONANTE_ID) {
    console.error("No se pudo obtener DONANTE_ID");
    return;
  }
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }


  /* ================= PERFIL ================= */
  fetch(`/api/donantes/${DONANTE_ID}/perfil`)
    .then(r => r.json())
    .then(d => {
      document.getElementById("donante-nombre").textContent =
        `${d.nombre} ${d.apellidos}`;

      document.getElementById("donante-email").textContent = d.usuario.email;
      document.getElementById("donante-telefono").textContent = d.usuario.telefono;
      document.getElementById("donante-direccion").textContent = d.usuario.direccion;

      document.getElementById("donante-sexo").textContent = d.genero;
      document.getElementById("donante-grupo").textContent = d.grupo_sanguineo;
      document.getElementById("donante-edad").textContent = calcularEdad(d.dob);

      const lista = document.getElementById("donante-afecciones");
      lista.innerHTML = "";
      if (d.condiciones) {
        d.condiciones.split(",").forEach(c => {
          lista.innerHTML += `<li>${c.trim()}</li>`;
        });
      }
    });


  function calcularEdad(dob) {
    const n = new Date(dob);
    const h = new Date();
    let edad = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() ||
      (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) edad--;
    return edad;
  }


  /* ================= HOSPITALES CERCANOS ================= */
  fetch(`/api/donantes/${DONANTE_ID}/hospitales_cercanos`)
  .then(res => res.json())
  .then(lista => {
       console.log("DEBUG LISTA:", lista); // 👈
    const cont = document.getElementById("centros-list");
    cont.innerHTML = "";

     if (!lista || !Array.isArray(lista) || lista.length === 0) {
      cont.innerHTML = `<p>No hay centros cercanos disponibles.</p>`;
      return;
    }

    lista.forEach(h => {
      cont.innerHTML += `
        <button class="center-btn">
          ${h.nombre} — <span class="distance">${h.distancia_km} km</span>
        </button>
      `;
    });
  })
  .catch(err => console.error("ERROR FRONT CENTROS:", err));


  // ==================== CARGAR CREDENCIALES =====================

async function cargarCredenciales() {
  try {
    const res = await fetch(`/api/donantes/${DONANTE_ID}/credenciales`);
    const data = await res.json();

    if (!data.ok) return console.error("Error cargando credenciales", data);

    document.getElementById("user-email").textContent = data.email;
    document.getElementById("user-rol").textContent = data.rol;
  } catch (err) {
    console.error("Error fetch credenciales:", err);
  }
}

cargarCredenciales();

const credForm = document.getElementById("credencialesForm");

if (credForm) {
  credForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const body = {};
    if (email) body.email = email;
    if (password) body.password = password;

    const res = await fetch(`/api/donantes/${DONANTE_ID}/credenciales`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.ok) {
      showToast("Credenciales actualizadas correctamente", "success");
      cargarCredenciales();  // refresca pantalla
    }
  });
}

// =============================
//   NAVEGACIÓN ENTRE SECCIONES
// =============================

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
//const savedUser = JSON.parse(localStorage.getItem("user"));
  //const id = savedUser?.id_donante;

  if (!DONANTE_ID) return console.error("❌ No hay ID de donante");

  try {
    const res = await fetch(`/api/donantes/${DONANTE_ID}/notificaciones`);
    const lista = await res.json();

    const box = document.getElementById("notificaciones-list");
    box.innerHTML = "";
    if (!lista.length) {
      box.innerHTML += "<p>No tienes notificaciones.</p>";
      return;
    }

    lista.forEach(n => {
      box.innerHTML += `
        <div class="notification-item">
          <h4>${n.mensaje}</h4>
          <p>${new Date(n.createdAt).toLocaleDateString()}</p>
        </div>
      `;
    });

  
  } catch (err) {
    console.error("Error cargando notificaciones:", err);
  }
}
async function cargarHistorial() {
  //const savedUser = JSON.parse(localStorage.getItem("user"));
 // const id = savedUser?.id_donante;

  if (!DONANTE_ID) return console.error("❌ No hay ID de donante");

  try {
    const res = await fetch(`/api/donantes/${DONANTE_ID}/historial`);
    const lista = await res.json();

    const cont = document.getElementById("donation-list");
    cont.innerHTML = "";

    if (!lista.length) {
      cont.innerHTML = "<p>No hay donaciones registradas.</p>";
      return;
    }

    lista.forEach(d => {
      cont.innerHTML += `
        <div class="donation-item">
          <p><strong>Fecha:</strong> ${formatDate(d.fecha)}</p>
          <p><strong>Cantidad:</strong> ${d.cantidad_ml} ml</p>
          <p><strong>Centro:</strong> ${d.centro || "—"}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error("Error cargando historial:", err);
  }
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

cargarHistorial();
cargarNotificaciones();
});
