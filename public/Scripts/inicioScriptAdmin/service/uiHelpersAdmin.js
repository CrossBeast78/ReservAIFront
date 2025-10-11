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
