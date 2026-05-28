import { CheckCircle } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/common/DataState.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { apiRequest } from '../lib/api.js';
import { formatDateTime, labelStatus } from '../lib/format.js';

export function NotificationsPage() {
  const notifications = useApiResource('/api/notifications');
  const { refreshUnread } = useCurrentUser();

  async function markRead(id) {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
    await notifications.reload();
    await refreshUnread();
  }

  if (notifications.loading) return <LoadingState rows={6} />;
  if (notifications.error) return <ErrorState message={notifications.error} onRetry={notifications.reload} />;

  return (
    <div className="page-grid">
      <PageHeader title="Notifications" description="Deadline, submission, feedback, archive, and announcement notices with unread state." />
      {(notifications.data || []).length ? (
        <section className="notification-list panel">
          {notifications.data.map((item) => (
            <article className={item.unread ? 'notification-row unread' : 'notification-row'} key={item.id}>
              <div className="notification-meta">
                <StatusPill status={item.unread ? 'UNDER_REVIEW' : 'APPROVED'} subtle />
                <span>{labelStatus(item.type)}</span>
              </div>
              <div className="notification-body">
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{formatDateTime(item.createdAt)}</small>
              </div>
              {item.unread ? <Button variant="secondary" size="sm" icon={CheckCircle} onClick={() => markRead(item.id)}>Mark read</Button> : null}
            </article>
          ))}
        </section>
      ) : <EmptyState title="No notifications" />}
    </div>
  );
}
