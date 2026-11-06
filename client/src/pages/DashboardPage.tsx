import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

interface Video {
  id: string; title: string; description?: string; status: string;
  sourceType: string; sourceUrl?: string; thumbnailUrl?: string;
  isFeatured: boolean; category?: { name: string }; createdAt: string;
}
interface Stats { totalVideos: number; publishedVideos: number; draftVideos: number; viewCount: number; }

function getThumb(v: Video): string {
  if (v.thumbnailUrl) return v.thumbnailUrl;
  if (v.sourceUrl) {
    const yt = v.sourceUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`;
  }
  return '';
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [videos,   setVideos]   = useState<Video[]>([]);
  const [filtered, setFiltered] = useState<Video[]>([]);
  const [stats,    setStats]    = useState<Stats>({ totalVideos: 0, publishedVideos: 0, draftVideos: 0, viewCount: 0 });
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [vRes, sRes] = await Promise.all([
      apiFetch('/api/v1/videos'),
      apiFetch('/api/v1/analytics/me'),
    ]);
    const vData = await vRes.json();
    const sData = await sRes.json();
    if (vData.success) { setVideos(vData.videos); setFiltered(vData.videos); }
    if (sData.success) setStats(sData.stats);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = videos;
    if (filter !== 'ALL') result = result.filter(v => v.status === filter);
    if (search) result = result.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [videos, filter, search]);

  const toggle = async (id: string, field: 'status' | 'isFeatured', current: string | boolean) => {
    const body = field === 'status'
      ? { status:     current === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }
      : { isFeatured: !current };
    const res  = await apiFetch(`/api/v1/videos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    if (res.ok) load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this video? This cannot be undone.')) return;
    setDeleting(id);
    await apiFetch(`/api/v1/videos/${id}`, { method: 'DELETE' });
    setDeleting(null); load();
  };

  const statCards = [
    { label: 'Total Videos',     value: stats.totalVideos,     icon: '🎬', color: '#6366f1' },
    { label: 'Published',        value: stats.publishedVideos, icon: '✅', color: '#10b981' },
    { label: 'Drafts',           value: stats.draftVideos,     icon: '📝', color: '#f59e0b' },
    { label: 'Portfolio Views',  value: stats.viewCount,       icon: '👁',  color: '#8b5cf6' },
  ];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <p className="sidebar__label">Portfolio</p>
        <Link to="/dashboard"         className="sidebar__link active">📊 Overview</Link>
        <Link to="/dashboard/add"     className="sidebar__link">➕ Add Video</Link>
        <p className="sidebar__label">Account</p>
        <Link to="/dashboard/profile" className="sidebar__link">👤 Profile Settings</Link>
        {user?.username && (
          <a href={`/u/${user.username}`} target="_blank" rel="noreferrer" className="sidebar__link">🌐 Public Page</a>
        )}
      </aside>

      <main className="dashboard__main">
        <header className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="dashboard__subtitle">Manage and showcase your video portfolio.</p>
          </div>
          <Link to="/dashboard/add" className="btn btn--primary">➕ Add Video</Link>
        </header>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--sp-md)', marginBottom: 'var(--sp-xl)' }}>
          {statCards.map(s => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', padding: 'var(--sp-lg)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-head)', color: s.color }}>{s.value.toLocaleString()}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-3)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }}>🔍</span>
            <input type="text" placeholder="Search videos…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-border)', borderRadius: 'var(--r-md)', color: 'var(--clr-text)', fontSize: '0.9rem', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['ALL','PUBLISHED','DRAFT'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '8px 14px', borderRadius: 'var(--r-md)', border: '1.5px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                  borderColor: filter === f ? 'var(--clr-primary)' : 'var(--clr-border)',
                  background: filter === f ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: filter === f ? 'var(--clr-primary)' : 'var(--clr-text-2)' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Video list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-3xl)' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-3xl)', color: 'var(--clr-text-3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-md)' }}>🎬</div>
            <p style={{ marginBottom: 'var(--sp-lg)' }}>{search || filter !== 'ALL' ? 'No videos match your filter.' : 'No videos yet. Add your first one!'}</p>
            {!search && filter === 'ALL' && <Link to="/dashboard/add" className="btn btn--primary">➕ Add First Video</Link>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
            {filtered.map(v => (
              <div key={v.id} className="card" style={{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'center', padding: 'var(--sp-md) var(--sp-lg)' }}>
                {/* Thumbnail */}
                <div style={{ width: 80, height: 52, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--clr-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getThumb(v) ? (
                    <img src={getThumb(v)} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : <span style={{ fontSize: '1.5rem' }}>🎬</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{v.title}</span>
                    {v.isFeatured && <span className="badge" style={{ background: 'rgba(251,191,36,0.15)', color: '#f59e0b', fontSize: '0.7rem' }}>⭐ Featured</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {v.category && <span className="badge badge--accent" style={{ fontSize: '0.7rem' }}>{v.category.name}</span>}
                    <span className="badge" style={{ fontSize: '0.7rem', background: 'var(--clr-surface-2)', color: 'var(--clr-text-3)' }}>{v.sourceType}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => toggle(v.id, 'status', v.status)}
                    style={{ padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1.5px solid', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s',
                      borderColor: v.status === 'PUBLISHED' ? '#10b981' : 'var(--clr-border)',
                      background: v.status === 'PUBLISHED' ? 'rgba(16,185,129,0.1)' : 'transparent',
                      color: v.status === 'PUBLISHED' ? '#10b981' : 'var(--clr-text-3)' }}>
                    {v.status === 'PUBLISHED' ? '✅ Live' : '⬆ Publish'}
                  </button>
                  <button onClick={() => toggle(v.id, 'isFeatured', v.isFeatured)}
                    title={v.isFeatured ? 'Remove from featured' : 'Set as featured'}
                    style={{ padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1.5px solid', cursor: 'pointer', fontSize: '0.75rem', background: v.isFeatured ? 'rgba(251,191,36,0.12)' : 'transparent', borderColor: v.isFeatured ? '#f59e0b' : 'var(--clr-border)', color: v.isFeatured ? '#f59e0b' : 'var(--clr-text-3)' }}>
                    {v.isFeatured ? '⭐' : '☆'}
                  </button>
                  <Link to={`/dashboard/edit/${v.id}`}
                    style={{ padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--clr-border)', fontSize: '0.75rem', color: 'var(--clr-text-2)', textDecoration: 'none', fontWeight: 500 }}>
                    ✏️ Edit
                  </Link>
                  <button onClick={() => remove(v.id)} disabled={deleting === v.id}
                    style={{ padding: '5px 10px', borderRadius: 'var(--r-sm)', border: '1.5px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    {deleting === v.id ? '…' : '🗑'}
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
