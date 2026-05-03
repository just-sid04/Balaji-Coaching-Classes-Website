import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/categories', label: 'Categories', icon: '📂' },
  { to: '/admin/tests', label: 'Tests', icon: '📝' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { to: '/admin/feedback', label: 'Feedback', icon: '💬' },
  { to: '/admin/moderation', label: 'Moderation', icon: '🛡️' },
  { to: '/admin/audit-log', label: 'Audit Log', icon: '🔍' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ zIndex: 40 }}>
        {/* Logo */}
        <div style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: 'white', fontSize: '1rem', flexShrink: 0,
          }}>B</div>
          <div>
            <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.875rem', color: '#f97316', lineHeight: 1.2 }}>
              BALAJI PORTAL
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              ADMIN PANEL
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 0.25rem', marginBottom: '0.5rem' }}>
            NAVIGATION
          </div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: 'white', fontSize: '0.875rem', flexShrink: 0,
            }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Super Admin</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-danger btn-sm" style={{ width: '100%' }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="page-with-sidebar" style={{ flex: 1 }}>
        {/* Top bar */}
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.25rem', display: 'none' }}
              className="mobile-menu-btn"
            >
              ☰
            </button>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Welcome, <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{user?.name}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={toggleTheme} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem', borderRadius: '50%', width: 36, height: 36 }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={() => navigate('/admin/tests/create')} className="btn btn-primary btn-sm">
              + New Test
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
