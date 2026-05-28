import { useMemo, useState } from 'react';
import { Check, PencilSimple } from '@phosphor-icons/react';
import { Button } from '../common/Button.jsx';

export function TrackerTable({ rows, adminEdit, onSelectRow, onSaveRow }) {
  const [editingRowId, setEditingRowId] = useState(null);
  const [draft, setDraft] = useState({});
  const milestones = useMemo(() => rows[0]?.cells || [], [rows]);

  function beginEdit(row) {
    setEditingRowId(row.id);
    setDraft(Object.fromEntries(row.cells.map((cell) => [cell.milestoneKey, cell.rawValue || ''])));
  }

  async function save(row) {
    await onSaveRow(row.id, draft);
    setEditingRowId(null);
    setDraft({});
  }

  return (
    <div className="tracker-table-wrap">
      <table className="tracker-table">
        <thead>
          <tr>
            <th className="sticky-col first">Name of Student</th>
            <th className="sticky-col second">Team Code</th>
            <th className="sticky-col third">Member #</th>
            {milestones.map((cell) => (
              <th key={cell.milestoneKey}>{cell.label}</th>
            ))}
            {adminEdit ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onSelectRow(row)} tabIndex={0}>
              <td className="sticky-col first strong-cell">{row.studentName}</td>
              <td className="sticky-col second mono-cell">{row.teamCode}</td>
              <td className="sticky-col third mono-cell">{row.memberNumber}</td>
              {row.cells.map((cell) => (
                <td key={cell.id}>
                  {editingRowId === row.id ? (
                    <input
                      className="cell-input"
                      value={draft[cell.milestoneKey] || ''}
                      onChange={(event) => setDraft({ ...draft, [cell.milestoneKey]: event.target.value })}
                      onClick={(event) => event.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={`tracker-value tracker-value-${String(cell.normalizedStatus).toLowerCase().replaceAll('_', '-')}`}
                      title={`${cell.label}: ${cell.rawValue || 'Blank'} (${cell.normalizedStatus})`}
                    >
                      {cell.rawValue || 'Blank'}
                    </span>
                  )}
                </td>
              ))}
              {adminEdit ? (
                <td>
                  {editingRowId === row.id ? (
                    <Button size="sm" variant="primary" icon={Check} onClick={(event) => { event.stopPropagation(); save(row); }}>Save</Button>
                  ) : (
                    <Button size="sm" variant="secondary" icon={PencilSimple} onClick={(event) => { event.stopPropagation(); beginEdit(row); }}>Edit</Button>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
