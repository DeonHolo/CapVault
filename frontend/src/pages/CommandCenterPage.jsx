import { Archive, ClipboardText, FilePdf, ListChecks, WarningCircle } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Button, DataTable, PageHeader, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { findStudent, formatDateTime, getDeliverable } from '../lib/workflow.js';

export function CommandCenterPage() {
  const { state, triggerAiEvaluation, markAccepted, archiveAttempt } = useWorkflow();
  const attention = state.attempts.filter((attempt) => attempt.flags.some((flag) => ['Template-like', 'Unmatched Student Number', 'Too Short'].includes(flag)) || attempt.reviewStatus === 'Needs Review');
  const accepted = state.attempts.filter((attempt) => attempt.reviewStatus === 'Accepted' && attempt.archiveStatus !== 'Archived');
  const missingPdfIssues = state.attempts.filter((attempt) => attempt.flags.includes('Not PDF') || attempt.flags.includes('Editable Link')).length;

  return (
    <div className="page-stack">
      <PageHeader
        title="Command Center"
        description="Sir's working view for submission attempts, tracker writeback, AI triage, and final archive readiness."
        actions={<Link className="btn btn-primary btn-md" to="/forms"><ClipboardText weight="regular" /><span>Publish form</span></Link>}
      />

      <section className="metric-grid">
        <Metric icon={ClipboardText} label="Published forms" value={state.deliverables.length} />
        <Metric icon={FilePdf} label="Submission attempts" value={state.attempts.length} />
        <Metric icon={WarningCircle} label="Needs attention" value={attention.length + missingPdfIssues} />
        <Metric icon={Archive} label="Archived finals" value={state.archives.length} />
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Attention queue</h2>
              <p>Items that save Sir from opening links one by one.</p>
            </div>
            <Link className="text-link" to="/review">Open review</Link>
          </div>
          <DataTable columns={['Student', 'Deliverable', 'Flags', 'Action']} minWidth={720}>
            {attention.slice(0, 6).map((attempt) => {
              const student = findStudent(state.students, attempt.studentNumber);
              const deliverable = getDeliverable(state, attempt.deliverableId);
              return (
                <tr key={attempt.id}>
                  <td><strong>{student?.name || attempt.studentNumber}</strong><small>{student?.teamCode || 'Unmatched'}</small></td>
                  <td>{deliverable?.shortTitle}</td>
                  <td><div className="status-row">{attempt.flags.map((flag) => <StatusBadge key={flag} status={flag} />)}</div></td>
                  <td><Button size="sm" variant="secondary" icon={ListChecks} onClick={() => triggerAiEvaluation(attempt.id)}>Run AI</Button></td>
                </tr>
              );
            })}
          </DataTable>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Archive candidates</h2>
              <p>Only final accepted PDFs should be captured as independent bytes.</p>
            </div>
            <Link className="text-link" to="/archive">Archive index</Link>
          </div>
          <div className="notice-list">
            {accepted.length ? accepted.map((attempt) => {
              const student = findStudent(state.students, attempt.studentNumber);
              const deliverable = getDeliverable(state, attempt.deliverableId);
              return (
                <div className="notice-row" key={attempt.id}>
                  <div><strong>{deliverable?.shortTitle}</strong><span>{student?.teamCode}</span></div>
                  <Button size="sm" variant="primary" icon={Archive} onClick={() => archiveAttempt(attempt.id)}>Archive final</Button>
                </div>
              );
            }) : <p className="muted-copy">No accepted final submissions are waiting for archive.</p>}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Recent activity</h2>
            <p>Background work that would also write to the Activity Log sheet.</p>
          </div>
        </div>
        <div className="activity-list">
          {state.activity.slice(0, 8).map((item) => (
            <div className="activity-row" key={item.id}>
              <span>{formatDateTime(item.at)}</span>
              <strong>{item.text}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric-card">
      <Icon weight="regular" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
