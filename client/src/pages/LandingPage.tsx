import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages.css';

/* ── Sample portfolio items ──────────────────────────────────────────────────── */
const SAMPLE_ITEMS = [
  { id: 1, title: 'Urban Timelapses', creator: 'Maya Reyes', category: 'Photography', emoji: '🌆', gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)' },
  { id: 2, title: 'Short Film: Echoes', creator: 'James Okafor', category: 'Film',        emoji: '🎭', gradient: 'linear-gradient(135deg,#0891b2,#0e7490)' },
  { id: 3, title: 'Brand Reel 2025',   creator: 'Sofia Chen',   category: 'Commercial',  emoji: '📽️', gradient: 'linear-gradient(135deg,#059669,#047857)' },
  { id: 4, title: 'Music Video: Neon', creator: 'Alex Martín',  category: 'Music Video', emoji: '🎵', gradient: 'linear-gradient(135deg,#d97706,#b45309)' },
  { id: 5, title: 'Wedding Highlights', creator: 'Priya Nair',  category: 'Event',       emoji: '💒', gradient: 'linear-gradient(135deg,#db2777,#9d174d)' },
  { id: 6, title: 'Travel Vlog: Japan', creator: 'Luca Bianchi',category: 'Travel',      emoji: '🗾', gradient: 'linear-gradient(135deg,#7c3aed,#06b6d4)' },
];

const FEATURES = [
  { icon: '☁️',  iconClass: 'purple', title: 'Cloud Video Uploads',     desc: 'Upload MP4, WebM and more directly from your device. Files land in secure S3-compatible storage — no manual hosting needed.' },
  { icon: '🔗',  iconClass: 'cyan',   title: 'YouTube & Vimeo Links',   desc: 'Paste any YouTube or Vimeo URL and ReelFolio will fetch the thumbnail and embed the player automatically.' },
  { icon: '🌐',  iconClass: 'green',  title: 'Public Portfolio URL',    desc: 'Every creator gets a shareable link at reelfolio.app/u/username — perfect for client proposals and job applications.' },
  { icon: '🖼️', iconClass: 'amber',  title: 'Customisable Profile',    desc: 'Add a bio, skills, and social links. Choose which projects are featured or kept as drafts until you\'re ready.' },
  { icon: '📊',  iconClass: 'purple', title: 'Creator Dashboard',       desc: 'Manage all your projects in one place — search, filter by category, reorder, publish, or delete with a single click.' },
  { icon: '🔒',  iconClass: 'cyan',   title: 'Private by Default',      desc: 'Draft projects are never visible to the public. Only the content you publish appears on your portfolio page.' },
];

const LandingPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  // Subtle parallax on hero grid
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * 20;
      heroRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero__grid" ref={heroRef} aria-hidden="true" />

        <div className="container hero__content fade-up">
          {/* Left */}
          <div className="hero__left">
            <div className="hero__eyebrow" aria-hidden="true">
              🚀 Now in Public Beta
            </div>

            <h1 id="hero-heading" className="hero__title">
              Your video work<br />
              deserves a <span>proper stage</span>
            </h1>

            <p className="hero__subtitle">
              ReelFolio is the all-in-one platform for creators to upload videos,
              link YouTube &amp; Vimeo, organise projects, and share a stunning
              public portfolio in minutes.
            </p>

            <div className="hero__actions">
              <Link to="/register" className="btn btn--primary btn--lg" id="hero-cta-primary">
                Create your portfolio →
              </Link>
              <Link to="/#gallery" className="btn btn--ghost btn--lg" id="hero-cta-secondary">
                See examples
              </Link>
            </div>

            <div className="hero__stats">
              <div>
                <div className="hero__stat-value">100%</div>
                <div className="hero__stat-label">Free beta access</div>
              </div>
              <div>
                <div className="hero__stat-value">&lt; 2 min</div>
                <div className="hero__stat-label">Time to first portfolio</div>
              </div>
              <div>
                <div className="hero__stat-value">∞</div>
                <div className="hero__stat-label">Projects supported</div>
              </div>
            </div>
          </div>

          {/* Right — demo card */}
          <div className="hero__right" aria-hidden="true">
            {/* Floating badges */}
            <div className="hero__badge hero__badge--1">
              <span>✅</span> Published to portfolio
            </div>
            <div className="hero__badge hero__badge--2">
              <span>👁️</span> 1,240 profile views
            </div>

            <div className="hero__demo">
              <div className="hero__demo-header">
                <div className="hero__demo-dot" style={{ background: '#ef4444' }} />
                <div className="hero__demo-dot" style={{ background: '#f59e0b' }} />
                <div className="hero__demo-dot" style={{ background: '#10b981' }} />
              </div>
              <div className="hero__demo-video">
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(6,182,212,0.3) 100%)' }} />
                <div className="hero__demo-play" tabIndex={0} role="button" aria-label="Play demo video">▶</div>
              </div>
              <div className="hero__demo-info">
                <div className="hero__demo-title">Short Film: Luminance — Director's Cut</div>
                <div className="hero__demo-meta">
                  <span className="badge badge--primary">Film</span>
                  <span>·</span>
                  <span>Published</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="glow-divider" />

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="features" id="features" aria-labelledby="features-heading">
        <div className="container">
          <header className="features__header">
            <p className="section-eyebrow">Why ReelFolio</p>
            <h2 id="features-heading" className="section-title" style={{ marginTop: 8, marginBottom: 12 }}>
              Everything a creator needs
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              From cloud uploads to shareable links — all the tools to showcase your best work, professionally.
            </p>
          </header>

          <div className="features__grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="card feature-card">
                <div className={`feature-card__icon feature-card__icon--${f.iconClass}`} aria-hidden="true">
                  {f.icon}
                </div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <hr className="glow-divider" />

      {/* ── GALLERY ──────────────────────────────────────────────────────── */}
      <section className="gallery-section" id="gallery" aria-labelledby="gallery-heading">
        <div className="container">
          <header className="gallery-section__header">
            <p className="section-eyebrow">Portfolio examples</p>
            <h2 id="gallery-heading" className="section-title" style={{ marginTop: 8, marginBottom: 12 }}>
              Creators love ReelFolio
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              Sample portfolios crafted by creators across every discipline — all powered by ReelFolio.
            </p>
          </header>

          <div className="gallery-grid" role="list">
            {SAMPLE_ITEMS.map(item => (
              <article key={item.id} className="gallery-card" role="listitem">
                <div className="gallery-card__thumb">
                  <div className="gallery-card__thumb-bg" style={{ background: item.gradient }}>
                    <span aria-hidden="true">{item.emoji}</span>
                  </div>
                  <div className="gallery-card__overlay" aria-hidden="true">
                    <div className="gallery-card__play">▶</div>
                  </div>
                </div>
                <div className="gallery-card__body">
                  <div className="gallery-card__title">{item.title}</div>
                  <div className="gallery-card__meta">
                    <span className="badge badge--accent">{item.category}</span>
                    <span>·</span>
                    <span>{item.creator}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <hr className="glow-divider" />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="cta-section" id="pricing" aria-labelledby="cta-heading">
        <div className="container cta-section__inner">
          <p className="section-eyebrow">Free during beta</p>
          <h2 id="cta-heading" className="cta-section__title">
            Ready to share your work?
          </h2>
          <p className="section-subtitle">
            Join early and get full access. No credit card required.
          </p>
          <div className="cta-section__actions">
            <Link to="/register" className="btn btn--primary btn--lg" id="cta-register">
              Create free portfolio →
            </Link>
            <Link to="/login" className="btn btn--ghost btn--lg" id="cta-login">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
