import SessionStorageManager from "./AppStorage.js";

const session = SessionStorageManager.getSession();
if (!session || !session.access_token) {
    window.location.href = "/login";
}

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

  [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener('focus', () => {
      input.classList.remove('error-input');
      if (input === emailInput) input.placeholder = "Correo electrónico";
      if (input === passwordInput) input.placeholder = "Contraseña";
      if (input === nameInput) input.placeholder = "Nombre";
      if (input === confirmPasswordInput) input.placeholder = "Confirmar contraseña";
    });
  });

  // Cambiar etiqueta de tipo de cuenta
  accountType.addEventListener("change", () => {
    accountLabel.textContent = accountType.checked ? "Admin" : "Usuario";
  });

  // Mostrar/ocultar contraseña
  document.getElementById('togglePassword').addEventListener('click', () => {
    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
  });
  document.getElementById('toggleConfirmPassword').addEventListener('click', () => {
    confirmPasswordInput.type = confirmPasswordInput.type === "password" ? "text" : "password";
  });

  // Registrar
  registerBtn.addEventListener("click", async () => {
    resetPlaceholders();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const pass = passwordInput.value;
    const confirm = confirmPasswordInput.value;
    const type = accountType.checked ? "admin" : "cliente";

    let valid = true;

    if (!name) {
      showError(nameInput, "El nombre es necesario");
      valid = false;
    }
    if (!email) {
      showError(emailInput, "El correo es necesario");
      valid = false;
    }
    if (!pass) {
      showError(passwordInput, "La contraseña es necesaria");
      valid = false;
    }
    if (!confirm) {
      showError(confirmPasswordInput, "Confirma tu contraseña");
      valid = false;
    }
    if (pass !== confirm ) {
      showError(confirmPasswordInput, "Las contraseñas no coinciden");
      valid = false;
    }
    if (!valid) return;

    // Validación básica de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showError(emailInput, "Correo electrónico inválido");
      return;
    }

    // --- Token de admin desde SessionStorage ---
    const adminToken = SessionStorageManager.getSession()?.access_token;
    const typeOfAccount = SessionStorageManager.getSession()?.account_type;
    if (typeOfAccount !== "admin") {
      showError(emailInput, "No tienes permisos para crear cuentas");
      return;
    }

    try {
      const response = await fetch("https://app.reservai-passmanager.com/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": adminToken
        },
        body: JSON.stringify({
          email: email,
          password: pass,
          name: name,
          type: type
        })
      });
        let result;
          try {
            result = await response.json();
          } catch {
            // Si no es JSON, probablemente es HTML de error
            result = { error: "El servidor respondió con un error inesperado." };
          }

          if (response.status === 418) {
            window.location.href = '/login';
            return; 
          }
         

          if (!response.ok) {
            showError(emailInput, result.error || result.message || "Error al registrar");
            return;
          }

          alert("Cuenta creada con éxito");
          window.location.href = "/verify_email";
        } catch (err) {
          showError(emailInput, "Error: " + err.message);
        }
  });
});