import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

const navItems = [
  { to: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/student/tests', label: 'Browse Tests', icon: '📝' },
  { to: '/student/history', label: 'My Attempts', icon: '📋' },
  { to: '/student/analytics', label: 'My Analytics', icon: '📊' },
  { to: '/student/profile', label: 'Profile', icon: '👤' },
  { to: '/student/feedback', label: 'Feedback', icon: '💬' },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ zIndex: 40 }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '1rem', flexShrink: 0 }}>B</div>
          <div>
            <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.875rem', color: '#f97316', lineHeight: 1.2 }}>BALAJI PORTAL</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>STUDENT</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 0.25rem', marginBottom: '0.5rem' }}>MENU</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Contact admin */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.06)', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.15)', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>CONTACT ADMIN</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href="https://wa.me/919960102201" target="_blank" rel="noopener noreferrer"
                className="btn btn-sm" style={{ flex: 1, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', fontSize: '0.7rem' }}>
                💬 WhatsApp
              </a>
              <a href="tel:+919960102201"
                className="btn btn-sm" style={{ flex: 1, background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)', fontSize: '0.7rem' }}>
                📞 Call
              </a>
            </div>
          </div>

          <div 
            onClick={() => { navigate('/student/profile'); setSidebarOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '10px', transition: 'background 0.2s' }}
            className="user-info-hover"
          >
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#f97316', fontSize: '0.875rem' }}>
              {user?.name?.charAt(0)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user?.targetExam || 'Student'}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-danger btn-sm" style={{ width: '100%' }}>🚪 Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div className="page-with-sidebar" style={{ flex: 1 }}>
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.25rem' }}>☰</button>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Hello, <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{user?.name}</span> 👋
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={toggleTheme} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem', borderRadius: '50%', width: 36, height: 36 }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user?.targetExam && <span className="badge badge-accent">{user.targetExam}</span>}
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
