import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CitizenLayout from './CitizenLayout';
import { grievanceApi } from '../../api';
import StatusPill from '../../components/StatusPill';

export default function MyComplaints() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    grievanceApi.mine().then((r) => setList(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <CitizenLayout>
      <div className="dash-head">
        <div><h1>My Complaints</h1><div className="sub">Every civic issue you've reported.</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/citizen/grievance/new')}>+ New Complaint</button>
      </div>
      {loading ? (
        <div className="center-loading">Loading…</div>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Complaint ID</th><th>Category</th><th>Area</th><th>Priority</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.grievanceId}>
                  <td className="mono">{c.grievanceId}</td>
                  <td>{c.category?.categoryName}</td>
                  <td>{c.area}</td>
                  <td><span className="tag" style={{ background: c.priority === 'HIGH' ? 'var(--danger-tint)' : c.priority === 'MEDIUM' ? 'var(--warn-tint)' : 'var(--ok-tint)', color: c.priority === 'HIGH' ? 'var(--danger)' : c.priority === 'MEDIUM' ? 'var(--warn)' : 'var(--ok)' }}>{c.priority || '—'}</span></td>
                  <td><StatusPill status={c.status} /></td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => navigate(`/citizen/complaints/${c.grievanceId}`)}>View →</button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="empty-state">No complaints yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </CitizenLayout>
  );
}
