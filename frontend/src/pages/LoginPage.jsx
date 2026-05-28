import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GoogleLogo, IdentificationCard, ShieldCheck } from '@phosphor-icons/react';
import { Button } from '../components/common/Button.jsx';
import { FormField } from '../components/common/FormField.jsx';
import { apiRequest } from '../lib/api.js';
import { ROLE_LABELS } from '../lib/constants.js';

export function LoginPage({ users, onLogin }) {
  const navigate = useNavigate();
  const [googleEmail, setGoogleEmail] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [staffEmail, setStaffEmail] = useState(users.find((user) => user.role === 'ADMIN')?.email || users[0]?.email || '');
  const [googleReady, setGoogleReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const staffUsers = useMemo(() => users.filter((user) => user.role !== 'STUDENT'), [users]);

  useEffect(() => {
    if (!staffEmail && staffUsers.length) {
      setStaffEmail(staffUsers[0].email);
    }
  }, [staffEmail, staffUsers]);

  function continueGoogle(event) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!googleEmail.trim()) {
      setError('Enter the Google account used for sign-in.');
      return;
    }
    setGoogleReady(true);
    setMessage('Google account accepted. Enter the student number to load the class record identity.');
  }

  async function verifyStudent(event) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!studentNumber.trim()) {
      setError('Enter the student number from the class record.');
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest('/api/session/access/student-number', {
        method: 'POST',
        body: { studentNumber }
      });
      onLogin(result.user.email);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function signInStaff(event) {
    event.preventDefault();
    if (!staffEmail) return;
    onLogin(staffEmail);
    navigate('/', { replace: true });
  }

  return (
    <main className="login-screen">
      <section className="login-hero">
        <div className="brand-mark login-mark"><ShieldCheck weight="regular" /></div>
        <div>
          <span className="eyeless-label">CapVault access</span>
          <h1>Sign in, then match the class record.</h1>
          <p>
            Students use any Google account for sign-in, then enter their student number. CapVault loads the official name, institutional email, team code, tracker row, deliverables, and archive permissions from the synced class record.
          </p>
        </div>
      </section>

      <section className="login-panel" aria-label="Sign in and register">
        <div className="login-step">
          <span>1</span>
          <div>
            <h2>Google sign-in</h2>
            <p>Use the Google account you can access. The academic identity comes from the student number check.</p>
          </div>
        </div>
        <form className="login-form" onSubmit={continueGoogle} noValidate>
          <FormField label="Google email">
            <input type="email" value={googleEmail} onChange={(event) => setGoogleEmail(event.target.value)} placeholder="name@gmail.com" />
          </FormField>
          <Button icon={GoogleLogo} variant={googleReady ? 'secondary' : 'primary'}>Continue with Google</Button>
        </form>

        <div className="login-divider" />

        <div className="login-step">
          <span>2</span>
          <div>
            <h2>Student number verification</h2>
            <p>This checks the imported tracker sheet and signs the student into the matched class record identity.</p>
          </div>
        </div>
        <form className="login-form" onSubmit={verifyStudent} noValidate>
          <FormField label="Student number">
            <input value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} placeholder="23-2250-144" />
          </FormField>
          <Button icon={IdentificationCard} loading={loading}>Verify and enter</Button>
        </form>

        {message ? <div className="inline-message success">{message}</div> : null}
        {error ? <div className="inline-message">{error}</div> : null}

        {staffUsers.length ? (
          <form className="staff-login" onSubmit={signInStaff}>
            <div>
              <span className="eyeless-label">Staff access</span>
              <p>Adviser and admin accounts enter through the registered account list.</p>
            </div>
            <select value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)}>
              {staffUsers.map((user) => (
                <option key={user.email} value={user.email}>{user.displayName} - {ROLE_LABELS[user.role] || user.role}</option>
              ))}
            </select>
            <Button variant="secondary" icon={ArrowRight}>Enter workspace</Button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
