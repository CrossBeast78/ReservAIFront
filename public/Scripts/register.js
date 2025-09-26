const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const accountType = document.getElementById('accountType');
const accountLabel = document.getElementById('accountLabel');
const registerBtn = document.getElementById('registerBtn');

// Mostrar/ocultar contraseña
togglePassword.addEventListener('click', () => {
  if (password.type === "password") {
    password.type = "text";
    togglePassword.textContent = "👁";
  } else {
    password.type = "password";
    togglePassword.textContent = "👁";
  }
});

toggleConfirmPassword.addEventListener('click', () => {
  if (confirmPassword.type === "password") {
    confirmPassword.type = "text";
    toggleConfirmPassword.textContent = "👁";
  } else {
    confirmPassword.type = "password";
    toggleConfirmPassword.textContent = "👁";
  }
});

// Cambiar etiqueta de tipo de cuenta
accountType.addEventListener('change', () => {
  accountLabel.textContent = accountType.checked ? "Admin" : "Usuario";
});

// Registrar (solo ejemplo con validación básica)
registerBtn.addEventListener('click', () => {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const pass = password.value;
  const confirm = confirmPassword.value;
  const type = accountType.checked ? "Admin" : "Usuario";

  if (!name || !email || !pass || !confirm) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  if (pass !== confirm) {
    alert("Las contraseñas no coinciden.");
    return;
  }

  alert(`Cuenta creada con éxito ✅\nNombre: ${name}\nEmail: ${email}\nTipo: ${type}`);
});

