import RegisterInfo from "../models/registermodel.js";
import SessionStorageManager from "./AppStorage.js";

document.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const accountType = document.getElementById('accountType');
  const accountLabel = document.getElementById('accountLabel');
  const registerBtn = document.getElementById('registerBtn');


  function resetPlaceholders() {
    nameInput.placeholder = "Nombre";
    emailInput.placeholder = "Correo electrónico";
    passwordInput.placeholder = "Contraseña";
    confirmPasswordInput.placeholder = "Confirmar contraseña";
    [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(inp => {
      inp.classList.remove("error-input");
    });
  }

  function showError(input, message) {
    input.value = "";
    input.placeholder = message;
    input.classList.add("error-input");
  }

  // Cambiar etiqueta de tipo de cuenta
  accountType.addEventListener("change", () => {
    accountLabel.textContent = accountType.checked ? "Admin" : "Usuario";
  });

  // Registrar
  registerBtn.addEventListener("click", async () => {
    resetPlaceholders();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const pass = passwordInput.value;
    const confirm = confirmPasswordInput.value;
    const type = accountType.checked ? "Admin" : "Usuario";

    let valid = true;

    if (!name) {
      showError(nameInput, "El nombre es obligatorio");
      valid = false;
    }
    if (!email) {
      showError(emailInput, "El correo es obligatorio");
      valid = false;
    }
    if (!pass) {
      showError(passwordInput, "La contraseña es obligatoria");
      valid = false;
    }
    if (!confirm) {
      showError(confirmPasswordInput, "Confirma tu contraseña");
      valid = false;
    }
    if (pass && confirm && pass !== confirm) {
      showError(confirmPasswordInput, "Las contraseñas no coinciden");
      valid = false;
    }
    if (!valid) return;

    let registerInfo;
    try {
      registerInfo = new RegisterInfo({
        name,
        email,
        password: pass,
        account_type: type,
      });
    } catch (err) {
      // Mostrar errores de validación del modelo en el campo correspondiente
      if (err.message.includes("Nombre")) {
        showError(nameInput, err.message);
      } else if (err.message.includes("Correo")) {
        showError(emailInput, err.message);
      } else {
        alert("Error: " + err.message);
      }
      return;
    }

    try {
      const result = await registerInfo.register();

      SessionStorageManager.saveSession({
        access_token: result.access_token,
        email_sender_token: result.email_sender_token,
        authorization_token: result.authorization_token,
        account_type: result.account_type,
        account_name: result.account_name,
      });

      alert("Cuenta creada con éxito ✅");
      window.location.href = "/verify_email";
    } catch (err) {
      showError(emailInput, "Error: " + err.message);
    }
  });
});