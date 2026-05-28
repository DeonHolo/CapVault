import { useState } from 'react';
import { ArrowsClockwise, Eye } from '@phosphor-icons/react';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { FormField } from '../components/common/FormField.jsx';
import { TableShell } from '../components/common/TableShell.jsx';
import { LoadingState, ErrorState } from '../components/common/DataState.jsx';
import { apiRequest } from '../lib/api.js';
import { DEFAULT_SHEET_URL } from '../lib/constants.js';
import { useApiResource } from '../hooks/useApiResource.js';
import { formatDateTime } from '../lib/format.js';

export function ClassRecordImportPage() {
  const [sourceUrl, setSourceUrl] = useState(DEFAULT_SHEET_URL);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const imports = useApiResource('/api/class-records/imports');

  async function previewSheet() {
    setBusy(true);
    setMessage(null);
    try {
      setPreview(await apiRequest('/api/class-records/preview', { method: 'POST', body: { sourceUrl } }));
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function syncSheet() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await apiRequest('/api/class-records/sync', { method: 'POST', body: { sourceUrl, mapping: preview?.suggestedMapping || {} } });
      setMessage(`${result.importedRows} tracker rows synchronized. ${result.errorRows} rows need review.`);
      imports.reload();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-grid">
      <PageHeader title="Class Record Import" description="Preview, map, validate, import, and re-sync the IT332 class record tracker sheet." />
      <section className="panel">
        <div className="form-grid two">
          <FormField label="Published Google Sheets URL" helper="Public tracker links are converted to CSV for preview and sync.">
            <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} />
          </FormField>
          <div className="button-row end">
            <Button icon={Eye} variant="secondary" loading={busy} onClick={previewSheet}>Preview</Button>
            <Button icon={ArrowsClockwise} loading={busy} disabled={!preview} onClick={syncSheet}>Confirm sync</Button>
          </div>
        </div>
        {message ? <div className="inline-message">{message}</div> : null}
      </section>
      {preview ? (
        <section className="split-grid">
          <div className="panel">
            <div className="panel-header">
              <h2>Column Mapping</h2>
              <p>Suggested fields are based on the class record tracker template.</p>
            </div>
            <div className="mapping-grid">
              {Object.entries(preview.suggestedMapping).map(([field, column]) => (
                <div key={field}>
                  <span>{field}</span>
                  <strong>{column}</strong>
                </div>
              ))}
            </div>
            <div className="milestone-tags">
              {preview.milestoneColumns.map((column) => <span key={column}>{column}</span>)}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <h2>Validation</h2>
              <p>Warnings appear before import so the admin can correct mapping.</p>
            </div>
            {preview.warnings.length ? (
              <ul className="validation-list">{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            ) : (
              <div className="inline-message success">Required tracker columns were detected.</div>
            )}
          </div>
        </section>
      ) : null}
      {preview ? (
        <TableShell
          className="compact-table"
          columns={preview.columns.slice(0, 8).map((column) => ({ key: column, label: column }))}
          rows={preview.sampleRows}
          renderRow={(row, index) => (
            <tr key={index}>
              {preview.columns.slice(0, 8).map((column) => <td key={column}>{row[column] || 'Blank'}</td>)}
            </tr>
          )}
        />
      ) : null}
      <section className="panel">
        <div className="panel-header">
          <h2>Recent Syncs</h2>
          <p>Class record imports are recorded for accountability.</p>
        </div>
        {imports.loading ? <LoadingState /> : imports.error ? <ErrorState message={imports.error} onRetry={imports.reload} /> : (
          <TableShell
            columns={[
              { key: 'status', label: 'Status' },
              { key: 'rows', label: 'Rows' },
              { key: 'started', label: 'Started' },
              { key: 'message', label: 'Message' }
            ]}
            rows={imports.data || []}
            renderRow={(row) => (
              <tr key={row.id}>
                <td>{row.status}</td>
                <td>{row.importedRows}</td>
                <td>{formatDateTime(row.startedAt)}</td>
                <td>{row.message}</td>
              </tr>
            )}
          />
        )}
      </section>
    </div>
  );
}
