export async function fetchPasswordById(accountId, passwordId) {
  const token = sessionStorage.getItem("access_token");
  const url = `https://app.reservai-passmanager.com/a/${encodeURIComponent(accountId)}/${encodeURIComponent(passwordId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": token
    }
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

export async function createPasswordForAccount(accountId, passwordData) {
  const token = sessionStorage.getItem("access_token");
  const url = `https://app.reservai-passmanager.com/a/${encodeURIComponent(accountId)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify(passwordData)
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

export async function updatePasswordAttribute(accountId, passwordId, attribute, value) {
  const token = sessionStorage.getItem("access_token");
  const url = `https://app.reservai-passmanager.com/a/${encodeURIComponent(accountId)}/${encodeURIComponent(passwordId)}?attribute=${encodeURIComponent(attribute)}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ value })
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}


export async function deletePassword(accountId, passwordId) {
  const token = sessionStorage.getItem("access_token");
  const url = `https://app.reservai-passmanager.com/a/${encodeURIComponent(accountId)}/${encodeURIComponent(passwordId)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Authorization": token
    }
  });
  if (!response.ok) throw new Error(await response.text());
  return true;
}