import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export function AppShell({ users, currentUser, onUserChange, unreadCount }) {
  return (
    <div className="app-shell">
      <Sidebar currentUser={currentUser} />
      <div className="workspace">
        <Topbar users={users} currentUser={currentUser} onUserChange={onUserChange} unreadCount={unreadCount} />
        <main className="main-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
