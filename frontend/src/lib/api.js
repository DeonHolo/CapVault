const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api').replace(/\/+$/, '');

const SOURCE_TYPE_TO_API = {
  teamFormation: 'TEAM_FORMATION',
  tracker: 'TRACKER',
  projectMonitor: 'PROJECT_MONITOR'
};

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function toApiSourceType(sourceType) {
  return SOURCE_TYPE_TO_API[sourceType] || sourceType;
}

export async function getBackendHealth() {
  return request('/health');
}

export async function importSheetSource(sourceType, payload) {
  return request(`/sheets/import/${toApiSourceType(sourceType)}`, {
    method: 'POST',
    body: {
      sheetUrl: payload.sheetUrl,
      displayName: payload.displayName || payload.trackerSheet || payload.name || ''
    }
  });
}

export async function getBackendSnapshot() {
  const [students, projects, trackerColumns, trackerRows, deliverables] = await Promise.all([
    request('/students'),
    request('/projects'),
    request('/tracker/columns'),
    request('/tracker/rows'),
    request('/deliverables')
  ]);

  return {
    students,
    projects,
    trackerColumns,
    trackerRows,
    deliverables
  };
}

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const error = await response.json();
      message = error.error || error.message || message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
