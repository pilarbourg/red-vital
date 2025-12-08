document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "/api";

  // Log Out
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      window.location.href = "/login.html";
    });
  }

  // Gestión de pestañas
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

  // Dashboard
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
      alert("Error al cargar el dashboard");
    }
  };

  // Usuarios
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
      alert("Error al cargar usuarios");
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

      alert("Usuario actualizado");
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar usuario");
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

      alert("Usuario eliminado");
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar usuario");
    }
  };

  if (btnRefrescarUsuarios) {
    btnRefrescarUsuarios.addEventListener("click", cargarUsuarios);
  }

  // Solicitudes del Usuario
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
        params.set("estado", filtroEstadoSol.value.toUpperCase());
      }

      if (
        filtroPrioridadSol instanceof HTMLSelectElement &&
        filtroPrioridadSol.value
      ) {
        params.set("urgencia", filtroPrioridadSol.value.toUpperCase());
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
          <td>${s.grupo_sanguineo}</td>
          <td>${s.cantidad_unidades}</td>
          <td>
            <select class="selUrgencia" data-id="${s.id}">
              <option value="ALTA"  ${s.urgencia === "ALTA" ? "selected" : ""}>Alta</option>
              <option value="MEDIA" ${s.urgencia === "MEDIA" ? "selected" : ""}>Media</option>
              <option value="BAJA"  ${s.urgencia === "BAJA" ? "selected" : ""}>Baja</option>
            </select>
          </td>
          <td>
            <select class="selEstado" data-id="${s.id}">
              <option value="PENDIENTE"   ${s.estado === "PENDIENTE" ? "selected" : ""}>Pendiente</option>
              <option value="EN_PROCESO"  ${s.estado === "EN_PROCESO" ? "selected" : ""}>En proceso</option>
              <option value="COMPLETADA"  ${s.estado === "COMPLETADA" ? "selected" : ""}>Completada</option>
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
      alert("Error al cargar solicitudes");
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
      const selUrgencia = fila.querySelector(".selUrgencia");

      const payload = {
        estado:
          selEstado instanceof HTMLSelectElement ? selEstado.value : undefined,
        urgencia:
          selUrgencia instanceof HTMLSelectElement ? selUrgencia.value : undefined,
      };

      await apiFetch(`/admin/solicitudes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      alert("Solicitud actualizada");
      cargarSolicitudes();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar solicitud");
    }
  };

  if (btnRefrescarSolicitudes) {
    btnRefrescarSolicitudes.addEventListener("click", cargarSolicitudes);
  }

  cargarDashboard();
  cargarUsuarios();
  cargarSolicitudes();
});
