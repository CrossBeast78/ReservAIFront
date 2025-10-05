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
}