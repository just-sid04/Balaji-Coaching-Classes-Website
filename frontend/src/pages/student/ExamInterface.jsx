import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS = { 
  UNVISITED: 'unvisited', 
  VISITED: 'visited', 
  ATTEMPTED: 'attempted', 
  REVIEW: 'review' 
};

export default function ExamInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('loading'); // loading | instructions | exam | submitting
  const [test, setTest] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [responses, setResponses] = useState({}); // { questionId: { selectedOptionIds:[], isMarkedForReview: bool } }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0])); // Track visited indices
  const [timeLeft, setTimeLeft] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false); // Mobile palette toggle
  const [startedAt, setStartedAt] = useState(null);
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);

  // Load test info for instructions
  useEffect(() => {
    studentAPI.getTest(testId)
      .then(r => { setTest(r.data.test); setPhase('instructions'); })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to load test');
        navigate('/student/tests');
      });
  }, [testId]);

  const startExam = async () => {
    try {
      setPhase('loading');
      const r = await studentAPI.startTest(testId);
      setTest(r.data.test);
      setAttemptId(r.data.attemptId);
      setTimeLeft(r.data.test.durationMinutes * 60);
      setStartedAt(new Date(r.data.startedAt));
      setCurrentIdx(0);
      // Initialize responses
      const init = {};
      r.data.test.questions.forEach(q => { init[q.id] = { selectedOptionIds: [], isMarkedForReview: false }; });
      setResponses(init);
      setPhase('exam');
      if (r.data.test.isFullScreen) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start test');
      navigate('/student/tests');
    }
  };

  // Timer
  useEffect(() => {
    if (phase !== 'exam') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Auto-save every 30s
  useEffect(() => {
    if (phase !== 'exam' || !attemptId) return;
    autoSaveRef.current = setInterval(() => { doAutoSave(); }, 30000);
    return () => clearInterval(autoSaveRef.current);
  }, [phase, attemptId, responses]);

  const doAutoSave = useCallback(async () => {
    if (!attemptId) return;
    const payload = Object.entries(responses).map(([qId, r]) => ({
      questionId: qId, selectedOptionIds: r.selectedOptionIds, isMarkedForReview: r.isMarkedForReview,
    }));
    try { await studentAPI.saveProgress(attemptId, payload); } catch {}
  }, [attemptId, responses]);

  const handleSelectOption = (optionId) => {
    if (!test) return;
    const q = test.questions[currentIdx];
    setResponses(prev => {
      const cur = prev[q.id] || { selectedOptionIds: [], isMarkedForReview: false };
      let selected;
      if (q.isMultipleCorrect) {
        selected = cur.selectedOptionIds.includes(optionId)
          ? cur.selectedOptionIds.filter(id => id !== optionId)
          : [...cur.selectedOptionIds, optionId];
      } else {
        selected = cur.selectedOptionIds[0] === optionId ? [] : [optionId];
      }
      return { ...prev, [q.id]: { ...cur, selectedOptionIds: selected } };
    });
  };

  const toggleReview = () => {
    const q = test.questions[currentIdx];
    setResponses(prev => ({ ...prev, [q.id]: { ...prev[q.id], isMarkedForReview: !prev[q.id]?.isMarkedForReview } }));
  };

  const clearResponse = () => {
    const q = test.questions[currentIdx];
    setResponses(prev => ({ ...prev, [q.id]: { selectedOptionIds: [], isMarkedForReview: false } }));
  };

  const handleSubmit = async (auto = false) => {
    if (!auto && !confirm('Are you sure you want to submit the test?')) return;
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);
    setPhase('submitting');
    if (document.fullscreenElement) document.exitFullscreen?.();

    const timeTaken = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : null;
    const payload = Object.entries(responses).map(([qId, r]) => ({
      questionId: qId, selectedOptionIds: r.selectedOptionIds, isMarkedForReview: r.isMarkedForReview,
    }));

    try {
      await studentAPI.submitTest(attemptId, { responses: payload, timeTakenSecs: timeTaken });
      toast.success('Test submitted!');
      navigate(`/result/${attemptId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
      setPhase('exam');
    }
  };

  const getStatus = (qIdx) => {
    const q = test.questions[qIdx];
    const r = responses[q.id];
    
    if (r?.isMarkedForReview) return STATUS.REVIEW;
    if (r?.selectedOptionIds?.length > 0) return STATUS.ATTEMPTED;
    if (visitedQuestions.has(qIdx)) return STATUS.VISITED;
    return STATUS.UNVISITED;
  };

  // Update visited status when changing question
  const handleSetIdx = (idx) => {
    setCurrentIdx(idx);
    setVisitedQuestions(prev => new Set([...prev, idx]));
  };

  const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const counts = test?.questions ? {
    attempted: test.questions.filter((q, i) => getStatus(i) === STATUS.ATTEMPTED).length,
    review: test.questions.filter((q, i) => getStatus(i) === STATUS.REVIEW).length,
    visited: test.questions.filter((q, i) => getStatus(i) === STATUS.VISITED).length,
    unvisited: test.questions.filter((q, i) => getStatus(i) === STATUS.UNVISITED).length,
  } : {};

  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto 1rem' }} /><p style={{ color: 'var(--text-muted)' }}>Loading test...</p></div>
    </div>
  );

  if (phase === 'submitting') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto 1rem' }} /><p>Submitting your test...</p></div>
    </div>
  );

  if (phase === 'instructions') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
      <div style={{ maxWidth: '640px', width: '100%', animation: 'slideUp 0.5s ease' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>
            <h1 style={{ fontFamily: 'Poppins', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{test?.title}</h1>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
              {[
                { label: `${test?._count?.questions || 0} Questions`, icon: '❓' },
                { label: `${test?.durationMinutes} Minutes`, icon: '⏱' },
                { label: `${test?.totalMarks} Marks`, icon: '⭐' },
                { label: test?.negativeMarking ? `−${test?.negativeMarkValue} per wrong` : 'No Negative', icon: '⚠️' },
              ].map((s, i) => (
                <span key={i} className="badge badge-accent" style={{ fontSize: '0.8rem' }}>{s.icon} {s.label}</span>
              ))}
            </div>
          </div>

          {test?.instructions && (
            <div style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem', color: '#f97316' }}>📋 Instructions</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{test.instructions}</p>
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Legend</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[
                { color: '#22c55e', label: 'Attempted' },
                { color: '#ef4444', label: 'Visited (Not Answered)' },
                { color: '#3b82f6', label: 'Marked for Review' },
                { color: '#64748b', label: 'Not Visited' },
                { color: '#f97316', label: 'Current Question' },
              ].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '3px', background: l.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => navigate('/student/tests')} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
            <button onClick={startExam} className="btn btn-primary btn-lg" style={{ flex: 2 }}>🚀 Start Test</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Exam UI
  const currentQ = test?.questions?.[currentIdx];
  const currentResponse = currentQ ? (responses[currentQ.id] || { selectedOptionIds: [], isMarkedForReview: false }) : null;
  const urgent = timeLeft < 300;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50, gap: '1rem',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {test?.title}
        </div>

        {/* Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.1)',
          border: urgent ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(249,115,22,0.25)',
          borderRadius: '10px', padding: '0.5rem 1rem',
          color: urgent ? '#ef4444' : '#f97316',
          fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800,
          animation: urgent ? 'pulse-accent 1s ease infinite' : 'none',
        }}>
          ⏱ {fmt(timeLeft)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setPaletteOpen(!paletteOpen)} className="btn btn-secondary btn-sm md-hidden" style={{ fontSize: '1rem', padding: '0.5rem' }}>
            📊
          </button>
          <button onClick={() => handleSubmit(false)} className="btn btn-primary btn-sm">Submit Test</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Question Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {currentQ && (
            <div className="animate-fade-in" key={currentIdx}>
              {/* Question header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                  Q{currentIdx + 1} of {test.questions.length}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>+{currentQ.marks}</span>
                  {test.negativeMarking && <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>−{currentQ.negativeMarks}</span>}
                  {currentQ.isMultipleCorrect && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Multiple Correct</span>}
                </div>
              </div>

              {/* Question text */}
              <div className="card" style={{ marginBottom: '1.25rem', fontSize: '1rem', lineHeight: 1.7 }}>
                {currentQ.questionText}
                {currentQ.questionImageUrl && (
                  <img src={currentQ.questionImageUrl} alt="Question" style={{ maxWidth: '100%', marginTop: '1rem', borderRadius: '8px' }} />
                )}
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {currentQ.options.map((opt, oi) => {
                  const selected = currentResponse?.selectedOptionIds?.includes(opt.id);
                  return (
                    <div key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1rem 1.25rem', borderRadius: '12px', cursor: 'pointer',
                        background: selected ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)',
                        border: selected ? '2px solid rgba(249,115,22,0.5)' : '1px solid var(--border)',
                        transition: 'all 0.15s ease',
                        transform: selected ? 'scale(1.01)' : 'scale(1)',
                      }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.875rem',
                        background: selected ? '#f97316' : 'rgba(255,255,255,0.08)',
                        color: selected ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}>
                        {['A','B','C','D','E'][oi]}
                      </div>
                      <span style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{opt.optionText}</span>
                      {opt.imageUrl && <img src={opt.imageUrl} alt="" style={{ maxHeight: '60px', borderRadius: '6px' }} />}
                    </div>
                  );
                })}
              </div>

              {/* Navigation controls */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={clearResponse} className="btn btn-secondary btn-sm">✕ Clear</button>
                <button onClick={toggleReview}
                  className="btn btn-sm"
                  style={{
                    background: currentResponse?.isMarkedForReview ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                    color: currentResponse?.isMarkedForReview ? '#3b82f6' : 'var(--text-secondary)',
                    border: currentResponse?.isMarkedForReview ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border)',
                  }}>
                  🔖 {currentResponse?.isMarkedForReview ? 'Unmark' : 'Mark for Review'}
                </button>
                <div style={{ flex: 1 }} />
                <button onClick={() => handleSetIdx(Math.max(0, currentIdx - 1))} className="btn btn-secondary btn-sm" disabled={currentIdx === 0}>← Prev</button>
                {currentIdx < test.questions.length - 1
                  ? <button onClick={() => handleSetIdx(currentIdx + 1)} className="btn btn-primary btn-sm">Save & Next →</button>
                  : <button onClick={() => handleSubmit(false)} className="btn btn-primary btn-sm">Submit →</button>
                }
              </div>
            </div>
          )}
        </div>

        {/* Question Palette Sidebar */}
        <div 
          onClick={() => setPaletteOpen(false)}
          className={`exam-palette-overlay ${paletteOpen ? 'show' : ''}`} 
        />
        <div className={`exam-palette ${paletteOpen ? 'open' : ''}`}>
          {/* Summary */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.625rem' }}>SUMMARY</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {[
                { color: '#22c55e', label: 'Attempted', count: counts.attempted },
                { color: '#ef4444', label: 'Visited', count: counts.visited },
                { color: '#3b82f6', label: 'For Review', count: counts.review },
                { color: '#64748b', label: 'Unvisited', count: counts.unvisited },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '2px', background: s.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div style={{ padding: '1rem', flex: 1 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.625rem' }}>QUESTIONS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem' }}>
              {test?.questions.map((q, i) => {
                const status = getStatus(i);
                const isCurrent = i === currentIdx;
                return (
                  <button key={q.id} onClick={() => handleSetIdx(i)}
                    className={`q-btn ${isCurrent ? 'q-btn-current' : 
                      status === STATUS.ATTEMPTED ? 'q-btn-attempted' : 
                      status === STATUS.REVIEW ? 'q-btn-review' : 
                      status === STATUS.VISITED ? 'q-btn-visited' : 'q-btn-unvisited'}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => handleSubmit(false)} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              Submit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
