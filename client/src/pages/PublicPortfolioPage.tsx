import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface SocialLinks { website?: string; twitter?: string; linkedin?: string; instagram?: string; }
interface Profile {
  username: string; displayName: string; bio?: string; avatarUrl?: string;
  skills: string[]; socialLinks?: SocialLinks; viewCount?: number;
}
interface Video {
  id: string; title: string; description?: string; sourceType: string;
  sourceUrl?: string; thumbnailUrl?: string; isFeatured: boolean;
  category?: { name: string }; createdAt: string;
}

function getEmbedUrl(v: Video): string | null {
  if (!v.sourceUrl) return null;
  const yt = v.sourceUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;
  const vm = v.sourceUrl.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
  return v.sourceUrl; // direct upload (Cloudinary URL)
}

function getThumb(v: Video): string {
  if (v.thumbnailUrl) return v.thumbnailUrl;
  if (v.sourceUrl) {
    const yt = v.sourceUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`;
  }
  return '';
}

const PublicPortfolioPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [videos,     setVideos]     = useState<Video[]>([]);
  const [filtered,   setFiltered]   = useState<Video[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [playing,    setPlaying]    = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [copied,     setCopied]     = useState(false);
  const viewTracked  = useRef(false);

  useEffect(() => {
    if (!username) return;
    Promise.all([
      apiFetch(`/api/v1/profile/${username}`).then(r => r.json()),
      apiFetch(`/api/v1/videos/public/${username}`).then(r => r.json()),
    ]).then(([pData, vData]) => {
      if (!pData.success) { setNotFound(true); setLoading(false); return; }
      setProfile(pData.profile);
      const vids: Video[] = vData.success ? vData.videos : [];
      setVideos(vids); setFiltered(vids);
      setLoading(false);

      // Track view once per page load
      if (!viewTracked.current) {
        viewTracked.current = true;
        apiFetch(`/api/v1/analytics/view/${username}`, { method: 'POST' }).catch(() => {});
      }
    }).catch(() => { setNotFound(true); setLoading(false); });
  }, [username]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? videos.filter(v => v.title.toLowerCase().includes(q) || v.category?.name.toLowerCase().includes(q)) : videos);
  }, [search, videos]);

  const featured   = videos.find(v => v.isFeatured) ?? videos[0];
  const rest        = filtered.filter(v => v.id !== featured?.id);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const socialIcons: { key: keyof SocialLinks; icon: string; label: string }[] = [
    { key: 'website',   icon: '🌐', label: 'Website' },
    { key: 'twitter',   icon: '𝕏',  label: 'Twitter' },
    { key: 'linkedin',  icon: '💼', label: 'LinkedIn' },
    { key: 'instagram', icon: '📸', label: 'Instagram' },
  ];

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-lg)', textAlign: 'center', padding: 'var(--sp-xl)' }}>
      <div style={{ fontSize: '4rem' }}>🎬</div>
      <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2rem' }}>Portfolio not found</h1>
      <p style={{ color: 'var(--clr-text-2)' }}>This portfolio is private or doesn't exist.</p>
      <Link to="/" className="btn btn--primary">Go home</Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-bg)', paddingBottom: 'var(--sp-3xl)' }}>

      {/* ── Profile header ── */}
      <div style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)', borderBottom: '1px solid var(--clr-border)', padding: 'var(--sp-3xl) var(--sp-xl) var(--sp-2xl)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 'var(--sp-xl)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--grad-primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 800, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.1)' }}>
            {profile?.avatarUrl
              ? <img src={profile.avatarUrl} alt={profile.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (profile?.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>{profile?.displayName}</h1>
            <p style={{ color: 'var(--clr-text-3)', marginBottom: 'var(--sp-sm)', fontSize: '0.9rem' }}>@{username}</p>
            {profile?.bio && <p style={{ color: 'var(--clr-text-2)', fontSize: '0.9375rem', maxWidth: 520, lineHeight: 1.6, marginBottom: 'var(--sp-md)' }}>{profile.bio}</p>}

            {/* Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--sp-md)' }}>
                {profile.skills.map(s => <span key={s} className="badge badge--accent">{s}</span>)}
              </div>
            )}

            {/* Social links */}
            {profile?.socialLinks && (
              <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
                {socialIcons.map(({ key, icon, label }) => profile?.socialLinks?.[key] ? (
                  <a key={key} href={profile.socialLinks![key]} target="_blank" rel="noreferrer"
                    className="btn btn--ghost btn--sm" title={label}>{icon} {label}</a>
                ) : null)}
              </div>
            )}
          </div>

          {/* Stats + share */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)', alignItems: 'flex-end', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 'var(--sp-md)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-head)' }}>{videos.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>Videos</div>
              </div>
              {profile?.viewCount !== undefined && (
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-head)' }}>{profile.viewCount.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>Views</div>
                </div>
              )}
            </div>
            <button className="btn btn--ghost btn--sm" onClick={copyLink}>
              {copied ? '✅ Copied!' : '🔗 Share'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 var(--sp-xl)' }}>

        {/* ── Featured video ── */}
        {featured && (
          <div style={{ marginTop: 'var(--sp-2xl)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--clr-text-3)', marginBottom: 'var(--sp-md)' }}>
              ⭐ Featured
            </p>
            <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', background: '#000', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              {playing === featured.id ? (
                featured.sourceType === 'UPLOAD' ? (
                  <video src={featured.sourceUrl} controls autoPlay style={{ width: '100%', aspectRatio: '16/9', display: 'block' }} />
                ) : (
                  <iframe src={getEmbedUrl(featured) ?? ''} title={featured.title}
                    allow="autoplay; fullscreen" allowFullScreen
                    style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }} />
                )
              ) : (
                <div style={{ position: 'relative', aspectRatio: '16/9', cursor: 'pointer' }} onClick={() => setPlaying(featured.id)}>
                  {getThumb(featured) ? (
                    <img src={getThumb(featured)} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--clr-surface)' }} />
                  )}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>▶</div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 'var(--sp-md)' }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.25rem', fontWeight: 700 }}>{featured.title}</h2>
              {featured.description && <p style={{ color: 'var(--clr-text-2)', marginTop: 4, fontSize: '0.9rem' }}>{featured.description}</p>}
              {featured.category && <span className="badge badge--accent" style={{ marginTop: 8, display: 'inline-block' }}>{featured.category.name}</span>}
            </div>
          </div>
        )}

        {/* ── Search bar ── */}
        {videos.length > 3 && (
          <div style={{ marginTop: 'var(--sp-2xl)', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }}>🔍</span>
            <input type="text" placeholder="Search videos…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 40px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-border)', borderRadius: 'var(--r-md)', color: 'var(--clr-text)', fontSize: '0.9375rem', outline: 'none' }} />
          </div>
        )}

        {/* ── Gallery grid ── */}
        {rest.length > 0 && (
          <div style={{ marginTop: 'var(--sp-2xl)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--clr-text-3)', marginBottom: 'var(--sp-lg)' }}>
              All Videos ({rest.length})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--sp-lg)' }}>
              {rest.map(v => (
                <div key={v.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setPlaying(p => p === v.id ? null : v.id)}>
                  {playing === v.id ? (
                    v.sourceType === 'UPLOAD' ? (
                      <video src={v.sourceUrl} controls autoPlay style={{ width: '100%', aspectRatio: '16/9', display: 'block', background: '#000' }} />
                    ) : (
                      <iframe src={getEmbedUrl(v) ?? ''} title={v.title} allow="autoplay; fullscreen" allowFullScreen
                        style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }} />
                    )
                  ) : (
                    <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                      {getThumb(v) ? (
                        <img src={getThumb(v)} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--clr-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎬</div>
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.35)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', opacity: 0.9 }}>▶</div>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: 'var(--sp-md)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {v.category && <span className="badge badge--accent" style={{ fontSize: '0.7rem' }}>{v.category.name}</span>}
                      <span className="badge" style={{ fontSize: '0.7rem', background: 'var(--clr-surface-2)', color: 'var(--clr-text-3)' }}>{v.sourceType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {videos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--sp-3xl)', color: 'var(--clr-text-3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-md)' }}>🎬</div>
            <p>No published videos yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicPortfolioPage;
