import { useMemo, useState } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/common/DataState.jsx';
import { MyProgressStrip } from '../components/tracker/MyProgressStrip.jsx';
import { TrackerFilters } from '../components/tracker/TrackerFilters.jsx';
import { TrackerTable } from '../components/tracker/TrackerTable.jsx';
import { TeamDetailPanel } from '../components/tracker/TeamDetailPanel.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { apiRequest } from '../lib/api.js';
import { DEFAULT_SHEET_URL } from '../lib/constants.js';

export function TrackerPage() {
  const { currentUser } = useCurrentUser();
  const [filters, setFilters] = useState({ search: '', teamCode: '', milestoneKey: '', status: '' });
  const [selectedRow, setSelectedRow] = useState(null);
  const [adminEdit, setAdminEdit] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const tracker = useApiResource(`/api/tracker${query.toString() ? `?${query}` : ''}`);
  const myProgress = useApiResource('/api/tracker/me');
  const groups = useApiResource('/api/groups');

  const teamOptions = useMemo(() => Array.from(new Set((tracker.data?.rows || []).map((row) => row.teamCode))).sort(), [tracker.data]);
  const selectedGroup = (groups.data || []).find((group) => group.teamCode === selectedRow?.teamCode);

  async function saveRow(rowId, values) {
    await apiRequest(`/api/tracker/rows/${rowId}`, { method: 'PATCH', body: { values } });
    tracker.reload();
    myProgress.reload();
  }

  async function syncTracker() {
    setSyncing(true);
    try {
      await apiRequest('/api/tracker/sync', { method: 'POST', body: { sourceUrl: DEFAULT_SHEET_URL, mapping: {} } });
      await tracker.reload();
      await myProgress.reload();
    } finally {
      setSyncing(false);
    }
  }

  if (tracker.loading || myProgress.loading) return <LoadingState rows={8} />;
  if (tracker.error) return <ErrorState message={tracker.error} onRetry={tracker.reload} />;

  const rows = tracker.data?.rows || [];
  return (
    <div className="page-grid tracker-layout">
      <PageHeader
        title="Project Tracker"
        description="Class-wide tracker table with raw spreadsheet values preserved beside derived statuses."
        actions={currentUser?.role === 'ADMIN' ? <Button icon={ArrowsClockwise} loading={syncing} onClick={syncTracker}>Sync tracker</Button> : null}
      />
      <MyProgressStrip tracker={myProgress.data} />
      <TrackerFilters
        filters={filters}
        onChange={setFilters}
        teamOptions={teamOptions}
        canEdit={currentUser?.role === 'ADMIN'}
        adminEdit={currentUser?.role === 'ADMIN' && adminEdit}
        onAdminEditChange={setAdminEdit}
      />
      {rows.length ? (
        <TrackerTable rows={rows} adminEdit={currentUser?.role === 'ADMIN' && adminEdit} onSelectRow={setSelectedRow} onSaveRow={saveRow} />
      ) : (
        <EmptyState title="No tracker rows match the current filters" description="Clear filters or sync the class record tracker." />
      )}
      <TeamDetailPanel row={selectedRow || rows[0]} group={selectedGroup} onClose={() => setSelectedRow(null)} />
    </div>
  );
}
