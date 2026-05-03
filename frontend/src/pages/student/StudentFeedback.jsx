import { useState } from 'react';
import { studentAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function StudentFeedback() {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) { toast.error('Subject and message required'); return; }
    setLoading(true);
    try {
      await studentAPI.submitFeedback(form);
      toast.success('Feedback submitted! We will get back to you.');
      setSent(true);
    } catch { toast.error('Failed to submit feedback'); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '4rem', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
      <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, marginBottom: '0.75rem', color: '#22c55e' }}>Feedback Submitted!</h2>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
        Thank you for your feedback! Prof. Ravindra Thakare will review and respond.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => { setForm({ subject: '', message: '' }); setSent(false); }} className="btn btn-secondary">Send Another</button>
        <a href="https://wa.me/919960102201" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ color: 'white' }}>💬 WhatsApp</a>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Feedback & Support</h1>
        <p className="section-subtitle">Share your thoughts, suggestions, or report issues</p>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '1rem' }}>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Subject *</label>
            <input className="input" placeholder="e.g., Question error in JEE Physics test..." value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">Message *</label>
            <textarea className="input" rows={5} placeholder="Describe your feedback, suggestion, or issue in detail..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '📨 Submit Feedback'}
          </button>
        </form>
      </div>

      {/* Direct contact */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Or Reach Us Directly</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href="https://wa.me/919960102201" target="_blank" rel="noopener noreferrer"
            className="btn btn-sm" style={{ flex: 1, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
            💬 WhatsApp: +91 99601 02201
          </a>
          <a href="tel:+919960102201"
            className="btn btn-sm" style={{ flex: 1, background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}>
            📞 Call: +91 99601 02201
          </a>
        </div>
      </div>
    </div>
  );
}
