const API_BASE = '';

export async function translateText(text) {
  const response = await fetch(`${API_BASE}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ details: response.statusText }));
    throw new Error(error.details || `Translation error: ${response.status}`);
  }

  const data = await response.json();
  return data.translated;
}
