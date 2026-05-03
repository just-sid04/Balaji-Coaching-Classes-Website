import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#eab308'];

export default function AdminAnalytics() {
  const [searchParams] = useSearchParams();
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(searchParams.get('testId') || '');
  const [analytics, setAnalytics] = useState(null);
  const [globalAnalytics, setGlobalAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getTests({ limit: 100, status: 'PUBLISHED' }),
      adminAPI.getGlobalAnalytics()
    ])
      .then(([testsRes, globalRes]) => {
        setTests(testsRes.data.tests);
        setGlobalAnalytics(globalRes.data);
      })
      .catch(() => toast.error('Failed to load global analytics'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedTestId) {
      setLoading(true);
      adminAPI.getTestAnalytics(selectedTestId)
        .then(r => setAnalytics(r.data))
        .catch(() => toast.error('Failed to load analytics'))
        .finally(() => setLoading(false));
    }
  }, [selectedTestId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: '0.875rem' }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Analytics & Reports</h1>
        <p className="section-subtitle">Detailed performance data for each test</p>
      </div>

      {/* Test selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <select className="input" style={{ maxWidth: '400px' }} value={selectedTestId}
          onChange={e => setSelectedTestId(e.target.value)}>
          <option value="">Select a test to view analytics</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      {!selectedTestId && globalAnalytics && !loading && (
        <div>
          {/* Global Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="stat-card">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', fontFamily: 'Poppins' }}>{globalAnalytics.overview.totalUsers}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Students</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📚</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f97316', fontFamily: 'Poppins' }}>{globalAnalytics.overview.activeTests}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Tests</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✍️</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#22c55e', fontFamily: 'Poppins' }}>{globalAnalytics.overview.totalAttemptsLast30Days}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attempts (Last 30 Days)</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Trend Chart */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Attempts Trend (Last 30 Days)</h3>
              {globalAnalytics.dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={globalAnalytics.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                    <YAxis stroke="#6b7280" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" name="Attempts" stroke="#3b82f6" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No data yet</p>}
            </div>

            {/* Category Distribution */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Tests Attempted by Category</h3>
              {globalAnalytics.categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={globalAnalytics.categoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" paddingAngle={3}>
                      {globalAnalytics.categoryDistribution.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No data yet</p>}
            </div>
          </div>

          {/* Top Students */}
          {globalAnalytics.topStudents.length > 0 && (
             <div className="card">
             <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Top 10 Students</h3>
             <div className="table-container">
               <table>
                 <thead>
                   <tr>
                     <th>Rank</th>
                     <th>Student Name</th>
                     <th>Tests Taken</th>
                     <th>Avg Score (%)</th>
                   </tr>
                 </thead>
                 <tbody>
                   {globalAnalytics.topStudents.map((s, i) => (
                     <tr key={s.id}>
                       <td style={{ fontWeight: 700, color: i < 3 ? '#f97316' : 'inherit' }}>#{i + 1}</td>
                       <td style={{ fontWeight: 600 }}>{s.name}</td>
                       <td>{s.testsTaken}</td>
                       <td>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <div className="progress-bar" style={{ flex: 1, maxWidth: '80px' }}>
                             <div className="progress-fill" style={{
                               width: `${s.avgScorePct}%`,
                               background: s.avgScorePct >= 60 ? '#22c55e' : s.avgScorePct >= 30 ? '#eab308' : '#ef4444',
                             }} />
                           </div>
                           <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{s.avgScorePct}%</span>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      )}

      {analytics && !loading && (
        <div>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Attempts', value: analytics.totalAttempts, icon: '👥', color: '#3b82f6' },
              { label: 'Average Score', value: `${analytics.avgScore}`, icon: '🎯', color: '#f97316' },
              { label: 'Highest Score', value: analytics.highestScore, icon: '🏆', color: '#22c55e' },
              { label: 'Lowest Score', value: analytics.lowestScore, icon: '📉', color: '#ef4444' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'Poppins' }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Score distribution */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Score Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.studentAttempts?.slice(0, 20).map(a => ({ name: a.studentName?.split(' ')[0], score: a.score }))} >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Question accuracy */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Question Accuracy</h3>
              {analytics.questionAnalytics?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.questionAnalytics.slice(0, 15).map((q, i) => ({ name: `Q${i + 1}`, accuracy: q.accuracy }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={11} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="accuracy" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No response data yet</p>}
            </div>
          </div>

          {/* Question-wise table */}
          {analytics.questionAnalytics?.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Question-wise Analysis</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Question</th>
                      <th>Attempted</th>
                      <th>Correct</th>
                      <th>Incorrect</th>
                      <th>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.questionAnalytics.map((q, i) => (
                      <tr key={q.questionId}>
                        <td style={{ fontWeight: 700, color: '#f97316' }}>Q{i + 1}</td>
                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                          {q.questionText}
                        </td>
                        <td>{q.attempted}</td>
                        <td style={{ color: '#22c55e' }}>{q.correct}</td>
                        <td style={{ color: '#ef4444' }}>{q.incorrect}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="progress-bar" style={{ flex: 1, maxWidth: '80px' }}>
                              <div className="progress-fill" style={{
                                width: `${q.accuracy}%`,
                                background: q.accuracy >= 60 ? '#22c55e' : q.accuracy >= 30 ? '#eab308' : '#ef4444',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{q.accuracy}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Student performance table */}
          {analytics.studentAttempts?.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Student-wise Performance</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Score</th>
                      <th>Time Taken</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.studentAttempts.map((a, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{a.studentName}</td>
                        <td style={{ color: '#f97316', fontWeight: 700 }}>{a.score}</td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {a.timeTaken ? `${Math.floor(a.timeTaken / 60)}m ${a.timeTaken % 60}s` : '—'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {a.submittedAt ? new Date(a.submittedAt).toLocaleString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
