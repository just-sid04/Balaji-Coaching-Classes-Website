import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminModeration() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getComments();
      setComments(r.data.comments);
    } catch { toast.error('Failed to load comments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const deleteComment = async (id) => {
    if (!confirm('Remove this comment?')) return;
    try {
      await adminAPI.deleteComment(id);
      toast.success('Comment removed');
      setComments(c => c.filter(cm => cm.id !== id));
    } catch { toast.error('Failed to remove comment'); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Comment Moderation</h1>
        <p className="section-subtitle">{comments.length} active comments across all tests</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <p>No comments to moderate</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Test</th>
                <th>Comment</th>
                <th>Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#f97316' }}>
                        {c.user?.name?.charAt(0)}
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{c.user?.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.test?.title}
                  </td>
                  <td style={{ maxWidth: '300px', fontSize: '0.875rem' }}>
                    <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {c.content}
                    </p>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <button onClick={() => deleteComment(c.id)} className="btn btn-danger btn-sm">🗑 Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
