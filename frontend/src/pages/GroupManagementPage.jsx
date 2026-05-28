import { useMemo, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { FormField } from '../components/common/FormField.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/common/DataState.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';
import { TableShell } from '../components/common/TableShell.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { apiRequest } from '../lib/api.js';
import { formatDate } from '../lib/format.js';

export function GroupManagementPage() {
  const { currentUser, users } = useCurrentUser();
  const groups = useApiResource('/api/groups');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ teamCode: '', projectTitle: '', softwareName: '', description: '', section: 'IT332', category: 'Academic Capstone', adviserEmail: '' });
  const [deliverable, setDeliverable] = useState({ title: '', milestoneKey: '', description: '', dueAt: '' });
  const [message, setMessage] = useState(null);

  const selected = useMemo(() => (groups.data || []).find((group) => group.id === selectedId) || (groups.data || [])[0], [groups.data, selectedId]);
  const advisers = users.filter((user) => user.role === 'ADVISER');

  async function saveGroup(event) {
    event.preventDefault();
    setMessage(null);
    await apiRequest('/api/groups', { method: 'POST', body: form });
    setForm({ ...form, teamCode: '', projectTitle: '', softwareName: '', description: '' });
    setMessage('Group record saved.');
    groups.reload();
  }

  async function saveDeliverable(event) {
    event.preventDefault();
    if (!selected) return;
    await apiRequest('/api/groups/deliverables', {
      method: 'POST',
      body: {
        ...deliverable,
        groupId: selected.id,
        dueAt: deliverable.dueAt ? new Date(deliverable.dueAt).toISOString() : null
      }
    });
    setDeliverable({ title: '', milestoneKey: '', description: '', dueAt: '' });
    setMessage('Deliverable saved for selected group.');
    groups.reload();
  }

  if (groups.loading) return <LoadingState rows={7} />;
  if (groups.error) return <ErrorState message={groups.error} onRetry={groups.reload} />;

  return (
    <div className="page-grid group-layout">
      <PageHeader title="Groups and Deliverables" description="Manage capstone groups, members, adviser assignments, project metadata, tracker progress, and archive state." />
      <section className="split-grid wide-left">
        <div className="panel">
          <div className="panel-header">
            <h2>Capstone groups</h2>
            <p>{groups.data?.length || 0} groups visible to {currentUser.displayName}.</p>
          </div>
          {(groups.data || []).length ? (
            <div className="group-list">
              {groups.data.map((group) => (
                <button key={group.id} className={selected?.id === group.id ? 'group-row active' : 'group-row'} onClick={() => setSelectedId(group.id)}>
                  <span className="mono-cell">{group.teamCode}</span>
                  <strong>{group.softwareName}</strong>
                  <small>{group.adviserName}</small>
                </button>
              ))}
            </div>
          ) : <EmptyState title="No groups yet" />}
        </div>
        <div className="panel">
          {selected ? (
            <>
              <div className="panel-header">
                <h2>{selected.teamCode}</h2>
                <p>{selected.projectTitle}</p>
              </div>
              <div className="metadata-grid">
                <div><span>Software</span><strong>{selected.softwareName}</strong></div>
                <div><span>Adviser</span><strong>{selected.adviserName}</strong></div>
                <div><span>Section</span><strong>{selected.section}</strong></div>
                <div><span>Archive</span><strong>{selected.archiveStatus}</strong></div>
              </div>
              <TableShell
                columns={[
                  { key: 'member', label: 'Member #' },
                  { key: 'name', label: 'Student' },
                  { key: 'id', label: 'Student No.' }
                ]}
                rows={selected.members}
                renderRow={(member) => (
                  <tr key={member.id}>
                    <td>{member.memberNumber}</td>
                    <td>{member.studentName}</td>
                    <td className="mono-cell">{member.studentNumber}</td>
                  </tr>
                )}
              />
              <TableShell
                columns={[
                  { key: 'title', label: 'Deliverable' },
                  { key: 'due', label: 'Due date' },
                  { key: 'status', label: 'Status' }
                ]}
                rows={selected.deliverables}
                renderRow={(item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{formatDate(item.dueAt)}</td>
                    <td><StatusPill status={item.status} subtle /></td>
                  </tr>
                )}
              />
            </>
          ) : <EmptyState title="Select a group" />}
        </div>
      </section>
      {currentUser.role === 'ADMIN' ? (
        <section className="split-grid">
          <form className="panel form-grid" onSubmit={saveGroup}>
            <div className="panel-header">
              <h2>Create or update group</h2>
              <p>Use the same team code to update an imported group.</p>
            </div>
            <FormField label="Team code"><input value={form.teamCode} onChange={(event) => setForm({ ...form, teamCode: event.target.value })} required /></FormField>
            <FormField label="Project title"><input value={form.projectTitle} onChange={(event) => setForm({ ...form, projectTitle: event.target.value })} required /></FormField>
            <FormField label="Software name"><input value={form.softwareName} onChange={(event) => setForm({ ...form, softwareName: event.target.value })} required /></FormField>
            <FormField label="Adviser"><select value={form.adviserEmail} onChange={(event) => setForm({ ...form, adviserEmail: event.target.value })}><option value="">Unassigned</option>{advisers.map((user) => <option key={user.email} value={user.email}>{user.displayName}</option>)}</select></FormField>
            <FormField label="Description"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField>
            <Button icon={Plus}>Save group</Button>
          </form>
          <form className="panel form-grid" onSubmit={saveDeliverable}>
            <div className="panel-header">
              <h2>Add deliverable</h2>
              <p>Attach deadlines to the selected group.</p>
            </div>
            <FormField label="Title"><input value={deliverable.title} onChange={(event) => setDeliverable({ ...deliverable, title: event.target.value })} required /></FormField>
            <FormField label="Milestone key"><input value={deliverable.milestoneKey} onChange={(event) => setDeliverable({ ...deliverable, milestoneKey: event.target.value })} required /></FormField>
            <FormField label="Due date"><input type="datetime-local" value={deliverable.dueAt} onChange={(event) => setDeliverable({ ...deliverable, dueAt: event.target.value })} /></FormField>
            <FormField label="Description"><textarea value={deliverable.description} onChange={(event) => setDeliverable({ ...deliverable, description: event.target.value })} /></FormField>
            <Button icon={Plus} disabled={!selected}>Save deliverable</Button>
          </form>
        </section>
      ) : null}
      {message ? <div className="inline-message success">{message}</div> : null}
    </div>
  );
}
