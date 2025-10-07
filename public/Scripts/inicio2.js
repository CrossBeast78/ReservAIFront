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
    const createDescription = document.getElementById('createDescription');
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
    let totalPages = 1;
    const itemsPerPage = 4;
 

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

            if (!response.ok) {
                if (response.status === 401) {
                    alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
                    SessionStorageManager.clear();
                    window.location.href = "/login";
                    return;
                }
                throw new Error(`Error al obtener las contraseñas: ${response.status}`);
            }

            const result = await response.json();

            // Manejar distintas estructuras del backend
            if (Array.isArray(result.data)) {
                passwords = result.data.filter(p => p && typeof p.name === 'string');
                totalPages = result.totalPages || Math.ceil(result.total / itemsPerPage) || 1;
            } else if (Array.isArray(result)) {
                passwords = result.filter(p => p && typeof p.name === 'string');
                totalPages = 1; // si el backend no pagina
            } else {
                passwords = [];
                totalPages = 1;
            }

            renderList();
            updatePaginationButtons();
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

        const query = (searchEl?.value || '').trim().toLowerCase();

        // Filtrar solo contraseñas con 'name' y que coincidan con la búsqueda
        const filtered = passwords.filter(p => 
            p && typeof p.name === 'string' && p.name.toLowerCase().includes(query)
        );

        // Mostrar el total real de contraseñas (no solo las filtradas)
        totalEl.textContent = passwords.length;

        // Calcular total de páginas basado en el filtro actual
        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

        // Ajustar currentPage si está fuera de rango
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        // Obtener los elementos de la página actual
        const start = (currentPage - 1) * itemsPerPage;
        const pageItems = filtered.slice(start, start + itemsPerPage);

        // Mostrar mensaje si no hay resultados
        if (pageItems.length === 0) {
            listEl.innerHTML = '<li class="empty">No se encontraron contraseñas.</li>';
            pageInfo.textContent = `Página 0 de 0`;
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        // Renderizar la lista actual
        listEl.innerHTML = pageItems.map((p, idx) => {
            const name = escapeHtml(p.name || 'Sin nombre');
            return `<li class="password-item" data-idx="${start + idx}" tabindex="0">${name}</li>`;
        }).join('');

        // Actualizar información de paginación
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

        // Actualizar botones
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    }   



    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =========================
    // PAGINACIÓN
    // =========================
    function updatePaginationButtons() {
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }

   if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchPasswords(currentPage, searchEl?.value || '');
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchPasswords(currentPage, searchEl?.value || '');
            }
        });
    }

    if (searchEl) {
        searchEl.addEventListener('input', () => {
            currentPage = 1;
            fetchPasswords(currentPage, searchEl.value);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        fetchPasswords(currentPage);
    });

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
        const description = createDescription?.value.trim() || "";
        const confirm = confirmPassword?.value;

        if(!name || !pass || !confirm) { alert("Todos los campos son obligatorios"); return; }
        if(pass !== confirm) { alert("Las contraseñas no coinciden"); return; }

        try {
            const response = await fetch("https://app.reservai-passmanager.com/p", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify({ name: name, password: pass, description: description })
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
