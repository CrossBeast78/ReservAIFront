import { fetchAccountById } from '../services/adminUserService.js';
import { showMessage } from '../service/uiHelpersAdmin.js';
import { renderAdminPasswordList } from '../service/renderListAdmin.js';
import { setupAdminModals, openAdminPasswordModal } from './modalControllerAdmin.js';

export async function openAccountPasswordsModal(account) {
    const modal = document.getElementById('accountPasswordsModal');
    const emailTitle = document.getElementById('accountEmailTitle');
    const passwordList = document.getElementById('password-list');
    const backBtn = document.getElementById('backToAccountsBtn');
    const menuBtn = document.getElementById('accountMenuBtn');
    const deleteBtn = document.getElementById('deleteAccountBtn');
    const addBtn = document.getElementById('addPasswordBtn');
    const createModal = document.getElementById('createModal');
    const viewModal = document.getElementById('viewModal');
    const createName = document.getElementById('createName');
    const createPassword = document.getElementById('createPassword');
    const createDescription = document.getElementById('createDescription');
    const confirmPassword = document.getElementById('confirmPassword');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const passwordSearchEl = document.getElementById('search2');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const pageInfo = document.getElementById('pageinfo');

    emailTitle.textContent = account.email || account.name || account.id;

    let currentPage = 1;
    let nextPage = null;
    let totalPasswords = 0;

    async function loadPasswordsPage(page = 1, search = '') {
        try {
            const response = await fetchAccountById(account.id, page, search);
            const passwords = response.data?.passwords || [];
            currentPage = response.current_page || page;
            nextPage = response.next_page || null;
            totalPasswords = response.total || passwords.length;

            renderAdminPasswordList(passwords, passwordList);

            // Evento para ver contraseña
            passwordList.querySelectorAll('.password-item').forEach(item => {
                const passwordId = item.dataset.id;
                item.onclick = () => openAdminPasswordModal(account.id, passwordId);
            });

            if (pageInfo) pageInfo.textContent = `Página ${currentPage}`;
            if (prevBtn) prevBtn.disabled = currentPage <= 1;
            if (nextBtn) nextBtn.disabled = !nextPage || nextPage <= currentPage;
        } catch (err) {
            passwordList.innerHTML = '<div style="color:red;">Error al cargar contraseñas</div>';
            if (pageInfo) pageInfo.textContent = '';
        }
    }

    // Listeners de paginación y búsqueda
    prevBtn?.addEventListener('click', () => {
        if (currentPage > 1) {
            loadPasswordsPage(currentPage - 1, passwordSearchEl.value);
        }
    });

    nextBtn?.addEventListener('click', () => {
        if (nextPage && nextPage > currentPage) {
            loadPasswordsPage(nextPage, passwordSearchEl.value);
        }
    });

    passwordSearchEl?.addEventListener('input', () => {
        loadPasswordsPage(1, passwordSearchEl.value);
    });

    // Inicializa la lista
    loadPasswordsPage();

    // Mostrar modal
    modal.classList.add('show');

    // Botón regresar
    backBtn.onclick = () => {
        modal.classList.remove('show');
    };

    // Menú tres puntos
    menuBtn.onclick = () => {
        menuBtn.parentElement.classList.toggle('open');
    };

    // Eliminar cuenta
    deleteBtn.onclick = () => {
        if (confirm("¿Seguro que deseas eliminar esta cuenta?")) {
            showMessage("Cuenta eliminada (implementa la lógica real aquí)");
            modal.classList.remove('show');
        }
    };

    // --- Lógica para crear contraseña dentro del modal ---
    setupAdminModals({
        addBtn,
        createModal,
        viewModal,
        fields: {
            createName,
            createPassword,
            createDescription,
            confirmPassword,
            savePasswordBtn
        },
        listEl: passwordList,
        renderList: () => loadPasswordsPage(currentPage, passwordSearchEl.value),
        getSelectedAccountId: () => account.id
    });
}