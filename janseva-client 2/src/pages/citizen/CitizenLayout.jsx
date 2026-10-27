import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const LINKS = [
  ['/citizen', 'Dashboard', '🏠'],
  ['/citizen/applications', 'My Applications', '📄'],
  ['/citizen/complaints', 'My Complaints', '📢'],
  ['/citizen/profile', 'Profile', '👤'],
];

export default function CitizenLayout({ children }) {
  const { user } = useAuth();
  return (
    <div className="dash">
      <aside className="sidebar">
        <div className="side-role">
          <div className="name">{user?.name}</div>
          <div className="role">Citizen</div>
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
