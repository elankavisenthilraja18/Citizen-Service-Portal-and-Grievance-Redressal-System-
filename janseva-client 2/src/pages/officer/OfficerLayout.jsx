import { NavLink } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../../auth/AuthContext';

const LINKS_BY_ROLE = {
  VAO: [['/officer/queue', 'Verification Queue', '📋']],
  RI: [['/officer/queue', 'Verification Queue', '📋']],
  TAHSILDAR: [['/officer/queue', 'Verification Queue', '📋']],
  DEPARTMENT_OFFICER: [['/officer/department', 'Department Complaints', '📋']],
  FIELD_OFFICER: [['/officer/field', 'My Tasks', '🧰']],
  GRIEVANCE_OFFICER: [['/officer/grievance-oversight', 'SLA Monitor', '📊']],
};

export default function OfficerLayout({ children }) {
  const { user } = useAuth();
  const links = LINKS_BY_ROLE[user?.role] || [];
  return (
    <div className="dash">
      <aside className="sidebar">
        <div className="side-role">
          <div className="name">{user?.name}</div>
          <div className="role">{ROLE_LABELS[user?.role]}</div>
          {user?.employeeId && <div className="mono" style={{ fontSize: 10.5, color: 'var(--slate-light)', marginTop: 2 }}>{user.employeeId}</div>}
        </div>
        {links.map(([to, label, icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
            {icon} {label}
          </NavLink>
        ))}
      </aside>
      <div className="dash-main">{children}</div>
    </div>
  );
}
