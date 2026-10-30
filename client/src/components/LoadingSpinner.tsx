import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading…', fullPage = false }) => {
  const style: React.CSSProperties = fullPage
    ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--sp-md)' }
    : { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-md)', padding: 'var(--sp-xl)' };

  return (
    <div style={style} role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p style={{ color: 'var(--clr-text-3)', fontSize: '0.9375rem' }}>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
