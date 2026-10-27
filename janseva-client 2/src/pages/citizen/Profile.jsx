import { useEffect, useState } from 'react';
import CitizenLayout from './CitizenLayout';
import { citizenApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';

const LANGUAGES = [
  ['en', 'English'],
  ['ta', 'தமிழ் (Tamil)'],
  ['hi', 'हिन्दी (Hindi)'],
];

export default function Profile() {
  const { updateUserName } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    citizenApi.me().then((r) => { setProfile(r.data); setForm(r.data); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const startEdit = () => { setForm(profile); setEditing(true); };
  const cancelEdit = () => { setForm(profile); setEditing(false); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await citizenApi.updateMe(form);
      setProfile(res.data);
      setForm(res.data);
      updateUserName(res.data.fullName);
      setEditing(false);
      toast('Profile updated successfully');
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <CitizenLayout><div className="center-loading">Loading profile…</div></CitizenLayout>;
  }

  return (
    <CitizenLayout>
      <div className="dash-head">
        <div><h1>My Profile</h1><div className="sub">View and update your account details</div></div>
        {!editing && <button className="btn btn-primary btn-sm" onClick={startEdit}>✎ Edit Profile</button>}
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        {!editing ? (
          <>
            <Row label="Full Name">{profile.fullName}</Row>
            <Row label="Mobile Number">{profile.mobile}</Row>
            <Row label="Email">{profile.email || '—'}</Row>
            <Row label="Address">{profile.address || '—'}</Row>
            <Row label="District">{profile.district || '—'}</Row>
            <Row label="Ward">{profile.ward || '—'}</Row>
            <Row label="Preferred Language">{LANGUAGES.find(([c]) => c === profile.languagePreference)?.[1] || profile.languagePreference}</Row>
            <Row label="Status"><span className={`status-pill ${profile.status === 'ACTIVE' ? 'sp-ok' : 'sp-bad'}`}>{profile.status}</span></Row>
          </>
        ) : (
          <form onSubmit={save}>
            <div className="field"><label>Full Name</label><input value={form.fullName} onChange={set('fullName')} required /></div>
            <div className="field">
              <label>Mobile Number</label>
              <input value={profile.mobile} disabled />
              <div className="help">Mobile number is your login ID and can't be changed here.</div>
            </div>
            <div className="field"><label>Email</label><input type="email" value={form.email || ''} onChange={set('email')} /></div>
            <div className="field"><label>Address</label><textarea rows={2} value={form.address || ''} onChange={set('address')} /></div>
            <div className="field-row">
              <div className="field"><label>District</label><input value={form.district || ''} onChange={set('district')} /></div>
              <div className="field"><label>Ward</label><input value={form.ward || ''} onChange={set('ward')} /></div>
            </div>
            <div className="field">
              <label>Preferred Language</label>
              <select value={form.languagePreference || 'en'} onChange={set('languagePreference')}>
                {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline btn-block" onClick={cancelEdit}>Cancel</button>
              <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        )}
      </div>
    </CitizenLayout>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ fontSize: 13, padding: '10px 0', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--slate)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{children}</span>
    </div>
  );
}
