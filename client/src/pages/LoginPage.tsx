import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/pages.css';

const LoginPage: React.FC = () => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = (location.state as any)?.from?.pathname ?? '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setApiError('Please enter your email and password.'); return; }
    setApiError('');
    setLoading(true);
    const err = await login(email, password);
    if (err) { setApiError(err); setLoading(false); return; }
    navigate(from, { replace: true });
  };

  return (
    <div className="auth-page" role="main">
      <div className="auth-card fade-up">
        <div className="auth-card__logo">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎬</div>
        </div>
        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to manage your portfolio.</p>

        {apiError && <div className="auth-error" role="alert" style={{ marginBottom: 'var(--sp-md)' }}>{apiError}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="login-email">Email address</label>
            <input id="login-email" type="email" className="input" placeholder="jane@example.com"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" className="input" placeholder="Your password"
              value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>

          <button id="login-submit" type="submit" className="btn btn--primary" disabled={loading}
            style={{ marginTop: 'var(--sp-sm)', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="auth-form__footer">
            Don't have an account? <Link to="/register">Create one free</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
