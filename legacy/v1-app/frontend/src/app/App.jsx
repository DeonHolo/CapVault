import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { CurrentUserContext } from '../hooks/useCurrentUser.js';
import { apiRequest, getStoredUserEmail, setStoredUserEmail } from '../lib/api.js';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { AccessPage } from '../pages/AccessPage.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { ClassRecordImportPage } from '../pages/ClassRecordImportPage.jsx';
import { GroupManagementPage } from '../pages/GroupManagementPage.jsx';
import { TrackerPage } from '../pages/TrackerPage.jsx';
import { SubmissionPage } from '../pages/SubmissionPage.jsx';
import { ReviewPage } from '../pages/ReviewPage.jsx';
import { ArchivePage } from '../pages/ArchivePage.jsx';
import { ReportsPage } from '../pages/ReportsPage.jsx';
import { CalendarPage } from '../pages/CalendarPage.jsx';
import { NotificationsPage } from '../pages/NotificationsPage.jsx';
import { UsersPage } from '../pages/UsersPage.jsx';
import { LoadingState, ErrorState } from '../components/common/DataState.jsx';
import { useCurrentUser } from '../hooks/useCurrentUser.js';

const SESSION_KEY = 'capvault.sessionActive';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentEmail, setCurrentEmail] = useState(getStoredUserEmail());
  const [sessionActive, setSessionActive] = useState(localStorage.getItem(SESSION_KEY) === 'true');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest('/api/session/users');
        if (!active) return;
        setUsers(result);
        const stored = getStoredUserEmail();
        const selected = result.find((user) => user.email === stored) || (sessionActive ? result.find((user) => user.role === 'ADMIN') || result[0] : null);
        if (selected) {
          setStoredUserEmail(selected.email);
          setCurrentEmail(selected.email);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    boot();
    return () => {
      active = false;
    };
  }, [sessionActive]);

  async function refreshUsers() {
    const result = await apiRequest('/api/session/users');
    setUsers(result);
    const selected = result.find((user) => user.email === currentEmail) || result[0];
    if (selected) {
      setStoredUserEmail(selected.email);
      setCurrentEmail(selected.email);
    }
    return result;
  }

  useEffect(() => {
    let active = true;
    async function loadUnread() {
      if (!currentEmail) return;
      try {
        const result = await apiRequest('/api/notifications');
        if (active) setUnreadCount(result.filter((item) => item.unread).length);
      } catch {
        if (active) setUnreadCount(0);
      }
    }
    loadUnread();
    return () => {
      active = false;
    };
  }, [currentEmail]);

  const currentUser = useMemo(() => users.find((user) => user.email === currentEmail), [users, currentEmail]);

  function handleUserChange(email) {
    setStoredUserEmail(email);
    setCurrentEmail(email);
  }

  function handleLogin(email) {
    localStorage.setItem(SESSION_KEY, 'true');
    setSessionActive(true);
    setStoredUserEmail(email);
    setCurrentEmail(email);
  }

  function handleSignOut() {
    localStorage.removeItem(SESSION_KEY);
    setSessionActive(false);
    setStoredUserEmail('');
    setCurrentEmail('');
    setUnreadCount(0);
  }

  const contextValue = useMemo(
    () => ({
      currentUser,
      users,
      refreshUsers,
      signOut: handleSignOut,
      refreshUnread: () => apiRequest('/api/notifications').then((items) => setUnreadCount(items.filter((item) => item.unread).length))
    }),
    [currentUser, users]
  );

  if (loading) {
    return (
      <div className="boot-screen">
        <LoadingState rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="boot-screen">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <CurrentUserContext.Provider value={contextValue}>
      <Routes>
        <Route path="login" element={<LoginPage users={users} onLogin={handleLogin} />} />
        <Route
          element={
            sessionActive && currentUser ? (
              <AppShell
                key={currentEmail || 'guest'}
                users={users}
                currentUser={currentUser}
                onUserChange={handleUserChange}
                onSignOut={handleSignOut}
                unreadCount={unreadCount}
                showAccountSwitcher={import.meta.env.DEV}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="access" element={<AccessPage />} />
          <Route path="class-records" element={<RequireRole roles={['ADMIN']}><ClassRecordImportPage /></RequireRole>} />
          <Route path="groups" element={<GroupManagementPage />} />
          <Route path="tracker" element={<TrackerPage />} />
          <Route path="submissions" element={<SubmissionPage />} />
          <Route path="review" element={<RequireRole roles={['ADMIN', 'ADVISER']}><ReviewPage /></RequireRole>} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="reports" element={<RequireRole roles={['ADMIN', 'ADVISER']}><ReportsPage /></RequireRole>} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="users" element={<RequireRole roles={['ADMIN']}><UsersPage /></RequireRole>} />
        </Route>
        <Route path="*" element={<Navigate to={sessionActive && currentUser ? '/' : '/login'} replace />} />
      </Routes>
    </CurrentUserContext.Provider>
  );
}

function RequireRole({ roles, children }) {
  const { currentUser } = useCurrentUser();
  if (!currentUser || !roles.includes(currentUser.role)) return <Navigate to="/" replace />;
  return children;
}
