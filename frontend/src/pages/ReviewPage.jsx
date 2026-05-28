import { useEffect, useMemo, useState } from 'react';
import { Archive, CheckCircle } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/common/DataState.jsx';
import { Button } from '../components/common/Button.jsx';
import { FormField } from '../components/common/FormField.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';
import { TableShell } from '../components/common/TableShell.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { apiRequest } from '../lib/api.js';
import { SUBMISSION_STATUSES } from '../lib/constants.js';
import { compactBytes, formatDateTime, labelStatus } from '../lib/format.js';

export function ReviewPage() {
  const { currentUser } = useCurrentUser();
  const submissions = useApiResource('/api/submissions');
  const [selectedId, setSelectedId] = useState(null);
  const [review, setReview] = useState({ status: 'UNDER_REVIEW', remarks: '', documentVersionId: '' });
  const [reviewError, setReviewError] = useState(null);
  const [message, setMessage] = useState(null);
  const selected = useMemo(() => (submissions.data || []).find((item) => item.id === selectedId) || (submissions.data || [])[0], [submissions.data, selectedId]);
  const selectedVersion = useMemo(() => {
    if (!selected) return null;
    return review.documentVersionId
      ? selected.versions.find((version) => String(version.id) === String(review.documentVersionId))
      : selected.versions[0];
  }, [review.documentVersionId, selected]);

  useEffect(() => {
    setReview({ status: 'UNDER_REVIEW', remarks: '', documentVersionId: '' });
    setReviewError(null);
    setMessage(null);
  }, [selected?.id]);

  async function saveReview(event) {
    event.preventDefault();
    if (!selected) return;
    setReviewError(null);
    if (!review.remarks.trim()) {
      setReviewError('Add reviewer remarks before saving this status change.');
      return;
    }
    const result = await apiRequest(`/api/review/submissions/${selected.id}`, {
      method: 'PATCH',
      body: { ...review, documentVersionId: review.documentVersionId ? Number(review.documentVersionId) : null }
    });
    setMessage(`${result.deliverableTitle} marked ${labelStatus(result.status)}.`);
    submissions.reload();
  }

  async function archiveSelected() {
    const versionId = selectedVersion?.id;
    if (!versionId) return;
    const archived = await apiRequest(`/api/archive/submissions/${selected.id}/versions/${versionId}`, { method: 'POST' });
    setMessage(`${archived.deliverableTitle} version ${archived.versionNumber} archived.`);
  }

  if (submissions.loading) return <LoadingState rows={7} />;
  if (submissions.error) return <ErrorState message={submissions.error} onRetry={submissions.reload} />;

  return (
    <div className="page-grid review-layout">
      <PageHeader title="Adviser Review" description="Review specific document versions, add remarks, update status, and archive approved or final submissions." />
      <section className="split-grid wide-left">
        <div className="panel">
          <div className="panel-header">
            <h2>Assigned submissions</h2>
            <p>{(submissions.data || []).length} submissions visible for review.</p>
          </div>
          {(submissions.data || []).length ? (
            <div className="submission-list">
              {submissions.data.map((submission) => (
                <button key={submission.id} className={selected?.id === submission.id ? 'submission-row active' : 'submission-row'} onClick={() => setSelectedId(submission.id)}>
                  <span className="mono-cell">{submission.teamCode}</span>
                  <strong>{submission.deliverableTitle}</strong>
                  <StatusPill status={submission.status} subtle />
                </button>
              ))}
            </div>
          ) : <EmptyState title="No submissions to review" />}
        </div>
        <div className="panel">
          {selected ? (
            <>
              <div className="version-heading">
                <div>
                  <h2>{selected.deliverableTitle}</h2>
                  <span>{selected.teamCode} - {selected.studentName}</span>
                </div>
                <StatusPill status={selected.status} />
              </div>
              <TableShell
                columns={[
                  { key: 'version', label: 'Version' },
                  { key: 'file', label: 'File' },
                  { key: 'size', label: 'Size' },
                  { key: 'hash', label: 'SHA-256' },
                  { key: 'date', label: 'Date' }
                ]}
                rows={selected.versions}
                renderRow={(version) => (
                  <tr key={version.id}>
                    <td>{version.versionNumber}</td>
                    <td>{version.filename}</td>
                    <td>{compactBytes(version.sizeBytes)}</td>
                    <td className="hash-cell">{version.sha256}</td>
                    <td>{formatDateTime(version.createdAt)}</td>
                  </tr>
                )}
              />
              <form className="form-grid" onSubmit={saveReview}>
                <FormField label="Version to review">
                  <select value={review.documentVersionId} onChange={(event) => setReview({ ...review, documentVersionId: event.target.value })}>
                    <option value="">Latest version</option>
                    {selected.versions.map((version) => <option key={version.id} value={version.id}>Version {version.versionNumber}</option>)}
                  </select>
                </FormField>
                <FormField label="Status">
                  <select value={review.status} onChange={(event) => setReview({ ...review, status: event.target.value })}>
                    {SUBMISSION_STATUSES.map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}
                  </select>
                </FormField>
                <FormField label="Remarks" error={reviewError}>
                  <textarea value={review.remarks} onChange={(event) => { setReview({ ...review, remarks: event.target.value }); setReviewError(null); }} />
                </FormField>
                <div className="button-row">
                  {currentUser.role === 'ADVISER' ? <Button icon={CheckCircle}>Save review</Button> : null}
                  <Button type="button" variant="secondary" icon={Archive} disabled={!selectedVersion || !['APPROVED', 'FINAL'].includes(selected.status)} onClick={archiveSelected}>Archive selected version</Button>
                </div>
              </form>
            </>
          ) : <EmptyState title="Select a submission" />}
        </div>
      </section>
      {message ? <div className="inline-message success">{message}</div> : null}
    </div>
  );
}
