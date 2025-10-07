import { setupAdminModals } from "./controllers/modalControllerAdmin.js";
import { renderAdminPasswordList } from "./service/renderListAdmin.js";

document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById('addPasswordBtn');
  const createModal = document.getElementById('createModal');
  const viewModal = document.getElementById('viewModal');
  const listEl = document.getElementById('password-list');
  const searchInput = document.getElementById('account-search');
  const createName = document.getElementById('createName');
  const createPassword = document.getElementById('createPassword');
  const createDescription = document.getElementById('createDescription');
  const confirmPassword = document.getElementById('confirmPassword');
  const savePasswordBtn = document.getElementById('savePasswordBtn');
  const selectedAccount = document.getElementById('selected-account');
  const totalPasswords = document.getElementById('totalPasswords');
  const passwordSearch = document.getElementById('search');

  // Render y búsqueda de cuentas
  renderAdminPasswordList({
    searchInput,
    listEl,
    selectedAccount,
    totalPasswords,
    passwordSearch
  });

  // Modales de crear/ver/editar
  setupAdminModals({
    addBtn,
    createModal,
    viewModal,
    fields: {
      createName,
      createPassword,
      createDescription,
      confirmPassword,
      savePasswordBtn
    },
    listEl,
    searchInput
  });
});