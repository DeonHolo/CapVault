import { percent } from '../../lib/format.js';
import { StatusPill } from '../common/StatusPill.jsx';

export function MyProgressStrip({ tracker }) {
  const rows = tracker?.rows || [];
  const team = rows[0]?.teamCode || 'No assigned team';
  const cells = rows.flatMap((row) => row.cells || []);
  const applicable = cells.filter((cell) => cell.normalizedStatus !== 'NOT_APPLICABLE');
  const active = applicable.filter((cell) => ['COMPLETE', 'IN_PROGRESS', 'RAW_VALUE'].includes(cell.normalizedStatus));
  const missing = applicable.filter((cell) => cell.normalizedStatus === 'MISSING');
  const coverage = applicable.length ? (active.length / applicable.length) * 100 : 0;

  return (
    <section className="my-progress-strip">
      <div>
        <span className="eyeless-label">My Progress</span>
        <h2>{team}</h2>
        <p>{rows.length} member rows, {missing.length} missing tracker cells, {applicable.length} applicable cells.</p>
      </div>
      <div className="progress-meter" aria-label={`Progress coverage ${percent(coverage)}`}>
        <span style={{ width: `${Math.min(coverage, 100)}%` }} />
      </div>
      <div className="progress-stat">
        <strong>{percent(coverage)}</strong>
        <span>Coverage</span>
      </div>
      <div className="progress-statuses">
        {cells.slice(0, 5).map((cell) => (
          <StatusPill key={`${cell.id}-${cell.milestoneKey}`} status={cell.normalizedStatus} subtle />
        ))}
      </div>
    </section>
  );
}
