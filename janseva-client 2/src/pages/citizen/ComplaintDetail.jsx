import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CitizenLayout from './CitizenLayout';
import { grievanceApi } from '../../api';
import Timeline from '../../components/Timeline';
import StatusPill from '../../components/StatusPill';

function fmtDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [aiLog, setAiLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      grievanceApi.get(id),
      grievanceApi.timeline(id),
      grievanceApi.aiLog(id).catch(() => ({ data: null })),
    ]).then(([c, t, ai]) => { setComplaint(c.data); setTimeline(t.data); setAiLog(ai.data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !complaint) return <CitizenLayout><div className="center-loading">Loading…</div></CitizenLayout>;

  const expected = fmtDate(complaint.expectedCompletionDate);
  const isOpen = !['RESOLVED', 'CLOSED'].includes(complaint.status);

  return (
    <CitizenLayout>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/citizen/complaints')}>← Back to My Complaints</button>
      <div className="dash-head">
        <div><h1>{complaint.title}</h1><div className="sub mono">{complaint.grievanceId} · {complaint.category?.categoryName}</div></div>
        <StatusPill status={complaint.status} />
      </div>

      {expected && isOpen && (
        <div className="card" style={{ background: 'var(--gold-tint)', border: '1px solid var(--gold)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>📅</span>
          <div>
            <b style={{ color: 'var(--gold-deep)' }}>Expected to be resolved by {expected}</b>
            <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
              Estimated by {complaint.assignedFieldOfficer?.name || 'the field officer'} based on their site visit.
            </div>
          </div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1.4fr .9fr', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Complaint Timeline</h3>
          <Timeline steps={timeline} />
        </div>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Details</h3>
            <Row label="Field Officer">{complaint.assignedFieldOfficer?.name || 'Not yet assigned'}</Row>
            <Row label="Department">{complaint.assignedDepartment?.departmentName || '—'}</Row>
            <Row label="Area">{complaint.area}</Row>
            <Row label="Priority">{complaint.priority || '—'}</Row>
            <Row label="Expected Completion">{expected || 'Not yet estimated'}</Row>
          </div>
          {aiLog && (
            <div className="card" style={{ background: 'var(--navy-deep)', border: 'none', color: '#fff' }}>
              <h3 style={{ fontSize: 14, color: '#fff', marginBottom: 10 }}>✨ AI Routing Decision</h3>
              <div style={{ fontSize: 12.5, opacity: 0.9, lineHeight: 1.9 }}>
                Category: <b>{aiLog.detectedCategory}</b><br />
                Department: <b>{aiLog.detectedDepartment?.departmentName}</b><br />
                Priority: <b>{aiLog.predictedPriority}</b><br />
                Confidence: <b>{(aiLog.confidenceScore * 100).toFixed(0)}%</b>
                {aiLog.duplicateOfGrievanceId && <><br />Possible duplicate of: <b>{aiLog.duplicateOfGrievanceId}</b></>}
              </div>
            </div>
          )}
        </div>
      </div>
    </CitizenLayout>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--slate)' }}>{label}</span>
      <span>{children}</span>
    </div>
  );
}