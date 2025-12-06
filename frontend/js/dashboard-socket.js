document.addEventListener("DOMContentLoaded", () => {
  const pendingEl = document.getElementById("pendingRequests");
  const completedEl = document.getElementById("completedRequests");
  const percentageEl = document.getElementById("coveredPercentage");
  const pie = document.getElementById("completedPie");

  const hospitalId = 2; // TODO REPLACE

  async function loadStats() {
    try {
      const res = await fetch(
        `http://localhost:3000/api/hospitales/${hospitalId}/solicitudes/stats`
      );
      if (!res.ok) throw new Error("Error fetching stats");

      const stats = await res.json();
      const completedPercentage = stats.total
        ? (stats.cubiertas / stats.total) * 100
        : 0;

      pendingEl.textContent = stats.pendientes || 0;
      completedEl.textContent = stats.cubiertas || 0;
      percentageEl.textContent = `${Math.round(completedPercentage)}%`;

      pie.style.background = `conic-gradient(
        #457b9d 0% ${completedPercentage}%,
        #457b9d53 ${completedPercentage}% 100%
      )`;
    } catch (err) {
      console.error(err);
    }
  }

  loadStats();

  const socket = io("http://localhost:3000");

  socket.on("solicitud:nueva", (data) => {
    console.log("Nueva solicitud:", data);
    loadStats();
  });

  socket.on("solicitud:update", (data) => {
    console.log("Solicitud actualizada:", data);
    loadStats();
  });
});