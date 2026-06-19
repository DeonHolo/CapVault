import { Link, NavLink } from 'react-router-dom';
import {
  Archive,
  ClipboardText,
  FilePdf,
  Gauge,
  GoogleLogo,
  IdentificationCard,
  ListChecks,
  MagnifyingGlass,
  Student,
  Table,
  WarningCircle
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
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
    { to: '/adviser', label: 'Adviser View', icon: IdentificationCard },
    { to: '/archive', label: 'Archive', icon: Archive },
    { to: '/workspace', label: 'Workspace', icon: GoogleLogo },
    { to: '/student', label: 'Student View', icon: Student }
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
            <span>Class record, forms, file checks, tracker, and final archive</span>
          </div>
          <NavLink className="public-link" to="/submit/week-9-srs">Open student form</NavLink>
        </div>
        <section className="main-surface">{children}</section>
      </main>
    </div>
  );
}

export function DataTable({ columns, children, minWidth = 780, className = '' }) {
  return (
    <div className={`table-wrap ${className}`} style={{ '--table-min': `${minWidth}px` }}>
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function PublicHeader({ subtitle }) {
  return (
    <header className="public-header">
      <Link className="public-brand" to="/">
        <span className="brand-mark small"><FilePdf weight="regular" /></span>
        <span><strong>CapVault V2</strong><small>{subtitle || 'Capstone submissions'}</small></span>
      </Link>
      <nav className="public-nav" aria-label="Student access">
        <Link to="/student">Student Dashboard</Link>
        <Link to="/register">Sign in / Register</Link>
      </nav>
    </header>
  );
}

export function SearchableSelect({ id, value, onChange, options, placeholder = 'Search', getValue = (item) => item.value, getLabel = (item) => item.label, disabledOptions = () => false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const matches = useMemo(() => {
    const needle = String(query || value || '').toLowerCase().trim();
    return options
      .filter((item) => {
        const haystack = `${getValue(item)} ${getLabel(item)}`.toLowerCase();
        return !needle || haystack.includes(needle);
      });
  }, [getLabel, getValue, options, query, value]);
  const filtered = matches.slice(0, 24);

  function choose(item) {
    if (disabledOptions(item)) return;
    const nextValue = getValue(item);
    onChange(nextValue, item);
    setQuery(nextValue);
    setOpen(false);
  }

  return (
    <div className="combo">
      <input
        id={id}
        value={open ? query : value}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange(event.target.value, null);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery(value || '');
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open ? (
        <div className="combo-menu" role="listbox">
          {filtered.length ? filtered.map((item) => (
            <button
              type="button"
              key={getValue(item)}
              className="combo-option"
              disabled={disabledOptions(item)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(item)}
            >
              <strong>{getValue(item)}</strong>
              <span>{getLabel(item)}</span>
              {disabledOptions(item) ? <em>Claimed</em> : null}
            </button>
          )) : <div className="combo-empty">No matching class record entry.</div>}
          {matches.length > filtered.length ? (
            <div className="combo-count">Showing 24 of {matches.length} matches. Type a Student Number or name to narrow the list.</div>
          ) : null}
        </div>
      ) : null}
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
