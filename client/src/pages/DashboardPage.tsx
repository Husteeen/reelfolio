import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Video {
  id: string; title: string; description?: string; sourceType: string;
  sourceUrl?: string; thumbnailUrl?: string; status: string;
  isFeatured: boolean; category?: { name: string };
  createdAt: string;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [videos,   setVideos]   = useState<Video[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search,   setSearch]   = useState('');

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/v1/videos${search ? `?q=${encodeURIComponent(search)}` : ''}`, { credentials: 'include' });
    if (res.ok) { const d = await res.json(); setVideos(d.videos); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video? This cannot be undone.')) return;
    setDeleting(id);
    await fetch(`/api/v1/videos/${id}`, { method: 'DELETE', credentials: 'include' });
    setVideos(v => v.filter(x => x.id !== id));
    setDeleting(null);
  };

  const handlePublishToggle = async (video: Video) => {
    const newStatus = video.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const res = await fetch(`/api/v1/videos/${video.id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { const d = await res.json(); setVideos(v => v.map(x => x.id === video.id ? d.video : x)); }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  const published = videos.filter(v => v.status === 'PUBLISHED').length;
  const drafts    = videos.filter(v => v.status === 'DRAFT').length;

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar" aria-label="Dashboard navigation">
        <p className="sidebar__label">Portfolio</p>
        <Link to="/dashboard"         className="sidebar__link active">📊 Overview</Link>
        <Link to="/dashboard/add"     className="sidebar__link">➕ Add Video</Link>

        <p className="sidebar__label">Account</p>
        <Link to="/dashboard/profile" className="sidebar__link">👤 Profile Settings</Link>

        <div style={{ marginTop: 'auto', paddingTop: 'var(--sp-xl)' }}>
          {user && (
            <div style={{ padding: '0 var(--sp-md) var(--sp-md)', borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-md)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', marginBottom: 4 }}>Signed in as</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.displayName}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>@{user.username}</p>
            </div>
          )}
          <button className="btn btn--ghost btn--sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            ← Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard__main" id="main-content">
        <header className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Dashboard</h1>
            <p className="dashboard__subtitle">Welcome back, {user?.displayName} 👋</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap', marginTop: 'var(--sp-md)' }}>
            <Link to="/dashboard/add" className="btn btn--primary btn--sm" id="dash-add-video">+ Add video</Link>
            <Link to={`/u/${user?.username}`} className="btn btn--ghost btn--sm" id="dash-preview" target="_blank">🌐 View portfolio</Link>
          </div>
        </header>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { icon: '📁', label: 'Total',     value: videos.length },
            { icon: '✅', label: 'Published', value: published },
            { icon: '📝', label: 'Drafts',    value: drafts },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__icon">{s.icon}</div>
              <div className="stat-card__label">{s.label}</div>
              <div className="stat-card__value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)', alignItems: 'center' }}>
          <input className="input" placeholder="🔍  Search videos…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        </div>

        {/* Video list */}
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-2xl)' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : videos.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-3xl)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-md)' }}>🎬</div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.25rem', marginBottom: 'var(--sp-sm)' }}>
              No videos yet
            </h2>
            <p style={{ color: 'var(--clr-text-2)', marginBottom: 'var(--sp-lg)', maxWidth: 400, margin: '0 auto var(--sp-lg)' }}>
              Add a YouTube link, Vimeo link to get started. Upload support coming soon.
            </p>
            <Link to="/dashboard/add" className="btn btn--primary">Add your first video →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            {videos.map(v => (
              <div key={v.id} className="card" style={{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'center', padding: 'var(--sp-md)' }}>
                {/* Thumbnail */}
                <div style={{ width: 100, height: 60, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--clr-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {v.thumbnailUrl
                    ? <img src={v.thumbnailUrl} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.5rem' }}>🎬</span>
                  }
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                  <div style={{ display: 'flex', gap: 'var(--sp-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge ${v.status === 'PUBLISHED' ? 'badge--success' : 'badge--warning'}`}>{v.status}</span>
                    <span className="badge badge--accent">{v.sourceType}</span>
                    {v.category && <span className="badge badge--primary">{v.category.name}</span>}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexShrink: 0, flexWrap: 'wrap' }}>
                  <button className="btn btn--ghost btn--sm" title={v.isFeatured ? 'Remove featured' : 'Set as featured'}
                    onClick={async () => {
                      const res = await fetch(`/api/v1/videos/${v.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFeatured: !v.isFeatured }) });
                      if (res.ok) { const d = await res.json(); setVideos(vs => vs.map(x => x.id === v.id ? d.video : x)); }
                    }}>
                    {v.isFeatured ? '⭐ Featured' : '☆ Feature'}
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => handlePublishToggle(v)}>
                    {v.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link to={`/dashboard/edit/${v.id}`} className="btn btn--ghost btn--sm">Edit</Link>
                  <button className="btn btn--ghost btn--sm" style={{ color: 'var(--clr-danger)' }}
                    onClick={() => handleDelete(v.id)} disabled={deleting === v.id}>
                    {deleting === v.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
