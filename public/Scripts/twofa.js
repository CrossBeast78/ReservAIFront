import SessionStorageManager from "./AppStorage.js";

const session = SessionStorageManager.getSession();
if (!session || !session.access_token) {
    window.location.href = "/login";
}

document.addEventListener("DOMContentLoaded", () => {
    const inputs = document.querySelectorAll('.code-inputs input');
    const verifyBtn = document.querySelector('.btn-verify');
    const errorDiv = document.getElementById('twofa-error');

    // Selecciona el primer input al cargar la página
    if (inputs.length > 0) inputs[0].focus();

    // Quitar error al enfocar cualquier input
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error-input');
            input.placeholder = "";
            errorDiv.textContent = "";
        });
    });

    // Autofocus al siguiente input
    inputs.forEach((input, idx) => {
        input.addEventListener('input', () => {
            if (input.value.length === 1 && idx < inputs.length - 1) {
                inputs[idx + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && !input.value && idx > 0) {
                inputs[idx - 1].focus();
            }
            if (e.key === "Enter") {
                verifyBtn.click();
            }
        });
    });

    function showError(message) {
        inputs.forEach(input => {
            input.classList.add("error-input");
            input.value = ""; 
        });
        errorDiv.textContent = message;
        inputs[0].focus();
    }

    verifyBtn.addEventListener('click', async () => {
        errorDiv.textContent = "";
        const code = Array.from(inputs).map(i => i.value).join('');
        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
            showError("Código incorrecto, inténtalo de nuevo.");
            return;
        }

        const token = SessionStorageManager.getSession().access_token;
        if (!token) {
            showError("No hay sesión activa. Inicia sesión de nuevo.");
            return;
        }

        try {
            const response = await fetch("https://app.reservai-passmanager.com/twofa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify({ code })
            });

            if (response.status === 418) {
                window.location.href = '/login';
                return; 
            }

            if (!response.ok) {
                const error = await response.json();
                showError(error.message || "Código incorrecto");
                return;
            }

            const data = await response.json();
            if (data.token && data.token_type === "access") {
                SessionStorageManager.saveSession({
                    access_token: data.token,
                    token_type: data.token_type,
                    account_type: data.account_type,
                    account_name: SessionStorageManager.getSession().account_name
                });

                if (SessionStorageManager.getSession().account_type === "admin") {
                    window.location.href = "/inicioAdmin";
                } else {
                    window.location.href = "/inicio";
                }
            } else {
                alert("Error: " + err.message);
                showError("Respuesta inválida del servidor.");}
        } catch (err) {

        }
    });
});