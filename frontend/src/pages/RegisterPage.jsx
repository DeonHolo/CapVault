import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, GoogleLogo, Key, Student } from '@phosphor-icons/react';
import { Button, Field, PublicHeader, SearchableSelect } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { findStudent, getIdentityStudents, getStudentOptions } from '../lib/workflow.js';

export function RegisterPage() {
  const { state, registerStudentAccount, loginStudentAccount } = useWorkflow();
  const navigate = useNavigate();
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ email: '', password: '', studentNumber: '' });
  const [message, setMessage] = useState('');
  const student = useMemo(() => findStudent(state.students, form.studentNumber), [form.studentNumber, state.students]);
  const identityStudents = useMemo(() => getIdentityStudents(state.students), [state.students]);
  const options = useMemo(() => getStudentOptions(identityStudents, state.studentAccounts), [identityStudents, state.studentAccounts]);
  const available = options.filter((item) => !item.claimed || item.studentNumber === form.studentNumber);
  const studentNumberHelper = identityStudents.length
    ? `${available.length} unclaimed of ${identityStudents.length} Student Numbers loaded from Team Formation.`
    : 'Import the Team Formation sheet in Workspace before student registration can claim official IDs.';

  function updateStudentNumber(value) {
    setForm((current) => ({ ...current, studentNumber: value }));
    setMessage('');
  }

  function register(authMethod = 'Email') {
    setMessage('');
    if (!form.email || (authMethod === 'Email' && !form.password) || !form.studentNumber) {
      setMessage('Enter your email, password, and Student Number.');
      return;
    }
    const response = registerStudentAccount({ email: form.email, studentNumber: form.studentNumber, authMethod });
    if (!response.ok) {
      setMessage(response.error);
      return;
    }
    setMessage('Account registered. Your student dashboard is ready.');
    window.setTimeout(() => navigate('/student'), 500);
  }

  function login(event) {
    event.preventDefault();
    setMessage('');
    if (!form.email) {
      setMessage('Enter the email used for registration.');
      return;
    }
    const response = loginStudentAccount({ email: form.email });
    if (!response.ok) {
      setMessage(response.error);
      return;
    }
    navigate('/student');
  }

  return (
    <main className="public-page auth-page">
      <PublicHeader subtitle="Student access" />
      <section className="auth-card">
        <div className="auth-copy">
          <div className="brand-mark"><Student weight="regular" /></div>
          <h1>Student access</h1>
          <p>Accounts are optional. Submissions still work through public form links, but an account lets students view their own status and fills form details automatically.</p>
          <div className="auth-facts">
            <span>Student Number comes from the class record.</span>
            <span>Name and team are filled after the number is claimed.</span>
            <span>Claimed numbers are hidden from new registrations.</span>
          </div>
        </div>

        <div className="auth-panel">
          <div className="segmented-control" role="tablist" aria-label="Access mode">
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
          </div>

          {mode === 'register' ? (
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); register('Email'); }}>
              <Button type="button" variant="secondary" icon={GoogleLogo} onClick={() => register('Google')}>Continue with Google</Button>
              <div className="divider"><span>or use email</span></div>
              <Field label="Email" required>
                <input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="student@gmail.com" />
              </Field>
              <Field label="Password" required>
                <input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Create a password" />
              </Field>
              <Field label="Student Number" helper={studentNumberHelper} required>
                <SearchableSelect
                  value={form.studentNumber}
                  onChange={updateStudentNumber}
                  options={available}
                  placeholder="Search Student Number"
                  getValue={(item) => item.studentNumber}
                  getLabel={(item) => `${item.name} | ${item.teamCode}`}
                  disabledOptions={(item) => item.claimed}
                />
              </Field>
              {student ? (
                <div className="identity-card matched">
                  <CheckCircle weight="regular" />
                  <div><span>Class record match</span><strong>{student.name}</strong><small>{student.teamCode} | Member {student.memberNumber}</small></div>
                </div>
              ) : null}
              {message ? <div className={`inline-alert ${message.includes('ready') ? 'success' : 'danger'}`}>{message}</div> : null}
              <Button icon={Key}>Create account</Button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={login}>
              <Field label="Email" required>
                <input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="student@gmail.com" />
              </Field>
              <Field label="Password">
                <input type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" />
              </Field>
              {message ? <div className="inline-alert danger">{message}</div> : null}
              <Button icon={Key}>Sign in</Button>
            </form>
          )}
          <p className="auth-footnote">Need to submit without an account? Open the deliverable link from your class announcement.</p>
          <Link className="text-link" to="/submit/week-9-srs">Open sample form</Link>
        </div>
      </section>
    </main>
  );
}
