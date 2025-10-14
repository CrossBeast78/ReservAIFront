import { escapeHtml } from './uiHelpers.js';


export function renderList(passwords, listEl) {
    if (!listEl) return;


    if (!passwords || passwords.length === 0) {
        listEl.innerHTML = '<li class="empty">No se encontraron contraseñas.</li>';
        return;
    }

    listEl.innerHTML = passwords.map((p) => {
        const name = escapeHtml(p.name || p.nombre || p.title || 'Sin nombre');
        return `<li class="password-item" data-id="${p.id}" tabindex="0">${name}</li>`;
    }).join('');
}