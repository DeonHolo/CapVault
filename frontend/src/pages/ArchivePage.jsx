import { useMemo, useState } from 'react';
import { DownloadSimple, Eye, MagnifyingGlass, ShieldCheck } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/common/DataState.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';
import { TableShell } from '../components/common/TableShell.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { apiRequest, downloadProtectedFile, openProtectedFile } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';

export function ArchivePage() {
  const archives = useApiResource('/api/archive');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState(null);
  const filtered = useMemo(() => {
    const lowered = query.toLowerCase();
    return (archives.data || []).filter((item) =>
      [item.projectTitle, item.teamCode, item.adviserName, item.deliverableTitle, item.status, item.filename]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(lowered))
    );
  }, [archives.data, query]);

  async function verify(id) {
    const result = await apiRequest(`/api/archive/${id}/verify`, { method: 'POST' });
    setMessage(`Integrity check result: ${result.result}.`);
  }

  if (archives.loading) return <LoadingState rows={7} />;
  if (archives.error) return <ErrorState message={archives.error} onRetry={archives.reload} />;

  return (
    <div className="page-grid">
      <PageHeader title="Archive Search and Retrieval" description="Search authorized archive records, download preserved versions, and verify SHA-256 integrity." />
      <section className="filter-bar archive-filter">
        <label className="search-control archive-search">
          <MagnifyingGlass weight="regular" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project, group, adviser, deliverable, version, hash" />
        </label>
      </section>
      {message ? <div className="inline-message success">{message}</div> : null}
      {filtered.length ? (
        <TableShell
          columns={[
            { key: 'project', label: 'Project' },
            { key: 'team', label: 'Team' },
            { key: 'deliverable', label: 'Deliverable' },
            { key: 'version', label: 'Version' },
            { key: 'status', label: 'Status' },
            { key: 'date', label: 'Archived' },
            { key: 'hash', label: 'SHA-256' },
            { key: 'actions', label: 'Actions' }
          ]}
          rows={filtered}
          renderRow={(row) => (
            <tr key={row.id}>
              <td>{row.projectTitle}</td>
              <td className="mono-cell">{row.teamCode}</td>
              <td>{row.deliverableTitle}</td>
              <td>{row.versionNumber}</td>
              <td><StatusPill status={row.status} subtle /></td>
              <td>{formatDateTime(row.archiveDate)}</td>
              <td className="hash-cell">{row.sha256}</td>
              <td>
                <div className="table-actions">
                  <Button size="sm" variant="secondary" icon={Eye} onClick={() => openProtectedFile(`/api/archive/${row.id}/download`)}>View</Button>
                  <Button size="sm" variant="secondary" icon={DownloadSimple} onClick={() => downloadProtectedFile(`/api/archive/${row.id}/download`, row.filename)}>Download</Button>
                  <Button size="sm" variant="secondary" icon={ShieldCheck} onClick={() => verify(row.id)}>Verify</Button>
                </div>
              </td>
            </tr>
          )}
        />
      ) : <EmptyState title="No archive records match the search" />}
    </div>
  );
}
