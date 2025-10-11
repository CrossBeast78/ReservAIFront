import SessionStorageManager from "../../AppStorage.js";

export async function fetchPasswordById(accountId, passwordId) {
    const token = SessionStorageManager.getSession()?.access_token;
    if (!token) throw new Error("No hay sesión activa");
    const url = `https://app.reservai-passmanager.com/a/${encodeURIComponent(accountId)}/${encodeURIComponent(passwordId)}`;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": token
        }
    });
    if (response.status === 418) {
      window.location.href = '/login';
      return; // Detén la ejecución
    }
    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    return result;
}

export async function createPasswordForAccount({accountId, name, password, description, updateablebyclient, visibility}) {
  const token = SessionStorageManager.getSession()?.access_token;
  const body = {
    name,
    password,
    description,
    updateablebyclient,
    visibility
  };

  console.log("JSON enviado al backend para crear contraseña:", body);
  const url = `https://app.reservai-passmanager.com/a/${encodeURIComponent(accountId)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify(body)
  });
  if (response.status === 418) {
    window.location.href = '/login';
    return; // Detén la ejecución
  }
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

export async function updatePasswordAttribute(accountId, passwordId, attribute, value) {
  const token = SessionStorageManager.getSession()?.access_token;
  if (!token) throw new Error("No hay sesión activa");
  const url = `https://app.reservai-passmanager.com/a/${encodeURIComponent(accountId)}/${encodeURIComponent(passwordId)}?attribute=${encodeURIComponent(attribute)}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ value })
  });
  if (response.status === 418) {
    window.location.href = '/login';
    return; // Detén la ejecución
  }
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}


export async function deletePassword(accountId, passwordId) {
  const token = SessionStorageManager.getSession()?.access_token;
  const url = `https://app.reservai-passmanager.com/a/${encodeURIComponent(accountId)}/${encodeURIComponent(passwordId)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Authorization": token
    }
  });
  if (response.status === 418) {
    window.location.href = '/login';
    return; // Detén la ejecución
  }
  if (!response.ok) throw new Error(await response.text());
  return true;
}