export function renderAdminAccountList(accounts, listEl, onSelect) {
    if (!listEl) return;
    if (!accounts.length) {
        listEl.innerHTML = "<div class='account-item'>No se encontraron cuentas.</div>";
        return;
    }
    listEl.innerHTML = accounts.map(acc => `
        <div class="account-item" data-id="${acc.id}">
            <div><b>Email:</b> ${acc.email || 'Sin correo'}</div>
            <div><b>Nombre:</b> ${acc.name || acc.nombre || 'Sin nombre'}</div>
        </div>
    `).join('');
    listEl.querySelectorAll('.account-item').forEach(item => {
        item.addEventListener('click', () => {
            onSelect(item.dataset.id);
        });
    });
}

export function renderAdminPasswordList(passwords, listEl, onView) {
    if (!listEl) return;
    listEl.innerHTML = passwords.length
        ? passwords.map(p => `
            <li class="password-item" data-id="${p.id}" style="cursor:pointer;">
                <b>Nombre:</b> ${p.name}
            </li>
        `).join('')
        : "<li>No hay contraseñas para esta cuenta.</li>";

    if (onView) {
        listEl.querySelectorAll('.password-item').forEach(item => {
            item.addEventListener('click', () => {
                onView(item.dataset.id);
            });
        });
    }
}

