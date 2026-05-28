import { WarningCircle, Tray } from '@phosphor-icons/react';
import { Button } from './Button.jsx';

export function LoadingState({ rows = 4 }) {
  return (
    <div className="skeleton-stack" aria-live="polite" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-line" key={index} style={{ width: `${92 - index * 7}%` }} />
      ))}
    </div>
  );
}

export function EmptyState({ title = 'No records found', description = 'Adjust filters or add records to populate this view.' }) {
  return (
    <div className="empty-state">
      <Tray size={28} weight="regular" />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <WarningCircle size={28} weight="regular" />
      <div>
        <h3>Unable to load this view</h3>
        <p>{message}</p>
        {onRetry ? <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button> : null}
      </div>
    </div>
  );
}
