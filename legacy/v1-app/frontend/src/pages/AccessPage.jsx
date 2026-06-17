import { IdentificationCard, ShieldCheck } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { FormField } from '../components/common/FormField.jsx';
import { LoadingState, ErrorState } from '../components/common/DataState.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { apiRequest } from '../lib/api.js';
import { ROLE_LABELS } from '../lib/constants.js';
import { useMemo, useState } from 'react';

export function AccessPage() {
  const { currentUser, refreshUsers } = useCurrentUser();
  const groups = useApiResource('/api/groups');
  const [studentNumber, setStudentNumber] = useState(currentUser?.studentNumber || '');
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const studentGroup = useMemo(() => (groups.data || [])[0], [groups.data]);
  const institutionalDomain = currentUser?.email?.toLowerCase().endsWith('@cit.edu');

  async function verifyStudent(event) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setVerifying(true);
    try {
      const result = await apiRequest('/api/session/verify-student-number', {
        method: 'POST',
        body: { studentNumber }
      });
      setMessage(result.message);
      await refreshUsers();
      await groups.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  }

  if (groups.loading && !groups.data) return <LoadingState rows={6} />;
  if (groups.error) return <ErrorState message={groups.error} onRetry={groups.reload} />;

  return (
    <div className="page-grid">
      <PageHeader
        title="Institutional Access"
        description="Class record verification connects the signed-in account to the academic identity used by tracker, submissions, calendar, and archive access."
      />

      <section className="access-profile-grid">
        <article className="panel account-card">
          <div className="account-card-icon"><ShieldCheck weight="regular" /></div>
          <div>
            <span className="eyeless-label">Current account</span>
            <h2>{currentUser?.displayName || 'No account selected'}</h2>
            <p>{currentUser?.email}</p>
          </div>
          <dl className="detail-list compact">
            <div>
              <dt>Role</dt>
              <dd>{ROLE_LABELS[currentUser?.role] || currentUser?.role}</dd>
            </div>
            <div>
              <dt>Email domain</dt>
              <dd><StatusPill status={institutionalDomain ? 'APPROVED' : 'NEEDS_REVISION'} /></dd>
            </div>
            <div>
              <dt>Account status</dt>
              <dd><StatusPill status={currentUser?.enabled ? 'APPROVED' : 'REJECTED'} /></dd>
            </div>
          </dl>
        </article>
      </section>

      {currentUser?.role === 'STUDENT' ? (
        <form className="panel access-panel access-verify-panel" onSubmit={verifyStudent}>
          <div>
            <span className="eyeless-label">Class record verification</span>
            <h2>{studentGroup ? 'Student record connected' : 'Verify student record'}</h2>
            <p>
              Entering the student number links this account to the synced class record row. Once matched, CapVault preloads team code, members, tracker rows, and deliverables.
            </p>
          </div>
          <FormField label="Student number" helper={studentGroup ? `Matched to ${studentGroup.teamCode}` : 'Use the student number from the class record.'}>
            <input value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} required />
          </FormField>
          <Button icon={IdentificationCard} loading={verifying}>Verify record</Button>
        </form>
      ) : (
        <section className="panel access-login-card">
          <div>
            <span className="eyeless-label">Role access</span>
            <h2>{ROLE_LABELS[currentUser?.role] || currentUser?.role} account ready</h2>
            <p>This role uses the validated institutional account directly. Student-number binding is only required for student accounts.</p>
          </div>
        </section>
      )}

      {message ? <div className="inline-message success">{message}</div> : null}
      {error ? <div className="inline-message">{error}</div> : null}
    </div>
  );
}
