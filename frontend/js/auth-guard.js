// auth-guard.js
function requireRole(rolRequerido, nextPage) {
  const saved = JSON.parse(localStorage.getItem('user') || 'null');

  // 1) No hay usuario -> mandar a login
  if (!saved) {
    const params = new URLSearchParams({
      next: nextPage,
      role: rolRequerido,
    });
    window.location.href = `login.html?${params.toString()}`;
    return null;
  }

  // 2) Hay usuario pero el rol NO coincide -> también a login
  if (saved.rol !== rolRequerido) {
    const params = new URLSearchParams({
      next: nextPage,
      role: rolRequerido,
    });
    window.location.href = `login.html?${params.toString()}`;
    return null;
  }

  // 3) Todo correcto
  return saved; // { id, rol, ... }
}
