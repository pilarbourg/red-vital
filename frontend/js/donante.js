// Espera a que todo el DOM esté cargado antes de ejecutar
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.center-btn');
  const banner = document.getElementById('blood-status-banner');
  const bannerText = document.getElementById('banner-text');

  if (!buttons.length || !banner || !bannerText) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const centerName = btn.dataset.center;
      const status = btn.dataset.status;

      bannerText.innerHTML = `<strong>${centerName}</strong><br>${status}`;
      banner.classList.remove('hidden');

      banner.style.opacity = '0';
      setTimeout(() => {
        banner.style.transition = 'opacity 0.4s ease';
        banner.style.opacity = '1';
      }, 50);
    });
  });
});
// --- CAMBIO DE PESTAÑAS ---
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // quitar active de todos
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));

    // activar el clicado
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Seleccionamos todos los botones del menú
const navItems = document.querySelectorAll(".nav-item-card");

// Escucha de click para cada uno
navItems.forEach(item => {
  item.addEventListener("click", () => {
    // Quitar clase activa a todos
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    // Mostrar la sección correspondiente
    const targetId = item.dataset.target; // obtiene "perfil", "donaciones", etc.
    const sections = document.querySelectorAll(".content-section");

    sections.forEach(section => {
      section.classList.remove("active-section");
      if (section.id === targetId) {
        section.classList.add("active-section");
        // desplazamiento suave al contenido
        section.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});
