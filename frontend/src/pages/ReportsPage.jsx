import { DownloadSimple } from '@phosphor-icons/react';
import { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { LoadingState, ErrorState } from '../components/common/DataState.jsx';
import { StatusPill } from '../components/common/StatusPill.jsx';
import { TableShell } from '../components/common/TableShell.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { apiRequest } from '../lib/api.js';
import { formatDate, percent } from '../lib/format.js';

export function ReportsPage() {
  const reports = useApiResource('/api/reports');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  if (reports.loading) return <LoadingState rows={8} />;
  if (reports.error) return <ErrorState message={reports.error} onRetry={reports.reload} />;

  async function exportCsv() {
    setExporting(true);
    setExportError('');
    try {
      const csv = await apiRequest('/api/reports/export.csv');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'capvault-report.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error.message);
    } finally {
      setExporting(false);
    }
  }

  const summary = reports.data.summary;
  const summaryItems = [
    ['Groups', summary.groups],
    ['Missing', summary.missing],
    ['Late', summary.late],
    ['Approved', summary.approved],
    ['Final', summary.finalCount],
    ['Archived', summary.archived],
    ['Archive failures', summary.failedArchives]
  ];

  return (
    <div className="page-grid">
      <PageHeader
        title="Advanced Reports"
        description="Submission, tracker, adviser workload, archive integrity, and drill-down tables for capstone defense."
        actions={<Button variant="secondary" icon={DownloadSimple} loading={exporting} onClick={exportCsv}>Export CSV</Button>}
      />
      {exportError ? <ErrorState message={exportError} onRetry={exportCsv} /> : null}
      <section className="metric-grid report-metrics">
        {summaryItems.map(([label, value]) => (
          <article className="metric-tile" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <section className="split-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Per-group tracker progress</h2>
            <p>Completion coverage from imported tracker values.</p>
          </div>
          <TableShell
            columns={[
              { key: 'team', label: 'Team' },
              { key: 'members', label: 'Members' },
              { key: 'coverage', label: 'Coverage' },
              { key: 'missing', label: 'Missing' }
            ]}
            rows={reports.data.teamProgress}
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
            <h2>Per-milestone coverage</h2>
            <p>Missing and not-applicable cells remain visible.</p>
          </div>
          <TableShell
            columns={[
              { key: 'milestone', label: 'Milestone' },
              { key: 'coverage', label: 'Coverage' },
              { key: 'missing', label: 'Missing' },
              { key: 'na', label: '#N/A' }
            ]}
            rows={reports.data.milestoneProgress}
            renderRow={(row) => (
              <tr key={row.milestoneKey}>
                <td>{row.label}</td>
                <td>{percent(row.coverage)}</td>
                <td>{row.missingCells}</td>
                <td>{row.notApplicableCells}</td>
              </tr>
            )}
          />
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Submission and archive drill-down</h2>
          <p>Report rows connect deliverables, versions, deadlines, submissions, and archive state.</p>
        </div>
        <TableShell
          columns={[
            { key: 'team', label: 'Team' },
            { key: 'project', label: 'Project' },
            { key: 'adviser', label: 'Adviser' },
            { key: 'deliverable', label: 'Deliverable' },
            { key: 'submission', label: 'Submission' },
            { key: 'archive', label: 'Archive' },
            { key: 'due', label: 'Due' }
          ]}
          rows={reports.data.rows}
          renderRow={(row, index) => (
            <tr key={`${row.teamCode}-${row.deliverableTitle}-${index}`}>
              <td className="mono-cell">{row.teamCode}</td>
              <td>{row.projectTitle}</td>
              <td>{row.adviserName}</td>
              <td>{row.deliverableTitle}</td>
              <td><StatusPill status={row.submissionStatus} subtle /></td>
              <td>{row.archiveStatus ? <StatusPill status={row.archiveStatus} subtle /> : 'Not archived'}</td>
              <td>{formatDate(row.dueAt)}</td>
            </tr>
          )}
        />
      </section>
    </div>
  );
}
