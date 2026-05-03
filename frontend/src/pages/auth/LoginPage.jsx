import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-primary)',
    }}>
      {/* Left Panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0f1629 0%, #0a0e1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '20%',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '20%',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '400px' }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 900, color: 'white',
            margin: '0 auto 1.5rem',
            boxShadow: '0 10px 40px rgba(249,115,22,0.3)',
          }}>B</div>
          <h2 style={{ fontFamily: 'Poppins', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            SHREE BALAJI
          </h2>
          <p style={{ color: '#f97316', fontWeight: 600, letterSpacing: '0.2em', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
            COACHING CLASSES
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Your gateway to cracking JEE, NEET & MHT-CET.
            Practice smarter. Perform better.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
            {['JEE', 'NEET', 'MHT-CET'].map(exam => (
              <span key={exam} className="badge badge-accent">{exam}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        width: '480px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2.5rem',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Sign in to your account to continue
          </p>

          {errors.general && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px',
              padding: '0.875rem 1rem',
              color: '#ef4444',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors({}); }}
                autoComplete="email"
              />
              {errors.email && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label className="label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#f97316', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors({}); }}
                autoComplete="current-password"
              />
              {errors.password && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password}</p>}
            </div>

            <button id="login-submit" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#f97316', fontWeight: 600, textDecoration: 'none' }}>
              Register free
            </Link>
          </p>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(249,115,22,0.05)', borderRadius: '10px', border: '1px solid rgba(249,115,22,0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              By Prof. Ravindra Thakare • Nandurbar, Maharashtra
              <br />
              <a href="https://wa.me/919960102201" target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e' }}>
                WhatsApp Help
              </a>
              {' · '}
              <a href="tel:+919960102201" style={{ color: '#f97316' }}>Call Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
