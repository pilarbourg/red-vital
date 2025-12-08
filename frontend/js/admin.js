document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "/api";


//Log Out

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      window.location.href = "/login.html";
    });
  }

//Gestión de pestañas

  const tabButtons = document.querySelectorAll(".tab-button");
  const tabs = document.querySelectorAll(".tab");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");

      const tabId = button.dataset.tab;
      tabs.forEach((tab) => tab.classList.remove("active"));

      if (tabId) {
        const activeTab = document.getElementById(tabId);
        if (activeTab) activeTab.classList.add("active");
      }
    });
  });



  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const respuesta = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    let data = {};
    try {
      data = await respuesta.json();
    } catch {
      data = {};
    }

    if (!respuesta.ok) {
      throw new Error(data.mensaje || "Error en la petición");
    }

    return data;
  };



//Dashboard

  const $stat = (id) => document.getElementById(id);

  const cargarDashboard = async () => {
    try {
      const info = await apiFetch("/admin/dashboard");

      const elTotalUsuarios = $stat("statTotalUsuarios");
      if (elTotalUsuarios)
        elTotalUsuarios.textContent = info.totalUsuarios ?? 0;

      const elTotalDonantes = $stat("statTotalDonantes");
      if (elTotalDonantes)
        elTotalDonantes.textContent = info.totalDonantes ?? 0;

      const elTotalHospitales = $stat("statTotalHospitales");
      if (elTotalHospitales)
        elTotalHospitales.textContent = info.totalHospitales ?? 0;

      const elTotalSolicitudes = $stat("statTotalSolicitudes");
      if (elTotalSolicitudes)
        elTotalSolicitudes.textContent = info.totalSolicitudes ?? 0;

      const elSolPendientes = $stat("statSolPendientes");
      if (elSolPendientes)
        elSolPendientes.textContent = info.solicitudesPendientes ?? 0;

      const elSolAlta = $stat("statSolAlta");
      if (elSolAlta)
        elSolAlta.textContent = info.solicitudesAlta ?? 0;

      const elTotalDonaciones = $stat("statTotalDonaciones");
      if (elTotalDonaciones)
        elTotalDonaciones.textContent = info.totalDonaciones ?? 0;
    } catch (error) {
      console.error(error);
      showToast("Error al cargar el dashboard", "error");
    }
  };


//Usuarios

  const filtroRol = document.getElementById("filtroRol");
  const filtroActivos = document.getElementById("filtroActivos");
  const btnRefrescarUsuarios = document.getElementById("btnRefrescarUsuarios");
  const tablaUsuariosBody = document.getElementById("tablaUsuariosBody");

  const cargarUsuarios = async () => {
    if (!tablaUsuariosBody) return;

    try {
      const params = new URLSearchParams();

      if (filtroRol instanceof HTMLSelectElement && filtroRol.value) {
        params.set("rol", filtroRol.value);
      }

      if (filtroActivos instanceof HTMLInputElement && filtroActivos.checked) {
        params.set("activo", "true");
      }

      const usuarios = await apiFetch(
        `/admin/usuarios?${params.toString()}`
      );

      tablaUsuariosBody.innerHTML = "";

      for (const u of usuarios) {
        const tr = document.createElement("tr");

        const isDonante = u.rol === "DONANTE" || u.rol === "donante";
        const isHospital = u.rol === "HOSPITAL" || u.rol === "hospital";
        const isAdmin = u.rol === "ADMIN" || u.rol === "admin";

        tr.innerHTML = `
          <td>${u.id}</td>
          <td>
            <input type="text" value="${u.nombre || ""}" data-field="nombre" />
          </td>
          <td>
            <input type="email" value="${u.email}" data-field="email" />
          </td>
          <td>
            <select data-field="rol">
              <option value="DONANTE" ${isDonante ? "selected" : ""}>Donante</option>
              <option value="HOSPITAL" ${isHospital ? "selected" : ""}>Hospital</option>
              <option value="ADMIN" ${isAdmin ? "selected" : ""}>Admin</option>
            </select>
          </td>
          <td>
            <input type="checkbox" data-field="activo" ${
              u.activo ? "checked" : ""
            } />
          </td>
          <td>
            <button class="btnGuardarUsuario" data-id="${u.id}">Guardar</button>
            <button class="btnEliminarUsuario" data-id="${u.id}">Eliminar</button>
          </td>
        `;

        tablaUsuariosBody.appendChild(tr);
      }

      tablaUsuariosBody
        .querySelectorAll(".btnGuardarUsuario")
        .forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            if (id) guardarUsuarioFila(id);
          });
        });

      tablaUsuariosBody
        .querySelectorAll(".btnEliminarUsuario")
        .forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            if (id) eliminarUsuario(id);
          });
        });
    } catch (error) {
      console.error(error);
      showToast("Error al cargar usuarios", "error");
    }
  };

  const guardarUsuarioFila = async (id) => {
    if (!tablaUsuariosBody) return;

    try {
      const filas = Array.from(tablaUsuariosBody.querySelectorAll("tr"));
      const fila = filas.find(
        (tr) =>
          tr.querySelector(".btnGuardarUsuario")?.getAttribute("data-id") ===
          id
      );

      if (!fila) return;

      const campos = fila.querySelectorAll("input, select");
      const payload = {};

      campos.forEach((el) => {
        const field = el.getAttribute("data-field");
        if (!field) return;

        if (el instanceof HTMLInputElement && el.type === "checkbox") {
          payload[field] = el.checked;
        } else if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement
        ) {
          payload[field] = el.value;
        }
      });

      await apiFetch(`/admin/usuarios/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      showToast("Usuario actualizado", "success");
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar el usuario", "error");
    }
  };

  const eliminarUsuario = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar este usuario?"
    );
    if (!confirmar) return;

    try {
      await apiFetch(`/admin/usuarios/${id}`, {
        method: "DELETE",
      });

      showToast("Usuario eliminado correctamente", "success");
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      showToast("Error al eliminar el usuario", "error");
    }
  };

  if (btnRefrescarUsuarios) {
    btnRefrescarUsuarios.addEventListener("click", cargarUsuarios);
  }



//Solicitudes del Usuario

  const filtroEstadoSol = document.getElementById("filtroEstadoSol");
  const filtroPrioridadSol = document.getElementById("filtroPrioridadSol");
  const btnRefrescarSolicitudes = document.getElementById(
    "btnRefrescarSolicitudes"
  );
  const tablaSolicitudesBody = document.getElementById("tablaSolicitudesBody");

  const cargarSolicitudes = async () => {
    if (!tablaSolicitudesBody) return;

    try {
      const params = new URLSearchParams();

      if (
        filtroEstadoSol instanceof HTMLSelectElement &&
        filtroEstadoSol.value
      ) {
        params.set("estado", filtroEstadoSol.value);
      }

      if (
        filtroPrioridadSol instanceof HTMLSelectElement &&
        filtroPrioridadSol.value
      ) {
        params.set("prioridad", filtroPrioridadSol.value);
      }

      const solicitudes = await apiFetch(
        `/admin/solicitudes?${params.toString()}`
      );

      tablaSolicitudesBody.innerHTML = "";

      for (const s of solicitudes) {
        const tr = document.createElement("tr");
        const fecha = s.createdAt
          ? new Date(s.createdAt).toLocaleString()
          : "-";

        tr.innerHTML = `
          <td>${s.id}</td>
          <td>${s.Hospital && s.Hospital.nombre ? s.Hospital.nombre : "-"}</td>
          <td>${s.tipoSangre}</td>
          <td>${s.cantidad}</td>
          <td>
            <select class="selPrioridad" data-id="${s.id}">
              <option value="alta" ${s.prioridad === "alta" ? "selected" : ""}>Alta</option>
              <option value="media" ${s.prioridad === "media" ? "selected" : ""}>Media</option>
              <option value="baja" ${s.prioridad === "baja" ? "selected" : ""}>Baja</option>
            </select>
          </td>
          <td>
            <select class="selEstado" data-id="${s.id}">
              <option value="pendiente" ${
                s.estado === "pendiente" ? "selected" : ""
              }>Pendiente</option>
              <option value="en_proceso" ${
                s.estado === "en_proceso" ? "selected" : ""
              }>En proceso</option>
              <option value="completada" ${
                s.estado === "completada" ? "selected" : ""
              }>Completada</option>
            </select>
          </td>
          <td>${fecha}</td>
          <td>
            <button class="btnGuardarSol" data-id="${s.id}">Guardar</button>
          </td>
        `;

        tablaSolicitudesBody.appendChild(tr);
      }

      tablaSolicitudesBody
        .querySelectorAll(".btnGuardarSol")
        .forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            if (id) guardarSolicitud(id);
          });
        });
    } catch (error) {
      console.error(error);
      showToast("Error al cargar solicitudes", "error");
    }
  };

  const guardarSolicitud = async (id) => {
    if (!tablaSolicitudesBody) return;

    try {
      const filas = Array.from(tablaSolicitudesBody.querySelectorAll("tr"));
      const fila = filas.find(
        (tr) =>
          tr.querySelector(".btnGuardarSol")?.getAttribute("data-id") === id
      );

      if (!fila) return;

      const selEstado = fila.querySelector(".selEstado");
      const selPrioridad = fila.querySelector(".selPrioridad");

      const payload = {
        estado: selEstado ? selEstado.value : undefined,
        prioridad: selPrioridad ? selPrioridad.value : undefined,
      };

      await apiFetch(`/admin/solicitudes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      showToast("Solicitud actualizada correctamente", "success");
      cargarSolicitudes();
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar la solicitud", "error");
    }
  };

  if (btnRefrescarSolicitudes) {
    btnRefrescarSolicitudes.addEventListener("click", cargarSolicitudes);
  }

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


  cargarDashboard();
  cargarUsuarios();
  cargarSolicitudes();
});

