import { useEffect, useState } from 'react';
import OfficerLayout from './OfficerLayout';
import { grievanceApi, notificationApi } from '../../api';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import StatusPill from '../../components/StatusPill';

export default function DepartmentOfficerDashboard() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null); // grievance being cross-verified
  const [timeline, setTimeline] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const load = () => {
    setLoading(true);
    grievanceApi.myDepartmentGrievances().then((r) => setList(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    notificationApi.mine().then((r) => setNotifications(r.data || [])).catch(() => {});
  }, []);

  const counts = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].reduce((acc, s) => {
    acc[s] = list.filter((g) => g.status === s).length;
    return acc;
  }, {});

  const openReview = async (g) => {
    setReviewing(g);
    setTimeline([]);
    try {
      const res = await grievanceApi.timeline(g.grievanceId);
      setTimeline(res.data);
    } catch (err) {
      toast(err.message, 'bad');
    }
  };

  const resolutionEntry = timeline.slice().reverse().find((h) => /resolved/i.test(h.stage));

  const approve = async () => {
    setBusy(true);
    try {
      await grievanceApi.approveResolution(reviewing.grievanceId);
      toast('Resolution cross-verified — citizen notified: issue solved');
      setReviewing(null);
      load();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  const escalate = async (id) => {
    try { await grievanceApi.escalate(id, { remarks: 'Escalated for delayed resolution' }); toast('Escalated to Grievance Officer'); load(); }
    catch (err) { toast(err.message, 'bad'); }
  };

  return (
    <OfficerLayout>
      <div className="dash-head">
        <div><h1>Department Overview</h1><div className="sub">Complaints routed to your department</div></div>
      </div>

      {notifications.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, margin: 0 }}>🔔 Department Updates</h3>
            <span className="tag">{notifications.length} notification{notifications.length === 1 ? '' : 's'}</span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {notifications.slice(0, 5).map((n) => (
              <div key={n.notificationId} style={{ background: 'var(--paper)', borderRadius: 8, padding: '9px 11px', fontSize: 12.5 }}>
                <b>{n.eventType === 'GRIEVANCE_RESOLVED' ? 'Resolution ready for verification' : 'Field work update'}</b>
                <div style={{ color: 'var(--slate)', marginTop: 3 }}>{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mini-stats">
        <div className="mini-stat warn"><div className="n">{counts.SUBMITTED + counts.ASSIGNED}</div><div className="l">Pending / Assigned</div></div>
        <div className="mini-stat"><div className="n">{counts.IN_PROGRESS}</div><div className="l">In Progress</div></div>
        <div className="mini-stat ok"><div className="n">{counts.RESOLVED}</div><div className="l">Awaiting Approval</div></div>
        <div className="mini-stat ok"><div className="n">{counts.CLOSED}</div><div className="l">Closed</div></div>
        <div className="mini-stat"><div className="n">{list.length}</div><div className="l">Total</div></div>
      </div>

      {loading ? (
        <div className="center-loading">Loading…</div>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Complaint ID</th><th>Title</th><th>Field Officer</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.grievanceId}>
                  <td className="mono">{c.grievanceId}</td>
                  <td>{c.title}</td>
                  <td>{c.assignedFieldOfficer?.name || '—'}</td>
                  <td><StatusPill status={c.status} /></td>
                  <td className="pillrow">
                    {c.status === 'RESOLVED' && <button className="btn btn-green btn-sm" onClick={() => openReview(c)}>🔍 Cross-verify</button>}
                    {['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status) && <button className="btn btn-danger btn-sm" onClick={() => escalate(c.grievanceId)}>Escalate</button>}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="empty-state">No complaints for your department yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {reviewing && (
        <Modal title={`Cross-verify ${reviewing.grievanceId}`} onClose={() => setReviewing(null)}>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 14 }}>{reviewing.title}</p>
          {resolutionEntry ? (
            <>
              {resolutionEntry.photoUrl ? (
                <img src={resolutionEntry.photoUrl} alt="Resolution proof" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--line)', marginBottom: 12 }} />
              ) : (
                <div className="error-box">No photo evidence was attached by the field officer.</div>
              )}
              <div style={{ fontSize: 12.5, background: 'var(--paper)', padding: 10, borderRadius: 8, marginBottom: 16 }}>
                <b>Field Officer's remarks:</b> {resolutionEntry.remarks || '—'}
              </div>
            </>
          ) : (
            <div className="center-loading">Loading resolution evidence…</div>
          )}
          <button className="btn btn-green btn-block" disabled={busy || !resolutionEntry?.photoUrl} onClick={approve}>
            ✓ Verified — Approve &amp; Close (Issue Solved)
          </button>
        </Modal>
      )}
    </OfficerLayout>
  );
}
