import {createPasswordForAccount as createPasswordAdmin, fetchPasswordById, updatePasswordAttribute, deletePassword} from '../services/adminPasswordService.js';
import { showMessage } from '../service/uiHelpersAdmin.js';
import { showDeleteConfirmModal } from '../service/uiHelpersAdmin.js';


export function setupAdminModals({ addBtn, createModal, viewModal, fields, listEl, passwords, renderList, getSelectedAccountId }) {
    const { createName, createPassword: createPasswordInput, createDescription, confirmPassword, savePasswordBtn } = fields;

    // --- Modal Crear ---
    addBtn?.addEventListener('click', () => {
        const accountId = typeof getSelectedAccountId === "function" ? getSelectedAccountId() : null;
        if (!accountId) {
            showMessage("Por favor, selecciona una cuenta antes de crear una contraseña.");
            return;
        }
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

    if (savePasswordBtn) {
        const newSaveBtn = savePasswordBtn.cloneNode(true);
        savePasswordBtn.parentNode.replaceChild(newSaveBtn, savePasswordBtn);

        newSaveBtn.addEventListener('click', async () => {
            const name = createName.value.trim();
            const pass = createPasswordInput.value;
            const confirm = confirmPassword.value;
            const desc = createDescription.value.trim();
            const accountId = typeof getSelectedAccountId === "function" ? getSelectedAccountId() : null;
            console.log("ID justo antes de crear contraseña:", accountId);
            // NUEVO: Lee los switches
            const updateableSwitch = document.getElementById('updateableSwitch');
            const visibilitySwitch = document.getElementById('visibilitySwitch');
            const updateablebyclient = updateableSwitch?.checked ?? true;
            const visibility = visibilitySwitch?.checked ?? true;

            if (!name || !pass || !confirm) return showMessage("Todos los campos son obligatorios");
            if (pass !== confirm) return showMessage("Las contraseñas no coinciden");

            try {
                await createPasswordAdmin({
                    accountId,
                    name,
                    password: pass,
                    description: desc,
                    updateablebyclient,
                    visibility
                });
                showMessage("Contraseña guardada correctamente");
                createModal.classList.remove('show');
                renderList();
            } catch (err) {
                showMessage("Error: " + err.message);
            }
        });
    }

    // --- Modal Ver/Editar Contraseña ---

}

export async function openAdminPasswordModal(accountId, passwordId) {
    const viewModal = document.getElementById('viewModal');
    const modalBody = viewModal.querySelector('#modalBody');
    modalBody.innerHTML = '<div style="text-align:center;">⏳ Cargando contraseña...</div>';
    viewModal.classList.add('show');

    try {
      
        const fullPass = await fetchPasswordById(accountId, passwordId); // <-- Solo esto
        console.log('fullPass:', fullPass); // Ahora sí, updateableByClient tendrá el valor correcto
        modalBody.innerHTML = fullPass ? fullPass.toHTML() : '<div style="color:red;">❌ Error al cargar la contraseña</div>';
        

        const updateableSwitch2 = document.getElementById('updateableSwitch2');
        const visibilitySwitch2 = document.getElementById('visibilitySwitch2');
        if (updateableSwitch2) updateableSwitch2.checked = !!fullPass.updateableByClient;
        if (visibilitySwitch2) visibilitySwitch2.checked = !!fullPass.visibility;


         // --- Listener para actualizar "actualizable por cliente" ---
        if (updateableSwitch2) {
            updateableSwitch2.onchange = async function() {
                try {
                    await updatePasswordAttribute(accountId, passwordId, "updateablebyclient", this.checked);
                    showMessage("Permiso de actualización actualizado");
                } catch (err) {
                    showMessage("Error al actualizar permiso de actualización");
                    // Revertir el cambio visual si falla
                    updateableSwitch2.checked = !this.checked;
                }
            };
        }

        // --- Listener para actualizar "visible para cliente" ---
        if (visibilitySwitch2) {
            visibilitySwitch2.onchange = async function() {
                try {
                    await updatePasswordAttribute(accountId, passwordId, "visibility", this.checked);
                    showMessage("Permiso de visibilidad actualizado");
                } catch (err) {
                    showMessage("Error al actualizar permiso de visibilidad");
                    // Revertir el cambio visual si falla
                    visibilitySwitch2.checked = !this.checked;
                }
            };
        }

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
                                await updatePasswordAttribute(accountId, fullPass.id, "name", newValue);
                                showMessage("Nombre actualizado");
                                fullPass.name = newValue;
                                document.dispatchEvent(new CustomEvent('passwordUpdated', { detail: { accountId, passwordId: fullPass.id } }));
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
                                await updatePasswordAttribute(accountId, fullPass.id, "description", newValue);
                                showMessage("Descripción actualizada");
                                fullPass.description = newValue;
                                document.dispatchEvent(new CustomEvent('passwordUpdated', { detail: { accountId, passwordId: fullPass.id } }));
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
                    const passDisplay = passDiv.querySelector('.password-display');
                    passDisplay.replaceChild(input, passSpan);
                    input.focus();

                    input.addEventListener('blur', async () => {
                        const newValue = input.value.trim();
                        if (newValue && newValue !== currentValue) {
                            try {
                                const pass = await fetchPasswordById(accountId, fullPass.id);
                                

                                await updatePasswordAttribute(accountId, fullPass.id, "password", newValue);
                                showMessage("Contraseña actualizada");
                                fullPass.password = newValue;
                                document.dispatchEvent(new CustomEvent('passwordUpdated', { detail: { accountId, passwordId: fullPass.id } }));
                                const newPassSpan = document.createElement('div');
                                newPassSpan.className = 'password-text';
                                newPassSpan.dataset.password = newValue;
                                newPassSpan.textContent = '*************';
                                passDisplay.replaceChild(newPassSpan, input);

                                // Reasigna listeners de mostrar/ocultar y copiar
                                const toggleBtn = modalBody.querySelector('.toggle-password-btn');
                                const eyeIcon = modalBody.querySelector('.eye-icon');
                                if (toggleBtn && newPassSpan && eyeIcon) {
                                    toggleBtn.addEventListener('click', () => {
                                        const isVisible = newPassSpan.textContent !== '*************';
                                        if (isVisible) {
                                            newPassSpan.textContent = '*************';
                                            eyeIcon.className = 'fas fa-eye eye-icon';
                                            toggleBtn.classList.remove('active');
                                            toggleBtn.title = 'Mostrar contraseña';
                                        } else {
                                            newPassSpan.textContent = newPassSpan.dataset.password;
                                            eyeIcon.className = 'fas fa-eye-slash eye-icon';
                                            toggleBtn.classList.add('active');
                                            toggleBtn.title = 'Ocultar contraseña';
                                        }
                                    });
                                }
                                const copyBtn = modalBody.querySelector('.copy-password-btn');
                                const copyIcon = modalBody.querySelector('.copy-icon');
                                if (copyBtn && newPassSpan && copyIcon) {
                                    copyBtn.addEventListener('click', async () => {
                                        try {
                                            await navigator.clipboard.writeText(newPassSpan.dataset.password);
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

            // Mostrar/Ocultar contraseña
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

            // Botón Copiar
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
        

        // Eliminar contraseña
       const deleteBtn = document.getElementById('deletePasswordBtn');
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                showDeleteConfirmModal({
                    title: "Eliminar contraseña",
                    message: "¿Seguro que deseas eliminar esta contraseña? Esta acción no se puede deshacer.<br>Escribe <b>eliminar</b> para confirmar.",
                    onConfirm: async () => {
                        try {
                            await deletePassword(accountId, passwordId);
                            showMessage("Contraseña eliminada");
                            viewModal.classList.remove('show');
                            document.dispatchEvent(new CustomEvent('passwordDeleted'));
                        } catch (err) {
                            showMessage("Error al eliminar: " + err.message);
                        }
                    }
                });
                };
        }
    } catch (err) {
        console.error("Error al cargar la contraseña:", err);
        modalBody.innerHTML = '<div style="text-align:center;color:red;">❌ Error al cargar la contraseña</div>';
        showMessage("Error al obtener la contraseña");
    }
}
