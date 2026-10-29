import React, { useState, useRef } from 'react';
import {
  Radio,
  LayoutDashboard,
  MapPin,
  Settings,
  ChevronDown,
  ChevronRight,
  Tv,
  Calendar,
  Users,
  Layers,
  FolderKanban,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  ScrollText,
  BarChart3,
  BookOpen,
  X
} from 'lucide-react';
import { csvApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../utils/rbac';
import { useFeedback } from '../context/FeedbackContext';
import { sanitizeUserError } from '../utils/errorHandler';
import RoleGuideModal from './RoleGuideModal';
import AppGuideModal from './AppGuideModal';
import './Sidebar.css';

export default function Sidebar({
  activePage,
  setActivePage,
  activeTab,
  setActiveTab,
  isBackendOnline,
  theme,
  toggleTheme,
  onRefresh,
  counts = {},
  isMobileOpen = false,
  onCloseMobile
}) {
  const { user } = useAuth();
  const { showSuccess, showError } = useFeedback();
  const isAdmin = hasRole(user, ['Admin']);
  const [showRoleGuide, setShowRoleGuide] = useState(false);
  const [showAppGuide, setShowAppGuide] = useState(false);

  // Accordéon des tables
  const [isCrudPocketOpen, setIsCrudPocketOpen] = useState(true);
  // Barre latérale repliée
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Importation CSV en cours
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef(null);

  // Éléments du menu de données
  const allCrudItems = [
    { key: 'emplacements', label: 'Supports', icon: Tv, count: counts.emplacements },
    { key: 'abonnements', label: 'Abonnements', icon: Calendar, count: counts.abonnements },
    { key: 'clients', label: 'Clients & Contacts', icon: Users, count: counts.clients },
    { key: 'typesupports', label: 'Types de supports', icon: Layers, count: counts.typeSupports },
    { key: 'zones', label: 'Aéroports & Zones', icon: MapPin, count: counts.zones },
    { key: 'formats', label: 'Catégories', icon: FolderKanban, count: counts.categories },
    { key: 'utilisateurs', label: 'Équipe & Rôles', icon: ShieldCheck, count: counts.utilisateurs, adminOnly: true },
    { key: 'actions', label: 'Suivi & Alertes', icon: Bell, count: counts.actionsCommerciales },
  ];

  const crudItems = allCrudItems.filter(item => !item.adminOnly || isAdmin);

  const handleNavigate = (page) => {
    setActivePage(page);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectCrudTab = (tabKey) => {
    setActivePage('dashboard');
    setActiveTab(tabKey);
    if (onCloseMobile) onCloseMobile();
  };

  const handleTogglePocket = (e) => {
    e.stopPropagation();
    setIsCrudPocketOpen(prev => !prev);
  };

  // Importe un fichier CSV depuis la barre latérale
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingCsv(true);
    try {
      const result = await csvApi.upload(file);
      const msg = `Importation réussie : ${result.data?.emplacementsImportes || 0} supports et ${result.data?.abonnementsCrees || 0} abonnements synchronisés.`;
      showSuccess(msg);
      if (onRefresh) onRefresh();
    } catch (err) {
      const errMsg = sanitizeUserError(err, "Erreur lors de l'importation du fichier CSV.");
      showError(errMsg);
    } finally {
      setUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* En-tête de navigation */}
      <div className="sidebar-header">
        <div className="sidebar-brand" onClick={() => handleNavigate('planning')}>
          <div className="sidebar-brand-icon">
            <Radio size={22} />
          </div>
          {!isCollapsed && (
            <div className="sidebar-brand-text">
              <span className="brand-title">AeroPub</span>
              <span className="brand-subtitle">Gestionnaire Pub</span>
            </div>
          )}
        </div>

        {/* Réduire ou agrandir */}
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(prev => !prev)}
          title={isCollapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Fermeture mobile */}
        <button
          type="button"
          className="sidebar-mobile-close-btn"
          onClick={onCloseMobile}
          aria-label="Fermer le menu"
          title="Fermer le menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation principale */}
      <nav className="sidebar-nav">
        {/* Liens principaux */}
        <div className="sidebar-section">
          {!isCollapsed && <span className="sidebar-section-title">Navigation</span>}

          <button
            type="button"
            className={`sidebar-nav-item ${activePage === 'kpis' ? 'active' : ''}`}
            onClick={() => handleNavigate('kpis')}
            title="KPI & Statistiques de pilotage"
          >
            <BarChart3 size={18} className="sidebar-item-icon" style={{ color: '#06b6d4' }} />
            {!isCollapsed && <span className="sidebar-item-label">KPI & Statistiques</span>}
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activePage === 'planning' ? 'active' : ''}`}
            onClick={() => handleNavigate('planning')}
            title="Planning & Zones d'affichage"
          >
            <MapPin size={18} className="sidebar-item-icon" />
            {!isCollapsed && <span className="sidebar-item-label">Planning & Zones</span>}
          </button>

          <button
            type="button"
            className="sidebar-nav-item"
            onClick={() => setShowRoleGuide(true)}
            title="Consulter le guide des rôles et des permissions"
          >
            <ShieldCheck size={18} className="sidebar-item-icon" style={{ color: 'var(--accent-secondary)' }} />
            {!isCollapsed && <span className="sidebar-item-label">Guide des rôles</span>}
          </button>

          <button
            type="button"
            className="sidebar-nav-item"
            onClick={() => setShowAppGuide(true)}
            title="Consulter le guide complet de l'application"
          >
            <BookOpen size={18} className="sidebar-item-icon" style={{ color: '#38bdf8' }} />
            {!isCollapsed && <span className="sidebar-item-label">Guide d'utilisation</span>}
          </button>
        </div>

        {/* Section Données */}
        <div className="sidebar-section">
          {!isCollapsed && <span className="sidebar-section-title">Données</span>}

          {/* En-tête de l'accordéon */}
          <div
            className={`sidebar-pocket-header ${activePage === 'dashboard' ? 'active-parent' : ''}`}
            onClick={() => {
              if (activePage !== 'dashboard') setActivePage('dashboard');
              if (isCollapsed) setIsCollapsed(false);
              else setIsCrudPocketOpen(prev => !prev);
            }}
            title="Tableau de bord et gestion des tables"
          >
            <div className="sidebar-pocket-title-box">
              <LayoutDashboard size={18} className="sidebar-item-icon" />
              {!isCollapsed && <span className="sidebar-item-label">Tableau de bord</span>}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                className="sidebar-chevron-btn"
                onClick={handleTogglePocket}
                title={isCrudPocketOpen ? 'Fermer' : 'Ouvrir'}
              >
                {isCrudPocketOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
          </div>

          {/* Menu déroulant des tables */}
          {(!isCollapsed && isCrudPocketOpen) && (
            <div className="sidebar-pocket-content">
              {crudItems.map((item) => {
                const IconComponent = item.icon;
                const isItemActive = activePage === 'dashboard' && activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`sidebar-sub-item ${isItemActive ? 'active' : ''}`}
                    onClick={() => handleSelectCrudTab(item.key)}
                  >
                    <div className="sidebar-sub-left">
                      <IconComponent size={15} className="sidebar-sub-icon" />
                      <span className="sidebar-sub-label">{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count !== null && (
                      <span className="sidebar-sub-badge">{item.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Version compacte */}
          {isCollapsed && (
            <div className="sidebar-collapsed-pills">
              {crudItems.map((item) => {
                const IconComponent = item.icon;
                const isItemActive = activePage === 'dashboard' && activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`sidebar-collapsed-btn ${isItemActive ? 'active' : ''}`}
                    onClick={() => handleSelectCrudTab(item.key)}
                    title={item.label}
                  >
                    <IconComponent size={16} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Bouton Importer des données */}
          <div className='sidebar-import-box'>
            <button
              type='button'
              className={`sidebar-nav-item sidebar-import-btn ${activePage === 'import' ? 'active' : ''}`}
              onClick={() => handleNavigate('import')}
              title="Importer des données"
            >
              <Upload size={18} className='sidebar-item-icon' />
              {!isCollapsed && <span className="sidebar-item-label">Importer des données</span>}
            </button>
          </div>
        </div>

        {/* Administration */}
        {hasRole(user, ['Admin']) && (
          <div className="sidebar-section">
            {!isCollapsed && <span className="sidebar-section-title">Administration</span>}

            <button
              type="button"
              className={`sidebar-nav-item ${activePage === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavigate('settings')}
              title="Paramètres et configuration"
            >
              <Settings size={18} className="sidebar-item-icon" />
              {!isCollapsed && <span className="sidebar-item-label">Paramètres</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activePage === 'audit' ? 'active' : ''}`}
              onClick={() => handleNavigate('audit')}
              title="Journal d'audit"
            >
              <ScrollText size={18} className="sidebar-item-icon" />
              {!isCollapsed && <span className="sidebar-item-label">Journal d'audit</span>}
            </button>
          </div>
        )}
      </nav>

      {/* Pied de page */}
      <div className="sidebar-footer">
        {/* Statut de l'API */}
        <div className="sidebar-status-pill" title={isBackendOnline ? 'API connectée' : 'API déconnectée'}>
          <span className={`status-dot ${isBackendOnline ? 'status-online' : 'status-offline'}`}></span>
          {!isCollapsed && (
            <span className="sidebar-status-text">
              {isBackendOnline ? 'API en ligne' : 'API hors ligne'}
            </span>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="sidebar-footer-actions">
          <button
            type="button"
            className="sidebar-tool-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
            {!isCollapsed && <span>{theme === 'dark' ? 'Jour' : 'Nuit'}</span>}
          </button>

          <button
            type="button"
            className="sidebar-tool-btn"
            disabled={refreshing}
            onClick={async () => {
              if (refreshing) return;
              setRefreshing(true);
              try {
                if (onRefresh) await onRefresh();
              } finally {
                setTimeout(() => setRefreshing(false), 500);
              }
            }}
            title="Actualiser les données"
          >
            <RefreshCw size={16} className={refreshing ? 'btn-spinner' : ''} />
            {!isCollapsed && <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>}
          </button>
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
    </aside>
  );
}
