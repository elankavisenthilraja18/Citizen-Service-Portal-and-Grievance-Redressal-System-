import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { catalogApi } from '../../api';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';

export default function ManageCatalog() {
  const toast = useToast();
  const [tab, setTab] = useState('services');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const loadAll = () => {
    catalogApi.listServices().then((r) => setServices(r.data));
    catalogApi.listGrievanceCategories().then((r) => setCategories(r.data));
    catalogApi.listDepartments().then((r) => setDepartments(r.data));
  };

  useEffect(() => { loadAll(); }, []);

  return (
    <AdminLayout>
      <div className="dash-head">
        <div><h1>Services &amp; Grievance Categories</h1><div className="sub">Manage the citizen-facing catalog</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add {tab === 'services' ? 'Service' : tab === 'categories' ? 'Category' : 'Department'}</button>
      </div>

      <div className="auth-tabs" style={{ maxWidth: 480, marginBottom: 22 }}>
        <button className={`auth-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>Services</button>
        <button className={`auth-tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>Grievance Categories</button>
        <button className={`auth-tab ${tab === 'departments' ? 'active' : ''}`} onClick={() => setTab('departments')}>Departments</button>
      </div>

      {tab === 'services' && (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Service</th><th>Department</th><th>SLA</th><th>Documents</th></tr></thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.serviceId}>
                  <td>{s.serviceName}</td>
                  <td>{s.department?.departmentName || '—'}</td>
                  <td>{s.slaDays} days</td>
                  <td style={{ maxWidth: 320, whiteSpace: 'normal' }}>{s.requiredDocuments}</td>
                </tr>
              ))}
              {services.length === 0 && <tr><td colSpan={4} className="empty-state">No services yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'categories' && (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Category</th><th>Default Department</th><th>SLA</th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.categoryId}>
                  <td>{c.categoryName}</td>
                  <td>{c.defaultDepartment?.departmentName || '—'}</td>
                  <td>{c.slaDays} days</td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={3} className="empty-state">No categories yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'departments' && (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Department</th><th>Contact Email</th></tr></thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.departmentId}>
                  <td>{d.departmentName}</td>
                  <td>{d.contactEmail}</td>
                </tr>
              ))}
              {departments.length === 0 && <tr><td colSpan={2} className="empty-state">No departments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddModal
          tab={tab}
          departments={departments}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); loadAll(); toast('Added successfully'); }}
          onError={(m) => toast(m, 'bad')}
        />
      )}
    </AdminLayout>
  );
}

function AddModal({ tab, departments, onClose, onCreated, onError }) {
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [sla, setSla] = useState(7);
  const [docs, setDocs] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === 'services') {
        await catalogApi.createService({
          serviceName: name, department: departmentId ? { departmentId } : null,
          slaDays: Number(sla), requiredDocuments: docs, feeAmount: 0, isActive: true,
        });
      } else if (tab === 'categories') {
        await catalogApi.createGrievanceCategory({
          categoryName: name, defaultDepartment: departmentId ? { departmentId } : null, slaDays: Number(sla),
        });
      } else {
        await catalogApi.createDepartment({ departmentName: name, contactEmail: docs });
      }
      onCreated();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const titleMap = { services: 'Add Service', categories: 'Add Grievance Category', departments: 'Add Department' };

  return (
    <Modal title={titleMap[tab]} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        {tab !== 'departments' && (
          <>
            <div className="field">
              <label>Department</label>
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">Select…</option>
                {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
              </select>
            </div>
            <div className="field"><label>SLA (days)</label><input type="number" min={1} value={sla} onChange={(e) => setSla(e.target.value)} /></div>
          </>
        )}
        <div className="field">
          <label>{tab === 'services' ? 'Required Documents (comma-separated)' : tab === 'departments' ? 'Contact Email' : 'Notes'}</label>
          <input value={docs} onChange={(e) => setDocs(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </Modal>
  );
}
