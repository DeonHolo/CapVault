import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';

export function CollapsibleSection({ title, description, count, defaultOpen = true, children, actions, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`panel collapsible-panel ${className}`.trim()}>
      <div className="collapsible-header">
        <button type="button" className="collapsible-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          <CaretDown className={open ? 'collapsible-icon open' : 'collapsible-icon'} weight="bold" />
          <span>
            <strong>{title}</strong>
            {description ? <small>{description}</small> : null}
          </span>
          {count !== undefined ? <em>{count}</em> : null}
        </button>
        {actions ? <div className="collapsible-actions">{actions}</div> : null}
      </div>
      {open ? <div className="collapsible-content">{children}</div> : null}
    </section>
  );
}
