import { ArrowSquareOut, ShieldCheck } from '@phosphor-icons/react';
import { DataTable, EmptyState, PageHeader, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { formatDateTime, makeDriveViewUrl } from '../lib/workflow.js';

export function ArchivePage() {
  const { state } = useWorkflow();

  return (
    <div className="page-stack">
      <PageHeader title="Final Archive" description="Accepted final PDFs are stored with project details and a SHA-256 verification hash." />
      <section className="panel">
        {state.archives.length ? (
          <DataTable columns={['Project', 'Team', 'Student', 'Deliverable', 'Archive key', 'SHA-256', 'Verified', 'Actions', 'Archived']} minWidth={1280}>
            {state.archives.map((archive) => (
              <tr key={archive.id}>
                <td><strong>{archive.softwareName || 'Project'}</strong><small>{archive.projectTitle || 'Project metadata not loaded'}</small></td>
                <td>{archive.teamCode}</td>
                <td>{archive.studentName}</td>
                <td>{archive.deliverableTitle}</td>
                <td className="mono-cell">{archive.storageKey}</td>
                <td className="hash-cell">{archive.sha256}</td>
                <td><StatusBadge status={archive.verified ? 'Verified' : 'Needs Check'} /></td>
                <td>{archive.sourceLink ? <a className="btn btn-secondary btn-sm" href={makeDriveViewUrl(archive.sourceLink)} target="_blank" rel="noreferrer"><ArrowSquareOut weight="regular" /><span>Open archive source link</span></a> : 'No link'}</td>
                <td>{formatDateTime(archive.archivedAt)}</td>
              </tr>
            ))}
          </DataTable>
        ) : <EmptyState icon={ShieldCheck} title="No final archive records yet" description="Accept a submission in Review, then archive it to generate an independent stored copy and hash." />}
      </section>
    </div>
  );
}
