import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CitizenLayout from './CitizenLayout';
import { applicationApi } from '../../api';
import StatusPill from '../../components/StatusPill';

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    applicationApi.mine().then((r) => setApps(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <CitizenLayout>
      <div className="dash-head">
        <div><h1>My Applications</h1><div className="sub">Every certificate you've applied for.</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/citizen/apply')}>+ New Application</button>
      </div>
      {loading ? (
        <div className="center-loading">Loading…</div>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Application ID</th><th>Service</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {apps.map((a) => (
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
      )}
    </CitizenLayout>
  );
}
