import LoginInfo from "../models/logininfo.js";
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.querySelector("loginbtn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
   

    const loginSystem = new LoginInfo("");

    loginBtn.addEventListener("click", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("Por favor, complete todos los campos.");
            return;
        }

        try {
            const { token, account } = await loginSystem.login(email, password);
            AppStorage.logedd(token, account);
            window.location.href = "/inicio";
        } catch (error) {
            alert(error.message);
        }
    });
});