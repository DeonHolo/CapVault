import { useMemo, useState } from 'react';
import { Copy, LinkSimple, PlusCircle } from '@phosphor-icons/react';
import { Button, DataTable, Field, PageHeader, StatusBadge } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { formatDate } from '../lib/workflow.js';

const defaultFields = [
  { id: 'documentPdf', label: 'PDF Drive Link', type: 'drive', required: true, pdfRequired: true },
  { id: 'notes', label: 'Submission note', type: 'textarea', required: false, pdfRequired: false }
];

export function FormsPage() {
  const { state, publishDeliverable } = useWorkflow();
  const [form, setForm] = useState({
    title: 'Week 11: Revised SRS',
    shortTitle: 'Revised SRS',
    dueAt: '2026-05-02T23:59',
    trackerColumn: 'SRS',
    instructions: 'Submit the revised SRS as a PDF Drive file. Editable document links are blocked.',
    pdfRequired: true
  });
  const previewSlug = useMemo(() => form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), [form.title]);

  function submit(event) {
    event.preventDefault();
    publishDeliverable({
      ...form,
      dueAt: `${form.dueAt}:00+08:00`,
      audience: 'IT332 students',
      fields: form.pdfRequired ? defaultFields : [
        { id: 'primaryLink', label: 'Submission link', type: 'url', required: true, pdfRequired: false },
        { id: 'notes', label: 'Submission note', type: 'textarea', required: false, pdfRequired: false }
      ]
    });
  }

  return (
    <div className="page-stack">
      <PageHeader title="Form Publisher" description="Create deliverable-specific links that behave like focused Google Forms but write back to Sheets and tracker rules." />
      <section className="split-grid wide-left">
        <form className="panel form-grid" onSubmit={submit}>
          <div className="panel-header">
            <div>
              <h2>Create or update deliverable form</h2>
              <p>Use templates for speed, then edit field rules before publishing.</p>
            </div>
          </div>
          <Field label="Form title" required><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
          <div className="two-col">
            <Field label="Short label" required><input value={form.shortTitle} onChange={(event) => setForm({ ...form, shortTitle: event.target.value })} /></Field>
            <Field label="Due date" required><input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></Field>
          </div>
          <div className="two-col">
            <Field label="Tracker column" required>
              <select value={form.trackerColumn} onChange={(event) => setForm({ ...form, trackerColumn: event.target.value })}>
                {['ProbExploration', 'Convergence', 'RRL', 'Project Proposal', 'SRS', 'SDD', 'SourceCode', 'DEMO'].map((column) => <option key={column}>{column}</option>)}
              </select>
            </Field>
            <Field label="Document rule">
              <select value={form.pdfRequired ? 'pdf' : 'link'} onChange={(event) => setForm({ ...form, pdfRequired: event.target.value === 'pdf' })}>
                <option value="pdf">Strict PDF Drive link</option>
                <option value="link">General link fields</option>
              </select>
            </Field>
          </div>
          <Field label="Instructions"><textarea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} rows={4} /></Field>
          <div className="form-preview">
            <span>Generated link</span>
            <strong>/submit/{previewSlug}</strong>
          </div>
          <Button icon={PlusCircle}>Publish form</Button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Published forms</h2>
              <p>These links can be sent directly to students.</p>
            </div>
          </div>
          <DataTable columns={['Deliverable', 'Due', 'Rule', 'Link']} minWidth={680}>
            {state.deliverables.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.title}</strong><small>{item.trackerColumn}</small></td>
                <td>{formatDate(item.dueAt)}</td>
                <td><StatusBadge status={item.fields.some((field) => field.pdfRequired) ? 'PDF required' : 'Link fields'} /></td>
                <td><a className="copy-link" href={`/submit/${item.slug}`}><LinkSimple weight="regular" /> /submit/{item.slug}</a></td>
              </tr>
            ))}
          </DataTable>
          <div className="inline-note"><Copy weight="regular" /> Copy a form link and send it like Sir's current deliverable links page.</div>
        </section>
      </section>
    </div>
  );
}

