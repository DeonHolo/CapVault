import { useMemo, useState } from 'react';
import { ArrowClockwise, CheckCircle, Database, GoogleLogo, HardDrives, LinkSimple, PlusCircle, Table, X } from '@phosphor-icons/react';
import { Button, DataTable, Field, PageHeader, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { extractSheetId, formatDateTime, getActiveTrackerColumns } from '../lib/workflow.js';

const SOURCE_CONFIG = [
  {
    key: 'teamFormation',
    title: 'Team Formation',
    description: 'Student Number, student name, team code, member number, and CIT email/account.',
    button: 'Import identities'
  },
  {
    key: 'tracker',
    title: 'Tracker',
    description: 'Deliverable columns, raw progress values, lateness numbers, and detected deadline row.',
    button: 'Import tracker'
  },
  {
    key: 'projectMonitor',
    title: 'Software Project Monitor',
    description: 'Project title, software name, description, remarks, adviser/status, and category.',
    button: 'Import projects'
  }
];

export function WorkspacePage() {
  const { state, connectSheetSource, generateFormsFromSuggestions, refreshBackendData, reset, updateTrackerColumn, addTrackerColumn, saveTemplate } = useWorkflow();
  const [sources, setSources] = useState(() => ({
    teamFormation: state.classRecord.sources?.teamFormation?.sheetUrl || '',
    tracker: state.classRecord.sources?.tracker?.sheetUrl || state.classRecord.sheetUrl || '',
    projectMonitor: state.classRecord.sources?.projectMonitor?.sheetUrl || ''
  }));
  const [workspaceName, setWorkspaceName] = useState(state.classRecord.name);
  const [trackerSheet, setTrackerSheet] = useState(state.classRecord.trackerSheet);
  const [newColumn, setNewColumn] = useState('');
  const [template, setTemplate] = useState({ deliverable: 'SRS', name: '', link: '' });
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState(null);
  const [importing, setImporting] = useState('');
  const [refreshingBackend, setRefreshingBackend] = useState(false);
  const activeColumns = getActiveTrackerColumns(state);
  const rows = [
    ['Google Sheets', 'Read Team Formation, Tracker, and Software Project Monitor sources', state.classRecord.status || 'Connected'],
    ['Google Drive', 'Verify PDF links, read file metadata, and prepare final copies', 'Ready'],
    ['Archive storage', 'Final PDF copies with verification hashes', 'Ready']
  ];
  const sourceStatuses = useMemo(() => SOURCE_CONFIG.map((source) => ({
    ...source,
    ...(state.classRecord.sources?.[source.key] || {})
  })), [state.classRecord.sources]);

  async function importSource(sourceType) {
    setImporting(sourceType);
    setMessage('');
    const result = await connectSheetSource(sourceType, {
      name: workspaceName,
      trackerSheet,
      sheetUrl: sources[sourceType]
    });
    setImporting('');
    if (result.ok) {
      setSummary(result.importSummary || null);
      setMessage(`${result.importSummary?.sourceType || 'Sheet'} imported.`);
    } else {
      setMessage(result.error);
    }
  }

  function submitColumn(event) {
    event.preventDefault();
    addTrackerColumn(newColumn);
    setNewColumn('');
  }

  function submitTemplate(event) {
    event.preventDefault();
    if (!template.name || !template.link) return;
    saveTemplate(template);
    setTemplate({ ...template, name: '', link: '' });
  }

  function generateSuggestedForms() {
    generateFormsFromSuggestions(summary?.suggestedForms || []);
    setSummary(null);
  }

  async function refreshFromBackend() {
    setRefreshingBackend(true);
    setMessage('');
    const result = await refreshBackendData();
    setRefreshingBackend(false);
    setMessage(result.ok ? 'Backend data refreshed.' : `Backend unavailable: ${result.error}`);
  }

  return (
    <div className="page-stack">
      <PageHeader title="Workspace Setup" description="Connect the three Google Sheets that define Sir Ralph's capstone workflow." />
      <section className="metric-grid">
        <Metric icon={GoogleLogo} label="Sources connected" value={sourceStatuses.filter((item) => item.status === 'Imported' || item.status === 'Starter data').length} />
        <Metric icon={Table} label="Students loaded" value={state.students.length} />
        <Metric icon={Database} label="Deliverable columns" value={activeColumns.length} />
        <Metric icon={HardDrives} label="Templates" value={state.templates.length} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Source sheets</h2>
            <p>Team Formation owns identity, Tracker owns progress, and Software Project Monitor owns group metadata.</p>
          </div>
        </div>
        <div className="two-col">
          <Field label="Workspace name" required>
            <input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
          </Field>
          <Field label="Tracker tab label" required>
            <input value={trackerSheet} onChange={(event) => setTrackerSheet(event.target.value)} />
          </Field>
        </div>
        <div className="source-grid">
          {SOURCE_CONFIG.map((source) => (
            <article className="source-card" key={source.key}>
              <div className="source-card-head">
                <div>
                  <h3>{source.title}</h3>
                  <p>{source.description}</p>
                </div>
                <StatusBadge status={state.classRecord.sources?.[source.key]?.status || 'Not connected'} />
              </div>
              <Field label="Published Google Sheet link" helper={`Sheet ID: ${extractSheetId(sources[source.key]) || 'Paste a public Sheet link'}`}>
                <input
                  value={sources[source.key]}
                  onChange={(event) => setSources((current) => ({ ...current, [source.key]: event.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
              </Field>
              <Button type="button" icon={LinkSimple} loading={importing === source.key} onClick={() => importSource(source.key)}>
                {importing === source.key ? 'Importing...' : source.button}
              </Button>
            </article>
          ))}
        </div>
        {message ? <div className={`inline-alert ${message.includes('imported') ? 'success' : 'danger'}`}>{message}</div> : null}
        {state.classRecord.importWarnings?.length ? (
          <div className="inline-alert warning">
            {state.classRecord.importWarnings.map((warning) => <span key={warning}>{warning}</span>)}
          </div>
        ) : null}
      </section>

      <section className="split-grid wide-left">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Deliverable columns</h2>
              <p>Edit detected Tracker columns. These populate form publishing and tracker views.</p>
            </div>
          </div>
          <div className="column-editor-list">
            {state.trackerColumns.map((column) => (
              <article className="column-editor-row" key={column.id}>
                <Field label="Display name">
                  <input value={column.label} onChange={(event) => updateTrackerColumn(column.id, { label: event.target.value })} />
                </Field>
                <Field label="Source column">
                  <input value={column.sourceColumn} onChange={(event) => updateTrackerColumn(column.id, { sourceColumn: event.target.value })} />
                </Field>
                <label className="toggle-line">
                  <input type="checkbox" checked={column.active !== false} onChange={(event) => updateTrackerColumn(column.id, { active: event.target.checked })} />
                  <span>Use in forms/tracker</span>
                </label>
                <label className="toggle-line">
                  <input type="checkbox" checked={Boolean(column.pdfRequired)} onChange={(event) => updateTrackerColumn(column.id, { pdfRequired: event.target.checked })} />
                  <span>PDF required</span>
                </label>
              </article>
            ))}
          </div>
          <form className="inline-form" onSubmit={submitColumn}>
            <input value={newColumn} onChange={(event) => setNewColumn(event.target.value)} placeholder="Add new Tracker column" />
            <Button size="sm" icon={PlusCircle}>Add column</Button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Official templates</h2>
              <p>Templates let file checks detect unchanged instructions or very low added content.</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={submitTemplate}>
            <Field label="Deliverable">
              <select value={template.deliverable} onChange={(event) => setTemplate({ ...template, deliverable: event.target.value })}>
                {activeColumns.map((column) => <option key={column.id} value={column.label}>{column.label}</option>)}
              </select>
            </Field>
            <Field label="Template name">
              <input value={template.name} onChange={(event) => setTemplate({ ...template, name: event.target.value })} placeholder="SRS official template" />
            </Field>
            <Field label="Google Drive template link">
              <input value={template.link} onChange={(event) => setTemplate({ ...template, link: event.target.value })} placeholder="https://drive.google.com/file/d/..." />
            </Field>
            <Button icon={PlusCircle}>Save template</Button>
          </form>
          <div className="template-list">
            {state.templates.map((item) => (
              <div className="template-row" key={item.id}>
                <div><strong>{item.name}</strong><span>{item.deliverable}</span></div>
                <a className="text-link" href={item.link} target="_blank" rel="noreferrer">Open</a>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="panel">
        <DataTable columns={['Source', 'Purpose', 'Status']} minWidth={760}>
          {sourceStatuses.map((source) => (
            <tr key={source.key}>
              <td><strong>{source.title}</strong><small>{source.csvUrl || source.sheetUrl || 'No link connected'}</small></td>
              <td>{source.description}</td>
              <td><StatusBadge status={source.status || 'Not connected'} /></td>
            </tr>
          ))}
          {rows.map(([name, purpose, status]) => (
            <tr key={name}>
              <td><strong>{name}</strong></td>
              <td>{purpose}</td>
              <td><StatusBadge status={status} /></td>
            </tr>
          ))}
        </DataTable>
      </section>

      <section className="panel subtle-panel">
        <div className="panel-header">
          <div>
            <h2>Maintenance</h2>
            <p>Switch between backend-loaded data and starter data for testing.</p>
            <small>Connected at {formatDateTime(state.classRecord.connectedAt)}</small>
            {state.backendSync?.status ? <small>Backend: {state.backendSync.status}</small> : null}
            {state.backendSync?.lastError ? <small>{state.backendSync.lastError}</small> : null}
          </div>
          <div className="button-row">
            <Button variant="secondary" icon={Database} loading={refreshingBackend} onClick={refreshFromBackend}>
              {refreshingBackend ? 'Refreshing...' : 'Refresh backend data'}
            </Button>
            <Button variant="secondary" icon={ArrowClockwise} onClick={reset}>Restore starter data</Button>
          </div>
        </div>
      </section>

      {summary ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel import-summary-modal" role="dialog" aria-modal="true" aria-label="Import summary">
            <button className="icon-close" type="button" onClick={() => setSummary(null)} aria-label="Close import summary">
              <X weight="regular" />
            </button>
            <div className="panel-header">
              <div>
                <h2>{summary.sourceType} import summary</h2>
                <p>Review what CapVault found before using the imported data.</p>
              </div>
            </div>
            <div className="summary-metric-grid">
              {'studentsFound' in summary ? <MetricMini label="Students" value={summary.studentsFound} /> : null}
              {'officialIdsFound' in summary ? <MetricMini label="Official IDs" value={summary.officialIdsFound} /> : null}
              {'groupsFound' in summary ? <MetricMini label="Groups" value={summary.groupsFound} /> : null}
              {'columnsFound' in summary ? <MetricMini label="Columns" value={summary.columnsFound} /> : null}
              {'headerRow' in summary ? <MetricMini label="Header row" value={summary.headerRow} /> : null}
              {'deadlineRows' in summary ? <MetricMini label="Deadline rows" value={summary.deadlineRows} /> : null}
              {summary.suggestedForms?.length ? <MetricMini label="Suggested forms" value={summary.suggestedForms.length} /> : null}
            </div>
            {summary.warnings?.length ? (
              <div className="inline-alert warning">
                {summary.warnings.map((warning) => <span key={warning}>{warning}</span>)}
              </div>
            ) : null}
            {summary.suggestedForms?.length ? (
              <div className="suggested-form-list">
                {summary.suggestedForms.map((item) => (
                  <div className="suggested-form-row" key={`${item.trackerColumn}-${item.dueAt}`}>
                    <div><strong>{item.title}</strong><span>{item.sourceValue}</span></div>
                    <StatusBadge status={item.pdfRequired ? 'PDF required' : 'Link fields'} />
                  </div>
                ))}
              </div>
            ) : null}
            <div className="button-row">
              {summary.suggestedForms?.length ? <Button icon={CheckCircle} onClick={generateSuggestedForms}>Generate suggested forms</Button> : null}
              <Button variant="secondary" onClick={() => setSummary(null)}>Close</Button>
            </div>
          </section>
        </div>
      ) : null}
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

function MetricMini({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
