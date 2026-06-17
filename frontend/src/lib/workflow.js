import { initialState } from './seedData.js';

const STORAGE_KEY = 'capvault.v2.workflow';

export function loadWorkflowState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    return { ...initialState, ...JSON.parse(stored) };
  } catch {
    return initialState;
  }
}

export function saveWorkflowState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetWorkflowState() {
  localStorage.removeItem(STORAGE_KEY);
  return initialState;
}

export function findStudent(students, studentNumber) {
  const normalized = normalizeStudentNumber(studentNumber);
  return students.find((student) => normalizeStudentNumber(student.studentNumber) === normalized) || null;
}

export function normalizeStudentNumber(value) {
  return String(value || '').trim().replace(/\s+/g, '').toLowerCase();
}

export function getDeliverable(state, deliverableIdOrSlug) {
  return state.deliverables.find((item) => item.id === deliverableIdOrSlug || item.slug === deliverableIdOrSlug) || null;
}

export function validateSubmission({ deliverable, values }) {
  const errors = {};
  const flags = ['Received'];

  for (const field of deliverable.fields) {
    const value = String(values[field.id] || '').trim();
    if (field.required && !value) {
      errors[field.id] = `${field.label} is required.`;
      continue;
    }
    if (!value || field.type === 'textarea') continue;

    const linkError = validateUrl(value);
    if (linkError) {
      errors[field.id] = linkError;
      continue;
    }

    if (field.pdfRequired) {
      const pdfResult = inspectDriveLink(value);
      if (!pdfResult.ok) {
        errors[field.id] = pdfResult.message;
      } else if (!flags.includes('PDF OK')) {
        flags.push('PDF OK');
      }
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    flags
  };
}

export function validateUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return 'Use a valid http or https link.';
    return '';
  } catch {
    return 'Use a complete link, including https://.';
  }
}

export function inspectDriveLink(value) {
  const lower = value.toLowerCase();
  if (lower.includes('docs.google.com/document') || lower.includes('docs.google.com/presentation') || lower.includes('docs.google.com/spreadsheets')) {
    return {
      ok: false,
      kind: 'Editable Link',
      message: 'This deliverable requires a PDF. Editable Google Docs, Slides, or Sheets links cannot be accepted.'
    };
  }
  if (lower.endsWith('.pdf') || lower.includes('.pdf?') || lower.includes('drive.google.com/file/d/')) {
    return { ok: true, kind: 'PDF' };
  }
  return {
    ok: false,
    kind: 'Unverifiable',
    message: 'CapVault could not verify this as a PDF Drive file. Submit a Google Drive file link to the PDF.'
  };
}

export function deriveAttemptFlags(values, baseFlags) {
  const flags = [...baseFlags];
  const combined = Object.values(values).join(' ').toLowerCase();
  if (combined.includes('template') && !flags.includes('Template-like')) flags.push('Template-like');
  if (combined.includes('blank') && !flags.includes('Too Short')) flags.push('Too Short');
  return flags;
}

export function calculateDaysLate(dueAt, submittedAt) {
  const due = new Date(dueAt);
  const submitted = new Date(submittedAt);
  if (submitted <= due) return 0;
  const diff = submitted.getTime() - due.getTime();
  return Math.max(1, Math.ceil(diff / 86_400_000));
}

export async function hashArchiveRecord(input) {
  const payload = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', payload);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

export function statusTone(status) {
  const key = String(status).toLowerCase();
  if (['pdf ok', 'accepted', 'archived', 'verified'].includes(key)) return 'success';
  if (['needs review', 'template-like', 'too short', 'unmatched student number'].includes(key)) return 'warning';
  if (['not pdf', 'editable link', 'inaccessible', 'blocked'].includes(key)) return 'danger';
  if (['ai checked', 'checking'].includes(key)) return 'info';
  return 'neutral';
}

