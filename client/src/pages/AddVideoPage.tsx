import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Category { id: string; name: string; slug: string; }

const AddVideoPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const [form, setForm] = useState({
    title: '', description: '', sourceType: 'YOUTUBE',
    sourceUrl: '', categoryId: '', status: 'DRAFT',
  });

  useEffect(() => {
    fetch('/api/v1/categories').then(r => r.json()).then(d => setCategories(d.categories ?? []));
  }, []);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if ((form.sourceType === 'YOUTUBE' || form.sourceType === 'VIMEO') && !form.sourceUrl.trim()) {
      setError('Please enter a valid video URL.'); return;
    }
    setLoading(true);
    const res = await fetch('/api/v1/videos', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, categoryId: form.categoryId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.message ?? 'Failed to save video.'); setLoading(false); return; }
    navigate('/dashboard');
  };

  const inputStyle = { padding: '12px 16px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-border)', borderRadius: 'var(--r-md)', color: 'var(--clr-text)', fontSize: '0.9375rem', outline: 'none', width: '100%' };

  return (
    <div className="dashboard">
      <aside className="sidebar" aria-label="Dashboard navigation">
        <p className="sidebar__label">Portfolio</p>
        <a href="/dashboard"     className="sidebar__link">📊 Overview</a>
        <a href="/dashboard/add" className="sidebar__link active">➕ Add Video</a>
        <a href="/dashboard/profile" className="sidebar__link">👤 Profile</a>
      </aside>

      <main className="dashboard__main">
        <header className="dashboard__header">
          <h1 className="dashboard__title">Add Video</h1>
          <p className="dashboard__subtitle">Paste a YouTube or Vimeo link to add it to your portfolio.</p>
        </header>

        <div className="card" style={{ maxWidth: 600 }}>
          {error && <div className="auth-error" role="alert" style={{ marginBottom: 'var(--sp-md)' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <div className="field">
              <label htmlFor="av-title">Title *</label>
              <input id="av-title" name="title" type="text" style={inputStyle} placeholder="My awesome video" value={form.title} onChange={handle} />
            </div>

            <div className="field">
              <label htmlFor="av-desc">Description</label>
              <textarea id="av-desc" name="description" rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="What's this video about?" value={form.description} onChange={handle} />
            </div>

            <div className="field">
              <label htmlFor="av-type">Video source</label>
              <select id="av-type" name="sourceType" style={inputStyle} value={form.sourceType} onChange={handle}>
                <option value="YOUTUBE">YouTube</option>
                <option value="VIMEO">Vimeo</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="av-url">Video URL *</label>
              <input id="av-url" name="sourceUrl" type="url" style={inputStyle}
                placeholder={form.sourceType === 'YOUTUBE' ? 'https://www.youtube.com/watch?v=…' : 'https://vimeo.com/…'}
                value={form.sourceUrl} onChange={handle} />
            </div>

            <div className="field">
              <label htmlFor="av-category">Category</label>
              <select id="av-category" name="categoryId" style={inputStyle} value={form.categoryId} onChange={handle}>
                <option value="">— Select category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="av-status">Status</label>
              <select id="av-status" name="status" style={inputStyle} value={form.status} onChange={handle}>
                <option value="DRAFT">Draft (not visible publicly)</option>
                <option value="PUBLISHED">Published (visible in portfolio)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-md)', marginTop: 'var(--sp-sm)' }}>
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? 'Saving…' : '+ Save video'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => navigate('/dashboard')}>Cancel</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddVideoPage;
