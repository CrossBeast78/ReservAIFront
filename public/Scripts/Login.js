document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  if (!form) {
    console.error("No se encontró el formulario con id='loginForm'");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Obtener datos de los inputs
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Por favor completa todos los campos.");
      return;
    }

    try {
      // Llamada al backend
      const response = await fetch("http://localhost:3000/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al iniciar sesión");
      }

      const data = await response.json();

      // Guardar tokens en SessionStorageManager
      SessionStorageManager.saveSession({
        access_token: data.access_token,
        email_sender_token: data.email_sender_token,
        authorization_token: data.authorization_token,
        account_type: data["account-type"],
        account_name: data["account-name"]
      });

      console.log("Sesión guardada:", SessionStorageManager.getSession());

      // Redirigir al home
      window.location.href = "../views/home.html";

    } catch (err) {
      console.error("❌ Error en login:", err.message);
      alert("Error: " + err.message);
    }
  });
});

// Toggle de mostrar/ocultar contraseña
function togglePassword() {
  const passwordField = document.getElementById("password");
  passwordField.type = passwordField.type === "password" ? "text" : "password";
}
