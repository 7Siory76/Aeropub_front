import React from 'react';
import { RefreshCw, Sun, Moon, LayoutDashboard, MapPin, Settings, ChevronRight } from 'lucide-react';

export default function Header({
  isBackendOnline,
  onRefresh,
  theme,
  toggleTheme,
  activePage,
  activeTab
}) {
  const tabLabels = {
    emplacements: 'Supports & Emplacements',
    abonnements: 'Abonnements & Contrats',
    clients: 'Clients & Contacts',
    typesupports: 'Types de Support',
    zones: 'Aéroports & Zones',
    formats: 'Catégories',
    utilisateurs: 'Équipe & Rôles',
    actions: 'Suivi & Alertes J-30'
  };

  const getBreadcrumb = () => {
    if (activePage === 'planning') {
      return (
        <div className="header-breadcrumb">
          <MapPin size={16} className="breadcrumb-icon" />
          <span className="breadcrumb-root">AeroPub</span>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-active">Planning & Zones</span>
        </div>
      );
    }
    if (activePage === 'settings') {
      return (
        <div className="header-breadcrumb">
          <Settings size={16} className="breadcrumb-icon" />
          <span className="breadcrumb-root">AeroPub</span>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-active">Paramètres</span>
        </div>
      );
    }
    return (
      <div className="header-breadcrumb">
        <LayoutDashboard size={16} className="breadcrumb-icon" />
        <span className="breadcrumb-root">AeroPub</span>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-sub">Tableau de Bord</span>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-active">{tabLabels[activeTab] || 'Référentiel'}</span>
      </div>
    );
  };

  return (
    <header className="header-glass">
      <div className="header-inner">
        {/* Fil d'ariane (Breadcrumb) dynamique */}
        {getBreadcrumb()}

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
