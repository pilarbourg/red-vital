document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  const citaId   = params.get('citaId');
  const nombre   = params.get('nombre') || '';
  const fecha    = params.get('fecha') || '';
  const hora     = params.get('hora') || '';
  const hospital = params.get('hospital') || '';
  const ciudad   = params.get('ciudad') || '';
  const doctor   = params.get('doctor') || '';
  const dept     = params.get('departamento') || '';
  const hospitalId = params.get('hospitalId') || '';

  const originalMode    = params.get('mode') || 'guest';
  const nombreDonante   = params.get('nombre_donante') || nombre;
  const emailDonante    = params.get('email_donante') || '';
  const telefonoDonante = params.get('telefono_donante') || '';
  const dobDonante      = params.get('dob_donante') || '';
  const generoDonante   = params.get('genero_donante') || '';


  const nameEl      = document.getElementById('cf-name');
  const datetimeEl  = document.getElementById('cf-datetime');
  const hospitalEl  = document.getElementById('cf-hospital');
  const doctorEl    = document.getElementById('cf-doctor');

  nameEl.textContent     = nombre || 'Donante';
  datetimeEl.textContent = fecha && hora ? `${fecha} · ${hora}` : (fecha || '');
  hospitalEl.textContent = ciudad ? `${hospital} – ${ciudad}` : hospital;
  doctorEl.textContent   = doctor
    ? `${doctor}${dept ? ' (' + dept + ')' : ''}`
    : (dept || '');

  const btnConfirm = document.getElementById('btn-confirm');
  const btnChange  = document.getElementById('btn-change');
  const btnCancel  = document.getElementById('btn-cancel');

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
  
  if (!citaId) {
    btnConfirm.disabled = true;
    btnCancel.disabled  = true;
    btnChange.disabled  = true;
    btnConfirm.title = 'No se ha encontrado la cita';
    btnChange.title  = 'No se ha encontrado la cita';
    btnCancel.title  = 'No se ha encontrado la cita';
    return;
  }

  btnConfirm.addEventListener('click', async () => {
    try {
      const res = await fetch(`/api/cita/${citaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMADA' }),
      });

      if (!res.ok) {
        throw new Error('Error al confirmar la cita');
      }

      showToast("Cita confirmada. ¡Gracias por donar sangre!", "success");
      window.location.href = '../../index.html';
    } catch (err) {
      console.error(err);
      showToast("Error al confirmar la cita", "error");
    }
  });

  
  btnChange.addEventListener('click', async () => {
    const sure = confirm(
      '¿Seguro que quieres cambiar esta cita? Se cancelará y podrás crear otra.'
    );
    if (!sure) return;

    try {
      const res = await fetch(`/api/cita/${citaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELADA' }),
      });

      if (!res.ok) {
        throw new Error('Error al cancelar la cita para cambiarla');
      }

      
      const backParams = new URLSearchParams({
        mode: originalMode,      
        fecha,
        hora,
        hospitalId,
        departamento: dept,
        doctor,
        nombre: nombreDonante,
        email: emailDonante,
        telefono: telefonoDonante,
        dob: dobDonante,
        genero: generoDonante,
      });

      window.location.href = `appointments.html?${backParams.toString()}`;
    } catch (err) {
      console.error(err);
      showToast("Error al cambiar la cita", "error");
    }
  });


  btnCancel.addEventListener('click', async () => {
    const sure = confirm('¿Seguro que quieres cancelar esta cita?');
    if (!sure) return;

    try {
      const res = await fetch(`/api/cita/${citaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELADA' }),
      });

      if (!res.ok) {
        throw new Error('Error al cancelar la cita');
      }

      showToast("Cita cancelada correctamente", "success");
      window.location.href = '../../index.html';
    } catch (err) {
      console.error(err);
      showToast("Error al cancelar la cita", "error");
    }
  });
});
