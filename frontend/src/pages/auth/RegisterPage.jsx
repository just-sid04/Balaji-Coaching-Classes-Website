import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const targetExams = ['JEE', 'NEET', 'MHT-CET', 'Other'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', college: '', targetExam: 'JEE',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        college: form.college,
        targetExam: form.targetExam,
      });
      setSubmitted(true);
      toast.success('Registration successful! Awaiting admin approval.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontFamily: 'Poppins', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: '#22c55e' }}>
            Registration Submitted!
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Your account is pending admin approval. Prof. Ravindra Thakare will review and activate
            your account shortly. You'll be able to log in once approved.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">Go to Login</Link>
            <a href="https://wa.me/919960102201" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ color: '#22c55e' }}>
              WhatsApp for Status
            </a>
          </div>
        </div>
      </div>
    );
  }

  const field = (label, id, props, error) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <label className="label">{label}</label>
      <input id={id} className={`input ${error ? 'input-error' : ''}`} {...props}
        onChange={e => { props.onChange(e); setErrors(ev => ({ ...ev, [id]: '' })); }} />
      {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '520px', animation: 'slideUp 0.5s ease' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 56, height: 56, background: 'linear-gradient(135deg, #f97316, #ea580c)',
              borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: '0 auto 1rem',
            }}>B</div>
          </Link>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Join Shree Balaji Coaching Classes portal
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {errors.general && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.875rem 1rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                {field('Full Name *', 'reg-name', {
                  type: 'text', placeholder: 'Your full name', value: form.name,
                  onChange: e => setForm(f => ({ ...f, name: e.target.value })),
                }, errors.name)}
              </div>
              {field('Email Address *', 'reg-email', {
                type: 'email', placeholder: 'you@example.com', value: form.email,
                onChange: e => setForm(f => ({ ...f, email: e.target.value })),
              }, errors.email)}
              {field('Phone Number', 'reg-phone', {
                type: 'tel', placeholder: '+91 98765 43210', value: form.phone,
                onChange: e => setForm(f => ({ ...f, phone: e.target.value })),
              }, null)}
              {field('Password *', 'reg-password', {
                type: 'password', placeholder: 'Min. 6 characters', value: form.password,
                onChange: e => setForm(f => ({ ...f, password: e.target.value })),
              }, errors.password)}
              {field('Confirm Password *', 'reg-confirm-password', {
                type: 'password', placeholder: 'Re-enter password', value: form.confirmPassword,
                onChange: e => setForm(f => ({ ...f, confirmPassword: e.target.value })),
              }, errors.confirmPassword)}
              <div style={{ gridColumn: '1 / -1' }}>
                {field('College / School', 'reg-college', {
                  type: 'text', placeholder: 'Your institution name (optional)', value: form.college,
                  onChange: e => setForm(f => ({ ...f, college: e.target.value })),
                }, null)}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Target Exam</label>
              <select className="input" value={form.targetExam}
                onChange={e => setForm(f => ({ ...f, targetExam: e.target.value }))}>
                {targetExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            </div>

            <button id="register-submit" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create Account'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#f97316', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          ✅ Account activation requires admin approval
        </div>
      </div>
    </div>
  );
}
