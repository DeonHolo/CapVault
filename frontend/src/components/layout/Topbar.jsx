import { Bell, ShieldCheck } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { ROLE_LABELS } from '../../lib/constants.js';

export function Topbar({ users, currentUser, onUserChange, unreadCount }) {
  return (
    <header className="topbar">
      <div className="topbar-context">
        <ShieldCheck weight="regular" />
        <span>Institutional access</span>
        <strong>{currentUser?.email || 'Select an account'}</strong>
      </div>
      <div className="topbar-controls">
        <label className="account-switcher">
          <span>View account</span>
          <select value={currentUser?.email || ''} onChange={(event) => onUserChange(event.target.value)}>
            {users.map((user) => (
              <option value={user.email} key={user.email}>
                {user.displayName} - {ROLE_LABELS[user.role] || user.role}
              </option>
            ))}
          </select>
        </label>
        <Link className="notification-chip" to="/notifications" aria-label={`${unreadCount || 0} unread notifications`}>
          <Bell weight="regular" />
          <span>{unreadCount || 0}</span>
        </Link>
      </div>
    </header>
  );
}
