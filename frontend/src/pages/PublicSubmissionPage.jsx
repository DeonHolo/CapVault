import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, FilePdf, WarningCircle } from '@phosphor-icons/react';
import { Button, Field, PublicHeader, SearchableSelect } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { findStudent, findStudentByName, formatDate, formatTime, getDeliverable, getIdentityStudents, isUsableAdviserName, normalizeStudentNumber } from '../lib/workflow.js';

export function PublicSubmissionPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { state, submitPublicForm } = useWorkflow();
  const deliverable = getDeliverable(state, slug);
  const activeAccount = useMemo(() => state.studentAccounts.find((account) => account.studentNumber === state.activeStudentNumber), [state.activeStudentNumber, state.studentAccounts]);
  const queryStudent = searchParams.get('student') || '';
  const [identity, setIdentity] = useState({ studentNumber: '', studentName: '', teamCode: '' });
  const [values, setValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState(null);
  const student = useMemo(() => findStudent(state.students, identity.studentNumber), [identity.studentNumber, state.students]);
  const existingResponse = useMemo(() => {
    if (!deliverable || !identity.studentNumber) return null;
    return state.attempts.find((response) => normalizeStudentNumber(response.studentNumber) === normalizeStudentNumber(identity.studentNumber) && response.deliverableId === deliverable.id) || null;
  }, [deliverable, identity.studentNumber, state.attempts]);
  const identityStudents = useMemo(() => getIdentityStudents(state.students), [state.students]);
  const teamCodes = useMemo(() => [...new Set(identityStudents.map((item) => item.teamCode))], [identityStudents]);
  const studentNumberHelper = identityStudents.length
    ? `${identityStudents.length} Student Numbers loaded from Team Formation. Search by ID or name.`
    : 'Student Numbers appear after Sir imports the Team Formation sheet in Workspace.';

  useEffect(() => {
    const matched = queryStudent
      ? findStudent(identityStudents, queryStudent)
      : activeAccount
        ? findStudent(identityStudents, activeAccount.studentNumber)
        : findStudent(identityStudents, state.activeStudentNumber);
    if (!matched && !activeAccount) return;
    setIdentity({
      studentNumber: matched?.studentNumber || activeAccount?.studentNumber || '',
      studentName: matched?.name || activeAccount?.studentName || '',
      teamCode: matched?.teamCode || activeAccount?.teamCode || ''
    });
  }, [activeAccount, identityStudents, queryStudent, state.activeStudentNumber]);

  useEffect(() => {
    setValues(existingResponse?.values || {});
  }, [deliverable?.id, existingResponse?.id, existingResponse?.updatedAt]);

  if (!deliverable || deliverable.status === 'Unpublished') {
    return (
      <main className="public-page">
        <PublicHeader />
        <section className="form-card">
          <div className="success-panel">
            <WarningCircle weight="regular" />
            <h1>{deliverable ? 'Submission form closed' : 'Submission form not found'}</h1>
            <p>{deliverable ? 'This deliverable is not currently accepting responses. Previous responses remain recorded.' : 'This link does not match a published deliverable.'}</p>
            <Link className="text-link" to="/">Return to command center</Link>
          </div>
        </section>
      </main>
    );
  }

  function updateField(id, value) {
    setValues((current) => ({ ...current, [id]: value }));
    setFieldErrors((current) => ({ ...current, [id]: '' }));
  }

  function updateStudentNumber(value, selected) {
    const matched = selected || findStudent(identityStudents, value);
    setIdentity((current) => ({
      ...current,
      studentNumber: value,
      studentName: matched?.name || current.studentName,
      teamCode: matched?.teamCode || current.teamCode
    }));
    setFormError('');
  }

  function updateStudentName(value) {
    const matched = findStudentByName(identityStudents, value);
    setIdentity((current) => ({
      ...current,
      studentName: value,
      studentNumber: matched?.studentNumber || current.studentNumber,
      teamCode: matched?.teamCode || current.teamCode
    }));
  }

  function submit(event) {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    if (!identity.studentNumber.trim() || !identity.studentName.trim() || !identity.teamCode.trim()) {
      setFormError('Complete the Student Number, Student Name, and Team Code fields.');
      return;
    }
    if (!student) {
      setFormError('Choose a Student Number from the connected class record.');
      return;
    }
    const response = submitPublicForm(deliverable.slug, { ...identity, values });
    if (!response.ok) {
      setFieldErrors(response.fieldErrors || {});
      setFormError(response.formError || '');
      return;
    }
    setResult(response);
  }

  return (
    <main className="public-page">
      <PublicHeader subtitle={state.classRecord.name} />
      <section className="form-card">
        <div className="form-banner">
          <div className="brand-mark"><FilePdf weight="regular" /></div>
          <div>
            <strong>{deliverable.shortTitle} Submission</strong>
            <span>{state.classRecord.trackerSheet}</span>
          </div>
        </div>
        {result ? (
          <div className="success-panel">
            <CheckCircle weight="regular" />
            <h1>{result.unchanged ? 'No changes saved' : result.updated ? 'Response updated' : 'Response received'}</h1>
            <p>{result.unchanged ? 'The response is already recorded with the same details.' : `${result.deliverable.title} was recorded for the class tracker.`}</p>
            <div className="result-grid">
              <div><span>Student</span><strong>{result.student?.name || identity.studentName}</strong></div>
              <div><span>Team</span><strong>{result.student?.teamCode || identity.teamCode}</strong></div>
              <div><span>Deliverable</span><strong>{result.deliverable.shortTitle}</strong></div>
              <div><span>Status</span><strong>{result.attempt.primaryStatus || result.attempt.reviewStatus}</strong></div>
            </div>
            <div className="button-row">
              <Button variant="secondary" onClick={() => setResult(null)}>Edit response</Button>
              <Link className="btn btn-primary btn-md" to="/student"><span>Open student dashboard</span></Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="form-title">
              <h1>{deliverable.title}</h1>
              <p>{deliverable.instructions}</p>
              <dl>
                <div><dt>Due date</dt><dd>{formatDate(deliverable.dueAt)} | {formatTime(deliverable.dueAt)}</dd></div>
                <div><dt>Deliverable</dt><dd>{deliverable.trackerColumn}</dd></div>
              </dl>
              {existingResponse ? (
                <div className="inline-alert info">A response already exists for this Student Number. Saving changes will update that response.</div>
              ) : null}
            </div>

            <section className="form-section">
              <h2>Student and group details</h2>
              <Field label="Student Number" helper={studentNumberHelper} required>
                <SearchableSelect
                  value={identity.studentNumber}
                  onChange={updateStudentNumber}
                  options={identityStudents}
                  placeholder="Search Student Number"
                  getValue={(item) => item.studentNumber}
                  getLabel={(item) => `${item.name} | ${item.teamCode}`}
                />
              </Field>
              <div className="two-col">
                <Field label="Student Name" required>
                  <input list="student-name-options" value={identity.studentName} onChange={(event) => updateStudentName(event.target.value)} placeholder="Surname, First Name" />
                </Field>
                <Field label="Team Code" required>
                  <input list="team-code-options" value={identity.teamCode} onChange={(event) => setIdentity((current) => ({ ...current, teamCode: event.target.value }))} placeholder="2526-sem2-it332-41" />
                </Field>
              </div>
              <datalist id="student-name-options">
                {identityStudents.map((item) => <option key={item.studentNumber} value={item.name}>{item.studentNumber}</option>)}
              </datalist>
              <datalist id="team-code-options">
                {teamCodes.map((teamCode) => <option key={teamCode} value={teamCode} />)}
              </datalist>
              {identity.studentNumber && student ? (
                <div className="identity-card matched">
                  <CheckCircle weight="regular" />
                  <div><span>Matched class record</span><strong>{student.name}</strong><small>{student.studentNumber} | {student.teamCode} | Member {student.memberNumber} | {isUsableAdviserName(student.adviser) ? student.adviser : 'Unassigned'}</small></div>
                </div>
              ) : identity.studentNumber ? (
                <div className="identity-card warning">
                  <WarningCircle weight="regular" />
                  <div><span>No class record match</span><strong>Choose from the Student Number list</strong><small>The list is loaded after Sir connects the class record.</small></div>
                </div>
              ) : null}
            </section>

            <section className="form-section">
              <h2>{deliverable.shortTitle} file</h2>
              {deliverable.fields.map((field) => (
                <Field key={field.id} label={field.label} required={field.required} error={fieldErrors[field.id]} helper={field.pdfRequired ? 'This deliverable requires a PDF Drive link.' : 'Paste the required link.'}>
                  {field.type === 'textarea' ? (
                    <textarea value={values[field.id] || ''} onChange={(event) => updateField(field.id, event.target.value)} rows={4} />
                  ) : (
                    <input value={values[field.id] || ''} onChange={(event) => updateField(field.id, event.target.value)} placeholder={field.pdfRequired ? 'https://drive.google.com/file/d/...' : 'https://'} />
                  )}
                </Field>
              ))}
              {formError ? <div className="inline-alert danger">{formError}</div> : null}
            </section>

            <div className="form-footer">
              <Button icon={CheckCircle}>{existingResponse ? 'Save response changes' : 'Submit response'}</Button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
