import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getAnalytics()
      .then(r => setAnalytics(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const stats = [
    { label: 'Tests Taken', value: analytics?.totalTests || 0, icon: '📝', color: '#3b82f6' },
    { label: 'Avg Score', value: analytics?.avgScore ? `${analytics.avgScore.toFixed(1)}` : '—', icon: '🎯', color: '#f97316' },
    { label: 'Avg Accuracy', value: analytics?.avgAccuracy ? `${analytics.avgAccuracy.toFixed(1)}%` : '—', icon: '✅', color: '#22c55e' },
  ];

  const recent = analytics?.trend?.slice(-5).reverse() || [];

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(234,88,12,0.05))',
        border: '1px solid rgba(249,115,22,0.15)',
        borderRadius: '16px', padding: '1.75rem 2rem',
        marginBottom: '2rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <h1 style={{ fontFamily: 'Poppins', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          {greet()}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {analytics?.totalTests > 0
            ? `You've completed ${analytics.totalTests} test${analytics.totalTests > 1 ? 's' : ''}. Keep pushing forward!`
            : "Ready to start your exam preparation? Take your first test now!"}
        </p>
        <button onClick={() => navigate('/student/tests')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Browse Tests →
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ width: 40, height: 40, background: `${s.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '0.875rem', border: `1px solid ${s.color}25` }}>{s.icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'Poppins' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Recent attempts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Performance</h2>
            <button onClick={() => navigate('/student/history')} className="btn btn-secondary btn-sm">View All</button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '1rem' }}>No tests attempted yet</p>
              <button onClick={() => navigate('/student/tests')} className="btn btn-primary btn-sm">Start Now</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recent.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: t.percentage >= 60 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: t.percentage >= 60 ? '#22c55e' : '#ef4444', fontSize: '0.875rem', flexShrink: 0 }}>
                    {t.percentage}%
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.testTitle}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{t.score}/{t.totalMarks} marks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: '📝 Browse JEE Tests', action: () => navigate('/student/tests?category=JEE') },
              { label: '🧬 Browse NEET Tests', action: () => navigate('/student/tests?category=NEET') },
              { label: '📐 Browse MHT-CET Tests', action: () => navigate('/student/tests?category=MHT-CET') },
              { label: '📊 View My Analytics', action: () => navigate('/student/analytics') },
              { label: '📋 My Attempt History', action: () => navigate('/student/history') },
              { label: '💬 Submit Feedback', action: () => navigate('/student/feedback') },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action} className="btn btn-secondary" style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
