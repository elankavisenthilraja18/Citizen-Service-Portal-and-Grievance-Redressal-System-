import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CitizenLayout from './CitizenLayout';
import { applicationApi, certificateApi } from '../../api';
import Seal from '../../components/Seal';
import { useToast } from '../../components/Toast';

export default function CertificateView() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [cert, setCert] = useState(null);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([certificateApi.byApplication(applicationId), applicationApi.get(applicationId)])
      .then(([c, a]) => { setCert(c.data); setApp(a.data); })
      .catch((err) => toast(err.message, 'bad'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [applicationId]);

  if (loading) return <CitizenLayout><div className="center-loading">Loading certificate…</div></CitizenLayout>;
  if (!cert || !app) return <CitizenLayout><div className="empty-state">Certificate not found.</div></CitizenLayout>;

  return (
    <CitizenLayout>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }} onClick={() => navigate(`/citizen/applications/${applicationId}`)}>← Back</button>

      <div className="cert">
        <div className="cert-band" />
        <div className="cert-inner">
          <div className="cert-head">
            <Seal size={44} />
            <div>
              <h3>Government of Tamil Nadu</h3>
              <p>{app.service?.serviceName?.toUpperCase()} · {app.service?.department?.departmentName}</p>
            </div>
          </div>
          <div className="cert-grid">
            <Field label="Certificate No."><span className="mono">{cert.certificateNumber}</span></Field>
            <Field label="Date of Issue">{new Date(cert.issueDate).toLocaleDateString('en-IN')}</Field>
            <Field label="Name">{app.citizen?.fullName}</Field>
            <Field label="District">{app.citizen?.district || '—'}</Field>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 6 }}>
            This is to certify that the above-named applicant has been verified and approved under the{' '}
            {app.service?.serviceName} scheme, following due process by the Village Administrative Officer,
            Revenue Inspector and Tahsildar of the concerned jurisdiction.
          </p>
          <div className="cert-footer">
            <div className="qr-box">
              {cert.qrCodeData ? (
                <img src={`data:image/png;base64,${cert.qrCodeData}`} alt="Verification QR" style={{ width: '100%', height: '100%' }} />
              ) : (
                <div style={{ fontSize: 10, color: 'var(--slate)' }}>QR unavailable</div>
              )}
            </div>
            <div className="sign-block">
              <div className="sign-line">{cert.issuedBy?.name}</div>
              <div>Tahsildar (Digitally Signed)</div>
              <div style={{ marginTop: 2 }}>🛡 Verified &amp; Authentic</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <a className="btn btn-primary" href={`data:image/png;base64,${cert.qrCodeData}`} download={`${cert.certificateNumber.replace('/', '_')}.png`}>⬇ Download QR</a>{' '}
        <button className="btn btn-outline" onClick={() => { navigator.clipboard?.writeText(cert.verificationUrl); toast('Verification link copied'); }}>🔗 Copy Verification Link</button>
      </div>
    </CitizenLayout>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ fontSize: 12.5 }}>
      <label style={{ display: 'block', color: 'var(--slate-light)', fontSize: 10.5, textTransform: 'uppercase', marginBottom: 3 }}>{label}</label>
      <span>{children}</span>
    </div>
  );
}
