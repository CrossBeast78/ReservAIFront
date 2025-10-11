import { fetchAccounts, fetchAccountById } from '../services/adminUserService.js';
import { renderAdminAccountList, renderAdminPasswordList } from '../service/renderListAdmin.js';
import { showMessage } from '../service/uiHelpersAdmin.js';

function isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function setupAdminSearch(elements) {
    const { accountSearchEl, accountListEl, passwordSearchEl, passwordListEl, selectedAccountEl, prevBtn, nextBtn, pageInfo, totalEl, onAccountSelected } = elements;
    let selectedAccountId = null;
    let currentPage = 1;
    let nextPage = null;
    let totalPasswords = 0;
    let currentPasswords = [];

    accountSearchEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchAccounts();
        }
    });

    passwordSearchEl?.addEventListener('input', () => {
        loadPasswordsPage(1, passwordSearchEl.value);
    });

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

    async function searchAccounts() {
        const search = accountSearchEl.value.trim();
        try {
            if (search && isUUID(search)) {
                const response = await fetchAccountById(search, 1, passwordSearchEl.value);
                const account = response.data?.account;
                renderAdminAccountList([account], accountListEl, onAccountSelectedInternal);
                if (account) {
                    selectedAccountId = account.id;
                    selectedAccountEl.textContent = ` ${account.id}`;
                    loadPasswordsPage(1, passwordSearchEl.value);
                }
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
        loadPasswordsPage(1, passwordSearchEl.value);
    }

    async function loadPasswordsPage(page = 1, search = '') {
        if (!selectedAccountId) {
            passwordListEl.innerHTML = "<div>Selecciona una cuenta para ver sus contraseñas.</div>";
            if (pageInfo) pageInfo.textContent = '';
            if (totalEl) totalEl.textContent = '0';
            return;
        }
        try {
            const response = await fetchAccountById(selectedAccountId, page, search);
            currentPasswords = response.data?.passwords || [];
            currentPage = response.current_page || page;
            nextPage = response.next_page || null;
            totalPasswords = response.total || currentPasswords.length;

            renderAdminPasswordList(currentPasswords, passwordListEl);

            passwordListEl.querySelectorAll('.password-item').forEach(item => {
                item.addEventListener('click', () => {
                    import('./modalControllerAdmin.js').then(module => {
                        module.openAdminPasswordModal(selectedAccountId, item.dataset.id);
                    });
                });
            });



            if (pageInfo) pageInfo.textContent = `Página ${currentPage}`;
            if (totalEl) totalEl.textContent = totalPasswords;
            if (prevBtn) prevBtn.disabled = currentPage <= 1;
            if (nextBtn) nextBtn.disabled = !nextPage || nextPage <= currentPage;
        } catch (err) {
            showMessage("Error al cargar contraseñas: " + err.message);
            renderAdminPasswordList([], passwordListEl);
            if (pageInfo) pageInfo.textContent = '';
            if (totalEl) totalEl.textContent = '0';
        }
    }

    document.addEventListener('passwordDeleted', () => {
        loadPasswordsPage(currentPage, passwordSearchEl.value);
    });

    // Inicializa
    await searchAccounts();
}