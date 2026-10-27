import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CitizenLayout from './CitizenLayout';
import { applicationApi, grievanceApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import StatusPill from '../../components/StatusPill';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([applicationApi.mine(), grievanceApi.mine()])
      .then(([a, g]) => { setApps(a.data); setComplaints(g.data); })
      .finally(() => setLoading(false));
  }, []);

  const ready = apps.filter((a) => a.status === 'CERTIFICATE_READY').length;
  const inProgress = apps.filter((a) => !['CERTIFICATE_READY', 'REJECTED'].includes(a.status)).length;
  const rejected = apps.filter((a) => a.status === 'REJECTED').length;

  return (
    <CitizenLayout>
      <div className="dash-head">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <div className="sub">Here's what's happening with your applications and complaints.</div>
        </div>
      </div>

      <div className="big-cards">
        <button className="big-card bc-services" onClick={() => navigate('/citizen/apply')}>
          <div>
            <h3>📄 Citizen Services</h3>
            <p>Apply for birth, income, residence, marriage certificates and more.</p>
          </div>
          <span className="btn bc-cta">Apply for a Service →</span>
        </button>
        <button className="big-card bc-grievance" onClick={() => navigate('/citizen/grievance/new')}>
          <div>
            <h3>📢 Grievance Redressal</h3>
            <p>Report civic issues — potholes, water supply, sanitation and more.</p>
          </div>
          <span className="btn bc-cta">Register a Complaint →</span>
        </button>
      </div>

      {loading ? (
        <div className="center-loading">Loading your data…</div>
      ) : (
        <>
          <div className="mini-stats">
            <div className="mini-stat"><div className="n">{apps.length}</div><div className="l">Applications</div></div>
            <div className="mini-stat ok"><div className="n">{ready}</div><div className="l">Certificates Ready</div></div>
            <div className="mini-stat warn"><div className="n">{inProgress}</div><div className="l">In Progress</div></div>
            <div className="mini-stat"><div className="n">{complaints.length}</div><div className="l">Complaints</div></div>
            <div className="mini-stat danger"><div className="n">{rejected}</div><div className="l">Rejected</div></div>
          </div>

          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Recent Applications</h3>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Application ID</th><th>Service</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {apps.slice(0, 5).map((a) => (
                  <tr key={a.applicationId}>
                    <td className="mono">{a.applicationId}</td>
                    <td>{a.service?.serviceName}</td>
                    <td>{new Date(a.submittedAt).toLocaleDateString('en-IN')}</td>
                    <td><StatusPill status={a.status} /></td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => navigate(`/citizen/applications/${a.applicationId}`)}>View →</button></td>
                  </tr>
                ))}
                {apps.length === 0 && <tr><td colSpan={5} className="empty-state">No applications yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </CitizenLayout>
  );
}
