import React from 'react';
import { RefreshCw, Radio, Sun, Moon, LayoutDashboard, MapPin, Settings } from 'lucide-react';

export default function Header({ isBackendOnline, onRefresh, theme, toggleTheme, activePage, setActivePage }) {
  return (
    <header className="header-glass">
      <div className="header-inner">
        {/* Logo AeroPub */}
        <div className="logo-badge">
          <Radio size={28} className="logo-icon" />
          <span>AeroPub FRONT_OFFICE</span>
        </div>

        {/* Boutons de Navigation de Page */}
        <div className="category-pills" style={{ width: 'auto', marginBottom: 0 }}>
          <button
            className={`pill-btn ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            <LayoutDashboard size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Tableau de Bord
          </button>

          <button
            className={`pill-btn ${activePage === 'planning' ? 'active' : ''}`}
            onClick={() => setActivePage('planning')}
          >
            <MapPin size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Planning & Zones
          </button>

          <button
            className={`pill-btn ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => setActivePage('settings')}
          >
            <Settings size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Paramètres
          </button>
        </div>

        {/* API Status Badge, Theme Toggle & Refresh */}
        <div className="header-actions">
          <div className="api-status-badge">
            <span className={`status-dot ${isBackendOnline ? 'status-online' : 'status-offline'}`}></span>
            <span>{isBackendOnline ? 'API En Ligne' : 'API Hors Ligne'}</span>
          </div>

          {/* Mode Nuit / Jour */}
          <button
            onClick={toggleTheme}
            className="btn-secondary btn-refresh"
            title={theme === 'dark' ? 'Passer en Mode Jour' : 'Passer en Mode Nuit'}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={16} style={{ color: '#f59e0b' }} />
                <span>Jour</span>
              </>
            ) : (
              <>
                <Moon size={16} style={{ color: '#6366f1' }} />
                <span>Nuit</span>
              </>
            )}
          </button>

          <button 
            onClick={onRefresh} 
            className="btn-secondary btn-refresh" 
            title="Rafraîchir les données API"
          >
            <RefreshCw size={16} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>
    </header>
  );
}
