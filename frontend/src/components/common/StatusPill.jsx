import { labelStatus } from '../../lib/format.js';

const TONE_BY_STATUS = {
  COMPLETE: 'success',
  IN_PROGRESS: 'progress',
  RAW_VALUE: 'progress',
  MISSING: 'danger',
  NOT_APPLICABLE: 'muted',
  SUBMITTED: 'progress',
  LATE: 'warning',
  UNDER_REVIEW: 'progress',
  NEEDS_REVISION: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  FINAL: 'success',
  ARCHIVED: 'success',
  FAILED: 'danger',
  PENDING: 'warning'
};

export function StatusPill({ status, subtle = false }) {
  const tone = TONE_BY_STATUS[status] || 'muted';
  return <span className={`status-pill status-${tone} ${subtle ? 'status-subtle' : ''}`}>{labelStatus(status)}</span>;
}
