import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const LINKS = [
  ['/admin', 'Overview', '🏠'],
  ['/admin/officers', 'Manage Officers', '👥'],
  ['/admin/catalog', 'Services & Categories', '🗂️'],
  ['/admin/analytics', 'Analytics', '📊'],
];

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  return (
    <div className="dash">
      <aside className="sidebar">
        <div className="side-role">
          <div className="name">{user?.name}</div>
          <div className="role">Administrator</div>
          {user?.employeeId && <div className="mono" style={{ fontSize: 10.5, color: 'var(--slate-light)', marginTop: 2 }}>{user.employeeId}</div>}
        </div>
        {LINKS.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
            {icon} {label}
          </NavLink>
        ))}
      </aside>
      <div className="dash-main">{children}</div>
    </div>
  );
}
