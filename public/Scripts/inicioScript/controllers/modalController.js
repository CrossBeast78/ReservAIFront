import { createPassword as createPasswordService, fetchPasswordById } from '../services/passwordService.js';
import { showMessage } from '../service/uiHelpers.js';

export function setupModals({ addBtn, createModal, viewModal, fields, listEl, passwords, renderList }) {
    const { createName, createPassword: createPasswordInput, createDescription, confirmPassword, savePasswordBtn } = fields;

    // --- Modal Crear ---
    addBtn?.addEventListener('click', () => {
        createName.value = '';
        createPasswordInput.value = '';
        createDescription.value = '';
        confirmPassword.value = '';
        createModal.classList.add('show');
    });

    document.querySelectorAll('.close-btn').forEach(btn =>
        btn.addEventListener('click', () => btn.closest('.modal')?.classList.remove('show'))
    );

       document.querySelectorAll('.closecreate').forEach(btn =>
        btn.addEventListener('click', () => btn.closest('.modalcreate')?.classList.remove('show'))
    );

    const toggleCreatePasswordBtn = document.getElementById('toggleCreatePassword');
    const eyeIconCreate = toggleCreatePasswordBtn?.querySelector('i');
    if (toggleCreatePasswordBtn && createPasswordInput && eyeIconCreate) {
        toggleCreatePasswordBtn.addEventListener('click', () => {
            const isHidden = createPasswordInput.type === 'password';
            createPasswordInput.type = isHidden ? 'text' : 'password';
            eyeIconCreate.className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
            toggleCreatePasswordBtn.title = isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña';
        });
    }

    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const eyeIconConfirm = toggleConfirmPasswordBtn?.querySelector('i');
    if (toggleConfirmPasswordBtn && confirmPassword && eyeIconConfirm) {
        toggleConfirmPasswordBtn.addEventListener('click', () => {
            const isHidden = confirmPassword.type === 'password';
            confirmPassword.type = isHidden ? 'text' : 'password';
            eyeIconConfirm.className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
            toggleConfirmPasswordBtn.title = isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña';
        });
    }

    savePasswordBtn?.addEventListener('click', async () => {
        const name = createName.value.trim();
        const pass = createPasswordInput.value;
        const confirm = confirmPassword.value;
        const desc = createDescription.value.trim();

        if (!name || !pass || !confirm) return showMessage("Todos los campos son obligatorios");
        if (pass !== confirm) return showMessage("Las contraseñas no coinciden");

        try {
            await createPasswordService({ name, password: pass, description: desc });
            showMessage("Contraseña guardada correctamente");
            createModal.classList.remove('show');
            renderList();
        } catch (err) {
            showMessage("Error: " + err.message);
        }
    });

    // --- Modal Ver Contraseña ---
    listEl?.addEventListener('click', async (e) => {
        const item = e.target.closest('.password-item');
        if (!item) return;

        const passwordId = item.dataset.id;
        const modalBody = viewModal.querySelector('#modalBody');
        modalBody.innerHTML = '<div style="text-align:center;">⏳ Cargando contraseña...</div>';
        viewModal.classList.add('show');

        try {
            const fullPass = await fetchPasswordById(passwordId);
            modalBody.innerHTML = fullPass.toHTML();

            // --- Botón Mostrar/Ocultar ---
            const toggleBtn = modalBody.querySelector('.toggle-password-btn');
            const passwordText = modalBody.querySelector('.password-text');
            const eyeIcon = modalBody.querySelector('.eye-icon');

            if (toggleBtn && passwordText && eyeIcon) {
                toggleBtn.addEventListener('click', () => {
                    const isVisible = passwordText.textContent !== '*************';
                    if (isVisible) {
                        passwordText.textContent = '*************';
                        eyeIcon.className = 'fas fa-eye eye-icon';
                        toggleBtn.classList.remove('active');
                        toggleBtn.title = 'Mostrar contraseña';
                    } else {
                        passwordText.textContent = passwordText.dataset.password;
                        eyeIcon.className = 'fas fa-eye-slash eye-icon';
                        toggleBtn.classList.add('active');
                        toggleBtn.title = 'Ocultar contraseña';
                    }
                });
            }

            // --- Botón Copiar ---
            const copyBtn = modalBody.querySelector('.copy-password-btn');
            const copyIcon = modalBody.querySelector('.copy-icon');
            if (copyBtn && passwordText && copyIcon) {
                copyBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(passwordText.dataset.password);
                        copyIcon.className = 'fas fa-check copy-icon';
                        copyBtn.classList.add('copied');
                        copyBtn.title = '¡Copiado!';
                        setTimeout(() => {
                            copyIcon.className = 'fas fa-copy copy-icon';
                            copyBtn.classList.remove('copied');
                            copyBtn.title = 'Copiar contraseña';
                        }, 2000);
                    } catch {
                        showMessage('No se pudo copiar la contraseña');
                    }
                });
            }

        } catch (err) {
            modalBody.innerHTML = '<div style="text-align:center;color:red;">❌ Error al cargar la contraseña</div>';
            showMessage("Error al obtener la contraseña");
        }
    });
}
