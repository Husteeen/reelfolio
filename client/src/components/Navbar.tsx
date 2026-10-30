import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/navbar.css';

const Navbar: React.FC = () => {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="container navbar__inner">
          <Link to="/" className="navbar__logo" aria-label="ReelFolio home">
            <div className="navbar__logo-icon" aria-hidden="true">🎬</div>
            ReelFolio
          </Link>

          <ul className="navbar__nav" role="list">
            <li><Link to="/#features">Features</Link></li>
            <li><Link to="/#gallery">Gallery</Link></li>
            {user && <li><Link to={`/u/${user.username}`}>My Portfolio</Link></li>}
          </ul>

          <div className="navbar__actions">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn--ghost btn--sm">Dashboard</Link>
                <button onClick={handleLogout} className="btn btn--outline btn--sm">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn btn--ghost btn--sm">Sign in</Link>
                <Link to="/register" className="btn btn--primary btn--sm">Get started</Link>
              </>
            )}
          </div>

          <button
            className="navbar__hamburger"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen(o => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className={`navbar__mobile-menu ${mobileOpen ? 'open' : ''}`} role="menu">
        <Link to="/#features" role="menuitem">Features</Link>
        <Link to="/#gallery"  role="menuitem">Gallery</Link>
        {user ? (
          <>
            <Link to="/dashboard" role="menuitem">Dashboard</Link>
            <button onClick={handleLogout} className="btn btn--outline" style={{ textAlign: 'left' }}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login"    role="menuitem">Sign in</Link>
            <Link to="/register" role="menuitem" className="btn btn--primary">Get started</Link>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;
