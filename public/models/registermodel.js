import Password from "./passwords.js";

export default class RegisterInfo {
    constructor({ name, email, password, account_type }) {
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            throw new Error("Nombre inválido");
        }
        if (!this.validateEmail(email)) {
            throw new Error("Correo electrónico inválido");
        }
        this.name = name.trim();
        this.email = email.trim();
        this.account_type = account_type === "Admin" ? "Admin" : "Usuario";
        this.password = new Password({
            id: null,
            name: this.name,
            description: "Contraseña de registro",
            password: password,
            updateableByClient: this.account_type === "Usuario",
            visibility: this.account_type === "Admin" ? "admin" : "client",
            account_id: null
        });
    }

    validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const trimmed = email.trim();
        if (trimmed.length < 3 || trimmed.length > 254) return false;
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(trimmed);
    }

    toJSON() {
        return {
            name: this.name,
            email: this.email,
            password: this.password.password,
            account_type: this.account_type
        };
    }

    async register() {
        const BASE_URL = "https://passmanager.reservai.com.mx/api";
        const endpointUrl = `${BASE_URL}/account`;
        try {
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.toJSON())
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Error al registrar");
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    }
}