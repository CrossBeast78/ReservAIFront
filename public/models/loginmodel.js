class LoginInfo {
    constructor(email, password) {
        this.email = email;
        this._password = password; // Convención para indicar que es privado
    }

    // Validar contraseña
    validatePassword(password) {
        return this._password === password;
    }

    

    // Mostrar información sin exponer la contraseña
    getInfo() {
        return { email: this.email };
    }
    
}