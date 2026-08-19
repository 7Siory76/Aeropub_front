import React from 'react';
import { Heart, Radio } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-inner">
        <div className="footer-title">
          <Radio size={20} className="footer-icon" />
          <span>FRONT_OFFICE & BACK_OFFICE Ecosystem</span>
        </div>
        <p className="footer-desc">
          Développé avec React (Vite), Axios, React-Toastify, Node.js, Express & PostgreSQL.
        </p>
        <p className="footer-desc" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          Conçu avec <Heart size={14} className="heart-icon" /> pour une expérience vitrine fluide.
        </p>
      </div>
    </footer>
  );
}
