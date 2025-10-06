import SessionStorageManager from '../Scripts/AppStorage.js';
import Password from '../models/passwords.js';

document.addEventListener('DOMContentLoaded', () => {
    // =========================
    // ELEMENTOS DEL DOM
    // =========================
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
    const closebtn = document.querySelectorAll('.close-btn');

    const modalBody = document.getElementById('modalBody');

    // =========================
    // VARIABLES
    // =========================
    const token = SessionStorageManager.getSession()?.access_token;
    let passwords = [];
    let currentPage = 1;
    const itemsPerPage = 5;
    let passwordVisible = false;

    if (!token) {
        alert("No hay sesión activa. Inicia sesión de nuevo.");
        window.location.href = "/";
        return;
    }

    // =========================
    // FETCH CONTRASEÑAS
    // =========================
    async function fetchPasswords(page = 1, search = '') {
        try {
            const url = `https://app.reservai-passmanager.com/p?page=${page}&search=${encodeURIComponent(search)}`;
            const response = await fetch(url, {
                method: "GET",
                headers: { "Authorization": token }
            });

            if (!response.ok) throw new Error(`Error al obtener las contraseñas: ${response.status}`);

            const result = await response.json();

            // Validar que sea un array y filtrar solo objetos con 'name'
            passwords = Array.isArray(result) 
                ? result.filter(p => p && typeof p.name === 'string')
                : (Array.isArray(result.data) ? result.data.filter(p => p && typeof p.name === 'string') : []);

            renderList();
        } catch (err) {
            alert("Error al cargar las contraseñas: " + err.message);
            console.error("Error fetching passwords:", err);
        }
    }

    fetchPasswords();

    // =========================
    // RENDERIZAR LISTA
    // =========================
   function renderList() {
        if (!listEl) return;

        const mapped = passwords.map((p, idx) => ({ p, idx }));
        const query = (searchEl?.value || '').trim().toLowerCase();

        // Filtrar solo objetos con 'name'
        const filtered = mapped.filter(obj => obj.p?.name?.toLowerCase().includes(query));

        totalEl.textContent = passwords.length;

        if (filtered.length === 0) {
            listEl.innerHTML = '<li class="empty">No se encontraron contraseñas.</li>';
            pageInfo.textContent = `Página 0 de 0`;
            if(prevBtn) prevBtn.disabled = true;
            if(nextBtn) nextBtn.disabled = true;
            return;
        }

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const start = (currentPage - 1) * itemsPerPage;
        const pageItems = filtered.slice(start, start + itemsPerPage);

        listEl.innerHTML = pageItems.map(obj => {
            const name = escapeHtml(obj.p.name || 'Sin nombre');
            return `<li class="password-item" data-idx="${obj.idx}" tabindex="0">${name}</li>`;
        }).join('');

        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        if(prevBtn) prevBtn.disabled = currentPage === 1;
        if(nextBtn) nextBtn.disabled = currentPage === totalPages;
    }


    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =========================
    // PAGINACIÓN
    // =========================
    if(prevBtn) prevBtn.addEventListener('click', () => {
        if(currentPage > 1) { currentPage--; fetchPasswords(currentPage, searchEl?.value); }
    });

    if(nextBtn) nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(passwords.length / itemsPerPage) || 1;
        if(currentPage < totalPages) { currentPage++; fetchPasswords(currentPage, searchEl?.value); }
    });

    if(searchEl) searchEl.addEventListener('input', () => { currentPage = 1; fetchPasswords(currentPage, searchEl.value); });

    // =========================
    // MODALES CREAR / VER
    // =========================
   addBtn?.addEventListener('click', () => {
        createName.value = '';
        createPassword.value = '';
        createModal.classList.add('show');
        createModal.setAttribute('aria-hidden', 'false');
        setTimeout(()=> createName.focus(), 100);
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(btn.dataset.close === 'createModal') createModal.classList.remove('show');
            else viewModal.classList.remove('show');
        });
    });

    // =========================
    // TOGGLE CONTRASEÑAS
    // =========================
    if(toggleCreatePassword) toggleCreatePassword.addEventListener('click', () => {
        if(createPassword) {
            createPassword.type = createPassword.type === 'password' ? 'text' : 'password';
            toggleCreatePassword.textContent = createPassword.type === 'password' ? 'Mostrar' : 'Ocultar';
        }
    });

    if(toggleConfirmPassword) toggleConfirmPassword.addEventListener('click', () => {
        if(confirmPassword) {
            confirmPassword.type = confirmPassword.type === 'password' ? 'text' : 'password';
            toggleConfirmPassword.textContent = confirmPassword.type === 'password' ? 'Mostrar' : 'Ocultar';
        }
    });



    // =========================
    // GUARDAR NUEVA CONTRASEÑA
    // =========================
    if(savePasswordBtn) savePasswordBtn.addEventListener('click', async () => {
        const name = createName?.value.trim();
        const pass = createPassword?.value;
        const confirm = confirmPassword?.value;

        if(!name || !pass || !confirm) { alert("Todos los campos son obligatorios"); return; }
        if(pass !== confirm) { alert("Las contraseñas no coinciden"); return; }

        try {
            const response = await fetch("https://app.reservai-passmanager.com/p", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify({ name, password: pass, description: "" })
            });

            if(!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || "Error al guardar la contraseña");
            }

            const newPassword = await response.json();
            passwords.push(newPassword);
            alert("Contraseña guardada correctamente");
            if(createModal) createModal.classList.remove('show');
            renderList();
        } catch(err) {
            alert("Error: " + err.message);
            console.error("Error al guardar contraseña:", err);
        }
    });

    // =========================
    // MODAL VER CONTRASEÑA
    // =========================
    function fetchPasswordById(id) {
    return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`https://app.reservai-passmanager.com/p/${id}`, {
                    method: 'GET',
                    headers: { 'Authorization': token }
                });

                if (!response.ok) throw new Error(`Error al obtener la contraseña: ${response.status}`);

                const jsonResponse = await response.json();
                const password = Password.fromJson(jsonResponse);
                
                if (password) {
                    resolve(password);
                } else {
                    throw new Error('Error al parsear la respuesta del servidor');
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    function resetViewModal() {
        if (!viewModal || !modalBody) return;
        modalBody.innerHTML = '';
        viewModal.classList.remove('show'); // cerramos el modal si estaba abierto
    }

    function openViewModal(item) {
        if (!modalBody || !viewModal) return;

        // Reset antes de abrir
        resetViewModal();

        // Mostrar indicador de carga
        modalBody.innerHTML = '<div style="text-align: center; font-size: 1.2rem;">⏳ Cargando contraseña...</div>';
        viewModal.classList.add('show'); // mostramos modal inmediatamente con el indicador de carga

        fetchPasswordById(item.id)
            .then(password => {
                let def = '*************'
                // password es ahora una instancia de la clase Password
                modalBody.innerHTML = password.toHTML();
                
                // Agregar event listeners para los botones
                const toggleBtn = modalBody.querySelector('.toggle-password-btn');
                const copyBtn = modalBody.querySelector('.copy-password-btn');
                const passwordText = modalBody.querySelector('.password-text');
                const eyeIcon = modalBody.querySelector('.eye-icon');
                const copyIcon = modalBody.querySelector('.copy-icon');
                
                // Botón de mostrar/ocultar contraseña
                if (toggleBtn && passwordText && eyeIcon) {
                    toggleBtn.addEventListener('click', () => {
                        const isVisible = passwordText.textContent !== def;
                        
                        if (isVisible) {
                            // Ocultar contraseña
                            passwordText.textContent = def;
                            eyeIcon.className = 'fas fa-eye eye-icon';
                            toggleBtn.title = 'Mostrar contraseña';
                            toggleBtn.classList.remove('active');
                        } else {
                            // Mostrar contraseña
                            passwordText.textContent = passwordText.dataset.password;
                            eyeIcon.className = 'fas fa-eye-slash eye-icon';
                            toggleBtn.title = 'Ocultar contraseña';
                            toggleBtn.classList.add('active');
                        }
                    });
                }
                
                // Botón de copiar contraseña
                if (copyBtn && passwordText && copyIcon) {
                    copyBtn.addEventListener('click', async () => {
                        try {
                            const passwordToCopy = passwordText.dataset.password;
                            await navigator.clipboard.writeText(passwordToCopy);
                            
                            // Efecto visual de copiado
                            copyIcon.className = 'fas fa-check copy-icon';
                            copyBtn.classList.add('copied');
                            copyBtn.title = '¡Copiado!';
                            
                            // Restaurar después de 2 segundos
                            setTimeout(() => {
                                copyIcon.className = 'fas fa-copy copy-icon';
                                copyBtn.classList.remove('copied');
                                copyBtn.title = 'Copiar contraseña';
                            }, 2000);
                            
                        } catch (err) {
                            console.error('Error al copiar:', err);
                            alert('No se pudo copiar la contraseña');
                        }
                    });
                }
            })
            .catch(err => {
                console.error('Error al obtener la contraseña por ID:', err);
                modalBody.innerHTML = '<div style="text-align: center; font-size: 1.2rem; color: #f44336;">❌ Error al cargar la contraseña</div>';
                alert('No se pudo obtener la contraseña. Intenta de nuevo.');
            });
    }


    listEl?.addEventListener('click', e => {
        const target = e.target;
        if(target?.classList.contains('password-item')) {
            const index = target.dataset.idx;
            const item = passwords[index];
            openViewModal(item);
        }
    });

    listEl?.addEventListener('keydown', e => {
        const target = e.target;
        if(target?.classList.contains('password-item') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            const index = target.dataset.idx;
            const item = passwords[index];
            openViewModal(item);
        }
    });

    window.addEventListener('click', e => {
        if(e.target === createModal) createModal.classList.remove('show');
        if(e.target === viewModal) {
            viewModal.classList.remove('show');
        }
    });
});
