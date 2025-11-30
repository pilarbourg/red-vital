document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('apptForm');
  const feedback  = document.getElementById('feedback');
  const slotsEl   = document.getElementById('slots');
  const modeBtns  = document.querySelectorAll('.appt-mode-btn');
  const modeHint  = document.getElementById('modeHint');
  const hospitalSelect = document.getElementById('hospital');
  const doctorSelect   = document.getElementById('doctorSelect');
  const identityInputs = document.querySelectorAll('.field-identity input, .field-identity select');

  let appointmentMode = null;
  let citas     = [];
  let hospitals = [];
  let doctorAssignments = {};
  let currentDonor = null;
    
  const ME_ENDPOINT = '/api/donantes/me';

  async function loadCurrentDonor() {
    try {
      const res = await fetch(ME_ENDPOINT, {
        credentials: 'include',
      });

      if (!res.ok) {
        currentDonor = null;
        return null;
      }

      const data = await res.json();
      currentDonor = data;
      return data;
    } catch (err) {
      console.error('Error cargando donante logueado', err);
      currentDonor = null;
      return null;
    }
  }

  const DOCTOR_NAMES = [
    'Dra. Ana Torres',
    'Dr. Luis García',
    'Dra. Elena López',
    'Dr. Javier Martín',
    'Dra. Paula Ruiz',
    'Dr. Miguel Sánchez',
    'Dra. Carmen Díaz',
    'Dr. Sergio Romero',
  ];
  
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
      modeHint.textContent = 'Usaremos los datos de tu perfil de donante (simulado aquí).';
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
      if (!currentDonor) {
        const me = await loadCurrentDonor();
        if (!me) {
          const params = new URLSearchParams({
            next: '/frontend/pages/appointments.html',
            mode: 'registered',
          });
          window.location.href = `login.html?${params.toString()}`;
          return;
        }
      }

      const d = currentDonor;

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
        if (mode === 'register') {
          const params = new URLSearchParams({
            next: '/frontend/pages/appointments.html',
            mode: 'registered',
          });
          window.location.href = `register.html?${params.toString()}`;
          return;
        }
        setMode(mode);
      });
    });
    
    const urlParams   = new URLSearchParams(window.location.search);
    const initialMode = urlParams.get('mode');
    if (initialMode === 'registered') {
      setMode('registered');
    }

    function assignDoctorsToHospitals(list) {
      const stored = localStorage.getItem('rv_doctorAssignments');
      if (stored) {
        try {
          doctorAssignments = JSON.parse(stored);
          return;
        } catch (_) {}
      }

      const available = [...DOCTOR_NAMES];
      doctorAssignments = {};

      list.forEach(h => {
        if (!available.length) return;
        const idx = Math.floor(Math.random() * available.length);
        const doc = available.splice(idx, 1)[0];
        doctorAssignments[h.id] = [doc]; 
      });

      localStorage.setItem('rv_doctorAssignments', JSON.stringify(doctorAssignments));
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

    function renderDoctorsForHospital(hospitalId) {
      if (!doctorSelect) return;
      doctorSelect.innerHTML = '<option value="">Selecciona un médico</option>';

      if (!hospitalId) return;
      const docs = doctorAssignments[hospitalId] || [];
      docs.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        doctorSelect.appendChild(opt);
      });
    }

    if (hospitalSelect) {
      hospitalSelect.addEventListener('change', e => {
        renderDoctorsForHospital(e.target.value);
      });
    }

    async function loadHospitals() {
      try {
        const res = await fetch('/api/hospitales');
        if (!res.ok) throw new Error('Error al cargar hospitales');

        hospitals = await res.json();
        if (!Array.isArray(hospitals)) hospitals = [];

        assignDoctorsToHospitals(hospitals);
        renderHospitals();
      } catch (err) {
        console.error(err);
        hospitals = [
          { id: 1, nombre: 'Hospital Central', ciudad: 'Madrid' },
          { id: 2, nombre: 'Clínica Norte', ciudad: 'Madrid' },
        ];
        assignDoctorsToHospitals(hospitals);
        renderHospitals();
      }
    }

    async function loadCitas() {
      try {
        const res = await fetch('/api/citas');
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
      if (!hospitalId && hospitals.length) {
        const rnd = hospitals[Math.floor(Math.random() * hospitals.length)];
        hospitalId = rnd.id;
        hospitalSelect.value = hospitalId;
        renderDoctorsForHospital(hospitalId);
      }

      let doctorName = doctorSelect.value;
      if (!doctorName && hospitalId && doctorAssignments[hospitalId]) {
        const docs = doctorAssignments[hospitalId];
        if (docs.length) {
          doctorName = docs[0];
          doctorSelect.value = doctorName;
        }
      }

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
        const res = await fetch('/api/citas', {
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
          await fetch(`/api/citas/${id}`, { method: 'DELETE' });
        }

        if (act === 'done') {
          await fetch(`/api/citas/${id}`, {
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
            await fetch(`/api/citas/${id}`, {
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