import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import Modal from '../components/Modal';

export default function Services() {
  const [tab, setTab] = useState('services');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([catalogApi.listServices(), catalogApi.listGrievanceCategories()])
      .then(([s, c]) => { setServices(s.data); setCategories(c.data); setError(''); })
      .catch((err) => {
        console.error('Failed to load catalog:', err);
        setError(err.message || 'Could not reach the backend API.');
      })
      .finally(() => setLoading(false));
  }, []);

  const applyNow = (service) => {
    if (!isAuthenticated || user.role !== 'CITIZEN') { navigate('/login'); return; }
    navigate('/citizen/apply', { state: { serviceId: service.serviceId } });
  };
  const complainNow = (category) => {
    if (!isAuthenticated || user.role !== 'CITIZEN') { navigate('/login'); return; }
    navigate('/citizen/grievance/new', { state: { categoryId: category.categoryId } });
  };

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs">Home / Services</div>
          <h1>Citizen Services &amp; Grievance Redressal</h1>
          <p className="lead">Browse required documents, SLAs and grievance categories before you apply.</p>
        </div>
      </div>
      <section className="section">
        <div className="container">
          <div className="auth-tabs" style={{ maxWidth: 420, marginBottom: 26 }}>
            <button className={`auth-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>📄 Citizen Services</button>
            <button className={`auth-tab ${tab === 'grievance' ? 'active' : ''}`} onClick={() => setTab('grievance')}>📢 Grievance Categories</button>
          </div>

          {error && (
            <div className="error-box" style={{ marginBottom: 20 }}>
              ⚠️ Could not load the catalog from the backend: <b>{error}</b>
              <div style={{ marginTop: 6, fontWeight: 400 }}>
                Check that the backend is running at <span className="mono">http://localhost:8080</span> and that
                you started the frontend with <span className="mono">npm run dev</span> (not a static preview server).
                Open your browser's DevTools → Network tab and reload to see the exact failing request.
              </div>
            </div>
          )}

          {loading ? (
            <div className="center-loading">Loading catalog…</div>
          ) : tab === 'services' ? (
            <div className="svc-grid">
              {services.map((s) => (
                <button key={s.serviceId} className="svc-tile" onClick={() => setSelected({ type: 'service', item: s })}>
                  <div className="si">📄</div>
                  <h4>{s.serviceName}</h4>
                  <div className="sla">⏱ SLA: {s.slaDays} days</div>
                </button>
              ))}
              {!error && services.length === 0 && <div className="empty-state">No services returned by the backend yet.</div>}
            </div>
          ) : (
            <div className="svc-grid">
              {categories.map((c) => (
                <button key={c.categoryId} className="svc-tile" onClick={() => setSelected({ type: 'category', item: c })}>
                  <div className="si" style={{ background: 'var(--green-tint)', color: 'var(--green-deep)' }}>⚠️</div>
                  <h4>{c.categoryName}</h4>
                  <div className="sla">⏱ SLA: {c.slaDays} days</div>
                </button>
              ))}
              {!error && categories.length === 0 && <div className="empty-state">No categories returned by the backend yet.</div>}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <Modal title={selected.item.serviceName || selected.item.categoryName} onClose={() => setSelected(null)}>
          {selected.type === 'service' ? (
            <>
              <div className="pillrow" style={{ marginBottom: 14 }}>
                <span className="tag">⏱ SLA: {selected.item.slaDays} days</span>
                {selected.item.department && <span className="tag">🏢 {selected.item.department.departmentName}</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 8, fontWeight: 600 }}>Required documents:</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18, fontSize: 13 }}>
                {(selected.item.requiredDocuments || '').split(',').map((d) => <li key={d}>📎 {d.trim()}</li>)}
              </ul>
              <button className="btn btn-primary btn-block" onClick={() => applyNow(selected.item)}>
                {isAuthenticated ? 'Apply Now' : 'Login to Apply'}
              </button>
            </>
          ) : (
            <>
              <div className="pillrow" style={{ marginBottom: 14 }}>
                <span className="tag">⏱ SLA: {selected.item.slaDays} days</span>
                {selected.item.defaultDepartment && <span className="tag">🏢 {selected.item.defaultDepartment.departmentName}</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 14 }}>
                Complaints in this category are auto-routed by our AI engine to the responsible department and nearest field officer.
              </p>
              <button className="btn btn-green btn-block" onClick={() => complainNow(selected.item)}>
                {isAuthenticated ? 'Register This Complaint' : 'Login to Register Complaint'}
              </button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
