import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getFeedback();
      setFeedbacks(r.data.feedbacks);
    } catch { toast.error('Failed to load feedback'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const markRead = async (id) => {
    try {
      await adminAPI.markFeedbackRead(id);
      setFeedbacks(f => f.map(fb => fb.id === id ? { ...fb, isRead: true } : fb));
    } catch { toast.error('Failed to update'); }
  };

  const unread = feedbacks.filter(f => !f.isRead).length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Feedback Management</h1>
        <p className="section-subtitle">{unread} unread message{unread !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      ) : feedbacks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
          <p>No feedback received yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedbacks.map(fb => (
            <div key={fb.id} className="card" style={{
              borderLeft: fb.isRead ? '3px solid var(--border)' : '3px solid #f97316',
              opacity: fb.isRead ? 0.75 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#f97316', fontSize: '0.8rem' }}>
                      {fb.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{fb.user?.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{fb.user?.email}</span>
                    </div>
                    {!fb.isRead && <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>New</span>}
                  </div>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.375rem', fontSize: '0.9rem' }}>{fb.subject}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{fb.message}</p>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(fb.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                  {!fb.isRead && (
                    <button onClick={() => markRead(fb.id)} className="btn btn-secondary btn-sm">✓ Mark Read</button>
                  )}
                  <a href={`mailto:${fb.user?.email}?subject=Re: ${encodeURIComponent(fb.subject)}`} className="btn btn-primary btn-sm">Reply</a>
                  <a href={`https://wa.me/919960102201`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ color: '#22c55e' }}>💬 WA</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
