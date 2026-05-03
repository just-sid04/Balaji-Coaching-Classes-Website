import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusConfig = {
  DRAFT: { color: '#6b7280', label: 'Draft', icon: '📄' },
  PUBLISHED: { color: '#22c55e', label: 'Published', icon: '✅' },
  SCHEDULED: { color: '#3b82f6', label: 'Scheduled', icon: '⏰' },
  EXPIRED: { color: '#ef4444', label: 'Expired', icon: '⛔' },
  UNPUBLISHED: { color: '#eab308', label: 'Unpublished', icon: '🚫' },
};

export default function AdminTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '', page: 1 });

  const fetchTests = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getTests({ ...filters, limit: 20 });
      setTests(r.data.tests);
      setTotal(r.data.total);
    } catch {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTests(); }, [filters.status, filters.search, filters.page]);

  const deleteTest = async (id, title) => {
    if (!confirm(`Delete "${title}"? This will delete all questions and attempts.`)) return;
    try {
      await adminAPI.deleteTest(id);
      toast.success('Test deleted');
      fetchTests();
    } catch {
      toast.error('Failed to delete test');
    }
  };

  const duplicateTest = async (id) => {
    try {
      await adminAPI.duplicateTest(id);
      toast.success('Test duplicated successfully');
      fetchTests();
    } catch {
      toast.error('Failed to duplicate test');
    }
  };

  const togglePublish = async (test) => {
    const newStatus = test.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    try {
      await adminAPI.updateTest(test.id, { ...test, status: newStatus });
      toast.success(`Test ${newStatus.toLowerCase()}`);
      fetchTests();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title">Test Management</h1>
          <p className="section-subtitle">{total} tests total</p>
        </div>
        <button onClick={() => navigate('/admin/tests/create')} className="btn btn-primary">
          + Create Test
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input type="search" className="input" placeholder="Search tests..." style={{ maxWidth: '280px' }}
          value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
        <select className="input" style={{ maxWidth: '180px' }} value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All Statuses</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      ) : tests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No tests found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Create your first test to get started</p>
          <button onClick={() => navigate('/admin/tests/create')} className="btn btn-primary">+ Create Test</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {tests.map(test => {
            const s = statusConfig[test.status] || statusConfig.DRAFT;
            const cat = test.section?.subcategory?.category?.name;
            const sub = test.section?.subcategory?.name;
            const sec = test.section?.name;
            return (
              <div key={test.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', flex: 1, lineHeight: 1.3 }}>{test.title}</h3>
                  <span style={{
                    padding: '0.2rem 0.5rem', borderRadius: '20px',
                    fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
                    background: `${s.color}15`, color: s.color,
                    border: `1px solid ${s.color}25`,
                  }}>
                    {s.icon} {s.label}
                  </span>
                </div>

                {/* Path breadcrumb */}
                {cat && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {cat} › {sub} › {sec}
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Questions', value: test._count?.questions || 0 },
                    { label: 'Attempts', value: test._count?.attempts || 0 },
                    { label: 'Duration', value: `${test.durationMinutes}m` },
                    { label: 'Marks', value: test.totalMarks },
                  ].map((stat, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f97316' }}>{stat.value}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => navigate(`/admin/tests/${test.id}/edit`)} className="btn btn-secondary btn-sm">✏️ Edit</button>
                  <button onClick={() => togglePublish(test)} className={`btn btn-sm ${test.status === 'PUBLISHED' ? 'btn-warning' : 'btn-success'}`}
                    style={test.status !== 'PUBLISHED' ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' } : { background: 'rgba(234,179,8,0.1)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' }}>
                    {test.status === 'PUBLISHED' ? '🚫 Unpublish' : '✅ Publish'}
                  </button>
                  <button onClick={() => navigate(`/admin/analytics?testId=${test.id}`)} className="btn btn-secondary btn-sm">📊</button>
                  <button onClick={() => duplicateTest(test.id)} className="btn btn-secondary btn-sm">📋</button>
                  <button onClick={() => deleteTest(test.id, test.title)} className="btn btn-danger btn-sm">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
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
