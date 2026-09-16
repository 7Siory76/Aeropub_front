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
  Loader2
} from 'lucide-react';
import { csvApi } from '../api';
import { toast } from 'react-toastify';
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
  counts = {}
}) {
  // État de la "poche" (accordéon ouvert par défaut)
  const [isCrudPocketOpen, setIsCrudPocketOpen] = useState(true);
  // État de réduction/compactage de la barre latérale
  const [isCollapsed, setIsCollapsed] = useState(false);
  // État d'importation CSV
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const fileInputRef = useRef(null);

  // Sous-compartiments de la table CRUD
  const crudItems = [
    { key: 'emplacements', label: 'Supports', icon: Tv, count: counts.emplacements },
    { key: 'abonnements', label: 'Abonnements', icon: Calendar, count: counts.abonnements },
    { key: 'clients', label: 'Clients & Contacts', icon: Users, count: counts.clients },
    { key: 'typesupports', label: 'Types de Support', icon: Layers, count: counts.typeSupports },
    { key: 'zones', label: 'Aéroports & Zones', icon: MapPin, count: counts.zones },
    { key: 'formats', label: 'Catégories', icon: FolderKanban, count: counts.categories },
    { key: 'utilisateurs', label: 'Équipe & Rôles', icon: ShieldCheck, count: counts.utilisateurs },
    { key: 'actions', label: 'Suivi & Alertes', icon: Bell, count: counts.actionsCommerciales },
  ];

  const handleSelectCrudTab = (tabKey) => {
    setActivePage('dashboard');
    setActiveTab(tabKey);
  };

  const handleTogglePocket = (e) => {
    e.stopPropagation();
    setIsCrudPocketOpen(prev => !prev);
  };

  // Déclenchement de l'importation CSV depuis la Sidebar
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingCsv(true);
    try {
      const result = await csvApi.upload(file);
      const msg = `✅ Importation réussie ! ${result.data?.emplacementsImportes || 0} supports et ${result.data?.abonnementsCrees || 0} abonnements synchronisés.`;
      if (typeof toast !== 'undefined' && toast?.success) {
        toast.success(msg);
      } else {
        alert(msg);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur lors de l'importation CSV:", err);
      const errMsg = err.response?.data?.message || "❌ Erreur lors de l'importation du fichier CSV.";
      if (typeof toast !== 'undefined' && toast?.error) {
        toast.error(errMsg);
      } else {
        alert(errMsg);
      }
    } finally {
      setUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* En-tête de la Sidebar avec Logo et bouton de repli */}
      <div className="sidebar-header">
        <div className="sidebar-brand" onClick={() => setActivePage('planning')}>
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

        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(prev => !prev)}
          title={isCollapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation Principale */}
      <nav className="sidebar-nav">
        {/* Section 1 : Planning direct */}
        <div className="sidebar-section">
          {!isCollapsed && <span className="sidebar-section-title">Navigation</span>}
          
          <button
            type="button"
            className={`sidebar-nav-item ${activePage === 'planning' ? 'active' : ''}`}
            onClick={() => setActivePage('planning')}
            title="Planning & Zones d'affichage"
          >
            <MapPin size={18} className="sidebar-item-icon" />
            {!isCollapsed && <span className="sidebar-item-label">Planning & Zones</span>}
          </button>
        </div>

        {/* Section 2 : POCHE ACCORDÉON "TABLEAU DE BORD / CRUD" */}
        <div className="sidebar-section">
          {!isCollapsed && <span className="sidebar-section-title">Données & CRUD</span>}

          {/* En-tête de la poche */}
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
              {!isCollapsed && <span className="sidebar-item-label">Tableau de Bord</span>}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                className="sidebar-chevron-btn"
                onClick={handleTogglePocket}
                title={isCrudPocketOpen ? 'Fermer la poche' : 'Ouvrir la poche'}
              >
                {isCrudPocketOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
          </div>

          {/* Contenu déroulant de la poche : Les sous-compartiments pour chaque table CRUD */}
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

          {/* Version compacte (quand la sidebar est réduite) : icônes rapides */}
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

          {/* Bouton Importer données dans la Sidebar */}
          <div className="sidebar-import-box">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className={`sidebar-nav-item sidebar-import-btn ${isCollapsed ? 'collapsed' : ''} ${uploadingCsv ? 'active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCsv}
              title="Importer des données (fichier CSV)"
            >
              {uploadingCsv ? (
                <Loader2 size={18} className="spinner-icon sidebar-item-icon" />
              ) : (
                <Upload size={18} className="sidebar-item-icon" />
              )}
              {!isCollapsed && (
                <span className="sidebar-item-label">{uploadingCsv ? 'Importation...' : 'Importer données 📄'}</span>
              )}
            </button>
          </div>
        </div>

        {/* Section 3 : Paramètres */}
        <div className="sidebar-section">
          {!isCollapsed && <span className="sidebar-section-title">Système</span>}
          
          <button
            type="button"
            className={`sidebar-nav-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => setActivePage('settings')}
            title="Paramètres de configuration"
          >
            <Settings size={18} className="sidebar-item-icon" />
            {!isCollapsed && <span className="sidebar-item-label">Paramètres</span>}
          </button>
        </div>
      </nav>

      {/* Pied de page de la Sidebar : État API, Thème et Actualisation */}
      <div className="sidebar-footer">
        {/* Statut de l'API */}
        <div className="sidebar-status-pill" title={isBackendOnline ? 'API Connectée' : 'API Déconnectée'}>
          <span className={`status-dot ${isBackendOnline ? 'status-online' : 'status-offline'}`}></span>
          {!isCollapsed && (
            <span className="sidebar-status-text">
              {isBackendOnline ? 'API En Ligne' : 'API Hors Ligne'}
            </span>
          )}
        </div>

        {/* Boutons d'action compacts */}
        <div className="sidebar-footer-actions">
          <button
            type="button"
            className="sidebar-tool-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Passer en Mode Jour' : 'Passer en Mode Nuit'}
          >
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
            {!isCollapsed && <span>{theme === 'dark' ? 'Jour' : 'Nuit'}</span>}
          </button>

          <button
            type="button"
            className="sidebar-tool-btn"
            onClick={onRefresh}
            title="Rafraîchir les données API"
          >
            <RefreshCw size={16} />
            {!isCollapsed && <span>Actualiser</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
