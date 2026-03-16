import React from 'react';
import './footer-style.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <p className="footer-eyebrow">Spark 2.0</p>
          <h2>Performance reviews without the clutter.</h2>
          <p className="footer-copy">
            Internal workspace for people management, department insights, and structured evaluations.
          </p>
        </div>
        <div className="footer-links">
          <div>
            <h3>Support</h3>
            <a href="/Support-Contact">Contact Us</a>
            <a href="/HR-Contact">HR Contact</a>
          </div>
          <div>
            <h3>Legal</h3>
            <a href="/Privacy-Policy">Privacy Policy</a>
            <a href="/Terms-of-Service">Terms of Service</a>
          </div>
          <div>
            <h3>Product</h3>
            <span>Version 2.0</span>
            <span>Internal Use Only</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
