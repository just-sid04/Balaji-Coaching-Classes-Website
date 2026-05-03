import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';

export default function AttemptHistory() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    studentAPI.getHistory({ page, limit: 15 })
      .then(r => { setAttempts(r.data.attempts); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">My Attempt History</h1>
        <p className="section-subtitle">{total} completed test{total !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      ) : attempts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ marginBottom: '1rem' }}>You haven't attempted any tests yet</p>
          <button onClick={() => navigate('/student/tests')} className="btn btn-primary">Browse Tests</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {attempts.map(a => {
              const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
              const cat = a.test?.section?.subcategory?.category?.name;
              return (
                <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer' }}
                  onClick={() => navigate(`/result/${a.id}`)}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '14px', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: pct >= 60 ? 'rgba(34,197,94,0.1)' : pct >= 40 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${pct >= 60 ? 'rgba(34,197,94,0.25)' : pct >= 40 ? 'rgba(234,179,8,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: pct >= 60 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444' }}>{pct}%</span>
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Score</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.25rem' }}>
                      {a.test?.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {cat && <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>{cat}</span>}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.score}/{a.totalMarks} marks</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✅ {a.correctCount} | ❌ {a.incorrectCount} | ⏭ {a.unattemptedCount}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {a.rank && <div style={{ fontWeight: 700, color: '#f97316', fontSize: '0.875rem' }}>Rank #{a.rank}</div>}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(a.submittedAt).toLocaleDateString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.25rem' }}>View →</div>
                  </div>
                </div>
              );
            })}
          </div>

          {total > 15 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {page} / {Math.ceil(total / 15)}
              </span>
              <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
