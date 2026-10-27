import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useToast } from '../components/Toast';
import Seal from '../components/Seal';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: request OTP, 2: enter OTP + new password
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const requestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ identifier });
      // Backend always returns the same generic message whether or not the
      // account exists, so this toast is accurate either way.
      toast('If an account exists for that mobile number or email, an OTP has been sent.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ identifier, otp, newPassword, confirmPassword });
      toast('Password reset successfully — please log in');
      navigate('/login', { replace: true });
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

        {step === 1 && (
          <form onSubmit={requestOtp}>
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>Forgot your password?</h2>
            <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 18 }}>
              Enter the mobile number or email on your JanSeva account. We'll send an OTP to reset your password.
            </p>
            {error && <div className="error-box">{error}</div>}
            <div className="field">
              <label>Email or Mobile Number</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@email.com or 9876543210"
                required
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--slate)', marginTop: 16 }}>
              <a onClick={() => navigate('/login')} style={{ color: 'var(--navy)', fontWeight: 700, cursor: 'pointer' }}>
                ← Back to login
              </a>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword}>
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>Reset your password</h2>
            <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 18 }}>
              Enter the OTP sent for <b>{identifier}</b> along with your new password. The OTP is valid for 15 minutes.
            </p>
            {error && <div className="error-box">{error}</div>}
            <div className="field">
              <label>Enter OTP</label>
              <input
                className="mono"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                maxLength={6}
                required
              />
            </div>
            <div className="field">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <p className="help">
                At least 8 characters, with an uppercase letter, a lowercase letter, a digit, and a special character.
              </p>
            </div>
            <div className="field">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 8 }}
              onClick={() => setStep(1)}
            >
              ← Use a different mobile/email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}