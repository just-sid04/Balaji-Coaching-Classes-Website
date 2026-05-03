import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', animation: 'slideUp 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: '0 auto 1rem' }}>B</div>
          </Link>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {sent ? 'Email Sent!' : 'Forgot Password'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {sent ? `We sent a reset link to ${email}` : 'Enter your email to receive a reset link'}
          </p>
        </div>
        <div className="card" style={{ padding: '2rem' }}>
          {!sent ? (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="label">Email Address</label>
                <input type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Check your inbox and spam folder. The link expires in 1 hour.
              </p>
              <button onClick={() => setSent(false)} className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
                Resend Email
              </button>
            </div>
          )}
          <div className="divider" />
          <Link to="/login" style={{ display: 'block', textAlign: 'center', color: '#f97316', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
