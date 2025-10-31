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
