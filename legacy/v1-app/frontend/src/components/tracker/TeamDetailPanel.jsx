import { X } from '@phosphor-icons/react';
import { StatusPill } from '../common/StatusPill.jsx';

export function TeamDetailPanel({ row, group, onClose }) {
  if (!row) return null;
  return (
    <section className="detail-panel tracker-detail-band" aria-label="Team detail">
      <button className="icon-button detail-close" onClick={onClose} aria-label="Close team detail">
        <X weight="regular" />
      </button>
      <div className="tracker-detail-main">
        <div>
          <span className="eyeless-label">Selected tracker row</span>
          <h2>{row.teamCode}</h2>
          <p>{group?.projectTitle || 'Project metadata not loaded'}</p>
        </div>
        <dl>
          <div><dt>Name</dt><dd>{row.studentName}</dd></div>
          <div><dt>Student No.</dt><dd>{row.studentNumber}</dd></div>
          <div><dt>Member #</dt><dd>{row.memberNumber}</dd></div>
          <div><dt>Adviser</dt><dd>{group?.adviserName || 'Unassigned'}</dd></div>
          <div><dt>Archive</dt><dd>{group?.archiveStatus || 'Not archived'}</dd></div>
        </dl>
      </div>
      <div className="tracker-detail-cells">
          {row.cells.map((cell) => (
            <div className="cell-stack-row" key={cell.id}>
              <span>{cell.label}</span>
              <strong>{cell.rawValue || 'Blank'}</strong>
              <StatusPill status={cell.normalizedStatus} subtle />
            </div>
          ))}
      </div>
    </section>
  );
}
