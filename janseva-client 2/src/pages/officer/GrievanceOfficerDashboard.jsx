import { useEffect, useState } from 'react';
import OfficerLayout from './OfficerLayout';
import { grievanceApi, catalogApi, adminApi } from '../../api';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import StatusPill from '../../components/StatusPill';

export default function GrievanceOfficerDashboard() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [departmentId, setDepartmentId] = useState('');
  const [fieldOfficerId, setFieldOfficerId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    grievanceApi.listAll().then((r) => setList(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    catalogApi.listDepartments().then((r) => setDepartments(r.data)).catch(() => {});
    adminApi.listOfficers('FIELD_OFFICER').then((r) => setFieldOfficers(r.data)).catch(() => {});
  }, []);

  const total = list.length;
  const closed = list.filter((g) => g.status === 'CLOSED').length;
  const highPriority = list.filter((g) => g.priority === 'HIGH').length;
  const slaCompliance = total ? Math.round((closed / total) * 100) : 0;

  const openReassign = (g) => {
    setActive(g);
    setDepartmentId(g.assignedDepartment?.departmentId || '');
    setFieldOfficerId(g.assignedFieldOfficer?.officerId || '');
    setRemarks('');
  };

  const reassign = async () => {
    setBusy(true);
    try {
      await grievanceApi.reassign(active.grievanceId, {
        departmentId: departmentId || null,
        fieldOfficerId: fieldOfficerId || null,
        remarks,
      });
      toast('Grievance reassigned');
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
      <div className="dash-head">
        <div><h1>Grievance Oversight</h1><div className="sub">District-wide SLA monitoring &amp; AI verification</div></div>
      </div>

      <div className="mini-stats">
        <div className="mini-stat"><div className="n">{total}</div><div className="l">Total Grievances</div></div>
        <div className="mini-stat ok"><div className="n">{slaCompliance}%</div><div className="l">Closed Rate</div></div>
        <div className="mini-stat danger"><div className="n">{highPriority}</div><div className="l">High Priority</div></div>
        <div className="mini-stat ok"><div className="n">{closed}</div><div className="l">Closed</div></div>
      </div>

      {loading ? (
        <div className="center-loading">Loading…</div>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Complaint ID</th><th>Department</th><th>Priority</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.grievanceId}>
                  <td className="mono">{g.grievanceId}</td>
                  <td>{g.assignedDepartment?.departmentName || '—'}</td>
                  <td>
                    <span className="tag" style={{ background: g.priority === 'HIGH' ? 'var(--danger-tint)' : 'var(--warn-tint)', color: g.priority === 'HIGH' ? 'var(--danger)' : 'var(--warn)' }}>
                      {g.priority || '—'}
                    </span>
                  </td>
                  <td><StatusPill status={g.status} /></td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => openReassign(g)}>Reassign</button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="empty-state">No grievances yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <Modal title={`Reassign ${active.grievanceId}`} onClose={() => setActive(null)}>
          <div className="field">
            <label>Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">— Keep current —</option>
              {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Field Officer</label>
            <select value={fieldOfficerId} onChange={(e) => setFieldOfficerId(e.target.value)}>
              <option value="">— Keep current —</option>
              {fieldOfficers.map((o) => <option key={o.officerId} value={o.officerId}>{o.name} ({o.employeeId})</option>)}
            </select>
          </div>
          <div className="field"><label>Remarks</label><textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Reason for reassignment" /></div>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={reassign}>Confirm Reassignment</button>
        </Modal>
      )}
    </OfficerLayout>
  );
}
