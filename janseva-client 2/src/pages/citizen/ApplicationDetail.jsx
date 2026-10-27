import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CitizenLayout from './CitizenLayout';
import { applicationApi } from '../../api';
import Timeline from '../../components/Timeline';
import StatusPill from '../../components/StatusPill';
import ImageUploadField from '../../components/ImageUploadField';
import { useToast } from '../../components/Toast';

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [app, setApp] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showResubmit, setShowResubmit] = useState(false);
  const [docFiles, setDocFiles] = useState({});
  const [docErrors, setDocErrors] = useState({});
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([applicationApi.get(id), applicationApi.timeline(id)])
      .then(([a, t]) => { setApp(a.data); setTimeline(t.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const requiredDocs = (app?.service?.requiredDocuments || '').split(',').map((d) => d.trim()).filter(Boolean);

  const setDoc = (name) => (dataUrl) => {
    setDocFiles((f) => ({ ...f, [name]: dataUrl }));
    setDocErrors((e) => ({ ...e, [name]: null }));
  };

  const openResubmit = () => {
    setDocFiles({});
    setDocErrors({});
    setDeclared(false);
    setDeclareError('');
    setShowResubmit(true);
  };

  const resubmit = async () => {
    const missing = requiredDocs.filter((d) => !docFiles[d]);
    if (missing.length > 0) {
      const errs = {};
      missing.forEach((d) => { errs[d] = 'This document is mandatory'; });
      setDocErrors(errs);
      toast(`Please upload: ${missing.join(', ')}`, 'bad');
      return;
    }
    if (!declared) {
      setDeclareError('You must accept the declaration to resubmit');
      return;
    }
    setResubmitting(true);
    try {
      const documents = requiredDocs.map((d) => ({ documentType: d, fileUrl: docFiles[d] }));
      await applicationApi.resubmit(id, {
        serviceId: app.service.serviceId,
        purpose: app.purpose,
        address: app.address,
        documents,
        declarationAccepted: declared,
      });
      toast('Application resubmitted for verification');
      setShowResubmit(false);
      load();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading || !app) {
    return <CitizenLayout><div className="center-loading">Loading…</div></CitizenLayout>;
  }

  return (
    <CitizenLayout>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/citizen/applications')}>← Back to My Applications</button>
      <div className="dash-head">
        <div>
          <h1>{app.service?.serviceName}</h1>
          <div className="sub mono">{app.applicationId} · Submitted {new Date(app.submittedAt).toLocaleDateString('en-IN')}</div>
        </div>
        {app.status === 'CERTIFICATE_READY' && (
          <button className="btn btn-gold" onClick={() => navigate(`/citizen/certificates/${app.applicationId}`)}>⬇ View Certificate</button>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr .9fr', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Application Timeline</h3>
          <Timeline steps={timeline} />
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Applicant Details</h3>
          <Row label="Status"><StatusPill status={app.status} /></Row>
          <Row label="Service">{app.service?.serviceName}</Row>
          <Row label="Purpose">{app.purpose || '—'}</Row>
          <Row label="Address">{app.address || '—'}</Row>
          {app.status === 'REJECTED' && (
            <>
              <div className="error-box" style={{ marginTop: 12 }}>{app.rejectionReason}</div>
              {!showResubmit ? (
                <button className="btn btn-danger btn-block" onClick={openResubmit}>↻ Upload Corrected Documents &amp; Resubmit</button>
              ) : (
                <div style={{ marginTop: 12 }}>
                  {requiredDocs.map((d) => (
                    <ImageUploadField key={d} label={d} value={docFiles[d] || null} onChange={setDoc(d)} error={docErrors[d]} />
                  ))}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 12.5, margin: '10px 0' }}>
                    <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); if (e.target.checked) setDeclareError(''); }} style={{ marginTop: 2, width: 15, height: 15, flexShrink: 0 }} />
                    <span>I hereby declare that the corrected information provided by me is true.</span>
                  </label>
                  {declareError && <div className="help" style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>{declareError}</div>}
                  <button className="btn btn-danger btn-block" disabled={resubmitting} onClick={resubmit}>
                    {resubmitting ? 'Resubmitting…' : 'Confirm Resubmission'}
                  </button>
                </div>
              )}
            </>
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
