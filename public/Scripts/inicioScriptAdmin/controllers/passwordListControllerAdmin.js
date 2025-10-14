import { fetchAccounts, fetchAccountById } from '../services/adminUserService.js';
import { renderAdminAccountList, renderAdminPasswordList } from '../service/renderListAdmin.js';
import { showMessage } from '../service/uiHelpersAdmin.js';

function isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function setupAdminSearch(elements) {
    console.log("setupAdminSearch ejecutándose");
    const {
        accountSearchEl,
        accountListEl,
        passwordSearchEl,
        passwordListEl,
        selectedAccountEl,
        prevBtn,
        nextBtn,
        pageInfo,
        totalEl,
        onAccountSelected,
        prevAccountBtn,
        nextAccountBtn,
        pageInfoAccount
    } = elements;

    let selectedAccountId = null;
    let currentPage = 1;
    let nextPage = null;
    let totalPasswords = 0;
    let currentPasswords = [];
    let currentAccountPage = 1;
    let nextAccountPage = null;
    let totalAccounts = 0;
    let currentAccounts = [];

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

    // --- PAGINACIÓN DE CUENTAS ---
    prevAccountBtn?.addEventListener('click', () => {
        if (currentAccountPage > 1) {
            searchAccounts(currentAccountPage - 1);
        }
    });

    nextAccountBtn?.addEventListener('click', () => {
        if (nextAccountPage && nextAccountPage > currentAccountPage) {
            searchAccounts(nextAccountPage);
        }
    });

    async function searchAccounts(page = 1) {
        const search = accountSearchEl.value.trim();
        try {
            if (search && isUUID(search)) {
                const response = await fetchAccountById(search, 1, passwordSearchEl.value);
                const account = response.data?.account;
                renderAdminAccountList([account], accountListEl, onAccountSelectedInternal);
                if (account) {
                    selectedAccountId = account.id;
                    selectedAccountEl.textContent = ` ${account.email || account.id}`;
                    loadPasswordsPage(1, passwordSearchEl.value);
                }
                // Actualiza paginación de cuentas (solo una cuenta)
                currentAccountPage = 1;
                nextAccountPage = null;
                totalAccounts = 1;
                if (pageInfoAccount) pageInfoAccount.textContent = `Página 1`;
                if (prevAccountBtn) prevAccountBtn.disabled = true;
                if (nextAccountBtn) nextAccountBtn.disabled = true;
            } else {
                const { data: accounts = [], total, next_page, current_page } = await fetchAccounts({ page, search });
                currentAccounts = accounts;
                renderAdminAccountList(accounts, accountListEl, onAccountSelectedInternal);
                renderAdminPasswordList([], passwordListEl);
                if (pageInfo) pageInfo.textContent = '';
                if (totalEl) totalEl.textContent = '0';

                // Actualiza paginación de cuentas
                currentAccountPage = current_page || page;
                nextAccountPage = next_page || null;
                totalAccounts = total || accounts.length;
                if (pageInfoAccount) pageInfoAccount.textContent = `Página ${currentAccountPage}`;
                if (prevAccountBtn) prevAccountBtn.disabled = currentAccountPage <= 1;
                if (nextAccountBtn) nextAccountBtn.disabled = !nextAccountPage || nextAccountPage <= currentAccountPage;
            }
        } catch (err) {
            showMessage("Error al buscar cuentas: " + err.message);
            renderAdminAccountList([], accountListEl, onAccountSelectedInternal);
            renderAdminPasswordList([], passwordListEl);
            if (pageInfo) pageInfo.textContent = '';
            if (totalEl) totalEl.textContent = '0';
            if (pageInfoAccount) pageInfoAccount.textContent = '';
            if (prevAccountBtn) prevAccountBtn.disabled = true;
            if (nextAccountBtn) nextAccountBtn.disabled = true;
        }
    }

    async function onAccountSelectedInternal(account) {
        selectedAccountId = account.id;
        if (typeof onAccountSelected === "function") onAccountSelected(account.id);
        selectedAccountEl.textContent = ` ${account.email || account.id}`;
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