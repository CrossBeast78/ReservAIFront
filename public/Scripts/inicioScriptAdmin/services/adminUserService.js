export async function fetchAccountById(accountId) {
  const token = sessionStorage.getItem("access_token");
  const url = `https://app.reservai-passmanager.com/a/${encodeURIComponent(accountId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": token
    }
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}