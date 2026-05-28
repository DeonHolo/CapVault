import { useEffect, useState } from 'react';
import { MagnifyingGlass, SlidersHorizontal } from '@phosphor-icons/react';
import { TRACKER_MILESTONES } from '../../lib/constants.js';

export function TrackerFilters({ filters, onChange, teamOptions, canEdit = false, adminEdit, onAdminEditChange }) {
  const [searchDraft, setSearchDraft] = useState(filters.search || '');

  useEffect(() => {
    setSearchDraft(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchDraft !== filters.search) {
        onChange({ ...filters, search: searchDraft });
      }
    }, 280);
    return () => window.clearTimeout(timeoutId);
  }, [filters, searchDraft, onChange]);

  function setValue(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <section className="filter-bar">
      <label className="search-control">
        <MagnifyingGlass weight="regular" />
        <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search student, team, milestone, value" />
      </label>
      <select value={filters.teamCode} onChange={(event) => setValue('teamCode', event.target.value)}>
        <option value="">All teams</option>
        {teamOptions.map((team) => (
          <option key={team} value={team}>{team}</option>
        ))}
      </select>
      <select value={filters.milestoneKey} onChange={(event) => setValue('milestoneKey', event.target.value)}>
        <option value="">All milestones</option>
        {TRACKER_MILESTONES.map((item) => (
          <option value={item.key} key={item.key}>{item.label}</option>
        ))}
      </select>
      <select value={filters.status} onChange={(event) => setValue('status', event.target.value)}>
        <option value="">All values</option>
        <option value="COMPLETE">Complete</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="MISSING">Missing / blank</option>
        <option value="NOT_APPLICABLE">Not applicable (#N/A)</option>
      </select>
      <span className="filter-hint">Missing is blank or 0; not applicable is #N/A from the sheet.</span>
      {canEdit ? (
        <label className="inline-toggle">
          <input type="checkbox" checked={adminEdit} onChange={(event) => onAdminEditChange(event.target.checked)} />
          <SlidersHorizontal weight="regular" />
          <span>Admin edit</span>
        </label>
      ) : null}
    </section>
  );
}
