document.addEventListener('DOMContentLoaded', () => {
  const addDonationBtn = document.getElementById('addDonationBtn');
  const donationForm = document.getElementById('donationForm');
  const donationsList = document.getElementById('donationsList');

  addDonationBtn.addEventListener('click', () => {
    donationForm.classList.toggle('hidden');
  });

  donationForm.addEventListener('submit', e => {
    e.preventDefault();

    const fecha = donationForm.fecha.value;
    const cantidad = donationForm.cantidad.value;
    const donante = donationForm.donante.value;

    const card = document.createElement('div');
    card.classList.add('donation-card');
    card.innerHTML = `
      <table>
        <tr>
          <td><strong>Fecha:</strong></td>
          <td>${fecha}</td>
        </tr>
        <tr>
          <td><strong>Cantidad recibida:</strong></td>
          <td>${cantidad} unidades</td>
        </tr>
        <tr>
          <td><strong>Donante asignado:</strong></td>
          <td>${donante}</td>
        </tr>
      </table>
    `;

    donationsList.prepend(card);
    donationForm.reset();
    donationForm.classList.add('hidden');
  });

  const updateBtn = document.getElementById('updateBtn');

  function applyColor(select, estado) {
    select.style.fontWeight = '600';
    select.style.color =
      estado === 'Pendiente' ? '#d90429' :
      estado === 'En Proceso' ? '#ffb703' :
      '#2a9d8f';
  }

  updateBtn.addEventListener('click', () => {
    const selects = document.querySelectorAll('.estado-select');
    selects.forEach(select => applyColor(select, select.value));
    alert('Estados actualizados correctamente ✅');
  });

  document.addEventListener('change', e => {
    if (e.target.classList.contains('estado-select')) {
      applyColor(e.target, e.target.value);
    }
  });

  document.querySelectorAll('.estado-select').forEach(select => {
    applyColor(select, select.value);
  });

  const donorResults = document.querySelector('.donor-results');
  const messageBox = document.querySelector('.message-box');
  const searchBtn = document.querySelector('.btn-search');
  const sendBtn = document.querySelector('.btn-send');

  searchBtn.addEventListener('click', () => donorResults.classList.remove('hidden'));

  donorResults.addEventListener('change', e => {
    if (e.target.classList.contains('select-donor')) {
      const anySelected = document.querySelectorAll('.select-donor:checked').length > 0;
      if (anySelected) messageBox.classList.remove('hidden');
      else messageBox.classList.add('hidden');
    }
  });

  sendBtn.addEventListener('click', () => {
    const selected = document.querySelectorAll('.select-donor:checked').length;
    if (selected === 0) {
      alert('Por favor selecciona al menos un donante antes de enviar.');
      return;
    }
    alert('¡Notificación enviada exitosamente! ✅');
  });

  const gridItems = document.querySelectorAll('.statistics-grid .grid-item');
  gridItems.forEach(item => {
    item.addEventListener('click', () => {
      gridItems.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });
  });

});
