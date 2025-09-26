export default  class LoginInfo {
    constructor(apiUrl) {
        this.apiUrl = apiUrl; 
    }

    // Método para hacer login 
    async login(email, password) {
        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (response.status === 200) {
                const token = response.headers.get("token");
                const account = await response.json();

                if (!token || !account) {
                    throw new Error("Faltan datos del servidor.");
                }

                return { token, account };
            } else if (response.status === 400) {
                throw new Error("Credenciales incorrectas.");
            } else if (response.status === 404) {
                throw new Error("Usuario no encontrado.");
            } else if (response.status === 500) {
                throw new Error("Error en el servidor. Intenta más tarde.");
            } else {
                throw new Error(`Error inesperado (código ${response.status})`);
            }
        } catch (error) {
            console.error("Error en login:", error.message);
            throw error;
        }
    }
}
