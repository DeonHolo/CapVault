import { Archive, CheckCircle, Robot } from '@phosphor-icons/react';
import { Button, DataTable, EmptyState, PageHeader, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { findStudent, formatDateTime, getDeliverable } from '../lib/workflow.js';

export function ReviewPage() {
  const { state, triggerAiEvaluation, markAccepted, archiveAttempt } = useWorkflow();

  return (
    <div className="page-stack">
      <PageHeader title="Review and AI Triage" description="AI helps Sir/advisers decide what to open first. It flags accessibility and content signals, but review remains human-controlled." />
      <section className="panel">
        {state.attempts.length ? (
          <DataTable columns={['Submitted by', 'Deliverable', 'When', 'Flags', 'AI summary', 'Actions']} minWidth={1100}>
            {state.attempts.map((attempt) => {
              const student = findStudent(state.students, attempt.studentNumber);
              const deliverable = getDeliverable(state, attempt.deliverableId);
              return (
                <tr key={attempt.id}>
                  <td><strong>{student?.name || attempt.studentNumber}</strong><small>{student?.teamCode || 'Unmatched identity'}</small></td>
                  <td><strong>{deliverable?.shortTitle}</strong><small>{deliverable?.title}</small></td>
                  <td>{formatDateTime(attempt.submittedAt)}</td>
                  <td><div className="status-row">{attempt.flags.map((flag) => <StatusBadge key={flag} status={flag} />)}</div></td>
                  <td className="summary-cell">{attempt.aiSummary || 'No full AI triage has been triggered yet.'}</td>
                  <td>
                    <div className="table-actions">
                      <Button size="sm" variant="secondary" icon={Robot} onClick={() => triggerAiEvaluation(attempt.id)}>Run AI</Button>
                      <Button size="sm" variant="secondary" icon={CheckCircle} onClick={() => markAccepted(attempt.id)}>Accept final</Button>
                      <Button size="sm" variant="primary" icon={Archive} disabled={attempt.reviewStatus !== 'Accepted' || attempt.archiveStatus === 'Archived'} onClick={() => archiveAttempt(attempt.id)}>Archive</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        ) : <EmptyState title="No submissions yet" description="Student attempts will appear here after a form link is used." />}
      </section>
    </div>
  );
}
