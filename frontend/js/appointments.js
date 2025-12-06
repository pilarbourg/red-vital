document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('apptForm');
  const feedback  = document.getElementById('feedback');
  const slotsEl   = document.getElementById('slots');
  const modeBtns  = document.querySelectorAll('.appt-mode-btn');
  const modeHint  = document.getElementById('modeHint');
  const hospitalSelect = document.getElementById('hospital');
  const doctorSelect   = document.getElementById('doctorSelect');
  const identityInputs = document.querySelectorAll('.field-identity input, .field-identity select');

  const API_BASE = "http://localhost:3000";

  let appointmentMode = null;
  let citas     = [];
  let hospitals = [];
  let currentDonor = null;


  async function loadCurrentDonor() {
    try {
      const saved = JSON.parse(localStorage.getItem('user'));

      if (!saved || !saved.id) {
        // No hay usuario logueado -> lo mandamos a login con vuelta a citas
        const params = new URLSearchParams({
          next: '/frontend/pages/appointments.html?mode=registered'
        });
        window.location.href = `login.html?${params.toString()}`;
        return null;
      }

      const res  = await fetch(`${API_BASE}/api/donantes/byUsuario/${saved.id}`);
      const data = await res.json();

      if (!data.ok) {
        console.error('Error obteniendo donante por usuario', data);
        return null;
      }

      // Estructura que usará setupRegisteredMode
      currentDonor = {
        id: data.id,
        nombre: data.nombre,
        apellidos: data.apellidos,
        genero: data.genero,
        fecha_nacimiento: data.dob,
        email: data.usuario?.email || null,
        telefono: data.usuario?.telefono || null,
      };

      return currentDonor;
    } catch (err) {
      console.error('Error cargando donante logueado', err);
      currentDonor = null;
      return null;
    }
  }

  
  function setMode(mode) {
    appointmentMode = mode;

    modeBtns.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.mode === mode);
    });
    
    if (mode === 'guest') {
      modeHint.textContent = 'Rellena tus datos para concertar una cita sin crear cuenta.';
      modeHint.classList.remove('hidden');
      setupGuestMode();
      form.classList.remove('hidden');
    } else if (mode === 'registered') {
      modeHint.textContent = 'Usaremos los datos de tu perfil de donante.';
      modeHint.classList.remove('hidden');
      setupRegisteredMode();
      form.classList.remove('hidden');
    } else {
      form.classList.add('hidden');
      modeHint.classList.add('hidden');
    }
    }
    
    function setupGuestMode() {
      identityInputs.forEach(el => {
        el.disabled = false;
      });

      form.reset();
      if (hospitalSelect) hospitalSelect.value = '';
      if (doctorSelect)
        doctorSelect.innerHTML = '<option value="">Selecciona un médico</option>';
    }

    let currentDonorId = null;
    
    async function setupRegisteredMode() {
      const d = currentDonor || await loadCurrentDonor();
      if (!d) return; // loadCurrentDonor ya redirige a login si hace falta

      document.getElementById('name').value =
        `${d.nombre} ${d.apellidos || ''}`.trim();
      document.getElementById('email').value  = d.email || '';
      document.getElementById('phone').value  = d.telefono || '';
      document.getElementById('gender').value = d.genero || '';
      document.getElementById('dob').value    = d.fecha_nacimiento || '';

      identityInputs.forEach(el => {
        el.disabled = true;
      });

      document.getElementById('date').value = '';
      document.getElementById('time').value = '';
      document.getElementById('msg').value  = '';

      if (doctorSelect)
        doctorSelect.innerHTML = '<option value="">Selecciona un médico</option>';
    }

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;

        // 1) Soy donante registrado → SIEMPRE ir a login
        if (mode === 'registered') {
          const params = new URLSearchParams({
            next: '/frontend/pages/appointments.html?mode=registered',
          });
          // página de login
          window.location.href = `login.html?${params.toString()}`;
          return;
        }

        // 2) Registrarme como donante: ir a register
        if (mode === 'register') {
          const params = new URLSearchParams({
            next: '/frontend/pages/appointments.html?mode=registered'
          });
          window.location.href = `register.html?${params.toString()}`;
          return;
        }

        // 3) Invitado: solo en este caso usamos setMode('guest')
        setMode(mode); // aquí solo entra cuando mode === 'guest'
      });
    });

   
    
    const urlParams   = new URLSearchParams(window.location.search);
    const initialMode = urlParams.get('mode');
    if (initialMode === 'registered') {
      setMode('registered');
    }


    function renderHospitals() {
      if (!hospitalSelect) return;
      hospitalSelect.innerHTML = '<option value="">(Cualquiera disponible)</option>';

      hospitals.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.id;
        opt.textContent = `${h.nombre} – ${h.ciudad}`;
        hospitalSelect.appendChild(opt);
      });
    }

    const deptSelect = document.getElementById('dept');
    async function loadDoctorsForSelection() {
      if (!doctorSelect) return;

      // Limpiamos siempre el select
      doctorSelect.innerHTML = '<option value="">Selecciona un médico</option>';

      const hospitalId = hospitalSelect.value;
      const deptValue  = deptSelect ? deptSelect.value : '';

      // Si no hay hospital o departamento, no pedimos nada
      if (!hospitalId || !deptValue) {
        return;
      }

      try {
        const params = new URLSearchParams({
          hospitalId: hospitalId,
          departamento: deptValue,
        });

        const res = await fetch(`${API_BASE}/api/doctores?${params.toString()}`);
        if (!res.ok) throw new Error('Error al cargar doctores');

        const doctores = await res.json();

        if (!Array.isArray(doctores) || !doctores.length) {
          return;
        }

        doctores.forEach(doc => {
          const opt = document.createElement('option');
          opt.value = doc.nombre;
          opt.textContent = doc.nombre;
          doctorSelect.appendChild(opt);
        });
      } catch (err) {
        console.error('Error cargando doctores:', err);
      }
    }
    
    if (hospitalSelect) {
      hospitalSelect.addEventListener('change', loadDoctorsForSelection);
    }

    if (deptSelect) {
      deptSelect.addEventListener('change', loadDoctorsForSelection);
    }

    

    async function loadHospitals() {
      try {
        const res = await fetch(`${API_BASE}/api/hospitales`);
        if (!res.ok) throw new Error('Error al cargar hospitales');

        hospitals = await res.json();
        if (!Array.isArray(hospitals)) hospitals = [];
        renderHospitals();

      } catch (err) {
        console.error(err);
        hospitals = [
          { id: 1, nombre: 'Hospital Central', ciudad: 'Madrid' },
          { id: 2, nombre: 'Clínica Norte', ciudad: 'Madrid' },
        ];
        renderHospitals();
      }
    }

    async function loadCitas() {
      try {
        const res = await fetch(`${API_BASE}/api/cita`);
        if (!res.ok) throw new Error('Error al cargar citas');
        citas = await res.json();
        renderCitas();
      } catch (err) {
        console.error(err);
        slotsEl.innerHTML = "<p class='appt-empty'>Error al cargar citas.</p>";
      }
    }

    function renderCitas() {
      if (!citas.length) {
        slotsEl.innerHTML = "<p class='appt-empty'>No hay citas.</p>";
        return;
      }

      const sorted = [...citas].sort((a, b) =>
        (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || ''))
      );

      const html = sorted
        .map(c => {
          const hosp = hospitals.find(h => String(h.id) === String(c.hospital_id));
          const hospLabel = hosp ? hosp.nombre : `Hospital #${c.hospital_id}`;
          return `
            <li class="appt-slot">
              <div class="appt-slot-main">
                <strong>${c.fecha}</strong> · ${c.hora || '—'}
                <span class="appt-badge">${c.departamento || 'General'}</span>
              </div>
              <div class="appt-slot-sub">
                ${hospLabel} · Médico: ${c.doctor || 'Por asignar'}
                · <em>${c.status || 'PENDIENTE'}</em>
              </div>
              <div class="appt-actions">
                <button data-act="done"    data-id="${c.id}">Completada</button>
                <button data-act="resched" data-id="${c.id}">Reprogramar</button>
                <button data-act="cancel"  data-id="${c.id}">Cancelar</button>
              </div>
            </li>
          `;
        })
        .join('');

      slotsEl.innerHTML = html;
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const v = id => document.getElementById(id).value.trim();

      if (!v('date') || !v('time')) {
        alert('Selecciona fecha y hora para la cita.');
        return;
      }

      let hospitalId = hospitalSelect.value;
      if (!hospitalId) {
        alert('Selecciona un hospital.');
        return;
      }

      const deptValue = document.getElementById('dept').value;
      if (!deptValue) {
        alert('Selecciona un departamento.');
        return;
      }

      let doctorName = doctorSelect.value;
      if (!doctorName) {
        alert('Selecciona un médico para la cita.');
        return;
      }

      let body = {
        hospital_id: hospitalId,
        fecha: v('date'),
        hora: v('time'),
        doctor: doctorName,
        departamento: v('dept'),
        mensaje: v('msg'),
      };

      if (appointmentMode === 'registered') {
        if (!currentDonor || !currentDonor.id) {
          alert('Debes iniciar sesión como donante para usar este modo.');
          return;
        }

        body.donante_id  = currentDonor.id;
        body.es_invitado = false;

      } else {

        if (!v('name') || !v('email') || !v('dob')) {
          alert('Nombre, email y fecha de nacimiento son obligatorios para invitados.');
          return;
        }

        body.donante_id       = null;
        body.es_invitado      = true;
        body.nombre_donante   = v('name');
        body.email_donante    = v('email');
        body.telefono_donante = v('phone');
        body.genero_donante   = document.getElementById('gender').value || null;
        body.dob_donante      = v('dob');
      }

      try {
        const res = await fetch(`${API_BASE}/api/cita`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Error al crear cita');
        }

        form.reset();
        if (appointmentMode === 'registered') {
          setupRegisteredMode();
        }
        feedback.classList.remove('hidden');
        setTimeout(() => feedback.classList.add('hidden'), 2500);

        await loadCitas();
      } catch (err) {
        console.error(err);
        alert('No se ha podido crear la cita.');
      }
    });


    slotsEl.addEventListener('click', async e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;

      const id  = btn.dataset.id;
      const act = btn.dataset.act;

      try {
        if (act === 'cancel') {
          await fetch(`${API_BASE}/api/cita/${id}`, { method: 'DELETE' });
        }

        if (act === 'done') {
          await fetch(`${API_BASE}/api/cita/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CONFIRMADA' }),
          });
        }

        if (act === 'resched') {
          const current = citas.find(c => String(c.id) === String(id));
          const nf = prompt('Nueva fecha (YYYY-MM-DD):', current?.fecha || '');
          const nh = prompt('Nueva hora (HH:MM):', current?.hora || '');
          if (nf && nh) {
            await fetch(`${API_BASE}/api/cita/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fecha: nf, hora: nh, status: 'PENDIENTE' }),
            });
          }
        }

        await loadCitas();
      } catch (err) {
        console.error(err);
        alert('No se ha podido actualizar la cita.');
      }
    });

    
  loadHospitals().then(loadCitas);
});