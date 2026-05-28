const USER_KEY = 'capvault.currentUserEmail';
let activeUserEmail = null;

export function getStoredUserEmail() {
  return localStorage.getItem(USER_KEY);
}

export function setStoredUserEmail(email) {
  activeUserEmail = email || null;
  if (email) {
    localStorage.setItem(USER_KEY, email);
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function setActiveUserEmail(email) {
  setStoredUserEmail(email);
}

function currentRequestEmail() {
  return activeUserEmail || getStoredUserEmail();
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
  const email = currentRequestEmail();
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

export async function apiBlob(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const email = currentRequestEmail();
  if (email) headers.set('X-CapVault-User', email);
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    await parseResponse(response);
  }
  return response.blob();
}

export async function openProtectedFile(path) {
  const viewer = window.open('about:blank', '_blank');
  if (viewer) {
    viewer.document.title = 'CapVault document';
    viewer.document.body.innerHTML = '<div style="font: 14px/1.5 system-ui; padding: 24px; color: #334155;">Loading CapVault document...</div>';
  }
  try {
    const blob = await apiBlob(path);
    const url = URL.createObjectURL(blob);
    if (viewer) {
      viewer.document.open();
      viewer.document.write(`<!doctype html>
        <html>
          <head>
            <title>CapVault document</title>
            <style>
              html, body { margin: 0; width: 100%; height: 100%; background: #f8fafc; font-family: system-ui, sans-serif; }
              .viewer { display: grid; grid-template-rows: auto minmax(0, 1fr); width: 100%; height: 100%; }
              .bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background: #ffffff; color: #0f172a; }
              .bar strong { font-size: 14px; }
              .bar a { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 14px; color: #0f172a; text-decoration: none; font-size: 14px; font-weight: 600; }
              iframe { width: 100%; height: 100%; border: 0; background: #ffffff; }
            </style>
          </head>
          <body>
            <main class="viewer">
              <div class="bar">
                <strong>CapVault document viewer</strong>
                <a href="${url}" download="capvault-document.pdf">Download</a>
              </div>
              <iframe src="${url}" title="CapVault document"></iframe>
            </main>
          </body>
        </html>`);
      viewer.document.close();
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => URL.revokeObjectURL(url), 300_000);
  } catch (error) {
    if (viewer) {
      viewer.document.body.innerHTML = `<pre style="font: 14px/1.5 system-ui; padding: 24px; color: #991b1b;">${escapeHtml(error.message)}</pre>`;
    } else {
      throw error;
    }
  }
}

export async function downloadProtectedFile(path, filename) {
  const blob = await apiBlob(path);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'capvault-document.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
