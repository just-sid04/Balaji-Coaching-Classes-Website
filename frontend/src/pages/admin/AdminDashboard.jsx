import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    Promise.all([
      adminAPI.getDashboard(),
      adminAPI.getUsers({ status: 'PENDING', limit: 5 })
    ])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data);
        setPendingUsers(usersRes.data.users);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const handleApprove = async (id, e) => {
    e.stopPropagation();
    try {
      await adminAPI.updateUserStatus(id, 'ACTIVE');
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      setStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,
        activeStudents: prev.activeStudents + 1
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id, e) => {
    e.stopPropagation();
    try {
      await adminAPI.updateUserStatus(id, 'REJECTED');
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      setStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: '👥', color: '#3b82f6', sub: `${stats?.activeStudents || 0} active` },
    { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: '⏳', color: '#eab308', sub: 'Awaiting review', urgent: stats?.pendingApprovals > 0, action: () => navigate('/admin/users') },
    { label: 'Total Tests', value: stats?.totalTests || 0, icon: '📝', color: '#22c55e', sub: 'All categories', action: () => navigate('/admin/tests') },
    { label: 'Total Attempts', value: stats?.totalAttempts || 0, icon: '✅', color: '#f97316', sub: 'Completed submissions' },
    { label: 'Average Score', value: stats?.averageScore ? `${stats.averageScore}%` : 'N/A', icon: '🎯', color: '#a855f7', sub: 'Across all tests' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">Dashboard Overview</h1>
        <p className="section-subtitle">Welcome to your admin control center</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {statCards.map((s, i) => (
          <div
            key={i}
            className="stat-card"
            onClick={s.action}
            style={{ cursor: s.action ? 'pointer' : 'default' }}
          >
            {s.urgent && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                width: 8, height: 8, borderRadius: '50%',
                background: '#eab308',
                animation: 'pulse-accent 2s ease infinite',
              }} />
            )}
            <div style={{
              width: 44, height: 44,
              background: `${s.color}15`,
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', marginBottom: '1rem',
              border: `1px solid ${s.color}25`,
            }}>
              {s.icon}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Poppins', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {s.value}
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.125rem' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Activity */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Test Attempts</h2>
            <button onClick={() => navigate('/admin/analytics')} className="btn btn-secondary btn-sm">View All</button>
          </div>
          {stats?.recentActivity?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recentActivity.slice(0, 8).map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'rgba(249,115,22,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: '#f97316', fontSize: '0.8rem',
                    }}>
                      {a.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.user?.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{a.test?.title}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-IN') : 'In progress'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No recent activity yet. Create and publish tests to get started!
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Pending Approvals Quick-Action */}
          <div className="card" style={{ border: stats?.pendingApprovals > 0 ? '1px solid #eab308' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⏳ Pending Approvals
                {stats?.pendingApprovals > 0 && (
                  <span className="badge badge-accent" style={{ background: '#eab308', color: '#fff' }}>{stats.pendingApprovals}</span>
                )}
              </h2>
              {stats?.pendingApprovals > 5 && (
                <button onClick={() => navigate('/admin/users?status=PENDING')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View All</button>
              )}
            </div>
            
            {pendingUsers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingUsers.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px', border: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={(e) => handleApprove(u.id, e)} className="btn btn-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '0.25rem 0.5rem' }}>✓</button>
                      <button onClick={(e) => handleReject(u.id, e)} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.25rem 0.5rem' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No pending approvals.
              </div>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Quick Links</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: '+ Create New Test', action: () => navigate('/admin/tests/create'), class: 'btn-primary' },
                { label: '👥 Manage Users', action: () => navigate('/admin/users'), class: 'btn-secondary' },
                { label: '📂 Manage Categories', action: () => navigate('/admin/categories'), class: 'btn-secondary' },
                { label: '📊 View Analytics', action: () => navigate('/admin/analytics'), class: 'btn-secondary' },
                { label: '💬 View Feedback', action: () => navigate('/admin/feedback'), class: 'btn-secondary' },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action} className={`btn ${btn.class}`} style={{ justifyContent: 'flex-start' }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
