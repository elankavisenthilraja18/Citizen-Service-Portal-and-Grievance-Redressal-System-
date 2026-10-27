import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyticsApi, catalogApi } from '../api';
import { useAuth, ROLE_HOME } from '../auth/AuthContext';

const FEATURES = [
  ['📄', 'Apply for Certificates', 'Birth, income, residence, community & more — with document upload and e-signature.', 'navy'],
  ['📢', 'Report Civic Issues', 'File grievances with photo evidence; AI auto-routes to the right department.', 'green'],
  ['🧭', 'Real-Time Tracking', 'Follow every file from VAO to Tahsildar with officer name, date and remarks.', 'gold'],
  ['✅', 'QR-Verified Certificates', 'Every certificate carries a QR code and digital signature for instant verification.', 'navy'],
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    analyticsApi.public().then((res) => setStats(res.data)).catch((err) => console.error('analytics/public failed:', err));
    catalogApi.listServices().then((res) => setServices(res.data.slice(0, 4))).catch((err) => console.error('services failed:', err));
  }, []);

  const getStarted = () => navigate(isAuthenticated ? ROLE_HOME[user.role] : '/register');

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">One Portal · All Government Services</span>
            <h1>Certificates and grievances,<br />settled <span className="accent">without the queue.</span></h1>
            <p className="lead">
              JanSeva connects citizens directly with VAO, RI, Tahsildar and department offices — apply for
              certificates, report civic issues, and track every file as it moves, in real time.
            </p>
            <div className="hero-badges">
              <div className="hero-badge">🛡️ Govt.-verified &amp; digitally signed</div>
              <div className="hero-badge">📱 QR-authenticated certificates</div>
              <div className="hero-badge">✨ AI-assisted grievance routing</div>
            </div>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={getStarted}>Get Started →</button>
              <Link to="/track" className="btn btn-outline">🔍 Track an Application</Link>
            </div>
          </div>
          <div className="card" style={{ maxWidth: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <b style={{ fontSize: 13 }}>Live from the API</b>
                <div className="mono" style={{ fontSize: 11, color: 'var(--slate)' }}>/api/analytics/public</div>
              </div>
            </div>
            {stats ? (
              <div className="grid grid-2">
                <StatMini label="Applications" value={stats.totalApplications} />
                <StatMini label="Certificates Issued" value={stats.certificatesIssued} />
                <StatMini label="Grievances" value={stats.totalGrievances} />
                <StatMini label="Resolved" value={stats.resolvedGrievances} />
              </div>
            ) : (
              <div className="center-loading">Loading live stats…</div>
            )}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow">What You Can Do</span>
            <h2>Every citizen service, one login away</h2>
          </div>
          <div className="grid grid-4">
            {FEATURES.map(([icon, title, desc, color]) => (
              <div key={title} className="card card-hover">
                <div className={`feat-icon ${color}`}>{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow">Live from the Catalog</span>
            <h2>Popular Services</h2>
          </div>
          <div className="svc-grid">
            {services.length === 0 && <div className="empty-state">Services will appear here once the backend is running.</div>}
            {services.map((s) => (
              <div key={s.serviceId} className="svc-tile">
                <div className="si">📄</div>
                <h4>{s.serviceName}</h4>
                <div className="sla">⏱ SLA: {s.slaDays} days</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/services" className="btn btn-outline">View All Services</Link>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, marginBottom: 10 }}>Ready to get started?</h2>
          <p className="lead" style={{ maxWidth: 460, margin: '0 auto 22px' }}>
            Create your JanSeva account and file your first application in under five minutes.
          </p>
          <button className="btn btn-primary" onClick={getStarted}>Get Started →</button>
        </div>
      </section>
    </>
  );
}

function StatMini({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--paper)', borderRadius: 10 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--navy-deep)' }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 10, color: 'var(--slate)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </div>
  );
}
