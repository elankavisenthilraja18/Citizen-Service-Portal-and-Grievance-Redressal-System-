import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS, ROLE_HOME } from '../auth/AuthContext';
import Seal from './Seal';

const GUEST_LINKS = [
  ['/', 'Home'],
  ['/services', 'Services'],
  ['/track', 'Track Status'],
  ['/faq', 'FAQ'],
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (name) =>
    (name || '')
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>Government of India · e-Governance Initiative</span>
          <span>Screen Reader Access</span>
        </div>
      </div>
      <nav className="navbar">
        <div className="container">
          <div className="brand" onClick={() => navigate('/')}>
            <Seal size={38} />
            <div className="brand-name">
              JanSeva
              <small>Citizen Service &amp; Grievance Redressal</small>
            </div>
          </div>

          <div className="nav-links">
            {!isAuthenticated &&
              GUEST_LINKS.map(([to, label]) => (
                <Link key={to} to={to} className="nav-link">{label}</Link>
              ))}
            {isAuthenticated && (
              <>
                <Link to={ROLE_HOME[user.role] || '/'} className="nav-link">Dashboard</Link>
                <Link to="/services" className="nav-link">Services</Link>
                <Link to="/track" className="nav-link">Track Status</Link>
              </>
            )}
          </div>

          <div className="nav-cta">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </>
            ) : (
              <>
                <div
                  className="role-chip"
                  style={{ cursor: user.role === 'CITIZEN' ? 'pointer' : 'default' }}
                  onClick={() => { if (user.role === 'CITIZEN') navigate('/citizen/profile'); }}
                  title={user.role === 'CITIZEN' ? 'View my profile' : undefined}
                >
                  <div className="avatar">{initials(user.name)}</div>
                  <div style={{ lineHeight: 1.1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy-deep)' }}>{user.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--slate)' }}>{ROLE_LABELS[user.role]}</div>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
