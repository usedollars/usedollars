async function postJSON(url, body, token) {
  const headers = {'Content-Type':'application/json'};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, {method:'POST', headers, body: JSON.stringify(body)});
  const txt = await res.text();
  try { return JSON.parse(txt); } catch(e){ return { error: txt || res.statusText, status: res.status }; }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const msg = document.getElementById('msg');
      msg.textContent = 'Conectando...';
      try {
        const resp = await postJSON('/api/auth/login', { email, password });
        if (resp && resp.token) {
          localStorage.setItem('token', resp.token);
          localStorage.setItem('user', JSON.stringify(resp.user || {}));
          // Mensaje solicitado por G:
          alert(`Bienvenido al sistema, un gusto tenerte por aquí, ${resp.user?.name || 'usuario'}`);
          window.location.href = '/dashboard.html';
        } else {
          msg.textContent = resp.error || JSON.stringify(resp);
        }
      } catch (err) {
        msg.textContent = 'Error de conexión';
        console.error(err);
      }
    });
  }

  const fakeRegister = document.getElementById('fakeRegister');
  if (fakeRegister) fakeRegister.addEventListener('click', ()=> alert('Función de registro aún no disponible'));

  // logout button handler (shared)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    alert(`Hasta luego, ${user.name || 'usuario'}`);
    // opcional: llamar API de logout si existe
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  });
});

