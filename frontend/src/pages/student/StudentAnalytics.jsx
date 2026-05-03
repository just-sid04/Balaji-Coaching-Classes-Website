import { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

export default function StudentAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getAnalytics()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.8rem' }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color, fontSize: '0.8rem' }}>{p.name}: {p.value}{p.name === 'Percentage' ? '%' : ''}</p>)}
      </div>
    );
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>;

  if (!data || data.totalTests === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
      <p>No analytics yet. Start taking tests to see your performance data!</p>
    </div>
  );

  const trendData = (data.trend || []).map(t => ({
    name: t.testTitle?.length > 15 ? t.testTitle.slice(0, 15) + '…' : t.testTitle,
    Score: t.score,
    Percentage: t.percentage,
    Marks: t.totalMarks,
  }));

  const categoryData = Object.entries(data.categoryBreakdown || {}).map(([name, v]) => ({
    subject: name,
    tests: v.attempted,
    correct: v.correct,
  }));

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">My Analytics</h1>
        <p className="section-subtitle">Your performance overview across all tests</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Tests Taken', value: data.totalTests, icon: '📝', color: '#3b82f6' },
          { label: 'Avg Score', value: data.avgScore?.toFixed(1) || 0, icon: '🎯', color: '#f97316' },
          { label: 'Avg Accuracy', value: `${data.avgAccuracy?.toFixed(1) || 0}%`, icon: '✅', color: '#22c55e' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.625rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, fontFamily: 'Poppins' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Performance Trend */}
      {trendData.length > 1 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Performance Trend (Last 10 Tests)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} angle={-20} textAnchor="end" height={45} />
              <YAxis stroke="#6b7280" fontSize={11} unit="%" domain={[0, 100]} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="Percentage" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Category Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {categoryData.map((c, i) => (
              <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f97316', fontFamily: 'Poppins' }}>{c.tests}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{c.subject}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>tests attempted</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
