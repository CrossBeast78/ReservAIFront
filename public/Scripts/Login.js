import LoginInfo from "../models/logininfo.js";
import SessionStorageManager from "./AppStorage.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById("togglePasswordBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", togglePassword);
  }

  if (!form) {
    console.error("No se encontró el formulario con id='loginForm'");
    return;
  }

  function resetPlaceholders() {
    emailInput.placeholder = "Correo electrónico";
    passwordInput.placeholder = "Contraseña";
    [emailInput, passwordInput].forEach(inp => {
      inp.classList.remove("error-input");
    });
  }

  function showError(input, message) {
    input.value = "";
    input.placeholder = message;
    input.classList.add("error-input");
  }

  // Quitar error al enfocar el input
  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('focus', () => {
      input.classList.remove('error-input');
      if (input === emailInput) input.placeholder = "Correo electrónico";
      if (input === passwordInput) input.placeholder = "Contraseña";
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    resetPlaceholders();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    let valid = true;

    if (!email) {
      showError(emailInput, "El correo es necesario");
      valid = false;
    }
    if (!password) {
      showError(passwordInput, "La contraseña es necesaria");
      valid = false;
    }
    if (!valid) return;

    let loginInfo;
    try {
      loginInfo = new LoginInfo(email, password);
    } catch (err) {
      if (err.message.includes("Correo")) {
        showError(emailInput, err.message);
      } else if (err.message.includes("Contraseña")) {
        showError(passwordInput, err.message);
      } else {
        alert("Error: " + err.message);
      }
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

      if(data.verified === false){
        window.location.href = "/verify_email";
      }else if (data.verified === true && data.twofaenabled === false){
        window.location.href = "/QR";
      }else if (data.verified === true && data.twofaenabled === true){
        window.location.href = "/twofa";
      }

    } catch (err) {
      const match = err.message.match(/\d+/);
      const code = match ? parseInt(match[0]) : null;
      if (code >= 400 && code < 500) {
        showError(emailInput, "Correo o contraseña inválidos");
        showError(passwordInput, "Correo o contraseña inválidos");
        return;
      }
    }
  });
});

// Toggle de mostrar/ocultar contraseña
function togglePassword() {
  const passwordField = document.getElementById("password");
  passwordField.type = passwordField.type === "password" ? "text" : "password";
}