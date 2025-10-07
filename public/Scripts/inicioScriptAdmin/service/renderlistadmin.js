import { fetchAccountById } from "../services/adminUserService.js";
import { renderPasswordList } from "./uiHelpersAdmin.js";

let currentPasswords = [];
let currentAccountId = null;

export function renderAdminPasswordList({ searchInput, listEl, selectedAccount, totalPasswords, passwordSearch }) {
  async function searchAndRender() {
    const accountId = searchInput.value.trim();
    if (!accountId) {
      selectedAccount.textContent = "Ninguna seleccionada";
      totalPasswords.textContent = "0";
      listEl.innerHTML = "<li class='error'>Ingresa un ID de cuenta.</li>";
      return;
    }
    listEl.innerHTML = "<li>Buscando...</li>";
    try {
      const accountData = await fetchAccountById(accountId);
      currentAccountId = accountId;
      currentPasswords = accountData.passwords || [];
      selectedAccount.textContent = accountData.name || accountId;
      totalPasswords.textContent = currentPasswords.length;
      renderPasswordList(currentPasswords, listEl);

      // Filtro por nombre de contraseña
      if (passwordSearch) {
        passwordSearch.oninput = function() {
          const val = passwordSearch.value.toLowerCase();
          const filtered = currentPasswords.filter(p => p.name.toLowerCase().includes(val));
          renderPasswordList(filtered, listEl);
        };
      }
    } catch (err) {
      selectedAccount.textContent = "Ninguna seleccionada";
      totalPasswords.textContent = "0";
      listEl.innerHTML = `<li class='error'>${err.message}</li>`;
    }
  }

  // Buscar al presionar Enter
  searchInput.addEventListener("keydown", e => { if (e.key === "Enter") searchAndRender(); });

  // Inicializa vacía
  listEl.innerHTML = "<li>Busca una cuenta para ver sus contraseñas.</li>";
}