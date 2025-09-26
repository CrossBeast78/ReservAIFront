// Datos de ejemplo
const passwords = Array.from({ length: 20 }, (_, i) => ({
  name: `Contraseña ${i + 1}`,
  password: `Pass${i + 1}#abc`,
  description: `Descripción de la contraseña ${i + 1}`
}));

// Elementos
const listEl = document.getElementById('password-list');
const searchEl = document.getElementById('search');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const pageInfo = document.getElementById('page-info');
const totalEl = document.getElementById('totalPasswords');

const addBtn = document.getElementById('addPasswordBtn');
const createModal = document.getElementById('createModal');
const viewModal = document.getElementById('viewModal');

const createName = document.getElementById('createName');
const createPassword = document.getElementById('createPassword');
const confirmPassword = document.getElementById('confirmPassword');
const toggleCreatePassword = document.getElementById('toggleCreatePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const savePasswordBtn = document.getElementById('savePasswordBtn');

const viewName = document.getElementById('viewName');
const viewPassword = document.getElementById('viewPassword');
const viewDescription = document.getElementById('viewDescription');
const copyBtn = document.getElementById('copyBtn');
const togglePasswordBtn = document.getElementById('togglePassword');

let currentPage = 1;
const itemsPerPage = 5;

// Renderizar lista con paginación y filtrado
function renderList() {
  // mapa con índices originales
  const mapped = passwords.map((p, idx) => ({ p, idx }));
  const q = (searchEl.value || '').trim().toLowerCase();

  const filtered = mapped.filter(obj => obj.p.name.toLowerCase().includes(q));
  totalEl.textContent = passwords.length;

  if (filtered.length === 0) {
    listEl.innerHTML = '<li class="empty">No se encontraron contraseñas.</li>';
    pageInfo.textContent = `Página 0 de 0`;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(start, start + itemsPerPage);

  listEl.innerHTML = pageItems.map(obj =>
    `<li class="password-item" data-index="${obj.idx}" tabindex="0">${escapeHtml(obj.p.name)}</li>`
  ).join('');

  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

// helpers
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s]));
}

// navegación
prevBtn?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderList(); }});
nextBtn?.addEventListener('click', () => {
  const mapped = passwords.map((p, idx) => ({ p, idx }));
  const filtered = mapped.filter(obj => obj.p.name.toLowerCase().includes((searchEl.value || '').trim().toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  if (currentPage < totalPages) { currentPage++; renderList(); }
});

searchEl?.addEventListener('input', () => { currentPage = 1; renderList(); });

// abrir modal crear
addBtn?.addEventListener('click', () => {
  createName.value = '';
  createPassword.value = '';
  createModal.classList.add('show');
  createModal.setAttribute('aria-hidden', 'false');
  setTimeout(()=> createName.focus(), 100);
});

// Guardar nueva contraseña (por ahora solo consola)
savePasswordBtn.addEventListener('click', () => {
  const name = document.getElementById('createName').value.trim();
  const pass = createPassword.value;
  const confirm = confirmPassword.value;
  const description = document.getElementById('createDescription').value.trim();

  if (!name || !pass || !confirm) {
    alert("Todos los campos son obligatorios excepto la descripción");
    return;
  }

  if (pass !== confirm) {
    alert("Las contraseñas no coinciden");
    return;
  }

  passwords.push({ name, password: pass, description });
  alert("Contraseña guardada correctamente");

  // limpiar campos
  document.getElementById('createName').value = "";
  createPassword.value = "";
  confirmPassword.value = "";
  document.getElementById('createDescription').value = "";

  createModal.classList.remove('show');
  renderList(); // refresca la lista
});
// abrir modal ver (delegación)
listEl.addEventListener('click', e => {
  if (e.target.classList.contains('password-item')) {
    const index = e.target.dataset.index;
    const item = passwords[index];
    viewName.textContent = item.name;
    viewPassword.type = "password"; // siempre inicia oculto
    viewPassword.value = item.password;
    viewDescription.textContent = item.description;
    viewModal.classList.add('show');
  }
});


// copiar al portapapeles
copyBtn?.addEventListener('click', async () => {
  const text = viewPassword.textContent || '';
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    alert('Contraseña copiada al portapapeles');
  } catch (err) {
    console.error(err);
    alert('No se pudo copiar la contraseña');
  }
});

// cerrar modales por botones con data-close
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const id = btn.getAttribute('data-close');
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
  });
});

// cerrar al hacer click fuera del modal-content
window.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal')) {
    e.target.classList.remove('show');
    e.target.setAttribute('aria-hidden', 'true');
  }
});

// cerrar con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(m => {
      m.classList.remove('show');
      m.setAttribute('aria-hidden', 'true');
    });
  }
});



// Alternar visibilidad
togglePasswordBtn.addEventListener('click', () => {
  if (viewPassword.type === "password") {
    viewPassword.type = "text";
    togglePasswordBtn.textContent = "👁";
  } else {
    viewPassword.type = "password";
    togglePasswordBtn.textContent = "👁";
  }
});

toggleCreatePassword.addEventListener('click', () => {
  if (createPassword.type === "password") {
    createPassword.type = "text";
    toggleCreatePassword.textContent = "👁";
  } else {
    createPassword.type = "password";
    toggleCreatePassword.textContent = "👁";
  }
});

toggleConfirmPassword.addEventListener('click', () => {
  if (confirmPassword.type === "password") {
    confirmPassword.type = "text";
    toggleConfirmPassword.textContent = "👁";
  } else {
    confirmPassword.type = "password";
    toggleConfirmPassword.textContent = "👁";
  }
});



// inicializar
renderList();
