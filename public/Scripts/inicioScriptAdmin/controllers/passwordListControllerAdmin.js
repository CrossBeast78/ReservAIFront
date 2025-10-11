import { fetchAccounts, fetchAccountById } from '../services/adminUserService.js';
import { renderAdminAccountList, renderAdminPasswordList } from '../service/renderListAdmin.js';
import { showMessage } from '../service/uiHelpersAdmin.js';

function isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function setupAdminSearch(elements) {
    const { accountSearchEl, accountListEl, passwordSearchEl, passwordListEl, selectedAccountEl, prevBtn, nextBtn, pageInfo, totalEl, onAccountSelected } = elements;
    let selectedAccountId = null;
    let currentPasswords = [];
    let currentPage = 1;
    let totalPages = 1;
    const pageSize = 5;

    accountSearchEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchAccounts();
        }
    });

    passwordSearchEl?.addEventListener('input', () => {
        renderPasswordsPage(1, passwordSearchEl.value);
    });

    prevBtn?.addEventListener('click', () => {
        if (currentPage > 1) {
            renderPasswordsPage(currentPage - 1, passwordSearchEl.value);
        }
    });

    nextBtn?.addEventListener('click', () => {
        renderPasswordsPage(currentPage + 1, passwordSearchEl.value);
    });

    async function searchAccounts() {
        const search = accountSearchEl.value.trim();
        try {
            if (search && isUUID(search)) {
                const response = await fetchAccountById(search);
                const account = response.data?.account;
                currentPasswords = response.data?.passwords || [];
                renderAdminAccountList([account], accountListEl, onAccountSelectedInternal);
                renderPasswordsPage(1, passwordSearchEl.value);
            } else {
                const { data: accounts = [] } = await fetchAccounts({ page: 1, search });
                renderAdminAccountList(accounts, accountListEl, onAccountSelectedInternal);
                renderAdminPasswordList([], passwordListEl);
                if (pageInfo) pageInfo.textContent = '';
                if (totalEl) totalEl.textContent = '0';
            }
        } catch (err) {
            showMessage("Error al buscar cuentas: " + err.message);
            renderAdminAccountList([], accountListEl, onAccountSelectedInternal);
            renderAdminPasswordList([], passwordListEl);
            if (pageInfo) pageInfo.textContent = '';
            if (totalEl) totalEl.textContent = '0';
        }
    }

    async function onAccountSelectedInternal(accountId) {
        selectedAccountId = accountId;
        if (typeof onAccountSelected === "function") onAccountSelected(accountId);
        selectedAccountEl.textContent = ` ${accountId}`;
        try {
            const response = await fetchAccountById(accountId);
            currentPasswords = response.data?.passwords || [];
            renderPasswordsPage(1, passwordSearchEl.value);
        } catch (err) {
            showMessage("Error al cargar contraseñas: " + err.message);
            renderAdminPasswordList([], passwordListEl);
            if (pageInfo) pageInfo.textContent = '';
            if (totalEl) totalEl.textContent = '0';
        }
    }

    function renderPasswordsPage(page = 1, search = '') {
        if (!selectedAccountId) {
            passwordListEl.innerHTML = "<div>Selecciona una cuenta para ver sus contraseñas.</div>";
            if (pageInfo) pageInfo.textContent = '';
            if (totalEl) totalEl.textContent = '0';
            return;
        }
        let filtered = currentPasswords;
        if (search) {
            const filter = search.toLowerCase();
            filtered = filtered.filter(p =>
                (p.name && p.name.toLowerCase().includes(filter)) ||
                (p.description && p.description.toLowerCase().includes(filter))
            );
        }
        const total = filtered.length;
        totalPages = Math.max(1, Math.ceil(total / pageSize));
        currentPage = Math.min(Math.max(1, page), totalPages);
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const pagePasswords = filtered.slice(start, end);

        renderAdminPasswordList(pagePasswords, passwordListEl);

        // Asigna el evento click para abrir el modal usando la lógica de modalControllerAdmin.js
        passwordListEl.querySelectorAll('.password-item').forEach(item => {
            item.addEventListener('click', () => {
                // Import dinámico para evitar ciclos de dependencias
                import('./modalControllerAdmin.js').then(module => {
                    module.openAdminPasswordModal(selectedAccountId, item.dataset.id);
                });
            });
        });

        if (pageInfo) pageInfo.textContent = `Página ${currentPage}`;
        if (totalEl) totalEl.textContent = total;
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }

    document.addEventListener('passwordDeleted', () => {
        // Vuelve a cargar la lista de contraseñas (ajusta según tu lógica)
        // Por ejemplo, si tienes una función renderPasswordsPage:
        renderPasswordsPage(currentPage, passwordSearchEl.value);
    });

    // Inicializa
    await searchAccounts();
}