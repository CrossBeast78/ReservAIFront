import { fetchAccounts, fetchAccountById } from '../services/adminUserService.js';
import { fetchPasswordById } from '../services/adminPasswordService.js';
import { renderAdminAccountList, renderAdminPasswordList } from '../service/renderListAdmin.js';
import { showMessage } from '../service/uiHelpersAdmin.js';

// Utilidad para detectar UUID v4
function isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function setupAdminSearch(elements) {
    const { accountSearchEl, accountListEl, passwordSearchEl, passwordListEl, selectedAccountEl, onAccountSelected } = elements;
    let selectedAccountId = null;
    let currentPasswords = [];

    accountSearchEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchAccounts();
        }
    });

    passwordSearchEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchPasswords();
        }
    });

    async function searchAccounts() {
        const search = accountSearchEl.value.trim();
        try {
            if (search && isUUID(search)) {
                // Buscar por ID
                const response = await fetchAccountById(search);
                const account = response.data?.account;
                currentPasswords = response.data?.passwords || [];
                renderAdminAccountList([account], accountListEl, onAccountSelectedInternal);
                renderAdminPasswordList(currentPasswords, passwordListEl, onViewPassword);
            } else {
                // Buscar por nombre/correo
                const { data: accounts = [] } = await fetchAccounts({ page: 1, search });
                renderAdminAccountList(accounts, accountListEl, onAccountSelectedInternal);
                renderAdminPasswordList([], passwordListEl, onViewPassword);
            }
        } catch (err) {
            showMessage("Error al buscar cuentas: " + err.message);
            renderAdminAccountList([], accountListEl, onAccountSelectedInternal);
            renderAdminPasswordList([], passwordListEl, onViewPassword);
        }
    }

    async function onAccountSelectedInternal(accountId) {
        selectedAccountId = accountId;
        if (typeof onAccountSelected === "function") onAccountSelected(accountId);
        selectedAccountEl.textContent = `${accountId}`;
        try {
            const response = await fetchAccountById(accountId);
            currentPasswords = response.data?.passwords || [];
            renderAdminPasswordList(currentPasswords, passwordListEl, onViewPassword);
        } catch (err) {
            showMessage("Error al cargar contraseñas: " + err.message);
            renderAdminPasswordList([], passwordListEl, onViewPassword);
        }
    }

    async function onViewPassword(passwordId) {
        if (!selectedAccountId) {
            showMessage("No hay cuenta seleccionada.");
            return;
        }
        try {
            console.log("Intentando fetchPasswordById con:", selectedAccountId, passwordId);
            const passwordData = await fetchPasswordById(selectedAccountId, passwordId);
            document.getElementById('viewModal').classList.add('show');
            document.getElementById('modalBody').innerHTML = `
                <div><b>Nombre:</b> ${passwordData.name}</div>
                <div><b>Descripción:</b> ${passwordData.description || ''}</div>
                <div><b>Contraseña:</b> ${passwordData.password || '*************'}</div>
            `;
        } catch (err) {
            console.error("Error al cargar la contraseña:", err);
            document.getElementById('viewModal').classList.add('show');
            document.getElementById('modalBody').innerHTML = `<div style="color:red"><b>&#10060; Error al cargar la contraseña</b></div>`;
        }
    }

    async function searchPasswords() {
        if (!selectedAccountId) {
            passwordListEl.innerHTML = "<div>Selecciona una cuenta para ver sus contraseñas.</div>";
            return;
        }
        const search = passwordSearchEl.value.trim().toLowerCase();
        const filtered = currentPasswords.filter(p =>
            (p.name && p.name.toLowerCase().includes(search)) ||
            (p.description && p.description.toLowerCase().includes(search))
        );
        renderAdminPasswordList(filtered, passwordListEl, onViewPassword);
    }

    // Inicializa
    await searchAccounts();
}