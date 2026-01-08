import SessionStorageManager from "./AppStorage.js";


document.addEventListener("DOMContentLoaded", async () => {
  const qrCodeDiv = document.querySelector(".qr-code");
  const qrMessage = document.querySelector(".qr-message");
  const nextBtn = document.getElementById('nextBtn');
  const token = SessionStorageManager.getSession().access_token;
  const BASE_URL = "https://passmanager.reservai.com.mx/api";

  // Configurar event listener para el botón "Siguiente"
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.location.href = "/twofa";
    });
  }

  if (!token) {
    qrMessage.textContent = "No hay sesión activa. Inicia sesión de nuevo.";
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/twofa`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      }
    });

    if (response.status === 418) {
      window.location.href = '/login';
      return; 
    }

    if (!response.ok) {
      throw new Error("No se pudo obtener el QR. Intenta más tarde.");
    }

    const data = await response.json();

    if (data.qrCode) {
      const img = document.createElement("img");
      img.src = data.qrCode;
      img.alt = "Código QR";
      img.width = 220;
      img.height = 220;
      qrCodeDiv.appendChild(img);
      qrMessage.textContent = "Escanea este código QR para usar el doble factor de autenticación.";
    } else {
      qrMessage.textContent = "No se recibió el QR. Contacta soporte.";
    }
  } catch (err) {

    qrMessage.textContent = "Error: " + err.message;
  }
});