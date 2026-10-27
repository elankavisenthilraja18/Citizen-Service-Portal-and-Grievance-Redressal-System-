import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CitizenLayout from './CitizenLayout';
import { catalogApi, applicationApi, citizenApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import ImageUploadField from '../../components/ImageUploadField';

export default function Apply() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [step, setStep] = useState(location.state?.serviceId ? 2 : 1);
  const [serviceId, setServiceId] = useState(location.state?.serviceId || null);
  const [purpose, setPurpose] = useState('');
  const [address, setAddress] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [docFiles, setDocFiles] = useState({}); // { "Aadhaar Card": dataUrl }
  const [docErrors, setDocErrors] = useState({});
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { catalogApi.listServices().then((r) => setServices(r.data)); }, []);

  // Prefill the address from the citizen's saved profile so they don't have
  // to retype it for every application - they can still edit it per-application
  // by unchecking "same as my profile address" below.
  useEffect(() => {
    citizenApi.me().then((r) => {
      const savedAddress = r.data.address || '';
      setProfileAddress(savedAddress);
      if (savedAddress) setAddress(savedAddress);
    }).catch(() => { /* profile fetch failing shouldn't block the application form */ });
  }, []);

  const selectedService = services.find((s) => s.serviceId === serviceId);
  const requiredDocs = (selectedService?.requiredDocuments || '').split(',').map((d) => d.trim()).filter(Boolean);

  const setDoc = (name) => (dataUrl) => {
    setDocFiles((f) => ({ ...f, [name]: dataUrl }));
    setDocErrors((e) => ({ ...e, [name]: null }));
  };

  const submit = async () => {
    // Client-side gate: every required document must be uploaded, and the
    // declaration must be checked - matches the backend's own enforcement,
    // but we validate here first so the citizen gets an immediate, specific error.
    const missing = requiredDocs.filter((d) => !docFiles[d]);
    if (missing.length > 0) {
      const errs = {};
      missing.forEach((d) => { errs[d] = 'This document is mandatory'; });
      setDocErrors(errs);
      toast(`Please upload: ${missing.join(', ')}`, 'bad');
      return;
    }
    if (!declared) {
      setDeclareError('You must accept the declaration to submit');
      toast('Please accept the declaration before submitting', 'bad');
      return;
    }

    setSubmitting(true);
    try {
      const documents = requiredDocs.map((d) => ({ documentType: d, fileUrl: docFiles[d] }));
      const res = await applicationApi.submit({ serviceId, purpose, address, documents, declarationAccepted: declared });
      setResult(res.data);
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CitizenLayout>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/citizen')}>← Back to Dashboard</button>
      <div className="dash-head"><div><h1>Apply for a Service</h1><div className="sub">Step {step} of 3</div></div></div>
      <div style={{ height: 7, background: 'var(--paper-deep)', borderRadius: 99, marginBottom: 26, overflow: 'hidden' }}>
        <div style={{ width: `${step * 33}%`, height: '100%', background: 'linear-gradient(90deg,var(--green),var(--navy))' }} />
      </div>

      {step === 1 && (
        <>
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Select a service</h3>
          <div className="svc-grid">
            {services.map((s) => (
              <button key={s.serviceId} className="svc-tile" onClick={() => { setServiceId(s.serviceId); setStep(2); }}>
                <div className="si">📄</div>
                <h4>{s.serviceName}</h4>
                <div className="sla">⏱ SLA: {s.slaDays} days</div>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && selectedService && (
        <div className="card" style={{ maxWidth: 620 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>👤 {selectedService.serviceName} — Details</h3>
          <div className="field"><label>Full Name</label><input value={user?.name || ''} disabled /></div>
          <div className="field"><label>Purpose of Certificate</label><input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. School admission, loan application" /></div>
          <div className="field">
            <label>Address</label>
            {profileAddress && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, fontSize: 12.5, color: 'var(--slate)', marginBottom: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useProfileAddress}
                  onChange={(e) => {
                    setUseProfileAddress(e.target.checked);
                    if (e.target.checked) setAddress(profileAddress);
                  }}
                  style={{ width: 14, height: 14 }}
                />
                Same as my profile address
              </label>
            )}
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Door No, Street, Village/Town"
              disabled={useProfileAddress && !!profileAddress}
            />
          </div>
          <button className="btn btn-primary btn-block" onClick={() => setStep(3)}>Continue to Documents →</button>
        </div>
      )}

      {step === 3 && selectedService && (
        <div className="card" style={{ maxWidth: 620 }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>⬆ Upload Required Documents</h3>
          <p className="help" style={{ marginBottom: 14 }}>Every document below is mandatory for {selectedService.serviceName}. Upload a clear photo of each.</p>

          {requiredDocs.map((d) => (
            <ImageUploadField
              key={d}
              label={d}
              value={docFiles[d] || null}
              onChange={setDoc(d)}
              error={docErrors[d]}
            />
          ))}

          <div className="field" style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={declared}
                onChange={(e) => { setDeclared(e.target.checked); if (e.target.checked) setDeclareError(''); }}
                style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13 }}>
                I hereby declare that the information provided by me is true, to the best of my knowledge.
              </span>
            </label>
            {declareError && <div className="help" style={{ color: 'var(--danger)', fontWeight: 600, marginTop: 4 }}>{declareError}</div>}
          </div>

          <button className="btn btn-primary btn-block" disabled={submitting} onClick={submit}>
            {submitting ? 'Submitting…' : '📨 Submit Application'}
          </button>
        </div>
      )}

      {result && (
        <Modal title="" onClose={() => navigate(`/citizen/applications/${result.applicationId}`)}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ok-tint)', color: 'var(--ok)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>✓</div>
            <h3 style={{ marginBottom: 6 }}>Application Submitted!</h3>
            <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 14 }}>You'll receive SMS &amp; email updates at every stage.</p>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, background: 'var(--paper-deep)', padding: 10, borderRadius: 10, marginBottom: 18 }}>{result.applicationId}</div>
            <button className="btn btn-primary btn-block" onClick={() => navigate(`/citizen/applications/${result.applicationId}`)}>Track this Application</button>
          </div>
        </Modal>
      )}
    </CitizenLayout>
  );
}