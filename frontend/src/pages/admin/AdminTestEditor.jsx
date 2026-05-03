import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI, ocrAPI, publicAPI } from '../../services/api';
import toast from 'react-hot-toast';

const defaultQuestion = () => ({
  questionText: '',
  questionImageUrl: '',
  explanation: '',
  marks: 4,
  negativeMarks: 1,
  isMultipleCorrect: false,
  options: [
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
  ],
});

export default function AdminTestEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState([]);
  const [step, setStep] = useState(1); // 1: Test Details, 2: Questions
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [uploadingImageFor, setUploadingImageFor] = useState(null);

  // Test details
  const [testData, setTestData] = useState({
    title: '', description: '', instructions: '', sectionId: '',
    durationMinutes: 60, status: 'DRAFT',
    negativeMarking: false, negativeMarkValue: 0.25,
    allowRetake: false, maxAttempts: 1,
    showAnswersAfter: true, isFullScreen: true,
    startDate: '', expiryDate: '',
  });

  const [existingTest, setExistingTest] = useState(null);
  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSub, setSelectedSub] = useState('');

  useEffect(() => {
    adminAPI.getCategories().then(r => setCategories(r.data.categories));
    if (isEdit) {
      adminAPI.getTest(id).then(r => {
        const t = r.data.test;
        setExistingTest(t);
        setTestData({
          title: t.title, description: t.description || '', instructions: t.instructions || '',
          sectionId: t.sectionId, durationMinutes: t.durationMinutes, status: t.status,
          negativeMarking: t.negativeMarking, negativeMarkValue: t.negativeMarkValue,
          allowRetake: t.allowRetake, maxAttempts: t.maxAttempts,
          showAnswersAfter: t.showAnswersAfter, isFullScreen: t.isFullScreen,
          startDate: t.startDate ? t.startDate.slice(0, 16) : '',
          expiryDate: t.expiryDate ? t.expiryDate.slice(0, 16) : '',
        });
        if (t.questions?.length > 0) {
          setQuestions(t.questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            questionImageUrl: q.questionImageUrl || '',
            explanation: q.explanation || '',
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            isMultipleCorrect: q.isMultipleCorrect,
            options: q.options.map(o => ({ id: o.id, optionText: o.optionText, isCorrect: o.isCorrect, imageUrl: o.imageUrl || '' })),
          })));
        }
        // Set category/sub selections from existing section
        const cat = r.data.test.section?.subcategory?.category;
        const sub = r.data.test.section?.subcategory;
        if (cat) setSelectedCat(cat.id);
        if (sub) setSelectedSub(sub.id);
      });
    }
  }, [id]);

  // Helper: find subcategories for selected category
  const currentCategory = categories.find(c => c.id === selectedCat);
  const currentSubcategory = currentCategory?.subcategories?.find(s => s.id === selectedSub);
  const currentSections = currentSubcategory?.sections || [];

  // Save test
  const saveTest = async (publishNow = false) => {
    if (!testData.title.trim()) { toast.error('Test title is required'); return null; }
    if (!testData.sectionId) { toast.error('Please select a section'); return null; }

    const data = {
      ...testData,
      status: publishNow ? 'PUBLISHED' : testData.status,
      startDate: testData.startDate || null,
      expiryDate: testData.expiryDate || null,
    };

    setSaving(true);
    try {
      let test;
      if (isEdit) {
        const r = await adminAPI.updateTest(id, data);
        test = r.data.test;
      } else {
        const r = await adminAPI.createTest(data);
        test = r.data.test;
      }
      return test;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save test');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const proceedToQuestions = async () => {
    const test = await saveTest();
    if (test) {
      if (!isEdit) {
        navigate(`/admin/tests/${test.id}/edit`, { replace: true });
      }
      setStep(2);
      toast.success('Test details saved');
    }
  };

  const saveQuestions = async () => {
    const testId = id || existingTest?.id;
    if (!testId) { toast.error('Save test details first'); return; }

    const validQuestions = questions.filter(q => q.questionText.trim());
    if (validQuestions.length === 0) { toast.error('Add at least one question'); return; }

    const hasNoOptions = validQuestions.some(q => q.options.filter(o => o.optionText.trim()).length < 2);
    if (hasNoOptions) { toast.error('Each question must have at least 2 options'); return; }

    const hasNoCorrect = validQuestions.some(q => !q.options.some(o => o.isCorrect));
    if (hasNoCorrect) { toast.error('Each question must have at least one correct option'); return; }

    setSaving(true);
    try {
      // If editing, update individually; if creating, batch add
      if (isEdit) {
        // Update existing questions, add new ones
        const existing = validQuestions.filter(q => q.id);
        const newOnes = validQuestions.filter(q => !q.id);
        await Promise.all(existing.map(q => adminAPI.updateQuestion(q.id, q)));
        if (newOnes.length > 0) await adminAPI.addQuestions(testId, newOnes);
      } else {
        await adminAPI.addQuestions(testId, validQuestions);
      }
      toast.success('Questions saved!');
      navigate('/admin/tests');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  // OCR import
  const handleOcr = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await ocrAPI.extract(formData);
      const extracted = r.data.questions;
      if (extracted.length > 0) {
        setQuestions(prev => [...prev.filter(q => q.questionText.trim()), ...extracted]);
        toast.success(`Imported ${extracted.length} question(s) from OCR. Review before saving.`);
      } else {
        toast.error('No questions could be extracted. Please check the image quality.');
      }
    } catch {
      toast.error('OCR failed. Please try again with a clearer image.');
    } finally {
      setOcrLoading(false);
      e.target.value = '';
    }
  };

  const uploadQuestionImage = async (qIdx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImageFor(qIdx);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const r = await publicAPI.uploadImage(formData);
      updateQuestion(qIdx, 'questionImageUrl', r.data.url);
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImageFor(null);
      e.target.value = '';
    }
  };

  const addQuestion = () => setQuestions(q => [...q, defaultQuestion()]);
  const removeQuestion = (idx) => setQuestions(q => q.filter((_, i) => i !== idx));
  const updateQuestion = (idx, field, value) => {
    setQuestions(q => q.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const updateOption = (qIdx, oIdx, field, value) => {
    setQuestions(q => q.map((item, i) => {
      if (i !== qIdx) return item;
      const options = item.options.map((o, j) => {
        if (j !== oIdx) return field === 'isCorrect' && !item.isMultipleCorrect ? { ...o, isCorrect: false } : o;
        return { ...o, [field]: value };
      });
      return { ...item, options };
    }));
  };
  const addOption = (qIdx) => {
    setQuestions(q => q.map((item, i) => i !== qIdx ? item : {
      ...item, options: [...item.options, { optionText: '', isCorrect: false }],
    }));
  };
  const removeOption = (qIdx, oIdx) => {
    setQuestions(q => q.map((item, i) => i !== qIdx ? item : {
      ...item, options: item.options.filter((_, j) => j !== oIdx),
    }));
  };

  const field = (label, node) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <label className="label">{label}</label>
      {node}
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="section-title">{isEdit ? 'Edit Test' : 'Create New Test'}</h1>
          <p className="section-subtitle">Step {step} of 2</p>
        </div>
        <button onClick={() => navigate('/admin/tests')} className="btn btn-secondary">✕ Cancel</button>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {['Test Details', 'Questions'].map((label, i) => (
          <div key={i} style={{
            flex: 1, padding: '0.75rem 1rem',
            borderRadius: '10px', textAlign: 'center',
            background: step === i + 1 ? 'rgba(249,115,22,0.15)' : step > i + 1 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
            border: step === i + 1 ? '1px solid rgba(249,115,22,0.4)' : step > i + 1 ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
            color: step === i + 1 ? '#f97316' : step > i + 1 ? '#22c55e' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '0.875rem', cursor: step > i + 1 ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }} onClick={() => step > i + 1 && setStep(i + 1)}>
            {step > i + 1 ? '✓ ' : `${i + 1}. `}{label}
          </div>
        ))}
      </div>

      {/* STEP 1: Test Details */}
      {step === 1 && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              {field('Test Title *', <input className="input" value={testData.title} onChange={e => setTestData(d => ({ ...d, title: e.target.value }))} placeholder="e.g., JEE Main Physics Chapter 1 Mock Test" />)}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              {field('Description', <textarea className="input" rows={2} value={testData.description} onChange={e => setTestData(d => ({ ...d, description: e.target.value }))} placeholder="Brief description of the test..." style={{ resize: 'vertical' }} />)}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              {field('Instructions for Students', <textarea className="input" rows={3} value={testData.instructions} onChange={e => setTestData(d => ({ ...d, instructions: e.target.value }))} placeholder="Instructions shown before the test starts..." style={{ resize: 'vertical' }} />)}
            </div>

            {/* Category selection */}
            {field('Category *', (
              <select className="input" value={selectedCat} onChange={e => { setSelectedCat(e.target.value); setSelectedSub(''); setTestData(d => ({ ...d, sectionId: '' })); }}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ))}
            {field('Subcategory *', (
              <select className="input" value={selectedSub} onChange={e => { setSelectedSub(e.target.value); setTestData(d => ({ ...d, sectionId: '' })); }} disabled={!selectedCat}>
                <option value="">Select Subcategory</option>
                {(categories.find(c => c.id === selectedCat)?.subcategories || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ))}
            {field('Section *', (
              <select className="input" value={testData.sectionId} onChange={e => setTestData(d => ({ ...d, sectionId: e.target.value }))} disabled={!selectedSub}>
                <option value="">Select Section</option>
                {currentSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ))}
            {field('Status', (
              <select className="input" value={testData.status} onChange={e => setTestData(d => ({ ...d, status: e.target.value }))}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="UNPUBLISHED">Unpublished</option>
              </select>
            ))}

            {field('Duration (minutes) *', <input type="number" className="input" value={testData.durationMinutes} onChange={e => setTestData(d => ({ ...d, durationMinutes: parseInt(e.target.value) || 60 }))} min={5} max={360} />)}
            {field('Max Attempts', <input type="number" className="input" value={testData.maxAttempts} onChange={e => setTestData(d => ({ ...d, maxAttempts: parseInt(e.target.value) || 1 }))} min={1} max={10} />)}
            {field('Start Date/Time', <input type="datetime-local" className="input" value={testData.startDate} onChange={e => setTestData(d => ({ ...d, startDate: e.target.value }))} />)}
            {field('Expiry Date/Time', <input type="datetime-local" className="input" value={testData.expiryDate} onChange={e => setTestData(d => ({ ...d, expiryDate: e.target.value }))} />)}
          </div>

          {/* Toggles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { key: 'negativeMarking', label: '⚠️ Negative Marking', desc: 'Deduct marks for wrong answers' },
              { key: 'allowRetake', label: '🔄 Allow Retakes', desc: 'Let students attempt multiple times' },
              { key: 'showAnswersAfter', label: '✅ Show Answers After', desc: 'Display correct answers post-submission' },
              { key: 'isFullScreen', label: '⛶ Full-Screen Mode', desc: 'Force fullscreen during exam' },
            ].map(toggle => (
              <div key={toggle.key} style={{
                padding: '1rem', borderRadius: '10px',
                background: testData[toggle.key] ? 'rgba(249,115,22,0.05)' : 'rgba(255,255,255,0.03)',
                border: testData[toggle.key] ? '1px solid rgba(249,115,22,0.2)' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s',
              }} onClick={() => setTestData(d => ({ ...d, [toggle.key]: !d[toggle.key] }))}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{toggle.label}</span>
                  <div style={{
                    width: 40, height: 22, borderRadius: '11px',
                    background: testData[toggle.key] ? '#f97316' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 3, width: 16, height: 16,
                      borderRadius: '50%', background: 'white',
                      left: testData[toggle.key] ? 21 : 3, transition: 'left 0.2s',
                    }} />
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{toggle.desc}</p>
              </div>
            ))}
          </div>

          {testData.negativeMarking && field('Negative Mark Value', (
            <input type="number" className="input" style={{ maxWidth: '200px' }} value={testData.negativeMarkValue}
              onChange={e => setTestData(d => ({ ...d, negativeMarkValue: parseFloat(e.target.value) || 0.25 }))}
              step={0.25} min={0} max={4} />
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => saveTest()} className="btn btn-secondary" disabled={saving}>
              💾 Save Draft
            </button>
            <button onClick={proceedToQuestions} className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Next: Add Questions →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Questions */}
      {step === 2 && (
        <div>
          {/* OCR Import Bar */}
          <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.125rem' }}>📸 OCR Import</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload an image or PDF to auto-extract questions</p>
            </div>
            <label style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleOcr} />
              <div className={`btn btn-secondary btn-sm ${ocrLoading ? 'disabled' : ''}`}>
                {ocrLoading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Extracting...</> : '📷 Upload Image/PDF'}
              </div>
            </label>
            <button onClick={addQuestion} className="btn btn-primary btn-sm">+ Add Question</button>
          </div>

          {/* Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: 700, color: '#f97316' }}>Question {qIdx + 1}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={q.isMultipleCorrect}
                        onChange={e => updateQuestion(qIdx, 'isMultipleCorrect', e.target.checked)} />
                      Multiple Correct
                    </label>
                    <button onClick={() => removeQuestion(qIdx)} className="btn btn-danger btn-sm" disabled={questions.length === 1}>🗑</button>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="label" style={{ marginBottom: 0 }}>Question Text *</label>
                    <label style={{ cursor: 'pointer' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadQuestionImage(qIdx, e)} disabled={uploadingImageFor === qIdx} />
                      <div className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        {uploadingImageFor === qIdx ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Uploading...</> : '📷 Add Image'}
                      </div>
                    </label>
                  </div>
                  {q.questionImageUrl && (
                    <div style={{ marginBottom: '0.75rem', position: 'relative', display: 'inline-block' }}>
                      <img src={q.questionImageUrl} alt="Question" style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      <button onClick={() => updateQuestion(qIdx, 'questionImageUrl', '')} className="btn btn-danger btn-sm" style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  )}
                  <textarea className="input" rows={3} value={q.questionText}
                    onChange={e => updateQuestion(qIdx, 'questionText', e.target.value)}
                    placeholder="Enter the question..." style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="label">Marks</label>
                    <input type="number" className="input" value={q.marks} min={0} step={0.5}
                      onChange={e => updateQuestion(qIdx, 'marks', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="label">Negative Marks</label>
                    <input type="number" className="input" value={q.negativeMarks} min={0} step={0.25}
                      onChange={e => updateQuestion(qIdx, 'negativeMarks', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>

                {/* Options */}
                <div>
                  <label className="label">Options ({q.isMultipleCorrect ? 'Multiple' : 'Single'} Correct)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options.map((o, oIdx) => (
                      <div key={oIdx} style={{
                        display: 'flex', gap: '0.75rem', alignItems: 'center',
                        padding: '0.625rem', borderRadius: '8px',
                        background: o.isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                        border: o.isCorrect ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
                        transition: 'all 0.2s',
                      }}>
                        <input
                          type={q.isMultipleCorrect ? 'checkbox' : 'radio'}
                          name={`q${qIdx}-correct`}
                          checked={o.isCorrect}
                          onChange={() => updateOption(qIdx, oIdx, 'isCorrect', !o.isCorrect)}
                          style={{ accentColor: '#22c55e', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {['A', 'B', 'C', 'D', 'E', 'F'][oIdx]}
                        </span>
                        <input className="input" style={{ border: 'none', background: 'transparent', padding: '0', flex: 1 }}
                          value={o.optionText}
                          onChange={e => updateOption(qIdx, oIdx, 'optionText', e.target.value)}
                          placeholder={`Option ${['A', 'B', 'C', 'D'][oIdx] || oIdx + 1}`} />
                        {q.options.length > 2 && (
                          <button onClick={() => removeOption(qIdx, oIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>×</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addOption(qIdx)} className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>+ Add Option</button>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label className="label">Explanation / Solution (optional)</label>
                  <textarea className="input" rows={2} value={q.explanation}
                    onChange={e => updateQuestion(qIdx, 'explanation', e.target.value)}
                    placeholder="Explain the correct answer..." style={{ resize: 'vertical' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button onClick={() => setStep(1)} className="btn btn-secondary">← Back</button>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={addQuestion} className="btn btn-secondary">+ Question</button>
              <button onClick={saveQuestions} className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '💾 Save Questions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
