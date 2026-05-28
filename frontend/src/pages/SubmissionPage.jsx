import { useEffect, useMemo, useState } from 'react';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { FormField } from '../components/common/FormField.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/common/DataState.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';
import { TableShell } from '../components/common/TableShell.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { uploadSubmission } from '../lib/api.js';
import { compactBytes, formatDateTime } from '../lib/format.js';

export function SubmissionPage() {
  const { currentUser } = useCurrentUser();
  const groups = useApiResource('/api/groups');
  const submissions = useApiResource('/api/submissions');
  const [form, setForm] = useState({ groupId: '', deliverableId: '', notes: '', driveLink: '', file: null });
  const [message, setMessage] = useState(null);
  const [formError, setFormError] = useState(null);
  const studentGroup = useMemo(() => (groups.data || [])[0], [groups.data]);
  const selectedGroup = useMemo(
    () => (groups.data || []).find((group) => String(group.id) === String(form.groupId)) || studentGroup,
    [groups.data, form.groupId, studentGroup]
  );
  const deliverables = selectedGroup?.deliverables || [];

  useEffect(() => {
    if (studentGroup && !form.groupId) {
      setForm((current) => ({ ...current, groupId: String(studentGroup.id) }));
    }
  }, [form.groupId, studentGroup]);

  async function submit(event) {
    event.preventDefault();
    setMessage(null);
    setFormError(null);
    if (!form.deliverableId) {
      setFormError('Choose the deliverable you are submitting.');
      return;
    }
    if (!form.file && !form.driveLink.trim()) {
      setFormError('Attach a PDF or paste an accessible Google Drive link.');
      return;
    }
    await uploadSubmission(form);
    event.currentTarget.reset();
    setForm({ groupId: studentGroup ? String(studentGroup.id) : '', deliverableId: '', notes: '', driveLink: '', file: null });
    setMessage('Submission recorded with a new immutable version.');
    submissions.reload();
  }

  if (groups.loading || submissions.loading) return <LoadingState rows={7} />;
  if (groups.error) return <ErrorState message={groups.error} onRetry={groups.reload} />;
  if (submissions.error) return <ErrorState message={submissions.error} onRetry={submissions.reload} />;

  return (
    <div className="page-grid">
      <PageHeader title="Submissions and Version History" description="Submit PDF files or accessible Drive links without overwriting previous versions." />
      {currentUser.role === 'STUDENT' ? (
        <form className="panel form-grid two" onSubmit={submit}>
          <FormField label="Student ID" helper="Loaded from the institutional account."><input value={currentUser.studentNumber || ''} readOnly /></FormField>
          <FormField label="Student name" helper="Matched from the class record when the account is verified."><input value={currentUser.displayName} readOnly /></FormField>
          <FormField label="Team code" helper={selectedGroup ? 'Assigned from the synced class record.' : 'No verified team found for this account.'}>
            <select value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value, deliverableId: '' })} required>
              <option value="">Select team</option>
              {(groups.data || []).map((group) => <option key={group.id} value={group.id}>{group.teamCode}</option>)}
            </select>
          </FormField>
          <FormField label="Deliverable" helper={deliverables.length ? 'Loaded from the group deliverables.' : 'Ask an admin to sync or create deliverables for this team.'}>
            <select value={form.deliverableId} onChange={(event) => setForm({ ...form, deliverableId: event.target.value })} required>
              <option value="">Select deliverable</option>
              {deliverables.map((deliverable) => <option key={deliverable.id} value={deliverable.id}>{deliverable.title}</option>)}
            </select>
          </FormField>
          <FormField label="PDF upload" helper="PDF is preserved as a document version."><input type="file" accept="application/pdf" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} /></FormField>
          <FormField label="Google Drive link" helper="Use when upload is unavailable; the system captures the file early when accessible."><input value={form.driveLink} onChange={(event) => setForm({ ...form, driveLink: event.target.value })} /></FormField>
          <FormField label="Submission notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></FormField>
          {formError ? <div className="inline-message form-span">{formError}</div> : null}
          <div className="button-row end"><Button icon={PaperPlaneTilt}>Submit deliverable</Button></div>
        </form>
      ) : null}
      {message ? <div className="inline-message success">{message}</div> : null}
      {(submissions.data || []).length ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Version history</h2>
            <p>Each resubmission is preserved as a separate version.</p>
          </div>
          {(submissions.data || []).map((submission) => (
            <div className="version-block" key={submission.id}>
              <div className="version-heading">
                <div>
                  <strong>{submission.deliverableTitle}</strong>
                  <span>{submission.teamCode} - version {submission.currentVersion}</span>
                </div>
                <StatusPill status={submission.status} />
              </div>
              <TableShell
                columns={[
                  { key: 'version', label: 'Version' },
                  { key: 'file', label: 'File' },
                  { key: 'size', label: 'Size' },
                  { key: 'hash', label: 'SHA-256' },
                  { key: 'date', label: 'Submitted' }
                ]}
                rows={submission.versions}
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
            </div>
          ))}
        </section>
      ) : <EmptyState title="No submissions yet" description="Submit a deliverable to create the first version history record." />}
    </div>
  );
}
