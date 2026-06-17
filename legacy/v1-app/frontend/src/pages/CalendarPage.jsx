import { useMemo, useState } from 'react';
import { Megaphone, Plus } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { FormField } from '../components/common/FormField.jsx';
import { LoadingState, ErrorState } from '../components/common/DataState.jsx';
import { TableShell } from '../components/common/TableShell.jsx';
import { CollapsibleSection } from '../components/common/CollapsibleSection.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { apiRequest } from '../lib/api.js';
import { formatDateTime, labelStatus } from '../lib/format.js';

export function CalendarPage() {
  const { currentUser, refreshUnread } = useCurrentUser();
  const deadlines = useApiResource('/api/calendar/deadlines');
  const announcements = useApiResource('/api/calendar/announcements');
  const groups = useApiResource('/api/groups');
  const [deadlineForm, setDeadlineForm] = useState({ title: '', description: '', dueAt: '', targetRole: '', groupId: '', deliverableId: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', targetRole: '' });
  const [message, setMessage] = useState(null);
  const isAdmin = currentUser.role === 'ADMIN';
  const deadlineRows = deadlines.data || [];
  const showTeamColumn = isAdmin || deadlineRows.some((row) => row.teamCode);
  const deadlineColumns = [
    { key: 'title', label: 'Title' },
    { key: 'due', label: 'Due' },
    { key: 'deliverable', label: 'Deliverable' },
    ...(isAdmin ? [{ key: 'role', label: 'Audience' }] : []),
    ...(showTeamColumn ? [{ key: 'team', label: 'Team' }] : [])
  ];
  const selectedDeadlineGroup = useMemo(
    () => (groups.data || []).find((group) => String(group.id) === String(deadlineForm.groupId)),
    [groups.data, deadlineForm.groupId]
  );
  const deadlineDeliverables = selectedDeadlineGroup?.deliverables || [];

  async function saveDeadline(event) {
    event.preventDefault();
    await apiRequest('/api/calendar/deadlines', {
      method: 'POST',
      body: {
        ...deadlineForm,
        dueAt: new Date(deadlineForm.dueAt).toISOString(),
        targetRole: deadlineForm.targetRole || null,
        groupId: deadlineForm.groupId ? Number(deadlineForm.groupId) : null,
        deliverableId: deadlineForm.deliverableId ? Number(deadlineForm.deliverableId) : null
      }
    });
    setDeadlineForm({ title: '', description: '', dueAt: '', targetRole: '', groupId: '', deliverableId: '' });
    setMessage('Deadline posted and notifications created.');
    await deadlines.reload();
    await refreshUnread();
  }

  async function saveAnnouncement(event) {
    event.preventDefault();
    await apiRequest('/api/calendar/announcements', {
      method: 'POST',
      body: { ...announcementForm, targetRole: announcementForm.targetRole || null }
    });
    setAnnouncementForm({ title: '', body: '', targetRole: '' });
    setMessage('Announcement published and notifications created.');
    await announcements.reload();
    await refreshUnread();
  }

  if (deadlines.loading || announcements.loading || groups.loading) return <LoadingState rows={7} />;
  if (deadlines.error) return <ErrorState message={deadlines.error} onRetry={deadlines.reload} />;

  return (
    <div className="page-grid">
      <PageHeader title="Deadline Calendar and Announcements" description="Shared calendar entries, role-targeted announcements, and notification creation." />
      {message ? <div className="inline-message success">{message}</div> : null}
      <section className="split-grid">
        <CollapsibleSection title="Deadlines" description="Connected to deliverables and groups when applicable." count={deadlineRows.length} defaultOpen={false}>
          <TableShell
            columns={deadlineColumns}
            rows={deadlineRows}
            renderRow={(row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{formatDateTime(row.dueAt)}</td>
                <td>{row.deliverableTitle || 'General'}</td>
                {isAdmin ? <td>{row.targetRole ? labelStatus(row.targetRole) : 'Class-wide'}</td> : null}
                {showTeamColumn ? <td>{row.teamCode || 'All groups'}</td> : null}
              </tr>
            )}
          />
        </CollapsibleSection>
        <div className="panel">
          <div className="panel-header">
            <h2>Announcements</h2>
            <p>Role-targeted notices are also delivered as notifications.</p>
          </div>
          <div className="announcement-list">
            {(announcements.data || []).map((item) => (
              <article key={item.id} className="announcement-row">
                <Megaphone weight="regular" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <span>{isAdmin ? `${item.targetRole ? labelStatus(item.targetRole) : 'Class-wide'} - ` : ''}{formatDateTime(item.publishedAt)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      {currentUser.role === 'ADMIN' ? (
        <section className="split-grid admin-action-grid">
          <form className="panel form-grid two" onSubmit={saveDeadline}>
            <div className="panel-header"><h2>Create deadline</h2><p>Students and advisers receive relevant notices.</p></div>
            <FormField label="Title"><input value={deadlineForm.title} onChange={(event) => setDeadlineForm({ ...deadlineForm, title: event.target.value })} required /></FormField>
            <FormField label="Due date"><input type="datetime-local" value={deadlineForm.dueAt} onChange={(event) => setDeadlineForm({ ...deadlineForm, dueAt: event.target.value })} required /></FormField>
            <FormField label="Audience"><select value={deadlineForm.targetRole} onChange={(event) => setDeadlineForm({ ...deadlineForm, targetRole: event.target.value })}><option value="">Class-wide</option><option value="STUDENT">Students</option><option value="ADVISER">Advisers</option><option value="ADMIN">Admins</option></select></FormField>
            <FormField label="Team"><select value={deadlineForm.groupId} onChange={(event) => setDeadlineForm({ ...deadlineForm, groupId: event.target.value, deliverableId: '' })}><option value="">All groups</option>{(groups.data || []).map((group) => <option key={group.id} value={group.id}>{group.teamCode}</option>)}</select></FormField>
            <FormField label="Deliverable"><select value={deadlineForm.deliverableId} onChange={(event) => setDeadlineForm({ ...deadlineForm, deliverableId: event.target.value })}><option value="">General deadline</option>{deadlineDeliverables.map((deliverable) => <option key={deliverable.id} value={deliverable.id}>{deliverable.title}</option>)}</select></FormField>
            <FormField label="Description" className="form-span"><textarea value={deadlineForm.description} onChange={(event) => setDeadlineForm({ ...deadlineForm, description: event.target.value })} /></FormField>
            <div className="button-row end form-span"><Button icon={Plus}>Post deadline</Button></div>
          </form>
          <form className="panel form-grid two" onSubmit={saveAnnouncement}>
            <div className="panel-header"><h2>Create announcement</h2><p>Publish class-wide or role-targeted notices.</p></div>
            <FormField label="Title"><input value={announcementForm.title} onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })} required /></FormField>
            <FormField label="Audience"><select value={announcementForm.targetRole} onChange={(event) => setAnnouncementForm({ ...announcementForm, targetRole: event.target.value })}><option value="">Class-wide</option><option value="STUDENT">Students</option><option value="ADVISER">Advisers</option><option value="ADMIN">Admins</option></select></FormField>
            <FormField label="Body" className="form-span"><textarea value={announcementForm.body} onChange={(event) => setAnnouncementForm({ ...announcementForm, body: event.target.value })} required /></FormField>
            <div className="button-row end form-span"><Button icon={Megaphone}>Publish announcement</Button></div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
