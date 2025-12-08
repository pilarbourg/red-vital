document.addEventListener("DOMContentLoaded", async () => {

  const saved = requireRole("HOSPITAL", "/frontend/pages/areahospitalaria.html");
  if (!saved) return;

  let HOSPITAL_ID = null;
  try {
    const res = await fetch(`/api/hospitales/byUsuario/${saved.id}`);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      showToast("No se ha encontrado un hospital asociado a este usuario", "error");
      return;
    }

    HOSPITAL_ID = data.id;
    console.log("Hospital logueado:", HOSPITAL_ID, data.nombre);
  } catch (err) {
    console.error("Error obteniendo hospital por usuario:", err);
    showToast("No se han podido cargar los datos del hospital", "error");
    return;
  }

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }

  const addDonationBtn = document.getElementById("addDonationBtn");
  const donationForm = document.getElementById("donationForm");
  const donationsList = document.getElementById("donationsList");
  const notificationDonorResultsBody = document.getElementById(
    "notificationDonorResultsBody"
  );
  const notificationSearchBtn = document.querySelector(
    ".send-right .btn-search"
  );
  const notificationDonorResults = document.querySelector(".donor-results");
  const notificationMessageBox = document.querySelector(".message-box");
  const notificationTextarea = document.querySelector(".message-box textarea");
  const notificationSendBtn = document.querySelector(".btn-send");
  const notificationBloodGroupSelect =
    document.querySelector(".send-right select");
  const notificationNameInput = document.getElementById("donor-name-filter");

  addDonationBtn.addEventListener("click", () => {
    donationForm.classList.toggle("hidden");
  });

  document.getElementById("updateBtn").addEventListener("click", async () => {
    const selects = document.querySelectorAll(".estado-select");

    for (let select of selects) {
      const estado = select.value;
      const solicitudId = select.getAttribute("data-solicitud-id");

      const res = await fetch(
        `http://localhost:3000/api/solicitud/${solicitudId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado }),
        }
      );

      if (!res.ok)
        console.error(`Error al actualizar solicitud ${solicitudId}`);
    }

    showToast("Todas las solicitudes fueron actualizadas ✔");
  });

  const updateBtn = document.getElementById("updateBtn");

  function applyColor(select, estado) {
    select.style.fontWeight = "600";
    select.style.color =
      estado === "Pendiente"
        ? "#d90429"
        : estado === "En Proceso"
        ? "#ffb703"
        : "#2a9d8f";
  }

  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("estado-select")) {
      applyColor(e.target, e.target.value);
    }
  });

  document.querySelectorAll(".estado-select").forEach((select) => {
    applyColor(select, select.value);
  });

  const donorResults = document.querySelector(".donor-results");
  const messageBox = document.querySelector(".message-box");
  const searchBtn = document.querySelector(".btn-search");
  const sendBtn = document.querySelector(".btn-send");

  searchBtn.addEventListener("click", () =>
    donorResults.classList.remove("hidden")
  );

  donorResults.addEventListener("change", (e) => {
    if (e.target.classList.contains("select-donor")) {
      const anySelected =
        document.querySelectorAll(".select-donor:checked").length > 0;
      if (anySelected) messageBox.classList.remove("hidden");
      else messageBox.classList.add("hidden");
    }
  });

  notificationSearchBtn.addEventListener("click", async () => {
    const grupo = notificationBloodGroupSelect.value;
    const nombre = notificationNameInput.value.trim();

    let url = `http://localhost:3000/api/hospitales/${HOSPITAL_ID}/donantes?`;

    if (grupo && grupo !== "Todos")
      url += `grupo=${encodeURIComponent(grupo)}&`;
    if (nombre) url += `nombre=${encodeURIComponent(nombre)}&`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error fetching donors");

      const donantes = await res.json();

      notificationDonorResultsBody.innerHTML = "";

      if (donantes.length === 0) {
        notificationDonorResultsBody.innerHTML = `<tr><td colspan="4">No se encontraron donantes</td></tr>`;
        notificationMessageBox.classList.add("hidden");
        return;
      }

      donantes.forEach((d) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="checkbox" class="select-donor" data-donante-id="${
            d.id
          }"></td>
          <td>${d.nombre} ${d.apellidos}</td>
          <td>${d.grupo_sanguineo}</td>
          <td>${d.email || "-"}</td>
        `;
        notificationDonorResultsBody.appendChild(tr);
      });

      notificationDonorResults.classList.remove("hidden");
      notificationMessageBox.classList.add("hidden");
    } catch (error) {
      showToast("Error al buscar donantes", "error");
      console.error(error);
    }
  });

  notificationDonorResultsBody.addEventListener("change", (e) => {
    if (e.target.classList.contains("select-donor")) {
      const anySelected =
        notificationDonorResultsBody.querySelectorAll(".select-donor:checked")
          .length > 0;
      if (anySelected) notificationMessageBox.classList.remove("hidden");
      else notificationMessageBox.classList.add("hidden");
    }
  });

  notificationSendBtn.addEventListener("click", async () => {
    const selectedCheckboxes = notificationDonorResultsBody.querySelectorAll(
      ".select-donor:checked"
    );
    if (selectedCheckboxes.length === 0) {
      showToast(
        "Por favor selecciona al menos un donante antes de enviar", "warning");
      return;
    }

    const mensaje = notificationTextarea.value.trim();
    if (!mensaje) {
      showToast("Por favor escribe un mensaje antes de enviar", "warning");
      return;
    }

    try {
      for (const checkbox of selectedCheckboxes) {
        const donanteId = checkbox.getAttribute("data-donante-id");

        const res = await fetch(
          "http://localhost:3000/api/donantes/notificar",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuario_id: parseInt(donanteId),
              grupo_sanguineo: notificationBloodGroupSelect.value,
              mensaje:
                mensaje ||
                `Se requiere donación urgente del tipo ${notificationBloodGroupSelect.value}`,
            }),
          }
        );

        if (!res.ok)
          throw new Error(
            `Error enviando notificación al donante ${donanteId}`
          );
      }

      showToast("¡Notificaciones enviadas exitosamente! ✔");

      notificationTextarea.value = "";
      selectedCheckboxes.forEach((cb) => (cb.checked = false));
      notificationMessageBox.classList.add("hidden");
      notificationDonorResults.classList.add("hidden");
    } catch (error) {
      console.error(error);
      showToast("Error enviando notificaciones", "error");
    }
  });

  const gridItems = document.querySelectorAll(".statistics-grid .grid-item");
  gridItems.forEach((item) => {
    item.addEventListener("click", () => {
      gridItems.forEach((i) => i.classList.remove("selected"));
      item.classList.add("selected");
    });
  });

  async function loadSolicitudes() {
    try {
      const res = await fetch(
        `http://localhost:3000/api/hospitales/${HOSPITAL_ID}/solicitudes`
      );
      if (!res.ok) throw new Error("Error fetching solicitudes");
      const solicitudes = await res.json();

      const tbody = document.getElementById("solicitudesTableBody");
      tbody.innerHTML = "";

      solicitudes.forEach((solicitud) => {
        const tr = document.createElement("tr");

        const fechaLimite = solicitud.fecha_limite
          ? new Date(solicitud.fecha_limite).toLocaleDateString()
          : "-";
        //TODO : handle the date
        tr.innerHTML = `
          <td>${solicitud.grupo_sanguineo}</td>
          <td>${solicitud.cantidad_unidades}</td>
          <td>${solicitud.urgencia}</td>
          <td>${fechaLimite}</td>
          <td>
            <select class="estado-select" data-solicitud-id="${solicitud.id}">
              <option value="PENDIENTE" ${
                solicitud.estado === "PENDIENTE" ? "selected" : ""
              }>Pendiente</option>
              <option value="PARCIAL" ${
                solicitud.estado === "PARCIAL" ? "selected" : ""
              }>Parcial</option>
              <option value="CUBIERTA" ${
                solicitud.estado === "CUBIERTA" ? "selected" : ""
              }>Cubierta</option>
              <option value="CANCELADA" ${
                solicitud.estado === "CANCELADA" ? "selected" : ""
              }>Cancelada</option>
            </select>
          </td>
        `;

        tbody.appendChild(tr);
      });

      document.querySelectorAll(".estado-select").forEach((select) => {
        applyColor(select, select.value);
      });
    } catch (error) {
      console.error(error);
      showToast("Error al cargar solicitudes", "error");
    }
  }

  loadSolicitudes();

  document
    .querySelector(".btn-create.btn-search")
    .addEventListener("click", async () => {
      const grupo = document
        .getElementById("grupo-sanguineo-filter")
        .value.trim();
      const nombre = document
        .getElementById("nombre-donante-filter")
        .value.trim();

      let url = `http://localhost:3000/api/hospitales/${HOSPITAL_ID}/donantes?`;

      if (grupo && grupo !== "Todos")
        url += `grupo=${encodeURIComponent(grupo)}&`;
      if (nombre) url += `nombre=${encodeURIComponent(nombre)}&`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Error fetching donors");

        const donantes = await res.json();

        const tbody = document.getElementById("donorResultsTableBody");
        tbody.innerHTML = ""; // clear previous results

        if (donantes.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5">No se encontraron donantes</td></tr>`;
        } else {
          donantes.forEach((d) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${d.nombre} ${d.apellidos}</td>
            <td>${calculateAge(d.dob)}</td>
            <td>${d.grupo_sanguineo}</td>
            <td>${d.email || "-"}</td>
            <td>${d.telefono || "-"}</td>
          `;
            tbody.appendChild(tr);
          });
        }

        showToast(`${donantes.length} donantes encontrados`, "success");
      } catch (error) {
        showToast("Error al buscar donantes", "error");
        console.error(error);
      }
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

  function calculateAge(dob) {
    const birthDate = new Date(dob);
    const diffMs = Date.now() - birthDate.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }

  function applyColor(select, estado) {
    select.style.fontWeight = "600";
    estado = estado.toUpperCase();

    select.style.color =
      estado === "PENDIENTE"
        ? "#d90429"
        : estado === "PARCIAL"
        ? "#ffb703"
        : estado === "CUBIERTA"
        ? "#2a9d8f"
        : estado === "CANCELADA"
        ? "#666666"
        : "#000000";
  }

  const pendingElement = document.querySelector(
    '[data-grid="pending-requests"] .stat-number .number'
  );
  const pie = document.getElementById("completedPie");

  async function loadHospitalStats() {
    const hospitalId = HOSPITAL_ID; 

    try {
      const response = await fetch(
        `http://localhost:3000/api/hospitales/${hospitalId}/solicitudes/stats`
      );
      if (!response.ok) throw new Error("Error fetching stats");
      const stats = await response.json();

      const completedPercentage = stats.total
        ? (stats.cubiertas / stats.total) * 100
        : 0;

      pie.style.background = `conic-gradient(
        #457b9d 0% ${completedPercentage}%,
        #457b9d53 ${completedPercentage}% 100%
      )`;

      if (pendingElement) {
        pendingElement.textContent = stats.pendientes;
      }
    } catch (err) {
      console.error(err);
    }
  }

  loadHospitalStats();

  function addSolicitudToDashboard(solicitud) {
    const tbody = document.getElementById("solicitudesTableBody");
    const tr = document.createElement("tr");

    const fechaLimite = solicitud.fecha_limite
      ? new Date(solicitud.fecha_limite).toLocaleDateString()
      : "-";

    tr.innerHTML = `
      <td>${solicitud.grupo_sanguineo}</td>
      <td>${solicitud.cantidad_unidades}</td>
      <td>${fechaLimite}</td>
      <td>
        <select class="estado-select" data-solicitud-id="${solicitud.id}">
          <option value="PENDIENTE">Pendiente</option>
          <option value="PARCIAL">Parcial</option>
          <option value="CUBIERTA">Cubierta</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </td>
    `;

    tbody.appendChild(tr);

    const select = tr.querySelector(".estado-select");
    applyColor(select, select.value);
  }

  async function loadDonantesSelect() {
    try {
      const res = await fetch(`http://localhost:3000/api/hospitales/${HOSPITAL_ID}/donantes`);
      if (!res.ok) throw new Error("Error fetching donantes");
      const donantes = await res.json();

      const donanteSelect = document.getElementById("donanteSelect");
      donanteSelect.innerHTML = '<option value="">-- Selecciona un donante --</option>';

      donantes.forEach(d => {
        const option = document.createElement("option");
        option.value = d.id;
        option.textContent = `${d.nombre} ${d.apellidos} (${d.grupo_sanguineo})`;
        donanteSelect.appendChild(option);
      });
    } catch (error) {
      console.error(error);
      showToast("Error cargando donantes para registrar", "error");
    }
  }

  async function loadSolicitudesSelect() {
    try {
      const res = await fetch(`http://localhost:3000/api/hospitales/${HOSPITAL_ID}/solicitudes`);
      if (!res.ok) throw new Error("Error fetching solicitudes");
      const solicitudes = await res.json();

      const solicitudSelect = document.getElementById("solicitudSelect");
      solicitudSelect.innerHTML = '<option value="">-- Selecciona una solicitud --</option>';

      solicitudes.forEach(s => {
        solicitudSelect.appendChild(
          new Option(
            `${s.grupo_sanguineo} - ${s.cantidad_unidades} unidades`,
            s.id
          )
        );
      });
    } catch (error) {
      console.error(error);
      showToast("Error cargando solicitudes para registrar", "error");
    }
  }

  loadDonantesSelect();
  loadSolicitudesSelect();

  function updateSolicitudInDashboard(solicitud) {
    const tbody = document.getElementById("solicitudesTableBody");
    const row = tbody
      .querySelector(`.estado-select[data-solicitud-id="${solicitud.id}"]`)
      ?.closest("tr");
    if (!row) return;

    row.cells[0].textContent = solicitud.grupo_sanguineo;
    row.cells[1].textContent = solicitud.cantidad_unidades;
    row.cells[2].textContent = solicitud.fecha_limite
      ? new Date(solicitud.fecha_limite).toLocaleDateString()
      : "-";

    const select = row.querySelector(".estado-select");
    select.value = solicitud.estado || select.value;
    applyColor(select, select.value);
  }

  const createBtn = document.querySelector(".blood-request-left .btn-create");
  if (createBtn) {
    createBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const tipoSelect = document.querySelector("select[name='tipo']");
      const cantidadInput = document.querySelector("input[type='number']");
      const comentariosTextarea = document.querySelector("textarea");

      if (!tipoSelect || !cantidadInput || !comentariosTextarea) return;

      const tipo = tipoSelect.value;
      const cantidad = cantidadInput.value;
      const comentarios = comentariosTextarea.value;

      try {
        const res = await fetch(
          `http://localhost:3000/api/hospitales/${HOSPITAL_ID}/solicitud`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              grupo_sanguineo: tipo,
              cantidad_unidades: cantidad,
              comentarios,
            }),
          }
        );

        const data = await res.json();
        console.log("Solicitud creada:", data);
        showToast("Solicitud creada exitosamente ✔", "success");
      } catch (err) {
        console.error(err);
        showToast("Error al crear la solicitud", "error");
      }
    });
  }

  const socket = io(); 

  socket.on("connect", () => {
    console.log("Socket conectado:", socket.id);
  });

  socket.on("solicitud:nueva", (solicitud) => {
    console.log("Solicitud nueva recibida via socket", solicitud);
    addSolicitudToDashboard(solicitud);
  });

  socket.on("solicitud:update", (solicitud) => {
    console.log("Solicitud actualizada recibida via socket", solicitud);
    updateSolicitudInDashboard(solicitud);
  });

});
