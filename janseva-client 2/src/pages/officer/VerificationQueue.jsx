import { useEffect, useState } from 'react';
import OfficerLayout from './OfficerLayout';
import { applicationApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';

const STAGE_LABEL = { VAO: 'VAO Verification', RI: 'RI Verification', TAHSILDAR: 'Tahsildar — Digital Signature' };

export default function VerificationQueue() {
  const { user } = useAuth();
  const toast = useToast();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // application under review in modal
  const [documents, setDocuments] = useState([]);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [mode, setMode] = useState(null); // 'review' | 'reject'
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    applicationApi.queue().then((r) => setQueue(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openReview = async (app) => {
    setActive(app);
    setMode('review');
    setRemarks('');
    setDocuments([]);
    if (['SUBMITTED'].includes(app.status)) {
      try { await applicationApi.view(app.applicationId); } catch { /* non-fatal */ }
    }
    try {
      const res = await applicationApi.documents(app.applicationId);
      setDocuments(res.data);
    } catch (err) {
      toast('Could not load documents: ' + err.message, 'bad');
    }
  };

  const approve = async () => {
    setBusy(true);
    try {
      await applicationApi.approve(active.applicationId, { remarks });
      toast('Approved & forwarded');
      setActive(null);
      load();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectionReason.trim()) { toast('A rejection reason is required', 'bad'); return; }
    setBusy(true);
    try {
      await applicationApi.reject(active.applicationId, { rejectionReason });
      toast('Application rejected — citizen notified via SMS & Email');
      setActive(null);
      setMode(null);
      load();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OfficerLayout>
      <div className="dash-head">
        <div><h1>{STAGE_LABEL[user.role]} Queue</h1><div className="sub">Applications awaiting your action</div></div>
      </div>

      {loading ? (
        <div className="center-loading">Loading queue…</div>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>App ID</th><th>Service</th><th>Citizen</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {queue.map((a) => (
                <tr key={a.applicationId}>
                  <td className="mono">{a.applicationId}</td>
                  <td>{a.service?.serviceName}</td>
                  <td>{a.citizen?.fullName}</td>
                  <td>{new Date(a.submittedAt).toLocaleDateString('en-IN')}</td>
                  <td><span className="status-pill sp-pending">{a.status.replaceAll('_', ' ')}</span></td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => openReview(a)}>👁 Review</button></td>
                </tr>
              ))}
              {queue.length === 0 && <tr><td colSpan={6} className="empty-state">Nothing waiting on you right now 🎉</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {active && mode === 'review' && (
        <Modal title={active.service?.serviceName} onClose={() => setActive(null)}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 14 }}>
            {active.applicationId} · Applicant: {active.citizen?.fullName}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {documents.length === 0 && <div className="help">Loading documents…</div>}
            {documents.map((doc) => (
              <div key={doc.documentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {doc.fileUrl && <img src={doc.fileUrl} alt={doc.documentType} style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />}
                  <span style={{ fontSize: 13 }}>{doc.documentType}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewingDoc(doc)}>View</button>
              </div>
            ))}
          </div>
          <div className="field"><label>Remarks (optional)</label><textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add verification remarks..." /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-green btn-block" disabled={busy} onClick={approve}>✓ Approve &amp; Forward</button>
            <button className="btn btn-danger btn-block" disabled={busy} onClick={() => setMode('reject')}>✕ Reject</button>
          </div>
        </Modal>
      )}

      {active && mode === 'reject' && (
        <Modal title="Reject Application" onClose={() => setMode('review')}>
          <div className="field"><label>Rejection Reason (required)</label><textarea rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. Address proof document is unclear..." /></div>
          <p className="help" style={{ marginBottom: 14 }}>✉️ This reason will be sent automatically to the citizen via Email &amp; SMS.</p>
          <button className="btn btn-danger btn-block" disabled={busy} onClick={reject}>Confirm Rejection</button>
        </Modal>
      )}

      {viewingDoc && (
        <Modal title={viewingDoc.documentType} onClose={() => setViewingDoc(null)}>
          <img src={viewingDoc.fileUrl} alt={viewingDoc.documentType} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--line)' }} />
        </Modal>
      )}
    </OfficerLayout>
  );
}
