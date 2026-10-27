import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminApi, catalogApi } from '../../api';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';

const ROLES = ['VAO', 'RI', 'TAHSILDAR', 'DEPARTMENT_OFFICER', 'FIELD_OFFICER', 'GRIEVANCE_OFFICER'];

const EMPTY_FORM = {
  name: '', email: '', phone: '', role: 'VAO', departmentId: '',
  district: '', taluk: '', ward: '', officeAddress: '',
};

export default function ManageOfficers() {
  const toast = useToast();
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null); // credential reveal after creation

  const load = (role) => {
    setLoading(true);
    adminApi.listOfficers(role || undefined).then((r) => setOfficers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    catalogApi.listDepartments().then((r) => setDepartments(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(roleFilter); /* eslint-disable-next-line */ }, [roleFilter]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submitCreate = async (e) => {
    e.preventDefault();
    if (form.role === 'FIELD_OFFICER' && !form.ward.trim()) {
      toast('Ward is required for a Field Officer.', 'bad');
      return;
    }
    setBusy(true);
    try {
      const res = await adminApi.createOfficer(form);
      setCreated(res.data);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      load(roleFilter);
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (o) => {
    try {
      if (o.active) await adminApi.deactivateOfficer(o.officerId);
      else await adminApi.activateOfficer(o.officerId);
      toast(o.active ? 'Officer deactivated' : 'Officer activated');
      load(roleFilter);
    } catch (err) {
      toast(err.message, 'bad');
    }
  };

  const resetPassword = async (o) => {
    try {
      const res = await adminApi.resetPassword(o.officerId);
      toast('New temporary password generated');
      setCreated({
        employeeId: o.employeeId, temporaryPassword: res.data.temporaryPassword,
        name: o.name, role: o.role,
        emailPreview: `New temporary password for ${o.name}: ${res.data.temporaryPassword}`,
        smsPreview: `JanSeva: Your password was reset. Temp password: ${res.data.temporaryPassword}`,
      });
    } catch (err) {
      toast(err.message, 'bad');
    }
  };

  return (
    <AdminLayout>
      <div className="dash-head">
        <div><h1>Manage Officers</h1><div className="sub">Officers are never self-registered — every account is created here.</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Add Officer</button>
      </div>

      <div className="pillrow" style={{ marginBottom: 16 }}>
        <button className={`tag ${roleFilter === '' ? 'active' : ''}`} style={roleFilter === '' ? { background: 'var(--navy)', color: '#fff' } : {}} onClick={() => setRoleFilter('')}>All Roles</button>
        {ROLES.map((r) => (
          <button key={r} className="tag" style={roleFilter === r ? { background: 'var(--navy)', color: '#fff' } : {}} onClick={() => setRoleFilter(r)}>{r.replaceAll('_', ' ')}</button>
        ))}
      </div>

      {loading ? (
        <div className="center-loading">Loading officers…</div>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Employee ID</th><th>Name</th><th>Role</th><th>Department</th><th>Jurisdiction</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {officers.map((o) => (
                <tr key={o.officerId}>
                  <td className="mono">{o.employeeId}</td>
                  <td>{o.name}</td>
                  <td>{o.role.replaceAll('_', ' ')}</td>
                  <td>{o.department?.departmentName || '—'}</td>
                  <td>{[o.district, o.taluk, o.ward].filter(Boolean).join(' / ') || '—'}</td>
                  <td><span className={`status-pill ${o.active ? 'sp-ok' : 'sp-bad'}`}>{o.active ? 'Active' : 'Inactive'}</span></td>
                  <td className="pillrow">
                    <button className="btn btn-outline btn-sm" onClick={() => resetPassword(o)}>Reset Password</button>
                    <button className={`btn btn-sm ${o.active ? 'btn-danger' : 'btn-green'}`} onClick={() => toggleActive(o)}>{o.active ? 'Deactivate' : 'Activate'}</button>
                  </td>
                </tr>
              ))}
              {officers.length === 0 && <tr><td colSpan={7} className="empty-state">No officers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <Modal title="Add Officer" onClose={() => setShowCreate(false)}>
          <form onSubmit={submitCreate}>
            <div className="field"><label>Officer Name</label><input value={form.name} onChange={set('name')} required /></div>
            <div className="field-row">
              <div className="field"><label>Email</label><input type="email" value={form.email} onChange={set('email')} /></div>
              <div className="field"><label>Mobile Number</label><input value={form.phone} onChange={set('phone')} required /></div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={set('role')}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replaceAll('_', ' ')}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Department</label>
                <select value={form.departmentId} onChange={set('departmentId')} required>
                  <option value="">Select…</option>
                  {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                </select>
              </div>
            </div>
            {form.role === 'DEPARTMENT_OFFICER' && (
              <div className="help" style={{ marginBottom: 10 }}>
                Each department has one dedicated Department Officer who verifies Field Officer resolutions and closes complaints.
              </div>
            )}
            {form.role === 'FIELD_OFFICER' && (
              <div className="help" style={{ marginBottom: 10 }}>
                This officer will receive complaints only from the selected department and selected ward.
              </div>
            )}
            <div className="field-row">
              <div className="field"><label>District</label><input value={form.district} onChange={set('district')} /></div>
              <div className="field"><label>Taluk</label><input value={form.taluk} onChange={set('taluk')} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Ward (optional)</label><input value={form.ward} onChange={set('ward')} /></div>
              <div className="field"><label>Office Address</label><input value={form.officeAddress} onChange={set('officeAddress')} /></div>
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create Account'}</button>
          </form>
        </Modal>
      )}

      {created && (
        <Modal title="Officer Account Created" onClose={() => setCreated(null)}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--ok-tint)', color: 'var(--ok)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 24 }}>✓</div>
            <b>{created.name}</b> — {created.role?.replaceAll('_', ' ')}
          </div>
          <div className="field"><label>Employee ID (Username)</label><div className="mono card" style={{ padding: 10 }}>{created.employeeId}</div></div>
          <div className="field"><label>Temporary Password</label><div className="mono card" style={{ padding: 10 }}>{created.temporaryPassword}</div></div>
          <p className="help" style={{ marginBottom: 14 }}>
            ✉️ Sent via Email &amp; SMS. The officer must verify OTP and set a new password on first login.
          </p>
          <details style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 14 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Preview notification content</summary>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8, background: 'var(--paper)', padding: 10, borderRadius: 8 }}>{created.emailPreview}</pre>
          </details>
          <button className="btn btn-primary btn-block" onClick={() => setCreated(null)}>Done</button>
        </Modal>
      )}
    </AdminLayout>
  );
}
