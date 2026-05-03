import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studentAPI, publicAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function StudentTests() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [tests, setTests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    categoryId: '',
    subcategoryId: '',
    sectionId: '',
    search: searchParams.get('search') || '',
    page: 1,
  });

  // Load categories
  useEffect(() => {
    publicAPI.getCategories().then(r => setCategories(r.data.categories));
  }, []);

  // Load tests when filters change
  useEffect(() => {
    setLoading(true);
    const params = { ...filters, limit: 12 };
    studentAPI.getTests(params)
      .then(r => { setTests(r.data.tests); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load tests'))
      .finally(() => setLoading(false));
  }, [filters.categoryId, filters.subcategoryId, filters.sectionId, filters.search, filters.page]);

  const selectedCategory = categories.find(c => c.id === filters.categoryId);
  const selectedSubcategory = selectedCategory?.subcategories?.find(s => s.id === filters.subcategoryId);

  const catColors = { JEE: '#3b82f6', NEET: '#22c55e', 'MHT-CET': '#f97316' };

  const handleToggleLike = async (testId, e) => {
    e.stopPropagation();
    try {
      const r = await studentAPI.toggleLike(testId);
      setTests(prev => prev.map(t => t.id === testId ? { ...t, isLiked: r.data.liked, _count: { ...t._count, likes: r.data.liked ? (t._count?.likes || 0) + 1 : (t._count?.likes || 1) - 1 } } : t));
    } catch { toast.error('Please log in to like tests'); }
  };

  const canAttempt = (test) => {
    if (!test.allowRetake && test.userAttemptCount > 0) return false;
    if (test.allowRetake && test.userAttemptCount >= test.maxAttempts) return false;
    return true;
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Browse Tests</h1>
        <p className="section-subtitle">{total} test{total !== 1 ? 's' : ''} available</p>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilters(f => ({ ...f, categoryId: '', subcategoryId: '', sectionId: '', page: 1 }))}
          className="btn btn-sm"
          style={{
            background: !filters.categoryId ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)',
            color: !filters.categoryId ? '#f97316' : 'var(--text-secondary)',
            border: !filters.categoryId ? '1px solid rgba(249,115,22,0.3)' : '1px solid var(--border)',
          }}>
          All Exams
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilters(f => ({ ...f, categoryId: cat.id, subcategoryId: '', sectionId: '', page: 1 }))}
            className="btn btn-sm"
            style={{
              background: filters.categoryId === cat.id ? `${catColors[cat.name] || '#f97316'}20` : 'rgba(255,255,255,0.05)',
              color: filters.categoryId === cat.id ? catColors[cat.name] || '#f97316' : 'var(--text-secondary)',
              border: filters.categoryId === cat.id ? `1px solid ${catColors[cat.name] || '#f97316'}40` : '1px solid var(--border)',
            }}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Subcategory pills */}
      {selectedCategory && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {selectedCategory.subcategories?.map(sub => (
            <button key={sub.id}
              onClick={() => setFilters(f => ({ ...f, subcategoryId: sub.id === f.subcategoryId ? '' : sub.id, sectionId: '', page: 1 }))}
              className="btn btn-sm"
              style={{
                background: filters.subcategoryId === sub.id ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.04)',
                color: filters.subcategoryId === sub.id ? '#f97316' : 'var(--text-muted)',
                border: filters.subcategoryId === sub.id ? '1px solid rgba(249,115,22,0.25)' : '1px solid var(--border)',
              }}>
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Section filter */}
      {selectedSubcategory && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {selectedSubcategory.sections?.map(sec => (
            <button key={sec.id}
              onClick={() => setFilters(f => ({ ...f, sectionId: sec.id === f.sectionId ? '' : sec.id, page: 1 }))}
              className="btn btn-sm"
              style={{
                background: filters.sectionId === sec.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                color: filters.sectionId === sec.id ? '#3b82f6' : 'var(--text-muted)',
                border: filters.sectionId === sec.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid var(--border)',
                fontSize: '0.75rem',
              }}>
              📁 {sec.name}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input type="search" className="input" placeholder="Search tests by title..." style={{ maxWidth: '400px' }}
          value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      ) : tests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <p>No tests found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {tests.map(test => {
            const catName = test.section?.subcategory?.category?.name;
            const subName = test.section?.subcategory?.name;
            const secName = test.section?.name;
            const color = catColors[catName] || '#f97316';
            const attempted = test.userAttemptCount > 0;
            const canDo = canAttempt(test);

            return (
              <div key={test.id} className="card" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                onClick={() => navigate(`/student/tests/${test.id}`)}>
                {/* Category badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                  <span style={{ padding: '0.2rem 0.625rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: `${color}15`, color, border: `1px solid ${color}25` }}>
                    {catName} • {subName}
                  </span>
                  <button
                    onClick={(e) => handleToggleLike(test.id, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem' }}>
                    {test.isLiked ? '❤️' : '🤍'}
                  </button>
                </div>

                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.375rem', lineHeight: 1.35, flex: 1 }}>
                  {test.title}
                </h3>

                {secName && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>📁 {secName}</p>}

                {/* Stats */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { icon: '❓', val: test._count?.questions || 0, label: 'Questions' },
                    { icon: '⏱', val: `${test.durationMinutes}m`, label: 'Duration' },
                    { icon: '⭐', val: test.totalMarks, label: 'Marks' },
                    { icon: '👥', val: test._count?.attempts || 0, label: 'Attempts' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{s.icon} {s.val}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Attempt button */}
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  {attempted && !canDo ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-success">✓ Completed ({test.userAttemptCount}x)</span>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/student/history`); }}
                        className="btn btn-secondary btn-sm">View Result</button>
                    </div>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/exam/${test.id}`); }}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                      disabled={!canDo}>
                      {attempted ? `🔄 Retake (${test.userAttemptCount}/${test.maxAttempts})` : '🚀 Start Test'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" disabled={filters.page === 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
          <span style={{ padding: '0.375rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Page {filters.page} of {Math.ceil(total / 12)}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={filters.page >= Math.ceil(total / 12)}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
        </div>
      )}
    </div>
  );
}
