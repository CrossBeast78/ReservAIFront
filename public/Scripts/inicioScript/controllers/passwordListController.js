import { fetchPasswords } from '../services/passwordService.js';
import { renderList } from '../service/renderList.js';
import { showError } from '../service/uiHelpers.js';

export async function setupPasswordList(elements) {
    const { listEl, searchEl, prevBtn, nextBtn, pageInfo, totalEl } = elements;
    let currentPage = 1;
    let totalPages = 1;
    let pageSize = 5; // Cambia esto si tu backend usa otro tamaño de página
 

    async function loadPage(page = 1, search = '') {
        try {
            const { data: passwords = [], total = 0, next_page, current_page } = await fetchPasswords(page, search);
            currentPage = current_page || page;
            // Calcula el tamaño de página dinámicamente (puede variar en la última página)
            pageSize = passwords.length > 0 ? passwords.length : pageSize;
          // Guarda el total si no está definido
            totalPages = Math.max(1, Math.ceil(total / pageSize)); // <-- CORREGIDO


            renderList(passwords, listEl);

            pageInfo.textContent = next_page ? `Página ${currentPage} `: `Página ${currentPage}`;
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = !next_page;
        } catch (err) {
            showError(listEl, "Error al cargar contraseñas: " + err.message);
        }
    }

    prevBtn?.addEventListener('click', () => {
        if (currentPage > 1) {
            loadPage(currentPage - 1, searchEl.value);
        }
    });

    nextBtn?.addEventListener('click', () => {
        loadPage(currentPage + 1, searchEl.value);
    });

    searchEl?.addEventListener('input', () => {
        loadPage(1, searchEl.value);
    });

    await loadPage(1, ''); // Iniciar con la primera página
    return { reload: loadPage };
}