const USER_KEY = 'capvault.currentUserEmail';

export function getStoredUserEmail() {
  return localStorage.getItem(USER_KEY);
}

export function setStoredUserEmail(email) {
  localStorage.setItem(USER_KEY, email);
}

async function parseResponse(response) {
  if (response.ok) {
    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return response.json();
    return response.text();
  }
  let message = `Request failed with status ${response.status}`;
  const text = await response.text();
  if (text) {
    try {
      const body = JSON.parse(text);
      message = body.message || message;
    } catch {
      message = text;
    }
  }
  throw new Error(message);
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const email = getStoredUserEmail();
  if (email) headers.set('X-CapVault-User', email);
  if (!(options.body instanceof FormData) && options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body instanceof FormData || typeof options.body === 'string' ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });
  return parseResponse(response);
}

export async function uploadSubmission({ deliverableId, notes, file, driveLink }) {
  const form = new FormData();
  form.append('deliverableId', deliverableId);
  if (notes) form.append('notes', notes);
  if (file) form.append('file', file);
  if (driveLink) form.append('driveLink', driveLink);
  return apiRequest('/api/submissions', {
    method: 'POST',
    body: form
  });
}
