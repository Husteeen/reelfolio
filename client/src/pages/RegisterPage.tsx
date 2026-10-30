import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/pages.css';

interface FormData { name: string; username: string; email: string; password: string; confirmPassword: string; }
interface FieldErrors { name?: string; username?: string; email?: string; password?: string; confirmPassword?: string; }

function validate(d: FormData): FieldErrors {
  const e: FieldErrors = {};
  if (!d.name.trim()) e.name = 'Display name is required.';
  if (!/^[a-z0-9_]{3,30}$/.test(d.username)) e.username = 'Username must be 3-30 lowercase letters, numbers, or underscores.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Please enter a valid email address.';
  if (d.password.length < 8) e.password = 'Password must be at least 8 characters.';
  if (d.password !== d.confirmPassword) e.confirmPassword = 'Passwords do not match.';
  return e;
}

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form,     setForm]     = useState<FormData>({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [errors,   setErrors]   = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(err => ({ ...err, [name]: undefined }));
    setApiError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    setLoading(true);
    const err = await register(form.name, form.username, form.email, form.password);
    if (err) { setApiError(err); setLoading(false); return; }
    navigate('/dashboard');
  };

  return (
    <div className="auth-page" role="main">
      <div className="auth-card fade-up">
        <div className="auth-card__logo">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎬</div>
        </div>
        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">Start building your video portfolio today.</p>

        {apiError && <div className="auth-error" role="alert">{apiError}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="reg-name">Display name</label>
            <input id="reg-name" name="name" type="text" className={`input ${errors.name ? 'input--error' : ''}`}
              placeholder="Jane Filmmaker" value={form.name} onChange={handleChange} autoComplete="name" />
            {errors.name && <span style={{ color: 'var(--clr-danger)', fontSize: '0.8rem' }} role="alert">{errors.name}</span>}
          </div>

          <div className="field">
            <label htmlFor="reg-username">Username</label>
            <input id="reg-username" name="username" type="text" className={`input ${errors.username ? 'input--error' : ''}`}
              placeholder="janefilmmaker" value={form.username} onChange={handleChange} autoComplete="username" />
            {errors.username && <span style={{ color: 'var(--clr-danger)', fontSize: '0.8rem' }} role="alert">{errors.username}</span>}
            <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>
              Your public URL: reelfolio.app/u/{form.username || 'username'}
            </span>
          </div>

          <div className="field">
            <label htmlFor="reg-email">Email address</label>
            <input id="reg-email" name="email" type="email" className={`input ${errors.email ? 'input--error' : ''}`}
              placeholder="jane@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
            {errors.email && <span style={{ color: 'var(--clr-danger)', fontSize: '0.8rem' }} role="alert">{errors.email}</span>}
          </div>

          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" name="password" type="password" className={`input ${errors.password ? 'input--error' : ''}`}
              placeholder="Min. 8 characters" value={form.password} onChange={handleChange} autoComplete="new-password" />
            {errors.password && <span style={{ color: 'var(--clr-danger)', fontSize: '0.8rem' }} role="alert">{errors.password}</span>}
          </div>

          <div className="field">
            <label htmlFor="reg-confirm">Confirm password</label>
            <input id="reg-confirm" name="confirmPassword" type="password" className={`input ${errors.confirmPassword ? 'input--error' : ''}`}
              placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
            {errors.confirmPassword && <span style={{ color: 'var(--clr-danger)', fontSize: '0.8rem' }} role="alert">{errors.confirmPassword}</span>}
          </div>

          <button id="reg-submit" type="submit" className="btn btn--primary" disabled={loading}
            style={{ marginTop: 'var(--sp-sm)', justifyContent: 'center' }}>
            {loading ? 'Creating account…' : 'Create free account'}
          </button>

          <p className="auth-form__footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
