import { NavLink } from 'react-router-dom';
import { BrandIcon, navItems } from './navigation.js';

export function Sidebar({ currentUser }) {
  const role = currentUser?.role;
  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(role));
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <BrandIcon weight="regular" />
        </div>
        <div>
          <strong>CapVault</strong>
          <span>IT332 academic records</span>
        </div>
      </div>
      <nav className="nav-list" aria-label="Primary navigation">
        {visibleItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <item.icon weight="regular" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
