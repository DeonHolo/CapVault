import { Bell, SignOut, ShieldCheck } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { ROLE_LABELS } from '../../lib/constants.js';
import { Button } from '../common/Button.jsx';

export function Topbar({ users, currentUser, onUserChange, onSignOut, unreadCount, showAccountSwitcher }) {
  return (
    <header className="topbar">
      <Link className="topbar-context" to="/access">
        <ShieldCheck weight="regular" />
        <span>Institutional access</span>
        <strong>{currentUser?.email || 'Select an account'}</strong>
      </Link>
      <div className="topbar-controls">
        {showAccountSwitcher ? (
          <label className="account-switcher dev-switcher">
            <span>Developer account</span>
            <select value={currentUser?.email || ''} onChange={(event) => onUserChange(event.target.value)}>
              {users.map((user) => (
                <option value={user.email} key={user.email}>
                  {user.displayName} - {ROLE_LABELS[user.role] || user.role}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Link className="notification-chip" to="/notifications" aria-label={`${unreadCount || 0} unread notifications`}>
          <Bell weight="regular" />
          <span>{unreadCount || 0}</span>
        </Link>
        <Button type="button" variant="ghost" size="sm" icon={SignOut} onClick={onSignOut}>Sign out</Button>
      </div>
    </header>
  );
}
