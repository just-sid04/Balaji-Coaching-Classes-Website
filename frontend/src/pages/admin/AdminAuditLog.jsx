import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const actionColors = {
  LOGIN: '#22c55e',
  USER_STATUS_CHANGED_TO_ACTIVE: '#22c55e',
  USER_STATUS_CHANGED_TO_SUSPENDED: '#ef4444',
  USER_STATUS_CHANGED_TO_REJECTED: '#ef4444',
  USER_DELETED: '#ef4444',
  TEST_CREATED: '#3b82f6',
  TEST_UPDATED: '#eab308',
  TEST_DELETED: '#ef4444',
  TEST_DUPLICATED: '#a855f7',
  CATEGORY_CREATED: '#3b82f6',
  CATEGORY_UPDATED: '#eab308',
  CATEGORY_DELETED: '#ef4444',
  COMMENT_DELETED: '#ef4444',
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.getAuditLogs()
      .then(r => setLogs(r.data.logs))
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Audit Log</h1>
        <p className="section-subtitle">Track all admin actions and system events</p>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <input type="search" className="input" placeholder="Search logs by action, user, entity..." style={{ maxWidth: '400px' }}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Performed By</th>
                <th>Entity</th>
                <th>IP Address</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                      background: `${actionColors[log.action] || '#6b7280'}15`,
                      color: actionColors[log.action] || '#6b7280',
                      fontFamily: 'monospace',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 600 }}>{log.user?.name}</span>
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{log.user?.email}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {log.entity || '—'}
                    {log.entityId && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>{log.entityId.slice(0, 8)}...</span>}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {log.ipAddress || '—'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
