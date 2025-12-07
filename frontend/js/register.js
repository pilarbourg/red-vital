document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const nextFromUrl = params.get("next");
  // Si no viene ?next=, usamos lo que ponía el script original del HTML
  const next = nextFromUrl || "/frontend/pages/appointments.html?mode=registered";
  const forcedRole = (params.get("role") || "").toUpperCase(); // DONANTE / HOSPITAL / ADMIN o ""

  const form = document.getElementById("registerForm");

  const emailInput = document.getElementById("email");
  const passInput = document.getElementById("password");

  // Estos dos pueden no existir en tu HTML actual, por eso los tratamos como opcionales
  const direccionInput = document.getElementById("direccion");
  const telefonoInput = document.getElementById("telefono");

  const roleChooser = document.getElementById("rol-wrapper"); 
  const rolSelect = document.getElementById("rolSelect");   
  const hiddenRolInput = document.getElementById("rol"); 

  const donorFields = document.getElementById("donorFields");
  const hospitalFields = document.getElementById("hospitalFields");

  function showRoleFields(role) {
    if (!donorFields || !hospitalFields) return;

    const r = role ? role.toUpperCase() : "";

    if (!r) {
      donorFields.classList.add("hidden");
      hospitalFields.classList.add("hidden");
      return;
    }

    donorFields.classList.toggle("hidden", r !== "DONANTE");
    hospitalFields.classList.toggle("hidden", r !== "HOSPITAL");
  }

  let currentRole = null;

  if (forcedRole) {
    // CASO 1: vienes de un área concreta (Donante, Hospital...)
    currentRole = forcedRole;
    if (roleChooser) roleChooser.style.display = "none";
    if (hiddenRolInput) hiddenRolInput.value = forcedRole;
    showRoleFields(currentRole);
  } else {
    // CASO 2: vienes del botón Register genérico
    currentRole = rolSelect ? (rolSelect.value || "").toUpperCase() : "";
    if (roleChooser) roleChooser.style.display = "block";

    if (rolSelect) {
      rolSelect.addEventListener("change", () => {
        currentRole = (rolSelect.value || "").toUpperCase();
        if (hiddenRolInput) hiddenRolInput.value = currentRole;
        showRoleFields(currentRole);
      });
    }

    showRoleFields(currentRole);
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passInput ? passInput.value : "";
    const direccion = direccionInput ? direccionInput.value.trim() : "";
    const telefono = telefonoInput ? telefonoInput.value.trim() : "";

    const rol = (
      forcedRole ||
      (hiddenRolInput && hiddenRolInput.value) ||
      (rolSelect && rolSelect.value) ||
      ""
    ).toUpperCase();

    if (!email || !password || !rol) {
      alert("Email, contraseña y rol son obligatorios.");
      return;
    }

    const payload = {
      email,
      password,
      direccion,
      telefono,
      rol,
    };

    // Campos según rol
    if (rol === "DONANTE") {
      const nombre = document.getElementById("donante-nombre").value.trim();
      const apellidos = document.getElementById("donante-apellidos").value.trim();
      const genero = document.getElementById("donante-genero").value || null;
      const dob = document.getElementById("donante-dob").value;
      const grupo = document.getElementById("donante-grupo").value;
      const radio = document.getElementById("donante-radio").value;
      const condiciones = document.getElementById("donante-condiciones").value;

      if (!nombre || !apellidos || !dob || !grupo) {
        alert("Completa nombre, apellidos, fecha de nacimiento y grupo sanguíneo.");
        return;
      }

      payload.nombre = nombre;
      payload.apellidos = apellidos;
      payload.genero = genero;
      payload.dob = dob;
      payload.grupo_sanguineo = grupo;
      payload.radio_km_periferico = radio ? Number(radio) : 10;
      payload.condiciones = condiciones || null;
    } else if (rol === "HOSPITAL") {
      const nombreHosp = document.getElementById("hospital-nombre").value.trim();
      const dirHosp =
        document.getElementById("hospital-direccion").value.trim() ||
        direccion;
      const ciudadHosp = document.getElementById("hospital-ciudad").value.trim();

      if (!nombreHosp || !dirHosp || !ciudadHosp) {
        alert("Completa nombre, dirección y ciudad del hospital.");
        return;
      }

      payload.nombreHospital = nombreHosp;
      payload.direccionHospital = dirHosp;
      payload.ciudadHospital = ciudadHosp;
    } else if (rol === "ADMIN") {
      // No hay campos extra obligatorios
    } else {
      alert("Rol no válido.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.mensaje || "Error al registrar usuario");
        return;
      }

      alert(data.mensaje || "Registro completado. Ahora puedes iniciar sesión.");

      const loginParams = new URLSearchParams();
      loginParams.set("next", next);
      loginParams.set("role", rol);

      window.location.href = "login.html?" + loginParams.toString();
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    }
  });
});
