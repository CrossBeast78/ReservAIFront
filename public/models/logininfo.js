
export default class LoginInfo {
    constructor(email, password) {
        if (!this.validateEmail(email) || !this.validatePassword(password)) {
            throw new Error("Información inválida");
        }
        this.email = this.sanitizeEmail(email);
        this.password = this.sanitizePassword(password);
    }

    validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const trimmed = email.trim();
        if (trimmed.length < 3 || trimmed.length > 254) return false;
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(trimmed);
    }

    sanitizeEmail(email) {
        return email.trim();
    }

    validatePassword(password) {
        if (!password || typeof password !== 'string') return false;
        return this.sanitizePassword(password) !== '';
    }

    sanitizePassword(password) {
        return password.trim();
    }

    toJSON() {
        return {
            email: this.email,
            password: this.password
        };
    }

    // POST al endpoint /account
    async login() {
        const endpointUrl = 'https://app.reservai-passmanager.com/account'; 
        try {
            console.log("Datos enviados:", this.email, this.password);
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.toJSON())
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data; //  respuesta del backend
        } catch (error) {
            console.error("Error en login:", error);
            throw error;
        }
    }
}