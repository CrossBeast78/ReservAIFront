import SessionStorageManager from "./AppStorage.js";

const session = SessionStorageManager.getSession();
const BASE_URL = "https://passmanager.reservai.com.mx/api";

// Función para mostrar mensajes en la interfaz
function showMessage(message, type = 'info', duration = 3000) {
  const container = document.getElementById('messageContainer');
  if (!container) return;

  const messageEl = document.createElement('div');
  messageEl.className = `message message-${type}`;
  messageEl.textContent = message;
  messageEl.style.animation = 'slideIn 0.3s ease-in-out';

  container.appendChild(messageEl);

  setTimeout(() => {
    messageEl.style.animation = 'slideOut 0.3s ease-in-out';
    setTimeout(() => messageEl.remove(), 300);
  }, duration);
}

document.addEventListener("DOMContentLoaded", () => {
  const verifyBtn = document.querySelector(".verifybtn");
  const resendBtn = document.querySelector(".resendbtn");

  const token = SessionStorageManager.getSession().access_token;

  if (verifyBtn) {
    verifyBtn.addEventListener("click", () => {
      window.location.href = "/login";
    });
  }

  //Reenviar email
  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      try {
        const response = await fetch(`${BASE_URL}/verification`, {
          method: "GET",
          headers: {
            "Authorization": token,
          },
        });

        let data;
        try { data = await response.json(); } catch { data = {}; }

        if (response.ok) {
          showMessage(data.message || "Correo de verificación reenviado.", 'success');
        } else {
          showMessage(data.message || "No se pudo reenviar el correo.", 'error');
        }
      } catch (err) {
        showMessage("Error al reenviar el correo: " + err.message, 'error');
      }
    });
  }
});
