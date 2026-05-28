import { X } from '@phosphor-icons/react';
import { StatusPill } from '../common/StatusPill.jsx';

export function TeamDetailPanel({ row, group, onClose }) {
  if (!row) return null;
  return (
    <aside className="detail-panel" aria-label="Team detail">
      <button className="icon-button detail-close" onClick={onClose} aria-label="Close team detail">
        <X weight="regular" />
      </button>
      <span className="eyeless-label">Team detail</span>
      <h2>{row.teamCode}</h2>
      <p>{group?.projectTitle || 'Project metadata not loaded'}</p>
      <div className="detail-section">
        <h3>Selected member</h3>
        <dl>
          <div><dt>Name</dt><dd>{row.studentName}</dd></div>
          <div><dt>Student No.</dt><dd>{row.studentNumber}</dd></div>
          <div><dt>Member #</dt><dd>{row.memberNumber}</dd></div>
        </dl>
      </div>
      <div className="detail-section">
        <h3>Adviser and archive</h3>
        <dl>
          <div><dt>Adviser</dt><dd>{group?.adviserName || 'Unassigned'}</dd></div>
          <div><dt>Archive status</dt><dd>{group?.archiveStatus || 'Not archived'}</dd></div>
          <div><dt>Project status</dt><dd>{group?.projectStatus || 'Tracked'}</dd></div>
        </dl>
      </div>
      <div className="detail-section">
        <h3>Tracker cells</h3>
        <div className="cell-stack">
          {row.cells.map((cell) => (
            <div className="cell-stack-row" key={cell.id}>
              <span>{cell.label}</span>
              <strong>{cell.rawValue || 'Blank'}</strong>
              <StatusPill status={cell.normalizedStatus} subtle />
            </div>
          ))}
        </div>
      </div>
      <div className="detail-section">
        <h3>Deliverables</h3>
        <div className="cell-stack">
          {(group?.deliverables || []).slice(0, 8).map((deliverable) => (
            <div className="cell-stack-row" key={deliverable.id}>
              <span>{deliverable.title}</span>
              <StatusPill status={deliverable.status} subtle />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
