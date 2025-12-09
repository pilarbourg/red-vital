// auth-guard.js
function requireRole(rolRequerido, nextPage) {
  const saved = JSON.parse(localStorage.getItem('user') || 'null');

  if (!saved) {
    const params = new URLSearchParams({
      next: nextPage,
      role: rolRequerido,
    });
    window.location.href = `login.html?${params.toString()}`;
    return null;
  }

  if (saved.rol !== rolRequerido) {
    const params = new URLSearchParams({
      next: nextPage,
      role: rolRequerido,
    });
    window.location.href = `login.html?${params.toString()}`;
    return null;
  }

  return saved;
}
