export function renderPasswordList(passwords, listEl) {
  listEl.innerHTML = "";
  if (!passwords.length) {
    listEl.innerHTML = "<li>No hay contraseñas para mostrar.</li>";
    return;
  }
  passwords.forEach((pass, idx) => {
    const item = document.createElement("li");
    item.className = "password-item";
    item.dataset.id = pass.id;
    item.dataset.idx = idx;
    item.innerHTML = `
      <span><b>${pass.name}</b></span>
      <span>${pass.password}</span>
      <button class="view-btn">Ver / Editar</button>
    `;
    listEl.appendChild(item);
  });
}

export function showMessage(msg) {
  let msgDiv = document.getElementById("admin-msg");
  if (!msgDiv) {
    msgDiv = document.createElement("div");
    msgDiv.id = "admin-msg";
    msgDiv.style.color = "#d32f2f";
    msgDiv.style.textAlign = "center";
    document.body.appendChild(msgDiv);
  }
  msgDiv.textContent = msg;
  setTimeout(() => { msgDiv.textContent = ""; }, 2500);
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


export function showDeleteConfirmModal({ title = "¿Estás seguro?", message = "", onConfirm, onCancel }) {
    const modal = document.getElementById('confirmDeleteModal');
    const titleEl = document.getElementById('confirmDeleteTitle');
    const msgEl = document.getElementById('confirmDeleteMsg');
    const inputEl = document.getElementById('confirmDeleteInput');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    titleEl.textContent = title;
    msgEl.innerHTML = message || "Esta acción no se puede deshacer.<br>Escribe <b>eliminar</b> para confirmar.";
    inputEl.value = "";
    confirmBtn.disabled = true;
    modal.style.display = "block";

    inputEl.oninput = () => {
        confirmBtn.disabled = inputEl.value.trim().toLowerCase() !== "eliminar";
    };

    function closeModal() {
        modal.style.display = "none";
        inputEl.oninput = null;
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
    }

    confirmBtn.onclick = () => {
        closeModal();
        if (typeof onConfirm === "function") onConfirm();
    };

    cancelBtn.onclick = () => {
        closeModal();
        if (typeof onCancel === "function") onCancel();
    };
}