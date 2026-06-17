import { useMemo, useState } from 'react';
import { PageHeader, SearchBox, StatusBadge, DataTable } from '../components/ui.jsx';
import { useWorkflow } from '../app/WorkflowContext.jsx';
import { trackerColumns } from '../lib/seedData.js';

export function TrackerPage() {
  const { state } = useWorkflow();
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return state.students;
    return state.students.filter((student) => `${student.name} ${student.teamCode} ${student.studentNumber}`.toLowerCase().includes(needle));
  }, [query, state.students]);

  return (
    <div className="page-stack">
      <PageHeader title="Tracker Writeback" description="Class-record values stay visible as days-late numbers, dates, blanks, or raw Sheet values. CapVault writes only mapped accepted attempts." actions={<SearchBox value={query} onChange={setQuery} placeholder="Search student or team" />} />
      <section className="panel">
        <div className="tracker-summary">
          <Summary label="Rows" value={state.students.length} />
          <Summary label="Teams" value={new Set(state.students.map((student) => student.teamCode)).size} />
          <Summary label="Accepted attempts" value={state.attempts.filter((attempt) => attempt.matched).length} />
          <Summary label="Unmatched" value={state.attempts.filter((attempt) => !attempt.matched).length} />
        </div>
        <DataTable columns={['Student', 'Team', 'Member', ...trackerColumns]} minWidth={1280}>
          {rows.map((student) => (
            <tr key={student.studentNumber}>
              <td><strong>{student.name}</strong><small>{student.studentNumber}</small></td>
              <td>{student.teamCode}</td>
              <td>{student.memberNumber}</td>
              {trackerColumns.map((column) => <td key={column}><TrackerValue value={student.milestones[column]} /></td>)}
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}

function Summary({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function TrackerValue({ value }) {
  if (value === '' || value === null || value === undefined) return <StatusBadge status="Blank" />;
  if (value === '#N/A') return <StatusBadge status="#N/A" />;
  if (Number(value) === 0) return <StatusBadge status="On time" />;
  if (!Number.isNaN(Number(value))) return <span className="late-value">{value}</span>;
  return <span className="raw-value">{value}</span>;
}

