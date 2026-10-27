import { useEffect, useState } from 'react';
import OfficerLayout from './OfficerLayout';
import { grievanceApi } from '../../api';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import StatusPill from '../../components/StatusPill';
import ImageUploadField from '../../components/ImageUploadField';
import { getCurrentPosition } from '../../utils/files';

const PRIORITY_STYLE = {
  HIGH: { background: 'var(--danger-tint)', color: 'var(--danger)' },
  MEDIUM: { background: 'var(--warn-tint)', color: 'var(--warn)' },
  LOW: { background: 'var(--ok-tint)', color: 'var(--ok)' },
};

export default function FieldOfficerDashboard() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [geo, setGeo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState(null); // citizen's reported-issue photo, viewed full-size

  const load = () => {
    setLoading(true);
    grievanceApi.myFieldTasks().then((r) => setTasks(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openTask = (t) => {
    setActive(t);
    setRemarks('');
    setExpectedDate('');
    setPhoto(null);
    setPhotoError('');
    setGeo(null);
  };

  const capturePhoto = async (dataUrl) => {
    setPhoto(dataUrl);
    setPhotoError('');
    const pos = await getCurrentPosition();
    setGeo(pos);
  };

  const submitUpdate = async (markResolved) => {
    if (!photo) {
      setPhotoError(markResolved ? 'A geo-tagged photo is required to mark this resolved' : 'Please upload a visit photo');
      return;
    }
    setBusy(true);
    try {
      await grievanceApi.fieldUpdate(active.grievanceId, {
        remarks, photoUrl: photo,
        expectedCompletionDate: expectedDate || null, markResolved,
      });
      toast(markResolved ? 'Marked resolved — sent for department review' : 'Field update recorded');
      setActive(null);
      load();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OfficerLayout>
      <div className="dash-head"><div><h1>My Assigned Complaints</h1><div className="sub">Field visits, geo-tagged updates &amp; resolutions</div></div></div>

      {loading ? (
        <div className="center-loading">Loading…</div>
      ) : (
        <div className="grid grid-2">
          {tasks.map((t) => (
            <div key={t.grievanceId} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
                <b style={{ fontSize: 14 }}>{t.title}</b>
                <StatusPill status={t.status} />
              </div>

              <div className="pillrow" style={{ marginBottom: 10 }}>
                <span className="tag">{t.category?.categoryName || 'Uncategorized'}</span>
                {t.priority && <span className="tag" style={PRIORITY_STYLE[t.priority]}>{t.priority} priority</span>}
              </div>

              {t.description && (
                <p style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 10, lineHeight: 1.5 }}>
                  {t.description}
                </p>
              )}

              <div className="mono" style={{ fontSize: 11.5, color: 'var(--slate)', marginBottom: 10 }}>
                {t.grievanceId} · 📍 {t.area}{t.ward ? `, ${t.ward}` : ''}
                {t.geoLat && t.geoLng && (
                  <> · <a href={`https://www.google.com/maps?q=${t.geoLat},${t.geoLng}`} target="_blank" rel="noreferrer" style={{ color: 'var(--navy)' }}>Open in Maps</a></>
                )}
              </div>

              {t.citizen && (
                <div style={{ fontSize: 12, marginBottom: 10, background: 'var(--paper)', padding: '7px 10px', borderRadius: 8 }}>
                  👤 Reported by <b>{t.citizen.fullName}</b>{t.citizen.mobile ? ` · ${t.citizen.mobile}` : ''}
                </div>
              )}

              {t.photoUrl && (
                <button
                  onClick={() => setZoomPhoto(t.photoUrl)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 12 }}
                >
                  <img src={t.photoUrl} alt="Reported issue" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line-strong)' }} />
                  <span style={{ fontSize: 11.5, color: 'var(--navy)', fontWeight: 600 }}>📷 View citizen's photo</span>
                </button>
              )}

              <button className="btn btn-outline btn-block" onClick={() => openTask(t)}>📷 Update Field Visit</button>
            </div>
          ))}
          {tasks.length === 0 && <div className="empty-state">No complaints assigned to you right now.</div>}
        </div>
      )}

      {active && (
        <Modal title="Field Visit Update" onClose={() => setActive(null)}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 14 }}>{active.grievanceId} · {active.title}</div>

          <ImageUploadField
            label="Geo-tagged Visit Photo"
            value={photo}
            onChange={capturePhoto}
            error={photoError}
            hint="Click to capture a photo at the site"
          />
          {geo && <div className="help" style={{ marginBottom: 10 }}>📍 Location tagged: {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</div>}

          <div className="field"><label>Remarks</label><textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Describe work carried out..." /></div>
          <div className="field"><label>Expected Completion Date</label><input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-block" disabled={busy} onClick={() => submitUpdate(false)}>Save Update</button>
            <button className="btn btn-green btn-block" disabled={busy} onClick={() => submitUpdate(true)}>✓ Mark Resolved</button>
          </div>
        </Modal>
      )}

      {zoomPhoto && (
        <Modal title="Citizen's Reported Photo" onClose={() => setZoomPhoto(null)}>
          <img src={zoomPhoto} alt="Reported issue full size" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--line)' }} />
        </Modal>
      )}
    </OfficerLayout>
  );
}