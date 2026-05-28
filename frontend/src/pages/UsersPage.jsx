import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { FormField } from '../components/common/FormField.jsx';
import { LoadingState, ErrorState } from '../components/common/DataState.jsx';
import { TableShell } from '../components/common/TableShell.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { apiRequest } from '../lib/api.js';

export function UsersPage() {
  const users = useApiResource('/api/session/users');
  const [form, setForm] = useState({ email: '', displayName: '', role: 'STUDENT', studentNumber: '', enabled: true });
  const [message, setMessage] = useState(null);

  async function save(event) {
    event.preventDefault();
    const saved = await apiRequest('/api/session/users', { method: 'POST', body: form });
    setMessage(`${saved.displayName} saved. Institutional validation: ${saved.institutionalValidated ? 'passed' : 'failed'}.`);
    setForm({ email: '', displayName: '', role: 'STUDENT', studentNumber: '', enabled: true });
    users.reload();
  }

  if (users.loading) return <LoadingState rows={7} />;
  if (users.error) return <ErrorState message={users.error} onRetry={users.reload} />;

  return (
    <div className="page-grid">
      <PageHeader title="Users and Roles" description="Manage Admin, Adviser, and Student accounts with cit.edu institutional validation." />
      {message ? <div className="inline-message success">{message}</div> : null}
      <section className="split-grid wide-left">
        <div className="panel">
          <div className="panel-header">
            <h2>Registered accounts</h2>
            <p>Only validated institutional accounts should receive active access.</p>
          </div>
          <TableShell
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role' },
              { key: 'valid', label: 'Validated' },
              { key: 'enabled', label: 'Enabled' }
            ]}
            rows={users.data || []}
            renderRow={(user) => (
              <tr key={user.id}>
                <td>{user.displayName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.institutionalValidated ? 'Yes' : 'No'}</td>
                <td>{user.enabled ? 'Yes' : 'No'}</td>
              </tr>
            )}
          />
        </div>
        <form className="panel form-grid" onSubmit={save}>
          <div className="panel-header">
            <h2>Create or update user</h2>
            <p>Email domain must end with cit.edu.</p>
          </div>
          <FormField label="Email"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></FormField>
          <FormField label="Display name"><input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required /></FormField>
          <FormField label="Role"><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="STUDENT">Student</option><option value="ADVISER">Adviser</option><option value="ADMIN">Admin</option></select></FormField>
          <FormField label="Student number"><input value={form.studentNumber} onChange={(event) => setForm({ ...form, studentNumber: event.target.value })} /></FormField>
          <label className="inline-toggle"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /><span>Enabled</span></label>
          <Button icon={Plus}>Save user</Button>
        </form>
      </section>
    </div>
  );
}
