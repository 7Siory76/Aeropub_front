import React, { useState } from 'react';
import { RefreshCw, Sun, Moon, LayoutDashboard, MapPin, Settings, ScrollText, ChevronRight, ShieldCheck, LogOut, User as UserIcon, BarChart3, Menu, BookOpen } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import RoleGuideModal from './RoleGuideModal';
import AppGuideModal from './AppGuideModal';

export default function Header({
  isBackendOnline,
  onRefresh,
  theme,
  toggleTheme,
  activePage,
  activeTab,
  onToggleMobileSidebar
}) {
  const [showRoleGuide, setShowRoleGuide] = useState(false);
  const [showAppGuide, setShowAppGuide] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const tabLabels = {
    emplacements: 'Supports & Emplacements',
    abonnements: 'Abonnements & Contrats',
    clients: 'Clients & Contacts',
    typesupports: 'Types de supports',
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
          <span className="breadcrumb-active">Paramètres & Configuration</span>
        </div>
      );
    }
    if (activePage === 'audit') {
      return (
        <div className="header-breadcrumb">
          <ScrollText size={16} className="breadcrumb-icon" />
          <span className="breadcrumb-root">AeroPub</span>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-active">Journal technique & Audit</span>
        </div>
      );
    }
    return (
      <div className="header-breadcrumb">
        <LayoutDashboard size={16} className="breadcrumb-icon" />
        <span className="breadcrumb-root">AeroPub</span>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-sub">Tableau de bord</span>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-active">{tabLabels[activeTab] || 'Référentiel'}</span>
      </div>
    );
  };

  return (
    <header className="header-glass">
      <div className="header-inner">
        {/* Menu mobile et fil d'Ariane */}
        <div className="header-left">
          {onToggleMobileSidebar && (
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={onToggleMobileSidebar}
              aria-label="Ouvrir le menu de navigation"
              title="Menu de navigation"
            >
              <Menu size={20} />
              <span className="mobile-menu-text">Menu</span>
            </button>
          )}
          {getBreadcrumb()}
        </div>

        {/* Actions et profil utilisateur */}
        <div className="header-actions">
          <div className="api-status-badge desktop-only-header-item">
            <span className={`status-dot ${isBackendOnline ? 'status-online' : 'status-offline'}`}></span>
            <span>{isBackendOnline ? 'API en ligne' : 'API hors ligne'}</span>
          </div>

          <NotificationBell />

          <button
            onClick={toggleTheme}
            className="btn-secondary btn-refresh"
            title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
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
            onClick={async () => {
              if (refreshing) return;
              setRefreshing(true);
              try {
                if (onRefresh) await onRefresh();
              } finally {
                setTimeout(() => setRefreshing(false), 500);
              }
            }}
            disabled={refreshing}
            className="btn-secondary btn-refresh desktop-only-header-item"
            title="Actualiser les données"
          >
            <RefreshCw size={16} className={refreshing ? 'btn-spinner' : ''} />
            <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRoleGuide(true)}
            className="btn-secondary desktop-only-header-item"
            title="Consulter le guide des rôles et des permissions"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--accent-secondary)' }} />
            <span>Guide des rôles</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAppGuide(true)}
            className="btn-secondary desktop-only-header-item"
            title="Consulter le guide complet de l'application"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', borderColor: 'rgba(56, 189, 248, 0.3)' }}
          >
            <BookOpen size={16} style={{ color: '#38bdf8' }} />
            <span>Guide d'utilisation</span>
          </button>

          {/* Profil utilisateur */}
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
                  title="Consulter le guide des rôles et des droits"
                  style={{ cursor: 'pointer' }}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-logout"
                title="Déconnexion"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      <RoleGuideModal
        isOpen={showRoleGuide}
        onClose={() => setShowRoleGuide(false)}
      />

      <AppGuideModal
        isOpen={showAppGuide}
        onClose={() => setShowAppGuide(false)}
      />
    </header>
  );
}
