document.addEventListener("DOMContentLoaded", () => {
  //const saved = requireRole("ADMIN", "/frontend/pages/admin.html");
  //if (!saved) return;

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("user"); 
      window.location.href = "/login.html";
    });
  }

  const $stat = (id) => document.getElementById(id);

  const API_BASE = "/api/admin";

  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    let data = {};
    try {
      data = await response.json();
    } catch {}

    if (!response.ok) throw new Error(data.mensaje || "Error en la petición");

    return data;
  };

  const cargarDashboard = async () => {
    try {
      const info = await apiFetch("/dashboard");

      $stat("statTotalUsuarios").textContent = info.totalUsuarios ?? 0;
      $stat("statTotalDonantes").textContent = info.totalDonantes ?? 0;
      $stat("statTotalHospitales").textContent = info.totalHospitales ?? 0;
      $stat("statTotalSolicitudes").textContent = info.totalSolicitudes ?? 0;
      $stat("statSolPendientes").textContent = info.solicitudesPendientes ?? 0;
      $stat("statSolAlta").textContent = info.solicitudesAlta ?? 0;
      $stat("statTotalDonaciones").textContent = info.totalDonaciones ?? 0;
    } catch (error) {
      console.error(error);
      alert("Error al cargar el dashboard");
    }
  };

  const filtroRol = document.getElementById("filtroRol");
  const filtroActivos = document.getElementById("filtroActivos");
  const btnRefrescarUsuarios = document.getElementById("btnRefrescarUsuarios");
  const tablaUsuariosBody = document.getElementById("tablaUsuariosBody");

  const cargarUsuarios = async () => {
    if (!tablaUsuariosBody) return;

    try {
      const params = new URLSearchParams();
      if (filtroRol?.value) params.set("rol", filtroRol.value);
      if (filtroActivos?.checked) params.set("activo", "true");

      const usuarios = await apiFetch(`/admin/usuarios?${params.toString()}`);
      tablaUsuariosBody.innerHTML = "";

      for (const u of usuarios) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${u.id}</td>
          <td><input type="text" value="${
            u.nombre || ""
          }" data-field="nombre" /></td>
          <td><input type="email" value="${
            u.email || ""
          }" data-field="email" /></td>
          <td>
            <select data-field="rol">
              <option value="DONANTE" ${
                u.rol === "DONANTE" ? "selected" : ""
              }>Donante</option>
              <option value="HOSPITAL" ${
                u.rol === "HOSPITAL" ? "selected" : ""
              }>Hospital</option>
              <option value="ADMIN" ${
                u.rol === "ADMIN" ? "selected" : ""
              }>Admin</option>
            </select>
          </td>
          <td><input type="checkbox" data-field="activo" ${
            u.activo ? "checked" : ""
          } /></td>
          <td>
            <button class="btnGuardarUsuario" data-id="${u.id}">Guardar</button>
            <button class="btnEliminarUsuario" data-id="${
              u.id
            }">Eliminar</button>
          </td>
        `;

        tablaUsuariosBody.appendChild(tr);
      }

      tablaUsuariosBody
        .querySelectorAll(".btnGuardarUsuario")
        .forEach((btn) => {
          btn.addEventListener("click", (e) =>
            guardarUsuarioFila(e.currentTarget.dataset.id)
          );
        });
      tablaUsuariosBody
        .querySelectorAll(".btnEliminarUsuario")
        .forEach((btn) => {
          btn.addEventListener("click", (e) =>
            eliminarUsuario(e.currentTarget.dataset.id)
          );
        });
    } catch (error) {
      console.error(error);
      alert("Error al cargar usuarios");
    }
  };

  const guardarUsuarioFila = async (id) => {
    if (!id) return;
    const fila = Array.from(tablaUsuariosBody.querySelectorAll("tr")).find(
      (tr) => tr.querySelector(".btnGuardarUsuario")?.dataset.id === id
    );
    if (!fila) return;

    const payload = {};
    fila.querySelectorAll("input, select").forEach((el) => {
      const field = el.dataset.field;
      if (!field) return;
      payload[field] = el.type === "checkbox" ? el.checked : el.value;
    });

    try {
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
    if (!confirm("¿Seguro que quieres eliminar este usuario?")) return;
    try {
      await apiFetch(`/admin/usuarios/${id}`, { method: "DELETE" });
      alert("Usuario eliminado");
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar usuario");
    }
  };

  btnRefrescarUsuarios?.addEventListener("click", cargarUsuarios);

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
      if (filtroEstadoSol?.value)
        params.set("estado", filtroEstadoSol.value.toUpperCase());
      if (filtroPrioridadSol?.value)
        params.set("urgencia", filtroPrioridadSol.value.toUpperCase());

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
          <td>${s.Hospital?.nombre || "-"}</td>
          <td>${s.grupo_sanguineo}</td>
          <td>${s.cantidad_unidades}</td>
          <td>
            <select class="selUrgencia" data-id="${s.id}">
              <option value="ALTA" ${
                s.urgencia === "ALTA" ? "selected" : ""
              }>Alta</option>
              <option value="MEDIA" ${
                s.urgencia === "MEDIA" ? "selected" : ""
              }>Media</option>
              <option value="BAJA" ${
                s.urgencia === "BAJA" ? "selected" : ""
              }>Baja</option>
            </select>
          </td>
          <td>
            <select class="selEstado" data-id="${s.id}">
              <option value="PENDIENTE" ${
                s.estado === "PENDIENTE" ? "selected" : ""
              }>Pendiente</option>
              <option value="EN_PROCESO" ${
                s.estado === "EN_PROCESO" ? "selected" : ""
              }>En proceso</option>
              <option value="COMPLETADA" ${
                s.estado === "COMPLETADA" ? "selected" : ""
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

      tablaSolicitudesBody.querySelectorAll(".btnGuardarSol").forEach((btn) => {
        btn.addEventListener("click", (e) =>
          guardarSolicitud(e.currentTarget.dataset.id)
        );
      });
    } catch (error) {
      console.error(error);
      alert("Error al cargar solicitudes");
    }
  };

  const guardarSolicitud = async (id) => {
    const fila = Array.from(tablaSolicitudesBody.querySelectorAll("tr")).find(
      (tr) => tr.querySelector(".btnGuardarSol")?.dataset.id === id
    );
    if (!fila) return;

    const payload = {
      estado: fila.querySelector(".selEstado")?.value,
      urgencia: fila.querySelector(".selUrgencia")?.value,
    };

    try {
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

  btnRefrescarSolicitudes?.addEventListener("click", cargarSolicitudes);

  const btnAdd = document.getElementById("btnAdd");
  const hName = document.getElementById("hName");
  const hLoc = document.getElementById("hLoc");
  const hEmail = document.getElementById("hEmail");

  btnAdd.addEventListener("click", async () => {
    const name = hName.value.trim();
    const location = hLoc.value.trim();
    const email = hEmail.value.trim();

    if (!name || !location || !email) {
      alert("Completa todos los campos para crear un hospital");
      return;
    }

    try {
      await apiFetch("/hospitales", {
        method: "POST",
        body: JSON.stringify({ nombre: name, localizacion: location, email }),
      });

      alert("Hospital creado correctamente");
      hName.value = "";
      hLoc.value = "";
      hEmail.value = "";
    } catch (err) {
      console.error(err);
      alert("Error al crear hospital");
    }
  });

  cargarDashboard();
  cargarUsuarios();
  cargarSolicitudes();
});
