import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'category'|'subcategory'|'section', data?, parentId? }
  const [form, setForm] = useState({ name: '', description: '', sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({});

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getCategories();
      setCategories(r.data.categories);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openModal = (type, data = null, parentId = null) => {
    setForm(data ? { name: data.name, description: data.description || '', sortOrder: data.sortOrder || 0 } : { name: '', description: '', sortOrder: 0 });
    setModal({ type, data, parentId });
  };

  const closeModal = () => { setModal(null); setForm({ name: '', description: '', sortOrder: 0 }); };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (modal.type === 'category') {
        if (modal.data) await adminAPI.updateCategory(modal.data.id, form);
        else await adminAPI.createCategory(form);
      } else if (modal.type === 'subcategory') {
        if (modal.data) await adminAPI.updateSubcategory(modal.data.id, form);
        else await adminAPI.createSubcategory({ ...form, categoryId: modal.parentId });
      } else if (modal.type === 'section') {
        if (modal.data) await adminAPI.updateSection(modal.data.id, form);
        else await adminAPI.createSection({ ...form, subcategoryId: modal.parentId });
      }
      toast.success('Saved successfully');
      closeModal();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const del = async (type, id, name) => {
    if (!confirm(`Delete "${name}"? All nested items will be deleted.`)) return;
    try {
      if (type === 'category') await adminAPI.deleteCategory(id);
      else if (type === 'subcategory') await adminAPI.deleteSubcategory(id);
      else await adminAPI.deleteSection(id);
      toast.success('Deleted');
      fetchCategories();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  const typeLabels = { category: 'Category', subcategory: 'Subcategory', section: 'Section' };
  const typeColors = { JEE: '#3b82f6', NEET: '#22c55e', 'MHT-CET': '#f97316' };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="section-title">Category Management</h1>
          <p className="section-subtitle">Manage exam categories, subcategories, and sections</p>
        </div>
        <button onClick={() => openModal('category')} className="btn btn-primary">
          + Add Category
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {categories.map(cat => (
            <div key={cat.id} className="card" style={{ padding: '1.25rem' }}>
              {/* Category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => toggle(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  {expanded[cat.id] ? '▼' : '▶'}
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem', borderRadius: '20px',
                    background: `${typeColors[cat.name] || '#f97316'}20`,
                    color: typeColors[cat.name] || '#f97316',
                    border: `1px solid ${typeColors[cat.name] || '#f97316'}30`,
                    fontWeight: 700, fontSize: '0.9rem',
                  }}>{cat.name}</span>
                  {cat.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{cat.description}</span>}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({cat.subcategories?.length || 0} subcategories)</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openModal('subcategory', null, cat.id)} className="btn btn-secondary btn-sm">+ Sub</button>
                  <button onClick={() => openModal('category', cat)} className="btn btn-secondary btn-sm">✏️</button>
                  <button onClick={() => del('category', cat.id, cat.name)} className="btn btn-danger btn-sm">🗑</button>
                </div>
              </div>

              {/* Subcategories */}
              {expanded[cat.id] && (
                <div style={{ marginLeft: '2.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cat.subcategories?.map(sub => (
                    <div key={sub.id}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '10px', border: '1px solid var(--border)',
                      }}>
                        <button onClick={() => toggle(sub.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          {expanded[sub.id] ? '▼' : '▶'}
                        </button>
                        <span style={{ fontWeight: 600, flex: 1 }}>{sub.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({sub.sections?.length || 0} sections)</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => openModal('section', null, sub.id)} className="btn btn-secondary btn-sm">+ Section</button>
                          <button onClick={() => openModal('subcategory', sub)} className="btn btn-secondary btn-sm">✏️</button>
                          <button onClick={() => del('subcategory', sub.id, sub.name)} className="btn btn-danger btn-sm">🗑</button>
                        </div>
                      </div>

                      {/* Sections */}
                      {expanded[sub.id] && (
                        <div style={{ marginLeft: '2rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          {sub.sections?.map(sec => (
                            <div key={sec.id} style={{
                              display: 'flex', alignItems: 'center', gap: '1rem',
                              padding: '0.625rem 1rem',
                              background: 'rgba(249,115,22,0.03)',
                              borderRadius: '8px', border: '1px solid rgba(249,115,22,0.1)',
                            }}>
                              <span style={{ fontSize: '0.875rem', flex: 1, color: 'var(--text-secondary)' }}>📁 {sec.name}</span>
                              <div style={{ display: 'flex', gap: '0.375rem' }}>
                                <button onClick={() => openModal('section', sec)} className="btn btn-secondary btn-sm">✏️</button>
                                <button onClick={() => del('section', sec.id, sec.name)} className="btn btn-danger btn-sm">🗑</button>
                              </div>
                            </div>
                          ))}
                          {sub.sections?.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>No sections yet</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {cat.subcategories?.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem' }}>No subcategories yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No categories found. Click "+ Add Category" to get started.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, marginBottom: '1.5rem' }}>
              {modal.data ? 'Edit' : 'Add'} {typeLabels[modal.type]}
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={`${typeLabels[modal.type]} name`} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Sort Order</label>
              <input type="number" className="input" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
              <button onClick={save} className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
