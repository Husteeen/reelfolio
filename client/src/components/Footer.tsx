import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer__grid">
        {/* Brand */}
        <div className="footer__brand">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.25rem' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🎬</span>
            ReelFolio
          </Link>
          <p className="footer__tagline">
            The all-in-one video portfolio platform for creators, filmmakers, editors, and visual storytellers.
          </p>
        </div>

        {/* Product */}
        <div>
          <p className="footer__heading">Product</p>
          <ul className="footer__links">
            <li><Link to="/register">Get started</Link></li>
            <li><Link to="/#features">Features</Link></li>
            <li><Link to="/#gallery">Gallery</Link></li>
            <li><Link to="/#pricing">Pricing</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <p className="footer__heading">Resources</p>
          <ul className="footer__links">
            <li><a href="#">Documentation</a></li>
            <li><a href="#">API Reference</a></li>
            <li><a href="#">Status</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <p className="footer__heading">Legal</p>
          <ul className="footer__links">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} ReelFolio. All rights reserved.</span>
        <span>Built with ❤️ for creators</span>
      </div>
    </div>
  </footer>
);

export default Footer;
