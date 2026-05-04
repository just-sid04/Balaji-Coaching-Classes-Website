import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusColors = {
  PENDING: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', label: 'Pending' },
  ACTIVE: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Active' },
  SUSPENDED: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Suspended' },
  REJECTED: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Rejected' },
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '', page: 1 });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getUsers({ ...filters, limit: 20 });
      setUsers(r.data.users);
      setTotal(r.data.total);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filters.status, filters.search, filters.page]);

  const updateStatus = async (id, status) => {
    try {
      await adminAPI.updateUserStatus(id, status);
      toast.success(`User ${status.toLowerCase()}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title">User Management</h1>
          <p className="section-subtitle">{total} total users registered</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="search"
          className="input"
          placeholder="Search by name or email..."
          style={{ maxWidth: '300px' }}
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
        />
        <select className="input" style={{ maxWidth: '180px' }} value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All Statuses</option>
          {Object.entries(statusColors).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Student</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Email</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Target Exam</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'center' }}>Attempts</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Joined</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const s = statusColors[u.status] || statusColors.PENDING;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'rgba(249,115,22,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: '#f97316', fontSize: '0.8rem', flexShrink: 0,
                        }}>
                          {u.name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>
                      {u.targetExam ? (
                        <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{u.targetExam}</span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{u._count?.attempts || 0}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.625rem', borderRadius: '20px',
                        fontSize: '0.7rem', fontWeight: 600,
                        background: s.bg, color: s.color,
                        border: `1px solid ${s.color}30`,
                      }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {u.status === 'PENDING' && (
                          <>
                            <button onClick={() => updateStatus(u.id, 'ACTIVE')} className="btn btn-success" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Approve</button>
                            <button onClick={() => updateStatus(u.id, 'REJECTED')} className="btn btn-danger" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Reject</button>
                          </>
                        )}
                        {u.status === 'ACTIVE' && (
                          <button onClick={() => updateStatus(u.id, 'SUSPENDED')} className="btn btn-danger" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Suspend</button>
                        )}
                        {u.status === 'SUSPENDED' && (
                          <button onClick={() => updateStatus(u.id, 'ACTIVE')} className="btn btn-success" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Reactivate</button>
                        )}
                        {u.status === 'REJECTED' && (
                          <button onClick={() => updateStatus(u.id, 'ACTIVE')} className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Activate</button>
                        )}
                        {u.role !== 'SUPER_ADMIN' && (
                          <button onClick={() => deleteUser(u.id, u.name)} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary btn-sm" disabled={filters.page === 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
          <span style={{ padding: '0.375rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Page {filters.page} of {Math.ceil(total / 20)}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={filters.page >= Math.ceil(total / 20)}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
        </div>
      )}
    </div>
  );
}
