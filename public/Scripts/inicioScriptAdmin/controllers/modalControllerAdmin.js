import {
  createPasswordForAccount,
  fetchPasswordById,
  updatePasswordAttribute,
  deletePassword
} from '../services/adminPasswordService.js';
import { showMessage } from '../service/uiHelpersAdmin.js';

export function setupAdminModals({ addBtn, createModal, viewModal, fields, listEl, searchInput }) {
  // Abrir modal de crear
  addBtn?.addEventListener('click', () => {
    fields.createName.value = '';
    fields.createPassword.value = '';
    fields.createDescription.value = '';
    fields.confirmPassword.value = '';
    createModal.classList.add('show');
  });

  // Cerrar modales
  document.querySelectorAll('.close, .close-btn').forEach(btn =>
    btn.addEventListener('click', function() {
      const modalId = this.getAttribute('data-close');
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('show');
      else this.closest('.modal')?.classList.remove('show');
    })
  );

  // Guardar nueva contraseña
  fields.savePasswordBtn?.addEventListener('click', async () => {
    const name = fields.createName.value.trim();
    const pass = fields.createPassword.value;
    const confirm = fields.confirmPassword.value;
    const desc = fields.createDescription.value.trim();
    const accountId = searchInput.value.trim();

    if (!name || !pass || !confirm) return showMessage("Todos los campos son obligatorios");
    if (pass !== confirm) return showMessage("Las contraseñas no coinciden");

    try {
      await createPasswordForAccount(accountId, {
        name,
        password: pass,
        description: desc,
        updateablebyclient: true,
        visibility: true
      });
      showMessage("Contraseña guardada correctamente");
      createModal.classList.remove('show');
      window.location.reload();
    } catch (err) {
      showMessage("Error: " + err.message);
    }
  });

  // Ver/editar/eliminar contraseña
  listEl?.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('view-btn')) return;
    const item = e.target.closest('.password-item');
    const passwordId = item.dataset.id;
    const accountId = searchInput.value.trim();
    const modalBody = document.getElementById('modalBody');
    viewModal.classList.add('show');
    modalBody.innerHTML = '<div style="text-align:center;">⏳ Cargando contraseña...</div>';

    try {
      const fullPass = await fetchPasswordById(accountId, passwordId);
      modalBody.innerHTML = `
        <div><b>Nombre:</b> ${fullPass.name}</div>
        <div><b>Contraseña:</b> <span class="password-text" data-password="${fullPass.password}">*************</span>
          <button class="toggle-password-btn" title="Mostrar contraseña">👁️</button>
          <button class="copy-password-btn" title="Copiar contraseña">📋</button>
        </div>
        <div><b>Descripción:</b> ${fullPass.description}</div>
        <button class="edit-attribute-btn" data-attribute="password">Editar contraseña</button>
        <button class="delete-password-btn">Eliminar</button>
      `;

      // Mostrar/Ocultar contraseña
      const toggleBtn = modalBody.querySelector('.toggle-password-btn');
      const passwordText = modalBody.querySelector('.password-text');
      toggleBtn?.addEventListener('click', () => {
        const isVisible = passwordText.textContent !== '*************';
        passwordText.textContent = isVisible ? '*************' : passwordText.dataset.password;
      });

      // Copiar contraseña
      const copyBtn = modalBody.querySelector('.copy-password-btn');
      copyBtn?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(passwordText.dataset.password);
          showMessage('¡Contraseña copiada!');
        } catch {
          showMessage('No se pudo copiar la contraseña');
        }
      });

      // Editar contraseña
      const editBtn = modalBody.querySelector('.edit-attribute-btn');
      editBtn?.addEventListener('click', async () => {
        const newValue = prompt("Nueva contraseña:");
        if (!newValue) return;
        try {
          await updatePasswordAttribute(accountId, passwordId, "password", newValue);
          showMessage("Contraseña actualizada");
          viewModal.classList.remove('show');
          window.location.reload();
        } catch (err) {
          showMessage("Error al actualizar: " + err.message);
        }
      });

      // Eliminar contraseña
      const deleteBtn = modalBody.querySelector('.delete-password-btn');
      deleteBtn?.addEventListener('click', async () => {
        if (!confirm("¿Seguro que deseas eliminar esta contraseña?")) return;
        try {
          await deletePassword(accountId, passwordId);
          showMessage("Contraseña eliminada.");
          viewModal.classList.remove('show');
          window.location.reload();
        } catch (err) {
          showMessage("Error al eliminar: " + err.message);
        }
      });

    } catch (err) {
      modalBody.innerHTML = '<div style="text-align:center;color:red;">❌ Error al cargar la contraseña</div>';
      showMessage("Error al obtener la contraseña");
    }
  });
}
