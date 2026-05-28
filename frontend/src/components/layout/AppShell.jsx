import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export function AppShell({ users, currentUser, onUserChange, onSignOut, unreadCount, showAccountSwitcher }) {
  return (
    <div className="app-shell">
      <Sidebar currentUser={currentUser} />
      <div className="workspace">
        <Topbar users={users} currentUser={currentUser} onUserChange={onUserChange} onSignOut={onSignOut} unreadCount={unreadCount} showAccountSwitcher={showAccountSwitcher} />
        <main className="main-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
