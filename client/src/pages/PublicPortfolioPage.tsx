import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/pages.css';

interface PublicProfile {
  username: string; displayName: string; bio?: string;
  avatarUrl?: string; skills: string[]; socialLinks?: Record<string,string>;
}
interface Video {
  id: string; title: string; description?: string; sourceType: string;
  sourceUrl?: string; thumbnailUrl?: string; isFeatured: boolean;
  category?: { name: string };
}

function getEmbedUrl(sourceType: string, sourceUrl?: string): string | null {
  if (!sourceUrl) return null;
  if (sourceType === 'YOUTUBE') {
    const m = sourceUrl.match(/(?:watch\?v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  }
  if (sourceType === 'VIMEO') {
    const m = sourceUrl.match(/vimeo\.com\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  return null;
}

const PublicPortfolioPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [videos,  setVideos]  = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [playId,  setPlayId]  = useState<string | null>(null);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (!username) return;
    Promise.all([
      fetch(`/api/v1/profile/${username}`).then(r => r.json()),
      fetch(`/api/v1/videos/public/${username}`).then(r => r.json()),
    ]).then(([pData, vData]) => {
      if (pData.success) setProfile(pData.profile);
      else setError('Portfolio not found.');
      if (vData.success) setVideos(vData.videos);
    }).catch(() => setError('Could not load portfolio.')).finally(() => setLoading(false));
  }, [username]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );
  if (error) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-md)' }}>
      <span style={{ fontSize: '3rem' }}>🔒</span>
      <p style={{ color: 'var(--clr-text-2)' }}>{error}</p>
      <Link to="/" className="btn btn--primary">Go home</Link>
    </div>
  );
  if (!profile) return null;

  const initials = profile.displayName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const featured = videos.find(v => v.isFeatured) ?? videos[0];

  return (
    <div className="portfolio-page" role="main">
      {/* Profile hero */}
      <section className="portfolio-hero" aria-labelledby="portfolio-name">
        <div className="container">
          <div className="profile-card">
            <div className="profile-avatar" aria-hidden="true">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <div className="profile-info">
              <h1 id="portfolio-name" className="profile-info__name">{profile.displayName}</h1>
              <p className="profile-info__username">@{profile.username}</p>
              {profile.bio && <p className="profile-info__bio">{profile.bio}</p>}
              {profile.skills?.length > 0 && (
                <div style={{ marginTop: 'var(--sp-md)', display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-sm)' }}>
                  {profile.skills.map(s => <span key={s} className="badge badge--accent">{s}</span>)}
                </div>
              )}
            </div>
            <button id="portfolio-copy-link" className="btn btn--ghost btn--sm hide-mobile"
              style={{ marginLeft: 'auto', flexShrink: 0 }} onClick={copyLink}>
              {copied ? '✅ Copied!' : '🔗 Copy link'}
            </button>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: 'var(--sp-3xl)' }}>
        {/* Featured video */}
        {featured && (() => {
          const embedUrl = getEmbedUrl(featured.sourceType, featured.sourceUrl);
          return (
            <div style={{ marginBottom: 'var(--sp-2xl)' }}>
              <p className="section-eyebrow" style={{ marginBottom: 'var(--sp-md)' }}>
                {featured.isFeatured ? '⭐ Featured' : '🎬 Latest'}
              </p>
              <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', aspectRatio: '16/9', background: 'var(--clr-surface)' }}>
                {embedUrl
                  ? <iframe src={embedUrl} title={featured.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 'none' }} />
                  : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem' }}>🎬</div>
                }
              </div>
              <h2 style={{ marginTop: 'var(--sp-md)', fontFamily: 'var(--font-head)', fontSize: '1.5rem' }}>{featured.title}</h2>
              {featured.description && <p style={{ color: 'var(--clr-text-2)', marginTop: 'var(--sp-xs)' }}>{featured.description}</p>}
            </div>
          );
        })()}

        {/* Video gallery */}
        {videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-3xl) 0' }}>
            <p style={{ color: 'var(--clr-text-2)' }}>No published videos yet.</p>
          </div>
        ) : (
          <>
            <p className="section-eyebrow" style={{ marginBottom: 'var(--sp-md)' }}>All videos</p>
            <div className="gallery-grid">
              {videos.map(v => {
                const embedUrl = getEmbedUrl(v.sourceType, v.sourceUrl);
                return (
                  <article key={v.id} className="gallery-card">
                    <div className="gallery-card__thumb" style={{ position: 'relative' }}>
                      {playId === v.id && embedUrl ? (
                        <iframe src={`${embedUrl}?autoplay=1`} title={v.title}
                          allow="autoplay; fullscreen" allowFullScreen
                          style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }} />
                      ) : (
                        <>
                          <div className="gallery-card__thumb-bg" style={{ background: 'var(--clr-surface-2)' }}>
                            {v.thumbnailUrl
                              ? <img src={v.thumbnailUrl} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span>🎬</span>
                            }
                          </div>
                          <div className="gallery-card__overlay">
                            <button className="gallery-card__play" onClick={() => setPlayId(v.id)} aria-label={`Play ${v.title}`}>▶</button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="gallery-card__body">
                      <div className="gallery-card__title">{v.title}</div>
                      <div className="gallery-card__meta">
                        {v.category && <span className="badge badge--accent">{v.category.name}</span>}
                        <span>{v.sourceType}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicPortfolioPage;
