import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { analyticsApi } from '../../api';

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => { analyticsApi.full().then((r) => setStats(r.data)).catch(() => {}); }, []);

  if (!stats) return <AdminLayout><div className="center-loading">Loading analytics…</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="dash-head"><div><h1>Portal Analytics</h1><div className="sub">Live from /api/analytics/full</div></div></div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <BreakdownCard title="Applications by Status" data={stats.applicationsByStatus} />
        <BreakdownCard title="Grievances by Status" data={stats.grievancesByStatus} />
        <BreakdownCard title="Officers by Role" data={stats.officersByRole} />
        <div className="card">
          <h4 style={{ marginBottom: 14 }}>Headline Numbers</h4>
          <Row label="Total Applications" value={stats.totalApplications} />
          <Row label="Certificates Issued" value={stats.certificatesIssued} />
          <Row label="Total Grievances" value={stats.totalGrievances} />
        </div>
      </div>
    </AdminLayout>
  );
}

function BreakdownCard({ title, data }) {
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="card">
      <h4 style={{ marginBottom: 14 }}>{title}</h4>
      {entries.map(([k, v]) => (
        <div key={k} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span>{k.replaceAll('_', ' ')}</span><b>{v}</b>
          </div>
          <div style={{ height: 7, background: 'var(--paper-deep)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg,var(--green),var(--navy))' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
      <span style={{ color: 'var(--slate)' }}>{label}</span><b>{value}</b>
    </div>
  );
}
