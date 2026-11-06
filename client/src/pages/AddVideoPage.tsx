import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface Category { id: string; name: string; }
type SourceType = 'YOUTUBE' | 'VIMEO' | 'UPLOAD';

const AddVideoPage: React.FC = () => {
  const navigate = useNavigate();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [categories,  setCategories]  = useState<Category[]>([]);
  const [sourceType,  setSourceType]  = useState<SourceType>('YOUTUBE');
  const [form, setForm] = useState({ title: '', description: '', sourceUrl: '', categoryId: '', status: 'DRAFT' });
  const [file,        setFile]        = useState<File | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadPct,   setUploadPct]   = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [dragOver,    setDragOver]    = useState(false);

  useEffect(() => {
    apiFetch('/api/v1/categories').then(r => r.json()).then(d => {
      if (d.success) setCategories(d.categories);
    });
  }, []);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleFile = (f: File) => {
    if (f.size > 200 * 1024 * 1024) { setError('File exceeds 200 MB limit.'); return; }
    setFile(f); setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }

    let resolvedUrl = form.sourceUrl;
    let thumbnailUrl: string | undefined;

    // Upload file to Cloudinary first if UPLOAD type
    if (sourceType === 'UPLOAD') {
      if (!file) { setError('Please select a video file to upload.'); return; }
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);

        // XHR so we get progress
        const uploadResult = await new Promise<{ url: string; thumbnailUrl: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const apiBase = (import.meta.env.VITE_API_URL as string) ?? '';
          xhr.open('POST', `${apiBase}/api/v1/upload/video`);
          xhr.withCredentials = true;
          xhr.upload.addEventListener('progress', ev => {
            if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100));
          });
          xhr.onload = () => {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.success) resolve(data);
            else reject(new Error(data.message ?? 'Upload failed.'));
          };
          xhr.onerror = () => reject(new Error('Network error during upload.'));
          xhr.send(fd);
        });

        resolvedUrl  = uploadResult.url;
        thumbnailUrl = uploadResult.thumbnailUrl;
      } catch (err: any) {
        setError(err.message); setUploading(false); return;
      }
      setUploading(false);
    }

    setSaving(true);
    const res = await apiFetch('/api/v1/videos', {
      method: 'POST',
      body: JSON.stringify({
        title:       form.title.trim(),
        description: form.description.trim() || undefined,
        sourceType,
        sourceUrl:   resolvedUrl || undefined,
        categoryId:  form.categoryId || undefined,
        status:      form.status,
        ...(thumbnailUrl && { thumbnailUrl }),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.message ?? 'Failed to save video.'); setSaving(false); return; }
    navigate('/dashboard');
  };

  const inputStyle: React.CSSProperties = {
    padding: '12px 16px', background: 'var(--clr-surface)',
    border: '1.5px solid var(--clr-border)', borderRadius: 'var(--r-md)',
    color: 'var(--clr-text)', fontSize: '0.9375rem', width: '100%', outline: 'none',
  };

  const sourceTypes: { key: SourceType; label: string; icon: string }[] = [
    { key: 'YOUTUBE', label: 'YouTube',      icon: '▶' },
    { key: 'VIMEO',   label: 'Vimeo',        icon: '🎬' },
    { key: 'UPLOAD',  label: 'Direct Upload', icon: '☁' },
  ];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <p className="sidebar__label">Portfolio</p>
        <Link to="/dashboard"         className="sidebar__link">📊 Overview</Link>
        <Link to="/dashboard/add"     className="sidebar__link active">➕ Add Video</Link>
        <p className="sidebar__label">Account</p>
        <Link to="/dashboard/profile" className="sidebar__link">👤 Profile Settings</Link>
      </aside>

      <main className="dashboard__main">
        <header className="dashboard__header">
          <h1 className="dashboard__title">Add Video</h1>
          <p className="dashboard__subtitle">Add a YouTube/Vimeo link or upload your own file.</p>
        </header>

        <div className="card" style={{ maxWidth: 640 }}>
          {error && <div className="auth-error" role="alert" style={{ marginBottom: 'var(--sp-md)' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>

            {/* Source type selector */}
            <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
              {sourceTypes.map(s => (
                <button key={s.key} type="button"
                  onClick={() => { setSourceType(s.key); setFile(null); setError(''); }}
                  style={{
                    flex: 1, padding: '10px 8px', border: '1.5px solid',
                    borderColor: sourceType === s.key ? 'var(--clr-primary)' : 'var(--clr-border)',
                    background: sourceType === s.key ? 'rgba(99,102,241,0.12)' : 'var(--clr-surface)',
                    color: sourceType === s.key ? 'var(--clr-primary)' : 'var(--clr-text-2)',
                    borderRadius: 'var(--r-md)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                  }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            <div className="field">
              <label htmlFor="av-title">Title *</label>
              <input id="av-title" name="title" type="text" style={inputStyle} value={form.title} onChange={handle} placeholder="My Short Film — Director's Cut" />
            </div>

            <div className="field">
              <label htmlFor="av-desc">Description</label>
              <textarea id="av-desc" name="description" rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                value={form.description} onChange={handle} placeholder="What's this video about?" />
            </div>

            {/* URL input (YouTube / Vimeo) */}
            {(sourceType === 'YOUTUBE' || sourceType === 'VIMEO') && (
              <div className="field">
                <label htmlFor="av-url">{sourceType === 'YOUTUBE' ? 'YouTube' : 'Vimeo'} URL *</label>
                <input id="av-url" name="sourceUrl" type="url" style={inputStyle} value={form.sourceUrl} onChange={handle}
                  placeholder={sourceType === 'YOUTUBE' ? 'https://youtube.com/watch?v=...' : 'https://vimeo.com/...'} />
              </div>
            )}

            {/* File drop zone (Upload) */}
            {sourceType === 'UPLOAD' && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  borderRadius: 'var(--r-lg)', padding: 'var(--sp-2xl)', textAlign: 'center',
                  cursor: 'pointer', background: dragOver ? 'rgba(99,102,241,0.06)' : 'var(--clr-surface)',
                  transition: 'all 0.2s',
                }}>
                <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                {file ? (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎬</div>
                    <div style={{ fontWeight: 600 }}>{file.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', marginTop: 4 }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>☁️</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop your video here or click to browse</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>MP4, WebM, MOV — up to 200 MB</div>
                  </div>
                )}
              </div>
            )}

            {/* Upload progress bar */}
            {uploading && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.875rem' }}>
                  <span>Uploading to cloud…</span><span>{uploadPct}%</span>
                </div>
                <div style={{ background: 'var(--clr-border)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${uploadPct}%`, height: '100%', background: 'var(--grad-primary)', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
              <div className="field">
                <label htmlFor="av-category">Category</label>
                <select id="av-category" name="categoryId" style={inputStyle} value={form.categoryId} onChange={handle}>
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="av-status">Status</label>
                <select id="av-status" name="status" style={inputStyle} value={form.status} onChange={handle}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-md)', marginTop: 'var(--sp-sm)' }}>
              <button type="submit" className="btn btn--primary" disabled={saving || uploading}>
                {uploading ? `Uploading ${uploadPct}%…` : saving ? 'Saving…' : '💾 Save video'}
              </button>
              <Link to="/dashboard" className="btn btn--ghost">Cancel</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddVideoPage;
