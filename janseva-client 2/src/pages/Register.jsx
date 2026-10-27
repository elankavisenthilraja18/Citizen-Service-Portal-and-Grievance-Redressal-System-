import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth, ROLE_HOME } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import Seal from '../components/Seal';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '', mobile: '', email: '', password: '', confirmPassword: '',
    district: '', ward: '', languagePreference: 'en',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.registerCitizen(form);
      login(res.data);
      toast('Account created successfully');
      navigate(ROLE_HOME.CITIZEN, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 18 }}><Seal size={46} /></div>
        <div className="auth-tabs">
          <button className="auth-tab" onClick={() => navigate('/login')}>Login</button>
          <button className="auth-tab active">Register</button>
        </div>
        <form onSubmit={submit}>
          <h2 style={{ fontSize: 19, marginBottom: 4 }}>Create your account</h2>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 18 }}>Citizens only — officials are provisioned by the Administrator.</p>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label>Full Name</label>
            <input value={form.fullName} onChange={set('fullName')} placeholder="As per Aadhaar" required />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Mobile Number</label>
              <input value={form.mobile} onChange={set('mobile')} placeholder="9876543210" required pattern="\d{10}" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="name@email.com" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>District</label>
              <input value={form.district} onChange={set('district')} placeholder="Coimbatore" />
            </div>
            <div className="field">
              <label>Ward</label>
              <input value={form.ward} onChange={set('ward')} placeholder="Ward 14" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required minLength={6} />
            </div>
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</button>
        </form>
      </div>
    </div>
  );
}
