import { ArrowClockwise, Database, GoogleLogo, HardDrives, Table } from '@phosphor-icons/react';
import { Button, DataTable, PageHeader, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { formatDateTime } from '../lib/workflow.js';

export function WorkspacePage() {
  const { state, reset } = useWorkflow();
  const rows = [
    ['Sheets API', 'Class record, submission rows, tracker writeback, status flags', 'Connected'],
    ['Drive API', 'PDF metadata checks, final PDF download, optional Drive mirror', 'Ready'],
    ['Docs API', 'Long AI reports and archive notes', 'Ready'],
    ['Archive storage', 'Independent final PDF bytes and SHA-256', 'Local storage profile']
  ];

  return (
    <div className="page-stack">
      <PageHeader title="Google Workspace" description="The visible operating model remains Sheets, Drive, and Docs. CapVault provides validation, triage, writeback, and archive automation around it." actions={<Button variant="secondary" icon={ArrowClockwise} onClick={reset}>Reset workflow data</Button>} />
      <section className="metric-grid">
        <Metric icon={GoogleLogo} label="Class record" value={state.classRecord.trackerSheet} />
        <Metric icon={Table} label="Students loaded" value={state.students.length} />
        <Metric icon={Database} label="Sheet tabs" value="9" />
        <Metric icon={HardDrives} label="Archive copies" value={state.archives.length} />
      </section>
      <section className="panel">
        <DataTable columns={['Integration', 'Purpose', 'Status']} minWidth={760}>
          {rows.map(([name, purpose, status]) => (
            <tr key={name}>
              <td><strong>{name}</strong></td>
              <td>{purpose}</td>
              <td><StatusBadge status={status} /></td>
            </tr>
          ))}
        </DataTable>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Class record connection</h2>
            <p>Current workspace points to {state.classRecord.name}.</p>
          </div>
        </div>
        <div className="detail-grid">
          <div><span>Sheet URL</span><strong>{state.classRecord.sheetUrl}</strong></div>
          <div><span>Connected</span><strong>{formatDateTime(state.classRecord.connectedAt)}</strong></div>
          <div><span>Tracker sheet</span><strong>{state.classRecord.trackerSheet}</strong></div>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric-card">
      <Icon weight="regular" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

