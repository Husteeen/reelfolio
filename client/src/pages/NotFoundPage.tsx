import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => (
  <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--sp-xl)' }} role="main">
    <div style={{ fontSize: '5rem', marginBottom: 'var(--sp-lg)' }} aria-hidden="true">📽️</div>
    <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 800, marginBottom: 'var(--sp-md)' }}>
      404 — Not found
    </h1>
    <p style={{ color: 'var(--clr-text-2)', fontSize: '1.0625rem', maxWidth: 420, marginBottom: 'var(--sp-xl)' }}>
      This page doesn't exist or has been moved. Let's get you back on track.
    </p>
    <div style={{ display: 'flex', gap: 'var(--sp-md)' }}>
      <Link to="/" className="btn btn--primary">Go home</Link>
      <Link to="/dashboard" className="btn btn--ghost">Dashboard</Link>
    </div>
  </div>
);

export default NotFoundPage;
