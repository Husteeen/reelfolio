import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProfileForm {
  displayName: string;
  bio: string;
  avatarUrl: string;
  skills: string;
  visibility: string;
  website: string;
  twitter: string;
  linkedin: string;
  instagram: string;
}

const ProfileSettingsPage: React.FC = () => {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>({
    displayName: '', bio: '', avatarUrl: '', skills: '',
    visibility: 'PUBLIC', website: '', twitter: '', linkedin: '', instagram: '',
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    fetch('/api/v1/profile/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const p = d.profile;
          const links = (p.socialLinks as any) ?? {};
          setForm({
            displayName: p.displayName ?? '',
            bio:         p.bio ?? '',
            avatarUrl:   p.avatarUrl ?? '',
            skills:      (p.skills ?? []).join(', '),
            visibility:  p.visibility ?? 'PUBLIC',
            website:     links.website ?? '',
            twitter:     links.twitter ?? '',
            linkedin:    links.linkedin ?? '',
            instagram:   links.instagram ?? '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError(''); setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) { setError('Display name is required.'); return; }
    setSaving(true);
    const res = await fetch('/api/v1/profile/me', {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: form.displayName.trim(),
        bio:         form.bio.trim() || null,
        avatarUrl:   form.avatarUrl.trim() || null,
        skills:      form.skills.split(',').map(s => s.trim()).filter(Boolean),
        visibility:  form.visibility,
        socialLinks: {
          website:   form.website.trim() || null,
          twitter:   form.twitter.trim() || null,
          linkedin:  form.linkedin.trim() || null,
          instagram: form.instagram.trim() || null,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.message ?? 'Save failed.'); } else { setSuccess(true); await refresh(); }
    setSaving(false);
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
        <a href="/dashboard/profile" className="sidebar__link active">👤 Profile</a>
      </aside>

      <main className="dashboard__main">
        <header className="dashboard__header">
          <h1 className="dashboard__title">Profile Settings</h1>
          <p className="dashboard__subtitle">Customise how you appear on your public portfolio.</p>
        </header>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-2xl)' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--sp-lg)', alignItems: 'start' }}>
            {/* Form */}
            <div className="card">
              {error   && <div className="auth-error" role="alert" style={{ marginBottom: 'var(--sp-md)' }}>{error}</div>}
              {success && <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: 'var(--sp-md)', fontSize: '0.9rem' }}>✅ Profile saved!</div>}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
                <div className="field">
                  <label htmlFor="ps-name">Display name *</label>
                  <input id="ps-name" name="displayName" type="text" style={inputStyle} value={form.displayName} onChange={handle} placeholder="Your full name" />
                </div>

                <div className="field">
                  <label htmlFor="ps-bio">Bio</label>
                  <textarea id="ps-bio" name="bio" rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                    value={form.bio} onChange={handle} placeholder="Tell the world what you do…" />
                </div>

                <div className="field">
                  <label htmlFor="ps-avatar">Avatar URL</label>
                  <input id="ps-avatar" name="avatarUrl" type="url" style={inputStyle} value={form.avatarUrl} onChange={handle} placeholder="https://…" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>Paste a direct image link (Gravatar, Imgur, etc.)</span>
                </div>

                <div className="field">
                  <label htmlFor="ps-skills">Skills / specialisations</label>
                  <input id="ps-skills" name="skills" type="text" style={inputStyle} value={form.skills} onChange={handle} placeholder="Filmmaking, Color Grading, Motion Graphics" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>Comma-separated list</span>
                </div>

                <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-md)' }}>
                  <p style={{ fontWeight: 600, marginBottom: 'var(--sp-md)', fontSize: '0.9375rem' }}>Social links</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
                    {[
                      { id: 'ps-website',   name: 'website',   label: '🌐 Website',   ph: 'https://yoursite.com' },
                      { id: 'ps-twitter',   name: 'twitter',   label: '𝕏 Twitter/X',  ph: 'https://x.com/…' },
                      { id: 'ps-linkedin',  name: 'linkedin',  label: '💼 LinkedIn',   ph: 'https://linkedin.com/in/…' },
                      { id: 'ps-instagram', name: 'instagram', label: '📸 Instagram',  ph: 'https://instagram.com/…' },
                    ].map(s => (
                      <div className="field" key={s.name}>
                        <label htmlFor={s.id}>{s.label}</label>
                        <input id={s.id} name={s.name} type="url" style={inputStyle}
                          value={(form as any)[s.name]} onChange={handle} placeholder={s.ph} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="ps-visibility">Portfolio visibility</label>
                  <select id="ps-visibility" name="visibility" style={inputStyle} value={form.visibility} onChange={handle}>
                    <option value="PUBLIC">Public — anyone can view your portfolio</option>
                    <option value="PRIVATE">Private — portfolio hidden from public</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 'var(--sp-md)' }}>
                  <button type="submit" className="btn btn--primary" disabled={saving}>
                    {saving ? 'Saving…' : '💾 Save profile'}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => navigate('/dashboard')}>Cancel</button>
                </div>
              </form>
            </div>

            {/* Preview card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', marginBottom: 'var(--sp-md)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Preview</p>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, margin: '0 auto var(--sp-md)', overflow: 'hidden' }}>
                  {form.avatarUrl
                    ? <img src={form.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : (form.displayName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?')
                  }
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', fontWeight: 700 }}>{form.displayName || 'Your Name'}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--clr-text-3)', marginBottom: 'var(--sp-sm)' }}>@{user?.username}</div>
                {form.bio && <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-2)', marginBottom: 'var(--sp-md)' }}>{form.bio.slice(0,120)}{form.bio.length > 120 ? '…' : ''}</p>}
                {form.skills && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 'var(--sp-md)' }}>
                    {form.skills.split(',').slice(0,4).map(s => s.trim()).filter(Boolean).map(s => (
                      <span key={s} className="badge badge--accent" style={{ fontSize: '0.7rem' }}>{s}</span>
                    ))}
                  </div>
                )}
                <a href={`/u/${user?.username}`} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm" style={{ width: '100%', justifyContent: 'center' }}>
                  🌐 View public page
                </a>
              </div>

              <div className="card" style={{ fontSize: '0.875rem' }}>
                <p style={{ fontWeight: 600, marginBottom: 'var(--sp-sm)' }}>Your portfolio URL</p>
                <div style={{ background: 'var(--clr-bg)', borderRadius: 'var(--r-sm)', padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--clr-text-2)', overflowWrap: 'break-word' }}>
                  {window.location.origin}/u/{user?.username}
                </div>
                <button className="btn btn--ghost btn--sm" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--sp-sm)' }}
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/u/${user?.username}`); }}>
                  🔗 Copy link
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfileSettingsPage;
