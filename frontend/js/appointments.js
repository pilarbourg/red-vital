document.addEventListener("DOMContentLoaded", () => {

  const KEY = "appointments";
  const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
  const save = (v) => localStorage.setItem(KEY, JSON.stringify(v));

  // Semilla para la primera vez que se carga la app
  if (load().length === 0) {
    save([
      { name: "Ana",   email: "ana@example.com",  date: "2025-11-05", time: "10:00", dept: "Banco de Sangre", doctor: "Dra. Ruiz",   state: "Pendiente" },
      { name: "Luis",  email: "luis@example.com", date: "2025-11-08", time: "12:30", dept: "Hematología",     doctor: "Dr. Pérez",  state: "Confirmada" }
    ]);
  }

  // --------- Referencias DOM ----------
  const form     = document.getElementById("apptForm");
  const feedback = document.getElementById("feedback");
  const slotsEl  = document.getElementById("slots");

  // --------- Render de la lista (Horario) ----------
  function render() {
    const list = load().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    if (!list.length) {
      slotsEl.innerHTML = "<p class='appt-empty'>No hay citas.</p>";
      return;
    }

    const html = list
      .map((i, idx) => `
        <li class="appt-slot">
          <div class="appt-slot-main">
            <strong>${i.date}</strong> · ${i.time}
            <span class="appt-badge">${i.dept || "General"}</span>
          </div>
          <div class="appt-slot-sub">
            Paciente: ${i.name} — ${i.doctor || "Por asignar"}
            ${i.state ? ` · <em>${i.state}</em>` : ""}
          </div>
          <div class="appt-actions">
            <button data-act="done"    data-i="${idx}">Completada</button>
            <button data-act="resched" data-i="${idx}">Reprogramar</button>
            <button data-act="cancel"  data-i="${idx}">Cancelar</button>
          </div>
        </li>
      `)
      .join("");

    slotsEl.innerHTML = html;
  }

  // --------- Crear cita (submit) ----------
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Valores del formulario
    const v = (id) => document.getElementById(id).value.trim();
    if (!v("name") || !v("email") || !v("date") || !v("time")) {
      alert("Completa nombre, email, fecha y hora.");
      return;
    }

    const appt = {
      name:   v("name"),
      gender: v("gender"),
      email:  v("email"),
      phone:  v("phone"),
      date:   v("date"),
      time:   v("time"),
      doctor: v("doctor"),
      dept:   v("dept"),
      msg:    v("msg"),
      state:  "Pendiente"
    };

    const list = load();
    list.push(appt);
    save(list);

    form.reset();
    // feedback al usuario (mismo patrón que usas en hospital: clase 'hidden')
    feedback.classList.remove("hidden");
    setTimeout(() => feedback.classList.add("hidden"), 2500);

    render();
  });

  // --------- Acciones por cita ----------
  slotsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;

    const idx = +btn.dataset.i;
    const act = btn.dataset.act;
    const list = load();
    const appt = list[idx];

    if (!appt) return;

    if (act === "cancel") {
      // Eliminar la cita
      list.splice(idx, 1);
    }

    if (act === "done") {
      // Marcar completada
      appt.state = "Completada";
    }

    if (act === "resched") {
      // Reprogramar:
      const nf = prompt("Nueva fecha (YYYY-MM-DD):", appt.date);
      const nh = prompt("Nueva hora (HH:MM):", appt.time);
      if (nf && nh) {
        appt.date = nf;
        appt.time = nh;
        appt.state = "Pendiente"; // vuelve a pendiente tras cambiar hora/fecha
      }
    }

    save(list);
    render();
  });

  render();
});