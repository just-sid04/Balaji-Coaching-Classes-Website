import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';

const features = [
  { icon: '⚡', title: 'Instant Results', desc: 'Get detailed score analysis and rank instantly after submission' },
  { icon: '🎯', title: 'Exam Focused', desc: 'Full-screen exam mode simulating real JEE, NEET & MHT-CET environment' },
  { icon: '📊', title: 'Deep Analytics', desc: 'Track performance trends, accuracy, and subject-wise breakdown' },
  { icon: '🔔', title: 'Auto-Submit', desc: 'Intelligent timer auto-submits your test when time expires' },
  { icon: '📝', title: 'Question Review', desc: 'Revisit all questions with correct answers and detailed explanations' },
  { icon: '🏆', title: 'Rank & Percentile', desc: 'Know your rank and percentile among all students in real-time' },
];

const examCategories = [
  { name: 'JEE', color: '#3b82f6', desc: 'Joint Entrance Examination', icon: '⚗️' },
  { name: 'NEET', color: '#22c55e', desc: 'National Eligibility cum Entrance Test', icon: '🧬' },
  { name: 'MHT-CET', color: '#f97316', desc: 'Maharashtra Common Entrance Test', icon: '📐' },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState({ testCount: 0, studentCount: 0 });

  useEffect(() => {
    publicAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)', 
      fontFamily: 'Outfit, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ─── Advanced Visuals ───────────────── */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(80px)', animation: 'pulse-accent 10s infinite ease-in-out', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: '-10%', width: '35vw', height: '35vw',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(80px)', animation: 'pulse-accent 12s infinite ease-in-out reverse', pointerEvents: 'none'
      }} />

      {/* Floating Icons (Simulated with text/emoji for speed, but styled impressively) */}
      <div className="floating-icons" style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.4, zIndex: 0 }}>
        <span style={{ position: 'absolute', top: '15%', left: '10%', fontSize: '2rem', animation: 'float 6s infinite ease-in-out' }}>⚗️</span>
        <span style={{ position: 'absolute', top: '45%', right: '15%', fontSize: '2.5rem', animation: 'float 8s infinite ease-in-out 1s' }}>🧬</span>
        <span style={{ position: 'absolute', top: '75%', left: '20%', fontSize: '1.8rem', animation: 'float 7s infinite ease-in-out 2s' }}>📐</span>
        <span style={{ position: 'absolute', top: '30%', left: '40%', fontSize: '2.2rem', animation: 'float 9s infinite ease-in-out 0.5s' }}>⚛️</span>
      </div>

      {/* Navbar */}
      <nav style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 42, height: 42,
            background: 'var(--accent-gradient)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', fontWeight: 900, color: 'white',
            boxShadow: '0 4px 12px var(--accent-glow)'
          }}>B</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              BALAJI <span style={{ color: 'var(--accent)' }}>PORTAL</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '-2px', letterSpacing: '0.15em', fontWeight: 600 }}>
              COACHING CLASSES
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
          <button onClick={toggleTheme} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem', borderRadius: '50%', width: 36, height: 36 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/login" className="btn btn-secondary">Log In</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '10rem 2rem 8rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
          background: 'var(--accent-glow)',
          border: '1px solid var(--border-hover)',
          borderRadius: '100px', padding: '0.6rem 1.5rem',
          fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 700,
          marginBottom: '2.5rem',
          animation: 'fadeIn 0.6s ease',
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.1)'
        }}>
          ✨ Maharashtra's Premier Online Test Platform
        </div>

        <h1 style={{
          fontSize: 'clamp(3.5rem, 9vw, 6.5rem)',
          fontWeight: 900,
          lineHeight: 0.95,
          color: 'var(--text-primary)',
          marginBottom: '2rem',
          letterSpacing: '-0.05em',
          animation: 'slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>
          Master Your <br />
          <span style={{ 
            background: 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(249, 115, 22, 0.3))'
          }}>
            JEE, NEET & MHT-CET
          </span>
        </h1>

        <p style={{
          fontSize: '1.35rem',
          color: 'var(--text-secondary)',
          maxWidth: '750px',
          margin: '0 auto 3.5rem',
          lineHeight: 1.5,
          animation: 'fadeIn 1s ease',
          fontWeight: 500
        }}>
          Join the platform built for serious aspirants. Experience real-time exam environments, 
          instant deep analytics, and hundreds of expert-curated mock tests.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeIn 1.2s ease' }}>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ minWidth: '240px', fontSize: '1.125rem' }}>
            Get Started for Free →
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg" style={{ minWidth: '180px', fontSize: '1.125rem' }}>
            Student Login
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '4rem', justifyContent: 'center', marginTop: '6rem',
          flexWrap: 'wrap', opacity: 0.8,
        }}>
          {[
            { label: 'Tests Available', value: stats.testCount || '120+' },
            { label: 'Active Learners', value: stats.studentCount || '600+' },
            { label: 'Total Questions', value: '15,000+' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Exam Categories */}
      <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Exam Categories
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Focused preparation tracks for every aspirant
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {examCategories.map((cat) => (
            <div key={cat.name} className="card-glass" style={{ 
              padding: '3rem 2rem', 
              textAlign: 'center',
              borderTop: `4px solid ${cat.color}`,
              transition: 'all 0.4s ease'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>{cat.icon}</div>
              <h3 style={{
                fontSize: '1.75rem', fontWeight: 800,
                color: cat.color, marginBottom: '0.75rem',
              }}>{cat.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>{cat.desc}</p>
              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                {['11th', '12th', 'Dropper'].map(s => (
                  <span key={s} className="badge" style={{
                    background: `${cat.color}15`,
                    color: cat.color,
                    borderColor: `${cat.color}30`,
                  }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(15,23,42,0.5))',
          padding: '5rem 2rem',
          maxWidth: '900px',
          margin: '0 auto',
          borderRadius: '32px',
        }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Ready to Start?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Join hundreds of students at Shree Balaji Coaching Classes and boost your preparation today.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ minWidth: '220px' }}>
              Register for Free
            </Link>
            <a href="https://wa.me/919960102201" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-lg">
              Chat with Faculty
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '4rem 2rem',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.01)'
      }}>
        <div style={{ marginBottom: '1rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.125rem' }}>
          SHREE BALAJI COACHING CLASSES
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Led by Prof. Ravindra Thakare • Nandurbar, Maharashtra</p>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '3rem' }}>
          <a href="https://wa.me/919960102201" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--success)', textDecoration: 'none', fontWeight: 600 }}>WhatsApp</a>
          <a href="tel:+919960102201" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Call</a>
          <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          © 2024 Shree Balaji Coaching Classes. Built for serious aspirants.
        </div>
      </footer>
    </div>
  );
}
