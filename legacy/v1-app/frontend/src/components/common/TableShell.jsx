import { EmptyState } from './DataState.jsx';

export function TableShell({ columns, rows, renderRow, emptyTitle = 'No records found', className = '' }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }
  return (
    <div className={`table-shell ${className}`}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}
