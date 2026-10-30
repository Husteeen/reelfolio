import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Category { id: string; name: string; }

const EditVideoPage: React.FC = () => {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', sourceUrl: '', categoryId: '',
    status: 'DRAFT', isFeatured: false,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/videos/${id}`, { credentials: 'include' }).then(r => r.json()),
      fetch('/api/v1/categories').then(r => r.json()),
    ]).then(([vData, cData]) => {
      if (vData.success) {
        const v = vData.video;
        setForm({
          title:       v.title ?? '',
          description: v.description ?? '',
          sourceUrl:   v.sourceUrl ?? '',
          categoryId:  v.categoryId ?? '',
          status:      v.status ?? 'DRAFT',
          isFeatured:  v.isFeatured ?? false,
        });
      } else { setError('Video not found.'); }
      if (cData.success) setCategories(cData.categories ?? []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    const res = await fetch(`/api/v1/videos/${id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, categoryId: form.categoryId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.message ?? 'Save failed.'); setSaving(false); return; }
    navigate('/dashboard');
  };

  const inputStyle: React.CSSProperties = {
    padding: '12px 16px', background: 'var(--clr-surface)',
    border: '1.5px solid var(--clr-border)', borderRadius: 'var(--r-md)',
    color: 'var(--clr-text)', fontSize: '0.9375rem', outline: 'none', width: '100%',
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <p className="sidebar__label">Portfolio</p>
        <a href="/dashboard"         className="sidebar__link">📊 Overview</a>
        <a href="/dashboard/add"     className="sidebar__link">➕ Add Video</a>
        <a href="/dashboard/profile" className="sidebar__link">👤 Profile</a>
      </aside>

      <main className="dashboard__main">
        <header className="dashboard__header">
          <h1 className="dashboard__title">Edit Video</h1>
          <p className="dashboard__subtitle">Update your video details.</p>
        </header>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-2xl)' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div className="card" style={{ maxWidth: 600 }}>
            {error && <div className="auth-error" role="alert" style={{ marginBottom: 'var(--sp-md)' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <div className="field">
                <label htmlFor="ev-title">Title *</label>
                <input id="ev-title" name="title" type="text" style={inputStyle} value={form.title} onChange={handle} />
              </div>

              <div className="field">
                <label htmlFor="ev-desc">Description</label>
                <textarea id="ev-desc" name="description" rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.description} onChange={handle} />
              </div>

              <div className="field">
                <label htmlFor="ev-url">Video URL</label>
                <input id="ev-url" name="sourceUrl" type="url" style={inputStyle} value={form.sourceUrl} onChange={handle} placeholder="https://youtube.com/watch?v=…" />
              </div>

              <div className="field">
                <label htmlFor="ev-category">Category</label>
                <select id="ev-category" name="categoryId" style={inputStyle} value={form.categoryId} onChange={handle}>
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="field">
                <label htmlFor="ev-status">Status</label>
                <select id="ev-status" name="status" style={inputStyle} value={form.status} onChange={handle}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>

              {/* Featured toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', cursor: 'pointer', padding: 'var(--sp-md)', background: 'var(--clr-surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                <input id="ev-featured" name="isFeatured" type="checkbox"
                  checked={form.isFeatured} onChange={handle}
                  style={{ width: 18, height: 18, accentColor: 'var(--clr-primary)', cursor: 'pointer' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>⭐ Feature this video</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>Featured video appears at the top of your public portfolio</div>
                </div>
              </label>

              <div style={{ display: 'flex', gap: 'var(--sp-md)', marginTop: 'var(--sp-sm)' }}>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save changes'}
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => navigate('/dashboard')}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditVideoPage;
