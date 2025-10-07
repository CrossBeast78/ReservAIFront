import { createPassword as createPasswordService, fetchPasswordById, updatePasswordAttribute } from '../services/passwordService.js';
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


            // Solo permite editar si updateableByClient es true
            if (fullPass.updateableByClient) {
                        // Editar nombre
            const nameDiv = modalBody.querySelector('.password-name');
            const nameSpan = nameDiv?.querySelector('.editable-name');
            const nameEditIcon = nameDiv?.querySelector('.edit-icon[title="Editar nombre"]');
            if (nameDiv && nameSpan && nameEditIcon) {
                nameEditIcon.addEventListener('click', async () => {
                    const currentValue = nameSpan.textContent.trim();
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = currentValue;
                    input.className = 'edit-input';
                    nameDiv.replaceChild(input, nameSpan);
                    input.focus();

                    input.addEventListener('blur', async () => {
                        const newValue = input.value.trim();
                        if (newValue && newValue !== currentValue) {
                            try {
                                await updatePasswordAttribute(fullPass.id, "name", newValue);
                                showMessage("Nombre actualizado");
                                fullPass.name = newValue;
                                const newSpan = document.createElement('span');
                                newSpan.className = 'editable-name';
                                newSpan.textContent = newValue;
                                nameDiv.replaceChild(newSpan, input);
                            } catch (err) {
                                showMessage("Error al actualizar nombre");
                                nameDiv.replaceChild(nameSpan, input);
                            }
                        } else {
                            nameDiv.replaceChild(nameSpan, input);
                        }
                    });

                    input.addEventListener('keydown', (ev) => {
                        if (ev.key === 'Enter') input.blur();
                        if (ev.key === 'Escape') nameDiv.replaceChild(nameSpan, input);
                    });
                });
            }

            // Editar descripción
            const descDiv = modalBody.querySelector('.password-description');
            const descSpan = descDiv?.querySelector('.editable-description');
            const descEditIcon = descDiv?.querySelector('.edit-icon[title="Editar descripción"]');
            if (descDiv && descSpan && descEditIcon) {
                descEditIcon.addEventListener('click', async () => {
                    const currentValue = descSpan.textContent.trim();
                    const textarea = document.createElement('textarea');
                    textarea.value = currentValue;
                    textarea.className = 'edit-input';
                    descDiv.replaceChild(textarea, descSpan);
                    textarea.focus();

                    textarea.addEventListener('blur', async () => {
                        const newValue = textarea.value.trim();
                        if (newValue !== currentValue) {
                            try {
                                await updatePasswordAttribute(fullPass.id, "description", newValue);
                                showMessage("Descripción actualizada");
                                fullPass.description = newValue;
                                const newSpan = document.createElement('span');
                                newSpan.className = 'editable-description';
                                newSpan.textContent = newValue;
                                descDiv.replaceChild(newSpan, textarea);
                            } catch (err) {
                                showMessage("Error al actualizar descripción");
                                descDiv.replaceChild(descSpan, textarea);
                            }
                        } else {
                            descDiv.replaceChild(descSpan, textarea);
                        }
                    });

                    textarea.addEventListener('keydown', (ev) => {
                        if (ev.key === 'Enter') textarea.blur();
                        if (ev.key === 'Escape') descDiv.replaceChild(descSpan, textarea);
                    });
                });
            }

            // Editar contraseña
            const passDiv = modalBody.querySelector('.password-value-container');
            const passSpan = passDiv?.querySelector('.password-text');
            const passEditIcon = passDiv?.querySelector('.edit-icon[title="Editar contraseña"]');
            if (passDiv && passSpan && passEditIcon) {
                passEditIcon.addEventListener('click', async () => {
                    const currentValue = passSpan.dataset.password || '';
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = currentValue;
                    input.className = 'edit-input';
                    // Cambia aquí:
                    const passDisplay = passDiv.querySelector('.password-display');
                    passDisplay.replaceChild(input, passSpan);
                    input.focus();

                    input.addEventListener('blur', async () => {
                        const newValue = input.value.trim();
                        if (newValue && newValue !== currentValue) {
                            try {
                                await updatePasswordAttribute(fullPass.id, "password", newValue);
                                showMessage("Contraseña actualizada");
                                fullPass.password = newValue;
                                const newPassSpan = document.createElement('div');
                                newPassSpan.className = 'password-text';
                                newPassSpan.dataset.password = newValue;
                                newPassSpan.textContent = '*************';
                                passDisplay.replaceChild(newPassSpan, input);
                            } catch (err) {
                                showMessage("Error al actualizar contraseña");
                                passDisplay.replaceChild(passSpan, input);
                            }
                        } else {
                            passDisplay.replaceChild(passSpan, input);
                        }
                    });

                    input.addEventListener('keydown', (ev) => {
                        if (ev.key === 'Enter') input.blur();
                        if (ev.key === 'Escape') passDisplay.replaceChild(passSpan, input);
                    });
                });
            }

            } else {
                // Si no es editable, quitar iconos de edición
                modalBody.querySelectorAll('.edit-icon').forEach(icon => icon.remove());
            }
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
