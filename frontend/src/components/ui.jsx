import { NavLink } from 'react-router-dom';
import {
  Archive,
  ClipboardText,
  FilePdf,
  Gauge,
  GoogleLogo,
  ListChecks,
  MagnifyingGlass,
  Student,
  Table,
  WarningCircle
} from '@phosphor-icons/react';
import { statusTone } from '../lib/workflow.js';

export function Button({ children, variant = 'primary', size = 'md', icon: Icon, loading = false, className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} disabled={loading || props.disabled} {...props}>
      {Icon ? <Icon weight="regular" aria-hidden="true" /> : null}
      <span>{loading ? 'Working...' : children}</span>
    </button>
  );
}

export function Field({ label, helper, error, children, required = false }) {
  return (
    <label className="field">
      <span className="field-label">{label}{required ? <b> *</b> : null}</span>
      {children}
      {helper ? <span className="field-helper">{helper}</span> : null}
      {error ? <span className="field-error" role="alert">{error}</span> : null}
    </label>
  );
}

export function StatusBadge({ status }) {
  return <span className={`status status-${statusTone(status)}`}>{status}</span>;
}

export function PageHeader({ title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({ title, description, icon: Icon = WarningCircle }) {
  return (
    <div className="empty-state">
      <Icon weight="regular" aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function AppShell({ children }) {
  const nav = [
    { to: '/', label: 'Command Center', icon: Gauge },
    { to: '/forms', label: 'Forms', icon: ClipboardText },
    { to: '/tracker', label: 'Tracker', icon: Table },
    { to: '/review', label: 'Review', icon: ListChecks },
    { to: '/archive', label: 'Archive', icon: Archive },
    { to: '/student', label: 'Student Status', icon: Student },
    { to: '/workspace', label: 'Workspace', icon: GoogleLogo }
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark"><FilePdf weight="regular" /></div>
          <div>
            <strong>CapVault V2</strong>
            <span>Google-first capstone operations</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <item.icon weight="regular" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="workspace">
        <div className="topbar">
          <div>
            <strong>IT332 SEM2 2025-26</strong>
            <span>Class record, submission checks, tracker writeback, and final archive</span>
          </div>
          <NavLink className="public-link" to="/submit/week-9-srs">Open student form</NavLink>
        </div>
        <section className="main-surface">{children}</section>
      </main>
    </div>
  );
}

export function DataTable({ columns, children, minWidth = 780 }) {
  return (
    <div className="table-wrap" style={{ '--table-min': `${minWidth}px` }}>
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search' }) {
  return (
    <label className="search-box">
      <MagnifyingGlass weight="regular" aria-hidden="true" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}
