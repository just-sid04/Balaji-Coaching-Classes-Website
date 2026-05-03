import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password: form.password });
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Invalid or missing reset token.</p>
        <Link to="/forgot-password" className="btn btn-primary">Request New Link</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', animation: 'slideUp 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: '0 auto 1rem' }}>B</div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Enter your new password</p>
        </div>
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">New Password</label>
              <input type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
