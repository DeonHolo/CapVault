import { ShieldCheck } from '@phosphor-icons/react';
import { DataTable, EmptyState, PageHeader, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { formatDateTime } from '../lib/workflow.js';

export function ArchivePage() {
  const { state } = useWorkflow();

  return (
    <div className="page-stack">
      <PageHeader title="Final Archive" description="Only accepted final PDFs are preserved as independent bytes with SHA-256. Google Drive can mirror the file, but it is not the only archive source." />
      <section className="panel">
        {state.archives.length ? (
          <DataTable columns={['Team', 'Student', 'Deliverable', 'Archive key', 'SHA-256', 'Verified', 'Archived']} minWidth={1120}>
            {state.archives.map((archive) => (
              <tr key={archive.id}>
                <td>{archive.teamCode}</td>
                <td>{archive.studentName}</td>
                <td>{archive.deliverableTitle}</td>
                <td className="mono-cell">{archive.storageKey}</td>
                <td className="hash-cell">{archive.sha256}</td>
                <td><StatusBadge status={archive.verified ? 'Verified' : 'Needs Check'} /></td>
                <td>{formatDateTime(archive.archivedAt)}</td>
              </tr>
            ))}
          </DataTable>
        ) : <EmptyState icon={ShieldCheck} title="No final archive records yet" description="Accept a submission in Review, then archive it to generate an independent stored copy and hash." />}
      </section>
    </div>
  );
}

