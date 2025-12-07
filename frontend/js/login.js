document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const nextFromUrl = params.get("next") || "";                
  const forcedRole = (params.get("role") || "").toUpperCase();

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passInput = document.getElementById("password");

  const titleEl = document.getElementById("loginTitle");
  const registerLink = document.getElementById("goRegister"); 

  // Ajustar título según rol 
  if (forcedRole && titleEl) {
    if (forcedRole === "ADMIN") {
      titleEl.textContent = "Accede al área de administración";
    } else if (forcedRole === "HOSPITAL") {
      titleEl.textContent = "Accede al área hospitalaria";
    } else if (forcedRole === "DONANTE") {
      titleEl.textContent = "Accede al área de donante";
    }
  }

  // Ajustar enlace "Regístrate" para conservar ?next= y ?role=
  if (registerLink) {
    const regParams = new URLSearchParams();
    if (nextFromUrl) regParams.set("next", nextFromUrl);
    if (forcedRole) regParams.set("role", forcedRole);
    registerLink.href = "register.html?" + regParams.toString();
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passInput ? passInput.value : "";

    if (!email || !password) {
      alert("Introduce email y contraseña");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.mensaje || "Error al iniciar sesión");
        return;
      }

      // Si estoy entrando a un área concreta, comprobar rol
      if (forcedRole && data.rol && data.rol.toUpperCase() !== forcedRole) {
        alert(
          `Esta cuenta es de tipo ${data.rol}, pero estás intentando entrar al área ${forcedRole}.`
        );
        return;
      }

      // Guardar usuario para que otras páginas sepan quién eres
      const user = {
        id: data.id,
        rol: data.rol,
        email,
      };
      localStorage.setItem("user", JSON.stringify(user));

      // Decidir a dónde redirigir (lógica del script original del HTML)
      let next = nextFromUrl;
      if (!next) {
        const rolUpper = (data.rol || "").toUpperCase();
        if (rolUpper === "DONANTE") {
          next = "/frontend/pages/areadonante.html";
        } else if (rolUpper === "HOSPITAL") {
          next = "/frontend/pages/areahospitalaria.html";
        } else if (rolUpper === "ADMIN") {
          next = "/frontend/pages/areaadmin.html";
        } else {
          next = "/index.html";
        }
      }

      window.location.href = next;
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    }
  });
});
