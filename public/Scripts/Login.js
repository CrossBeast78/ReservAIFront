import LoginInfo from "../models/logininfo.js";
import SessionStorageManager from "./AppStorage.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const toggleBtn = document.getElementById("togglePasswordBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", togglePassword);
  }

  if (!form) {
    console.error("No se encontró el formulario con id='loginForm'");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    let loginInfo;
    try {
      loginInfo = new LoginInfo(email, password);
    } catch (err) {
      alert("Información inválida: " + err.message);
      return;
    }

    try {
      const data = await loginInfo.login();

   
     SessionStorageManager.saveSession({
        access_token: data.token, // Siempre guarda el token recibido
        token_type: data.token_type, // Guarda también el tipo de token
        account_type: data.account_type,
        account_name: email
      });


      // Redirección según el estado de twofa y verificación
      if (data.twofaenabled) {
        window.location.href = "/twofa";
      } else if (data.verified) {
        window.location.href = "/QR";
      } else {
        window.location.href = "/verify_email";
      }

    } catch (err) {
      console.error("Error en login:", err.message);
      alert("Error: " + err.message);
    }
  });
});

// Toggle de mostrar/ocultar contraseña
function togglePassword() {
  const passwordField = document.getElementById("password");
  passwordField.type = passwordField.type === "password" ? "text" : "password";
}