import React, { useState } from 'react';
import { RefreshCw, Sun, Moon, LayoutDashboard, MapPin, Settings, ScrollText, ChevronRight, ShieldCheck, LogOut, User as UserIcon, BarChart3 } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import RoleGuideModal from './RoleGuideModal';

export default function Header({
  isBackendOnline,
  onRefresh,
  theme,
  toggleTheme,
  activePage,
  activeTab
}) {
  const [showRoleGuide, setShowRoleGuide] = useState(false);
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

  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      logout();
    }
  };
  const getBreadcrumb = () => {
    if (activePage === 'kpis') {
      return (
        <div className="header-breadcrumb">
          <BarChart3 size={16} className="breadcrumb-icon" style={{ color: '#06b6d4' }} />
          <span className="breadcrumb-root">AeroPub</span>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-active">KPI & Statistiques</span>
        </div>
      );
    }
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
          <span className="breadcrumb-active">Paramètres / Configuration</span>
        </div>
      );
    }
    if (activePage === 'audit') {
      return (
        <div className="header-breadcrumb">
          <ScrollText size={16} className="breadcrumb-icon" />
          <span className="breadcrumb-root">AeroPub</span>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-active">Journal technique & Audit Log</span>
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

          {/* notifications */}
          <NotificationBell />
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

          {/* Bouton Guide des Rôles accessible à TOUS les utilisateurs */}
          <button
            type="button"
            onClick={() => setShowRoleGuide(true)}
            className="btn-secondary"
            title="Consulter le Guide des Rôles & Permissions (Qui peut faire quoi ?)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--accent-secondary)' }} />
            <span>Guide Rôles 💡</span>
          </button>

          {/* Profil utilisateur & Rôle */}
          {user && (
            <div className="user-header-badge">
              <div className="user-avatar">
                {user.nom ? user.nom.charAt(0).toUpperCase() : <UserIcon size={14} />}
              </div>
              <div className="user-details">
                <span className="user-name">{user.nom}</span>
                <span
                  className={`user-role-pill role-${user.role?.toLowerCase()}`}
                  onClick={() => setShowRoleGuide(true)}
                  title="Cliquez pour consulter le Guide des Rôles & Droits"
                  style={{ cursor: 'pointer' }}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="btn-logout"
                title="Déconnexion"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modale d'aide globale sur les rôles accessible à tout le monde */}
      <RoleGuideModal
        isOpen={showRoleGuide}
        onClose={() => setShowRoleGuide(false)}
      />
    </header>
  );
}
