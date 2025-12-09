document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('apptForm');
  const feedback  = document.getElementById('feedback');
  const slotsEl   = document.getElementById('slots');
  const modeBtns  = document.querySelectorAll('.appt-mode-btn');
  const modeHint  = document.getElementById('modeHint');
  const hospitalSelect = document.getElementById('hospital');
  const doctorSelect   = document.getElementById('doctorSelect');
  const dateInput      = document.getElementById('date');

  const identityInputs = document.querySelectorAll('.field-identity input, .field-identity select');

  const API_BASE = "http://localhost:3000";

  let appointmentMode = null;
  let citas     = [];
  let hospitals = [];
  let currentDonor = null;

  const DAILY_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30'];
  
  let selectedSlot = null;
  
  const urlParams   = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode'); 

  const preFecha      = urlParams.get('fecha') || '';
  const preHora       = urlParams.get('hora') || '';
  const preHospitalId = urlParams.get('hospitalId') || '';
  const preDept       = urlParams.get('departamento') || '';
  const preDoctor     = urlParams.get('doctor') || '';

  const preName    = urlParams.get('nombre') || '';
  const preEmail   = urlParams.get('email') || '';
  const prePhone   = urlParams.get('telefono') || '';
  const preDob     = urlParams.get('dob') || '';
  const preGender  = urlParams.get('genero') || '';

  async function loadCurrentDonor() {
    try {
      const saved = JSON.parse(localStorage.getItem('user'));

      if (!saved || !saved.id) {
        const params = new URLSearchParams({
          next: '/frontend/pages/appointments.html?mode=registered',
          role: 'DONANTE',
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

      currentDonor = {
        id: data.id,
        nombre: data.nombre,
        apellidos: data.apellidos,
        genero: data.genero,
        fecha_nacimiento: data.dob,
        email: (data.usuario && data.usuario.email) || saved.email || '',
        telefono: (data.usuario && data.usuario.telefono) || saved.telefono || '',
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
      if (!d) return;

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
            role: 'DONANTE',
          });
          window.location.href = `login.html?${params.toString()}`;
          return;
        }

        // 2) Registrarme como donante: ir a register
        if (mode === 'register') {
          const params = new URLSearchParams({
            next: '/frontend/pages/appointments.html?mode=registered',
            role: 'DONANTE',
          });
          window.location.href = `register.html?${params.toString()}`;
          return;
        }

        // 3) Invitado: solo en este caso usamos setMode('guest')
        setMode(mode);
      });
    });
    
    if (initialMode === 'registered' || initialMode === 'guest') {
      setMode(initialMode);
    }

    if (initialMode === 'guest') {
      if (preName)   document.getElementById('name').value   = preName;
      if (preEmail)  document.getElementById('email').value  = preEmail;
      if (prePhone)  document.getElementById('phone').value  = prePhone;
      if (preDob)    document.getElementById('dob').value    = preDob;
      if (preGender) document.getElementById('gender').value = preGender;
    }

    if (preFecha && dateInput) {
      dateInput.value = preFecha;
    }
    if (preHora) {
      selectedSlot = preHora;
      const timeInput = document.getElementById('time');
      if (timeInput) timeInput.value = preHora;
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

      
      if (preHospitalId) {
        hospitalSelect.value = preHospitalId;
      }
      if (preDept && deptSelect) {
        deptSelect.value = preDept;
      }

      
      if ((preHospitalId || preDept) && doctorSelect) {
        loadDoctorsForSelection().then(() => {
          if (preDoctor) {
            doctorSelect.value = preDoctor;
          }
          
          renderSlots();
        });
      }

    }

    const deptSelect = document.getElementById('dept');
    async function loadDoctorsForSelection() {
      if (!doctorSelect) return;

      doctorSelect.innerHTML = '<option value="">Selecciona un médico</option>';

      const hospitalId = hospitalSelect.value;
      const deptValue  = deptSelect ? deptSelect.value : '';

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

      if (preHospitalId && hospitalSelect) {
        hospitalSelect.value = preHospitalId;
      }

      if (preDept && deptSelect) {
        deptSelect.value = preDept;
      }

      if (preHospitalId && preDept) {
        await loadDoctorsForSelection();
        if (preDoctor && doctorSelect) {
          doctorSelect.value = preDoctor;
        }
      }

    }

    async function loadCitas() {
      try {
        const res = await fetch(`${API_BASE}/api/cita`);
        if (!res.ok) throw new Error('Error al cargar citas');
        citas = await res.json();
        renderSlots();
      } catch (err) {
        console.error(err);
        slotsEl.innerHTML = "<p class='appt-empty'>Error al cargar citas.</p>";
      }
    }

    function renderSlots() {
      if (!slotsEl) return;

      const date       = dateInput.value;
      const hospitalId = hospitalSelect.value;
      const deptValue  = deptSelect ? deptSelect.value : '';
      const doctorName = doctorSelect ? doctorSelect.value : '';

      if (!date || !hospitalId || !deptValue || !doctorName) {
        slotsEl.innerHTML =
          "<p class='appt-empty'>Selecciona fecha, hospital, departamento y médico para ver los horarios disponibles.</p>";
        return;
      }

      const takenHours = citas
        .filter(c =>
          String(c.hospital_id) === String(hospitalId) &&
          c.departamento === deptValue &&
          c.doctor === doctorName &&
          c.fecha === date &&
          c.status !== 'CANCELADA'
        )
        .map(c => c.hora);

      const html = DAILY_SLOTS.map(hora => {
        const isTaken    = takenHours.includes(hora);
        const isSelected = selectedSlot === hora;

        return `
          <li class="appt-slot ${isTaken ? 'is-taken' : 'is-free'} ${isSelected ? 'is-selected' : ''}"
              data-hora="${hora}">
            <div class="appt-slot-main">
              <strong>${hora}</strong>
              <span class="appt-badge">
                ${isTaken ? 'No disponible' : 'Disponible'}
              </span>
            </div>
          </li>
        `;
      }).join('');

      slotsEl.innerHTML = html;
    }


    form.addEventListener('submit', async e => {
      e.preventDefault();

      const v = id => document.getElementById(id).value.trim();

      if (!v('date') || !v('time')) {
        showToast("Selecciona fecha y hora para la cita", "warning");
        return;
      }

      let hospitalId = hospitalSelect.value;
      if (!hospitalId) {
        showToast("Selecciona un hospital", "warning");
        return;
      }

      const deptValue = document.getElementById('dept').value;
      if (!deptValue) {
        showToast("Selecciona un departamento", "warning");
        return;
      }

      let doctorName = doctorSelect.value;
      if (!doctorName) {
        showToast("Selecciona un médico para la cita", "warning");
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
          showToast("Debes iniciar sesión como donante para usar este modo", "warning");
          return;
        }

        body.donante_id  = currentDonor.id;
        body.es_invitado = false;
      } else{
        if (!v('name') || !v('email') || !v('dob')) {
          showToast("Nombre, email y fecha de nacimiento son obligatorios para invitados", "warning");
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
          const res = await fetch('/api/cita', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Error al crear cita');
          }

          const citaCreada = await res.json();

          const hosp = hospitals.find(h => String(h.id) === String(citaCreada.hospital_id));

          const nombreDonante =
            appointmentMode === 'registered'
              ? `${currentDonor.nombre} ${currentDonor.apellidos || ''}`.trim()
              : body.nombre_donante;

          const baseParams = {
            mode: appointmentMode || 'guest',
            nombre: nombreDonante,
            fecha: citaCreada.fecha,
            hora: citaCreada.hora,
            hospital: hosp ? hosp.nombre : '',
            ciudad: hosp ? hosp.ciudad : '',
            doctor: citaCreada.doctor || '',
            departamento: citaCreada.departamento || '',
            citaId: citaCreada.id,
            hospitalId: citaCreada.hospital_id,
          };

          if (appointmentMode === 'guest') {
            baseParams.nombre_donante   = body.nombre_donante;
            baseParams.email_donante    = body.email_donante;
            baseParams.telefono_donante = body.telefono_donante || '';
            baseParams.dob_donante      = body.dob_donante;
            baseParams.genero_donante   = body.genero_donante || '';
          }

          const params = new URLSearchParams(baseParams);
          
          window.location.href = `/frontend/pages/appointment-confirmation.html?${params.toString()}`;

        } catch (err) {
          console.error(err);
          showToast("Error al crear la cita", "error");
        }
    });

    if (hospitalSelect) {
      hospitalSelect.addEventListener('change', () => {
        loadDoctorsForSelection();
        selectedSlot = null;
        document.getElementById('time').value = '';
        renderSlots();
      });
    }

    if (deptSelect) {
      deptSelect.addEventListener('change', () => {
        loadDoctorsForSelection();
        selectedSlot = null;
        document.getElementById('time').value = '';
        renderSlots();
      });
    }

    if (doctorSelect) {
      doctorSelect.addEventListener('change', () => {
        selectedSlot = null;
        document.getElementById('time').value = '';
        renderSlots();
      });
    }

    if (dateInput) {
      dateInput.addEventListener('change', () => {
        selectedSlot = null;
        document.getElementById('time').value = '';
        renderSlots();
      });
    }

    slotsEl.addEventListener('click', e => {
      const li = e.target.closest('.appt-slot');
      if (!li) return;

      if (li.classList.contains('is-taken')) return;

      selectedSlot = li.dataset.hora;
      document.getElementById('time').value = selectedSlot;
      renderSlots();
    });
    
  loadHospitals().then(loadCitas);

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
});


