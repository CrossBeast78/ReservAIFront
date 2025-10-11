import SessionStorageManager from '../../AppStorage.js';
import Password from '../../../models/passwords.js';

const BASE_URL = "https://app.reservai-passmanager.com/p";
const token = SessionStorageManager.getSession()?.access_token;

    export async function fetchPasswords(page = 1, search = '') {
        const token = SessionStorageManager.getSession()?.access_token;
        if (!token) throw new Error("No hay sesión activa");

        const url = `https://app.reservai-passmanager.com/p?page=${page}&search=${encodeURIComponent(search)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: token }
        });

        if (!response.ok) {
             if (response.status === 418) {
                // Redirige al login
                window.location.href = '/login';
                return; // Detén la ejecución
        }
            throw new Error(`Error al obtener contraseñas: ${response.status}`);
        }

        const result = await response.json();
        return result; // <-- Devuelve el objeto tal cual
    }

    export async function fetchPasswordById(id) {
        const response = await fetch(`${BASE_URL}/${id}`, { headers: { "Authorization": token } });
        if (response.status === 418) {
            window.location.href = '/login';
            return; // Detén la ejecución
        }
        if (!response.ok) throw new Error(`Error ${response.status}: no se pudo obtener la contraseña`);
        const data = await response.json();
        return Password.fromJson(data);
    }

    export async function createPassword({ name, password, description }) {
         const token = SessionStorageManager.getSession()?.access_token;
        const response = await fetch(BASE_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": token 
            },
            body: JSON.stringify({ name, password, description })
        });

          if (response.status === 418) {

            window.location.href = '/login';
            return; 
        }
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Error al crear contraseña");
        }
        return await response.json();
    }

    export async function updatePasswordAttribute(id, attribute, value) {
    const token = SessionStorageManager.getSession()?.access_token;
    if (!token) throw new Error("No hay sesión activa");

    
    const response = await fetch(`https://app.reservai-passmanager.com/p/${id}?attribute=${attribute}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify({ value })
    });

     if (response.status === 418) {
        // Redirige al login
        window.location.href = '/login';
        return; // Detén la ejecución
    }

    const result = await response.json();
    if (!response.ok) throw new Error(await response.text());
    return result;
}