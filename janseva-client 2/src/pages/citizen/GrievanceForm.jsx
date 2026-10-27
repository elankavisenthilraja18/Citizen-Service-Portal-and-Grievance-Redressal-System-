import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CitizenLayout from './CitizenLayout';
import { catalogApi, grievanceApi } from '../../api';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import ImageUploadField from '../../components/ImageUploadField';
import { getCurrentPosition } from '../../utils/files';

const AI_STEPS = [
  'Analyzing complaint description…',
  'Analyzing uploaded photo…',
  'Confirming category & correct department…',
  'Assigning nearest available field officer for your ward…',
  'Predicting complaint priority…',
  'Checking for duplicate complaints nearby…',
];

export default function GrievanceForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [step, setStep] = useState(location.state?.categoryId ? 2 : 1);
  const [categoryId, setCategoryId] = useState(location.state?.categoryId || null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [ward, setWard] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [geo, setGeo] = useState(null); // {lat, lng} or null
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiStepIndex, setAiStepIndex] = useState(-1);
  const [result, setResult] = useState(null);

  useEffect(() => { catalogApi.listGrievanceCategories().then((r) => setCategories(r.data)); }, []);

  const selectedCategory = categories.find((c) => c.categoryId === categoryId);

  const capturePhoto = async (dataUrl) => {
    setPhoto(dataUrl);
    setPhotoError('');
    // Tag the photo's capture moment with the device's current location, if allowed.
    setLocating(true);
    const pos = await getCurrentPosition();
    setGeo(pos);
    setLocating(false);
  };

  const submit = async () => {
    if (!photo) { setPhotoError('A geo-tagged photo is required as proof'); toast('Please upload a photo of the issue', 'bad'); return; }
    setSubmitting(true);
    setStep(3);
    setAiStepIndex(0);
    const interval = setInterval(() => {
      setAiStepIndex((i) => (i < AI_STEPS.length - 1 ? i + 1 : i));
    }, 550);
    try {
      const res = await grievanceApi.submit({
        categoryId, title, description, area, ward,
        geoLat: geo?.lat ?? null, geoLng: geo?.lng ?? null, photoUrl: photo,
      });
      setTimeout(() => { clearInterval(interval); setResult(res.data); }, AI_STEPS.length * 550 + 400);
    } catch (err) {
      clearInterval(interval);
      toast(err.message, 'bad');
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CitizenLayout>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/citizen')}>← Back to Dashboard</button>
      <div className="dash-head"><div><h1>Register a Grievance</h1><div className="sub">Step {Math.min(step, 3)} of 3</div></div></div>
      <div style={{ height: 7, background: 'var(--paper-deep)', borderRadius: 99, marginBottom: 26, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(step, 3) * 33}%`, height: '100%', background: 'linear-gradient(90deg,var(--green),var(--navy))' }} />
      </div>

      {step === 1 && (
        <>
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Select the department / category</h3>
          <div className="svc-grid">
            {categories.map((c) => (
              <button key={c.categoryId} className="svc-tile" onClick={() => { setCategoryId(c.categoryId); setStep(2); }}>
                <div className="si" style={{ background: 'var(--green-tint)', color: 'var(--green-deep)' }}>⚠️</div>
                <h4>{c.categoryName}</h4>
                {c.defaultDepartment && <div className="sla">🏢 {c.defaultDepartment.departmentName}</div>}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && selectedCategory && (
        <div className="card" style={{ maxWidth: 620 }}>
          <h3 style={{ fontSize: 15, marginBottom: 2 }}>{selectedCategory.categoryName}</h3>
          {selectedCategory.defaultDepartment && (
            <p className="help" style={{ marginBottom: 12 }}>This will be raised with <b>{selectedCategory.defaultDepartment.departmentName}</b>.</p>
          )}
          <p style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 16 }}>Describe the issue in detail — this helps our AI route it accurately.</p>
          <div className="field"><label>Complaint Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Large pothole near bus stop" required /></div>
          <div className="field"><label>Description</label><textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue, its severity, and how long it has persisted..." required /></div>
          <div className="field-row">
            <div className="field"><label>Area</label><input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Anna Nagar" /></div>
            <div className="field"><label>Ward</label><input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="e.g. Ward 14" /></div>
          </div>

          <ImageUploadField
            label="Geo-tagged Photo (proof of the issue)"
            value={photo}
            onChange={capturePhoto}
            error={photoError}
            hint="Click to capture / upload a photo of the issue"
          />
          {locating && <div className="help">📍 Reading your device location…</div>}
          {geo && <div className="help">📍 Location tagged: {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</div>}
          {!locating && !geo && photo && <div className="help">📍 Location unavailable — complaint will still be submitted using the area/ward you entered above.</div>}

          <button className="btn btn-green btn-block" style={{ marginTop: 12 }} disabled={!title || !description || submitting} onClick={submit}>📨 Submit Complaint</button>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: 'linear-gradient(135deg, var(--navy-deep), var(--navy))', color: '#fff', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, marginBottom: 14 }}>
            ✨ AI is processing your complaint…
          </div>
          {AI_STEPS.slice(0, aiStepIndex + 1).map((s) => (
            <div key={s} style={{ display: 'flex', gap: 10, fontSize: 13, padding: '6px 0' }}>
              <span style={{ color: 'var(--gold)' }}>✓</span> {s}
            </div>
          ))}
        </div>
      )}

      {result && (
        <Modal title="" onClose={() => navigate(`/citizen/complaints/${result.grievanceId}`)}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ok-tint)', color: 'var(--ok)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>✓</div>
            <h3 style={{ marginBottom: 6 }}>Complaint Registered!</h3>
            <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 6 }}>
              Priority: <b>{result.priority}</b> {result.assignedFieldOfficer && <>· Assigned to <b>{result.assignedFieldOfficer.name}</b></>}
            </p>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, background: 'var(--paper-deep)', padding: 10, borderRadius: 10, margin: '10px 0 18px' }}>{result.grievanceId}</div>
            <button className="btn btn-primary btn-block" onClick={() => navigate(`/citizen/complaints/${result.grievanceId}`)}>Track this Complaint</button>
          </div>
        </Modal>
      )}
    </CitizenLayout>
  );
}
