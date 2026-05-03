import { useEffect, useState } from 'react';
import { studentAPI, publicAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', college: '', targetExam: 'JEE' });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', college: user.college || '', targetExam: user.targetExam || 'JEE' });
  }, [user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await publicAPI.uploadImage(formData);
      const newImageUrl = res.data.url;

      // Update backend profile
      const updateRes = await studentAPI.updateProfile({ ...form, profileImageUrl: newImageUrl });
      updateUser({ ...updateRes.data.user, profileImageUrl: newImageUrl });
      toast.success('Profile picture updated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image. Please check your connection or file size.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      const r = await studentAPI.updateProfile(form);
      updateUser(r.data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">My Profile</h1>
        <p className="section-subtitle">Manage your account details</p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={user?.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 900, color: 'white', flexShrink: 0 }}>
                {user?.name?.charAt(0)}
              </div>
            )}
            
            <label style={{
              position: 'absolute', bottom: 0, right: -4,
              background: '#3b82f6', color: 'white',
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: '2px solid var(--bg-card)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} title="Upload profile picture">
              {uploadingImage ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <span style={{ fontSize: '0.8rem' }}>📷</span>}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          </div>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem' }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
            <span className="badge badge-success" style={{ marginTop: '0.375rem', fontSize: '0.7rem' }}>✓ Active Student</span>
          </div>
        </div>

        {editing ? (
          <div>
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
              { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
              { label: 'College / School', key: 'college', type: 'text', placeholder: 'Your institution' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '1.25rem' }}>
                <label className="label">{f.label}</label>
                <input type={f.type} className="input" placeholder={f.placeholder}
                  value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Target Exam</label>
              <select className="input" value={form.targetExam} onChange={e => setForm(f => ({ ...f, targetExam: e.target.value }))}>
                {['JEE', 'NEET', 'MHT-CET', 'Other'].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setEditing(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={save} className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Email', value: user?.email, icon: '📧' },
                { label: 'Phone', value: user?.phone || '—', icon: '📱' },
                { label: 'College', value: user?.college || '—', icon: '🏫' },
                { label: 'Target Exam', value: user?.targetExam || '—', icon: '🎯' },
                { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—', icon: '📅' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{row.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                    <div style={{ fontWeight: 600, marginTop: '0.125rem' }}>{row.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setEditing(true)} className="btn btn-primary" style={{ width: '100%' }}>✏️ Edit Profile</button>
          </div>
        )}
      </div>

      {/* Contact card */}
      <div className="card" style={{ marginTop: '1rem', padding: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Need Help?</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href="https://wa.me/919960102201" target="_blank" rel="noopener noreferrer"
            className="btn btn-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
            💬 WhatsApp Prof. Thakare
          </a>
          <a href="tel:+919960102201" className="btn btn-sm" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}>
            📞 Call: +91 99601 02201
          </a>
        </div>
      </div>
    </div>
  );
}
