import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

export default function ResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('summary'); // summary | solutions
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    studentAPI.getResult(attemptId)
      .then(r => setResult(r.data.attempt))
      .catch(() => navigate('/student/history'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  const loadComments = async () => {
    if (!result) return;
    const r = await studentAPI.getComments(result.test.id);
    setComments(r.data.comments);
    setShowComments(true);
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    const r = await studentAPI.postComment(result.test.id, newComment);
    setComments(c => [r.data.comment, ...c]);
    setNewComment('');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div className="spinner" />
    </div>
  );
  if (!result) return null;

  const a = result;
  const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
  const accuracy = (a.correctCount + a.incorrectCount) > 0
    ? Math.round((a.correctCount / (a.correctCount + a.incorrectCount)) * 100) : 0;

  const pieData = [
    { name: 'Correct', value: a.correctCount || 0, color: '#22c55e' },
    { name: 'Incorrect', value: a.incorrectCount || 0, color: '#ef4444' },
    { name: 'Unattempted', value: a.unattemptedCount || 0, color: '#475569' },
  ];

  const getGrade = () => {
    if (pct >= 90) return { label: 'Excellent! 🏆', color: '#22c55e' };
    if (pct >= 70) return { label: 'Good Job! 🎉', color: '#3b82f6' };
    if (pct >= 50) return { label: 'Keep Going! 💪', color: '#eab308' };
    return { label: 'Need Practice 📚', color: '#ef4444' };
  };

  const grade = getGrade();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'slideUp 0.5s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {pct >= 70 ? '🎉' : pct >= 50 ? '💪' : '📚'}
          </div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: grade.color }}>
            {grade.label}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{a.test?.title}</p>
        </div>

        {/* Score Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', background: 'var(--bg-card)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--border)', minWidth: '180px' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, fontFamily: 'Poppins', color: grade.color, lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>
              {a.score} / {a.totalMarks}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Score</div>
            {a.rank && <div style={{ marginTop: '1rem', padding: '0.375rem 0.75rem', background: 'rgba(249,115,22,0.1)', borderRadius: '20px', fontSize: '0.875rem', color: '#f97316', fontWeight: 700 }}>
              Rank #{a.rank} ({a.percentile}th %ile)
            </div>}
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Correct', value: a.correctCount, color: '#22c55e', icon: '✅' },
              { label: 'Incorrect', value: a.incorrectCount, color: '#ef4444', icon: '❌' },
              { label: 'Skipped', value: a.unattemptedCount, color: '#6b7280', icon: '⏭' },
              { label: 'Accuracy', value: `${accuracy}%`, color: '#3b82f6', icon: '🎯' },
              { label: 'Time Taken', value: a.timeTakenSecs ? `${Math.floor(a.timeTakenSecs/60)}m ${a.timeTakenSecs%60}s` : '—', color: '#a855f7', icon: '⏱' },
              { label: 'Total Questions', value: (a.correctCount||0)+(a.incorrectCount||0)+(a.unattemptedCount||0), color: '#f97316', icon: '📝' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '0.875rem 1rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, color: s.color, fontSize: '1.1rem' }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 200px', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Question Breakdown</h3>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '3px', background: d.color }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flex: 1 }}>{d.name}</span>
                <span style={{ fontWeight: 700, color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        {a.responses?.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {['summary', 'solutions'].map(t => (
                <button key={t} onClick={() => setTab(t)} className="btn btn-sm"
                  style={{ background: tab === t ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)', color: tab === t ? '#f97316' : 'var(--text-muted)', border: tab === t ? '1px solid rgba(249,115,22,0.3)' : '1px solid var(--border)', textTransform: 'capitalize' }}>
                  {t === 'summary' ? '📊 Summary' : '📖 Solutions'}
                </button>
              ))}
            </div>

            {tab === 'solutions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {a.responses.map((r, i) => (
                  <div key={r.questionId} className="card"
                    style={{ borderLeft: `3px solid ${r.isCorrect === true ? '#22c55e' : r.selectedOptionIds?.length > 0 ? '#ef4444' : '#475569'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#f97316', fontSize: '0.875rem' }}>Q{i+1}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {r.marksAwarded !== null && <span className={`badge ${r.marksAwarded > 0 ? 'badge-success' : r.marksAwarded < 0 ? 'badge-error' : ''}`}>{r.marksAwarded > 0 ? '+' : ''}{r.marksAwarded}</span>}
                        <span className={`badge ${r.isCorrect ? 'badge-success' : r.selectedOptionIds?.length > 0 ? 'badge-error' : ''}`}>
                          {r.isCorrect ? '✓ Correct' : r.selectedOptionIds?.length > 0 ? '✗ Wrong' : '— Skipped'}
                        </span>
                      </div>
                    </div>
                    <p style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>{r.questionText}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {r.options?.map((o, oi) => {
                        const wasSelected = r.selectedOptionIds?.includes(o.id);
                        const isCorrect = o.isCorrect;
                        return (
                          <div key={o.id} style={{
                            padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem',
                            background: isCorrect ? 'rgba(34,197,94,0.08)' : wasSelected && !isCorrect ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                            border: isCorrect ? '1px solid rgba(34,197,94,0.3)' : wasSelected ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
                            color: isCorrect ? '#22c55e' : wasSelected ? '#ef4444' : 'var(--text-secondary)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                          }}>
                            <span style={{ fontWeight: 700 }}>{['A','B','C','D','E'][oi]}.</span>
                            {o.optionText}
                            {isCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>✓ Correct</span>}
                            {wasSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>Your Answer</span>}
                          </div>
                        );
                      })}
                    </div>
                    {r.explanation && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(59,130,246,0.06)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>💡 Explanation: </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{r.explanation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Comments */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700 }}>💬 Discussion</h3>
            {!showComments && <button onClick={loadComments} className="btn btn-secondary btn-sm">Load Comments</button>}
          </div>
          {showComments && (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <input className="input" style={{ flex: 1 }} placeholder="Share your thoughts..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && postComment()} />
                <button onClick={postComment} className="btn btn-primary btn-sm">Post</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#f97316', fontSize: '0.8rem', flexShrink: 0 }}>{c.user?.name?.charAt(0)}</div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.625rem 0.875rem', flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.user?.name}</span>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{c.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No comments yet. Be the first!</p>}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/student/tests')} className="btn btn-secondary btn-lg">Browse More Tests</button>
          <button onClick={() => navigate('/student/dashboard')} className="btn btn-primary btn-lg">← Dashboard</button>
        </div>
      </div>
    </div>
  );
}
