import SessionStorageManager from "../../AppStorage.js";

const session = SessionStorageManager.getSession();
if (!session || !session.access_token) {
    window.location.href = "/login";
}

// Utilidad para detectar UUID v4
function isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function fetchAccountById(accountId, page = 1, search = '') {
    const token = SessionStorageManager.getSession()?.access_token;
    const params = new URLSearchParams();
    params.append('page', page);
    if (search) params.append('search', search);

    const response = await fetch(
        `https://app.reservai-passmanager.com/a/${encodeURIComponent(accountId)}?${params.toString()}`,
        {
            headers: { Authorization: token }
        }
    );
    if (!response.ok) throw new Error('No se pudo obtener la cuenta');
    const result = await response.json();
    return result;
}
export async function fetchAccounts({ page = 1, search = "" }) {
    const token = SessionStorageManager.getSession()?.access_token;
    if (!token) throw new Error("No hay sesión de administrador");

    let url;
    if (search && isUUID(search)) {
        // Buscar por ID
        url = `https://app.reservai-passmanager.com/a/${encodeURIComponent(search)}?page=${page}&search=`;
    } else {
        // Buscar por nombre/correo
        url = `https://app.reservai-passmanager.com/a?page=${page}&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": token
        }
    });

    if (!response.ok) throw new Error(await response.text());
    return await response.json();
}