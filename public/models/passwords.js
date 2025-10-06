export default class Password {
    constructor({ id, name, description, password, updateableByClient, visibility, account_id }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.password = password;
        this.updateableByClient = updateableByClient;
        this.visibility = visibility;
        this.account_id = account_id;
    }

    static fromJson(jsonResponse) {
        // Maneja la respuesta del endpoint que retorna:
        // {
        //   "data": { id, name, description, password, updateablebyclient, visibility, account_id },
        //   "total": 1,
        //   "message": "Password fetched successfully"
        // }
        if (jsonResponse && jsonResponse.data) {
            return new Password({
                id: jsonResponse.data.id,
                name: jsonResponse.data.name,
                description: jsonResponse.data.description,
                password: jsonResponse.data.password,
                updateableByClient: jsonResponse.data.updateablebyclient,
                visibility: jsonResponse.data.visibility,
                account_id: jsonResponse.data.account_id
            });
        }
        return null;
    }

    forClient() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            password: this.password
        };
    }

    forAdmin() {
        return { ...this };
    }

    toHTML() {
        const editIcon = this.updateableByClient 
            ? '<div class="edit-icon" title="Editable">✏️</div>' 
            : '';
        
        return `
            <div class="password-details">
                ${editIcon}
                <div class="password-info">
                    <div class="password-name">
                        <strong>Nombre:</strong> ${this.name || 'Sin nombre'}
                    </div>
                    <div class="password-field">
                        <div class="password-value-container">
                            <strong>Contraseña:</strong>
                            <div class="password-display">
                                <div class="password-text" data-password="${this.password || ''}">*************</div>
                                <div class="password-actions">
                                    <button class="toggle-password-btn" type="button" title="Mostrar contraseña">
                                        <i class="fas fa-eye eye-icon"></i>
                                    </button>
                                    <button class="copy-password-btn" type="button" title="Copiar contraseña">
                                        <i class="fas fa-copy copy-icon"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${this.description ? `
                        <div class="password-description">
                            <strong>Descripción:</strong> ${this.description}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}