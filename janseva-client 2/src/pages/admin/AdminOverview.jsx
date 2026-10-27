import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { analyticsApi } from '../../api';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { analyticsApi.full().then((r) => setStats(r.data)).catch(() => {}); }, []);

  return (
    <AdminLayout>
      <div className="dash-head"><div><h1>Administrator Console</h1><div className="sub">Portal configuration &amp; system-wide oversight</div></div></div>

      {stats ? (
        <div className="mini-stats">
          <div className="mini-stat"><div className="n">{stats.totalApplications}</div><div className="l">Applications</div></div>
          <div className="mini-stat ok"><div className="n">{stats.certificatesIssued}</div><div className="l">Certificates Issued</div></div>
          <div className="mini-stat"><div className="n">{stats.totalGrievances}</div><div className="l">Complaints</div></div>
          <div className="mini-stat warn"><div className="n">{stats.officersByRole?.ADMINISTRATOR ?? 0}</div><div className="l">Administrators</div></div>
          <div className="mini-stat danger"><div className="n">{stats.applicationsByStatus?.REJECTED ?? 0}</div><div className="l">Rejected Applications</div></div>
        </div>
      ) : (
        <div className="center-loading">Loading stats…</div>
      )}

      <div className="grid grid-3">
        <div className="card">
          <div className="feat-icon navy">👥</div>
          <h3>Manage Officers</h3>
          <p>Create government officer accounts, deactivate, reset passwords.</p>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => navigate('/admin/officers')}>Open</button>
        </div>
        <div className="card">
          <div className="feat-icon green">🗂️</div>
          <h3>Services &amp; Categories</h3>
          <p>Manage citizen services, departments and grievance categories.</p>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => navigate('/admin/catalog')}>Open</button>
        </div>
        <div className="card">
          <div className="feat-icon gold">📊</div>
          <h3>Analytics</h3>
          <p>Application and grievance breakdowns across every status and role.</p>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => navigate('/admin/analytics')}>Open</button>
        </div>
      </div>
    </AdminLayout>
  );
}
