import { useMemo, useState } from 'react';
import { Student } from '@phosphor-icons/react';
import { DataTable, EmptyState, Field, PageHeader, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { findStudent, formatDateTime, getDeliverable } from '../lib/workflow.js';

export function StudentStatusPage() {
  const { state } = useWorkflow();
  const [studentNumber, setStudentNumber] = useState('20-0649-750');
  const student = useMemo(() => findStudent(state.students, studentNumber), [state.students, studentNumber]);
  const attempts = state.attempts.filter((attempt) => attempt.studentNumber === studentNumber);

  return (
    <div className="page-stack">
      <PageHeader title="Student Status" description="Optional account view. Students can check their own attempts and flags after entering or linking a Student Number." />
      <section className="split-grid">
        <div className="panel">
          <Field label="Student Number" helper="Account claiming would lock this number after email confirmation.">
            <input value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} />
          </Field>
          {student ? (
            <div className="identity-card matched large">
              <Student weight="regular" />
              <div>
                <span>Matched student</span>
                <strong>{student.name}</strong>
                <small>{student.teamCode} | Member {student.memberNumber} | {student.adviser}</small>
              </div>
            </div>
          ) : (
            <div className="identity-card warning large">
              <Student weight="regular" />
              <div>
                <span>No class record match</span>
                <strong>Status history is limited</strong>
                <small>Staff can resolve unmatched submissions from the review queue.</small>
              </div>
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Visible flags</h2>
              <p>Student-facing view stays actionable and does not expose full adviser-only evaluation detail.</p>
            </div>
          </div>
          <div className="status-row loose">
            <StatusBadge status="Received" />
            <StatusBadge status="PDF OK" />
            <StatusBadge status="Template-like" />
            <StatusBadge status="Needs Review" />
            <StatusBadge status="Accepted" />
          </div>
        </div>
      </section>
      <section className="panel">
        {attempts.length ? (
          <DataTable columns={['Deliverable', 'Submitted', 'Status', 'Feedback']} minWidth={820}>
            {attempts.map((attempt) => {
              const deliverable = getDeliverable(state, attempt.deliverableId);
              return (
                <tr key={attempt.id}>
                  <td>{deliverable?.title}</td>
                  <td>{formatDateTime(attempt.submittedAt)}</td>
                  <td><div className="status-row">{attempt.flags.map((flag) => <StatusBadge key={flag} status={flag} />)}</div></td>
                  <td>{attempt.aiSummary || 'Submission is recorded. Review notes will appear here when available.'}</td>
                </tr>
              );
            })}
          </DataTable>
        ) : <EmptyState title="No attempts found" description="Submit through a deliverable link, then use the same Student Number to see status here." />}
      </section>
    </div>
  );
}

