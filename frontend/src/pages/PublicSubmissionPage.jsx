import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, FilePdf, WarningCircle } from '@phosphor-icons/react';
import { Button, Field, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { findStudent, formatDate, getDeliverable } from '../lib/workflow.js';

export function PublicSubmissionPage() {
  const { slug } = useParams();
  const { state, submitPublicForm } = useWorkflow();
  const deliverable = getDeliverable(state, slug);
  const [studentNumber, setStudentNumber] = useState('');
  const [values, setValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState(null);
  const student = useMemo(() => findStudent(state.students, studentNumber), [state.students, studentNumber]);

  if (!deliverable) {
    return (
      <main className="public-page">
        <section className="form-card">
          <h1>Submission form not found</h1>
          <p>This link does not match a published deliverable.</p>
          <Link className="text-link" to="/">Return to command center</Link>
        </section>
      </main>
    );
  }

  function updateField(id, value) {
    setValues((current) => ({ ...current, [id]: value }));
    setFieldErrors((current) => ({ ...current, [id]: '' }));
  }

  function submit(event) {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    const response = submitPublicForm(deliverable.slug, { studentNumber, values });
    if (!response.ok) {
      setFieldErrors(response.fieldErrors || {});
      setFormError(response.formError || '');
      return;
    }
    setResult(response);
  }

  return (
    <main className="public-page">
      <section className="form-card">
        <div className="form-banner">
          <div className="brand-mark"><FilePdf weight="regular" /></div>
          <div>
            <strong>CapVault submission</strong>
            <span>{state.classRecord.name}</span>
          </div>
        </div>
        {result ? (
          <div className="success-panel">
            <CheckCircle weight="regular" />
            <h1>Submission received</h1>
            <p>{result.deliverable.title} was recorded. If the Student Number matched the class record, tracker lateness is ready for writeback.</p>
            <div className="result-grid">
              <div><span>Student</span><strong>{result.student?.name || studentNumber}</strong></div>
              <div><span>Team</span><strong>{result.student?.teamCode || 'Needs staff review'}</strong></div>
              <div><span>Status</span><strong>{result.attempt.flags.join(', ')}</strong></div>
            </div>
            <div className="button-row">
              <Button variant="secondary" onClick={() => window.location.reload()}>Submit another response</Button>
              <Link className="btn btn-primary btn-md" to="/student"><span>Check status</span></Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="form-title">
              <h1>{deliverable.title}</h1>
              <p>{deliverable.instructions}</p>
              <dl>
                <div><dt>Due date</dt><dd>{formatDate(deliverable.dueAt)} | 11:59 PM</dd></div>
                <div><dt>Tracker column</dt><dd>{deliverable.trackerColumn}</dd></div>
              </dl>
            </div>

            <section className="form-section">
              <h2>Student and group details</h2>
              <Field label="Student Number" helper="Used to match the class record. Unmatched submissions can still be sent but will be flagged." required>
                <input value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} placeholder="20-0649-750" />
              </Field>
              {studentNumber && student ? (
                <div className="identity-card matched">
                  <CheckCircle weight="regular" />
                  <div><span>Matched class record</span><strong>{student.name}</strong><small>{student.teamCode} | Member {student.memberNumber} | {student.adviser}</small></div>
                </div>
              ) : studentNumber ? (
                <div className="identity-card warning">
                  <WarningCircle weight="regular" />
                  <div><span>Unmatched Student Number</span><strong>Submission can continue</strong><small>Sir or staff will need to resolve the identity before tracker writeback.</small></div>
                </div>
              ) : null}
            </section>

            <section className="form-section">
              <h2>{deliverable.shortTitle} submission</h2>
              {deliverable.fields.map((field) => (
                <Field key={field.id} label={field.label} required={field.required} error={fieldErrors[field.id]} helper={field.pdfRequired ? 'PDF Drive file links only. Editable Google Docs links are blocked.' : 'Paste the required link exactly.'}>
                  {field.type === 'textarea' ? (
                    <textarea value={values[field.id] || ''} onChange={(event) => updateField(field.id, event.target.value)} rows={4} />
                  ) : (
                    <input value={values[field.id] || ''} onChange={(event) => updateField(field.id, event.target.value)} placeholder={field.pdfRequired ? 'https://drive.google.com/file/d/...' : 'https://'} />
                  )}
                </Field>
              ))}
              {formError ? <div className="inline-alert danger">{formError}</div> : null}
              <div className="pdf-rule">
                <StatusBadge status="PDF required" />
                <span>Document deliverables must be frozen as PDFs before they are accepted.</span>
              </div>
            </section>

            <div className="form-footer">
              <Button icon={CheckCircle}>Submit response</Button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

