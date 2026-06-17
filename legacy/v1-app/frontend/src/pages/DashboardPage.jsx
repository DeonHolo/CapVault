import { Archive, ClipboardText, Rows, UsersThree } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { LoadingState, ErrorState } from '../components/common/DataState.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { percent } from '../lib/format.js';
import { TableShell } from '../components/common/TableShell.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';

export function DashboardPage() {
  const summary = useApiResource('/api/reports/summary');
  const tracker = useApiResource('/api/tracker');
  const notifications = useApiResource('/api/notifications');

  if (summary.loading || tracker.loading) return <LoadingState rows={6} />;
  if (summary.error) return <ErrorState message={summary.error} onRetry={summary.reload} />;

  const metrics = [
    { label: 'Groups', value: summary.data.groups, icon: UsersThree },
    { label: 'Submissions', value: summary.data.submissions, icon: ClipboardText },
    { label: 'Archived', value: summary.data.archived, icon: Archive },
    { label: 'Tracker rows', value: tracker.data?.rows?.length || 0, icon: Rows }
  ];

  return (
    <div className="page-grid">
      <PageHeader title="Academic Operations Dashboard" description="Capstone status from class records, submissions, archive integrity, and notifications." />
      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-tile" key={metric.label}>
            <metric.icon weight="regular" />
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>
      <section className="split-grid wide-left">
        <div className="panel">
          <div className="panel-header">
            <h2>Team Progress</h2>
            <p>Coverage is derived from tracker cells, not only dashboard counts.</p>
          </div>
          <TableShell
            columns={[
              { key: 'team', label: 'Team Code' },
              { key: 'members', label: 'Members' },
              { key: 'coverage', label: 'Coverage' },
              { key: 'missing', label: 'Missing' }
            ]}
            rows={(tracker.data?.teamProgress || []).slice(0, 10)}
            renderRow={(row) => (
              <tr key={row.teamCode}>
                <td className="mono-cell">{row.teamCode}</td>
                <td>{row.memberCount}</td>
                <td>{percent(row.coverage)}</td>
                <td>{row.missingCells}</td>
              </tr>
            )}
          />
        </div>
        <div className="panel">
          <div className="panel-header">
            <h2>Attention</h2>
            <p>Unread notices and integrity signals.</p>
          </div>
          <div className="notice-list">
            {(notifications.data || []).slice(0, 6).map((item) => (
              <div className="notice-row" key={item.id}>
                <StatusPill status={item.unread ? 'UNDER_REVIEW' : 'APPROVED'} subtle />
                <div className="notice-copy">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
