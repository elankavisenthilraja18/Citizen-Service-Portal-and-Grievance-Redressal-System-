import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth, ROLE_HOME } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import Seal from '../components/Seal';

export default function Login() {
  const [tab, setTab] = useState('citizen'); // citizen | officer
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();

  const goAfterLogin = (jwtResponse) => {
    login(jwtResponse);
    const dest = location.state?.from?.pathname || ROLE_HOME[jwtResponse.role] || '/';
    navigate(dest, { replace: true });
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 18 }}><Seal size={46} /></div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'citizen' ? 'active' : ''}`} onClick={() => setTab('citizen')}>Citizen</button>
          <button className={`auth-tab ${tab === 'officer' ? 'active' : ''}`} onClick={() => setTab('officer')}>Government Official</button>
        </div>
        {tab === 'citizen' ? <CitizenLoginForm onSuccess={goAfterLogin} toast={toast} /> : <OfficerLoginForm onSuccess={goAfterLogin} toast={toast} />}
        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--slate)', marginTop: 16 }}>
          No account? <a onClick={() => navigate('/register')} style={{ color: 'var(--navy)', fontWeight: 700, cursor: 'pointer' }}>Register here</a>
        </p>
      </div>
    </div>
  );
}

function CitizenLoginForm({ onSuccess, toast }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.loginCitizen({ identifier, password });
      toast('Login successful');
      onSuccess(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h2 style={{ fontSize: 19, marginBottom: 4 }}>Welcome back</h2>
      <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 18 }}>Login with your registered mobile number or email.</p>
      {error && <div className="error-box">{error}</div>}
      <div className="field">
        <label>Email or Mobile Number</label>
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="name@email.com or 9876543210" required />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
      </div>
      <p style={{ textAlign: 'right', fontSize: 12.5, marginTop: -8, marginBottom: 14 }}>
        <a onClick={() => navigate('/forgot-password')} style={{ color: 'var(--navy)', fontWeight: 600, cursor: 'pointer' }}>Forgot password?</a>
      </p>
      <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
      <p className="help" style={{ marginTop: 14, textAlign: 'center' }}>Demo: mobile <b>9876543210</b> / password <b>Passw0rd!</b></p>
    </form>
  );
}

function OfficerLoginForm({ onSuccess, toast }) {
  const [step, setStep] = useState(1); // 1: creds, 2: otp, 3: force password change
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingJwt, setPendingJwt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.officerLoginStep1({ identifier, password });
      toast('OTP sent to registered mobile number');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitStep2 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.officerVerifyOtp({ identifier, otp });
      if (res.data.firstLogin) {
        setPendingJwt(res.data);
        setStep(3);
      } else {
        toast('Login successful');
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitStep3 = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('New password and confirm password do not match'); return; }
    setLoading(true);
    try {
      await authApi.changeOfficerPassword({ identifier, newPassword, confirmPassword });
      toast('Password updated — please log in again with your new password');
      setStep(1);
      setPassword('');
      setOtp('');
      setPendingJwt(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {step === 1 && (
        <form onSubmit={submitStep1}>
          <h2 style={{ fontSize: 19, marginBottom: 4 }}>Official Login</h2>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 18 }}>
            Officer accounts are created only by an Administrator. Login with your Employee ID.
          </p>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label>Employee ID</label>
            <input className="mono" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="e.g. VAO20260001" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Verifying…' : 'Continue'}</button>
          <p className="help" style={{ marginTop: 14, textAlign: 'center' }}>Demo: try <b>ADM20260001</b> / <b>VAO20260001</b> / <b>FLD20260001</b> etc, password <b>Passw0rd!</b></p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={submitStep2}>
          <h2 style={{ fontSize: 19, marginBottom: 4 }}>🛡️ Two-Factor Authentication</h2>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 18 }}>
            An OTP has been sent to the registered mobile number. Check the backend console log (demo OTP gateway).
          </p>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label>Enter OTP</label>
            <input className="mono" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} required />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Verifying…' : 'Verify & Continue'}</button>
          <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setStep(1)}>← Back</button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={submitStep3}>
          <h2 style={{ fontSize: 19, marginBottom: 4 }}>Set a New Password</h2>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 18 }}>
            This is your first login, {pendingJwt?.name}. You must set a permanent password before continuing.
          </p>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="field">
            <label>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Saving…' : 'Update Password & Continue'}</button>
        </form>
      )}
    </>
  );
}