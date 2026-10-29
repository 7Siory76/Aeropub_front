import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import { DashboardPage, PlanningPage, ParametragePage, KpiStatsPage } from './pages';
import { checkHealthApi } from './api';
import { useAuth } from './context/AuthContext';
import { useFeedback } from './context/FeedbackContext';
import DiscreetBanner from './components/DiscreetBanner';
import LoginPage from './pages/LoginPage';
import ImportPage from './pages/import/ImportPage';

import { hasRole } from './utils/rbac';

export default function App() {
  const parseHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const [page, tab] = hash.split('/');
    return { page, tab };
  };

  const initialNav = parseHash();

  const { user } = useAuth();
  const { feedback, clearFeedback, registerNavigationHandler } = useFeedback();
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [activePage, setActivePage] = useState(() => {
    return initialNav.page || localStorage.getItem('aeropub_last_page') || 'kpis';
  });

  const [activeTab, setActiveTab] = useState(() => {
    return initialNav.tab || localStorage.getItem('aeropub_last_tab') || 'emplacements';
  });

  const [counts, setCounts] = useState({});
  const [kpiFilter, setKpiFilter] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Redirections internes
  useEffect(() => {
    registerNavigationHandler((page, tab) => {
      if (page) setActivePage(page);
      if (tab) setActiveTab(tab);
    });
  }, [registerNavigationHandler]);

  // Thème sombre ou clair
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aeropub_theme') || 'dark';
  });

  // Applique data-theme sur l'élément racine
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aeropub_theme', theme);
  }, [theme]);

  // Titre dynamique de l'onglet du navigateur
  useEffect(() => {
    if (!user) {
      document.title = "AeroPub | Plateforme d'Affichage & Publicités Aéroportuaires — Connexion Sécurisée";
      return;
    }

    const tabTitles = {
      emplacements: 'Supports & Emplacements Publicitaires',
      abonnements: 'Abonnements & Contrats Publicitaires',
      clients: 'Clients Partenaires & Annonceurs',
      typesupports: 'Types de Supports Publicitaires',
      zones: "Aéroports & Zones d'Affichage",
      formats: "Catégories & Formats d'Affichage",
      utilisateurs: 'Gestion des Utilisateurs & Rôles',
      actions: 'Actions Commerciales & Alertes J-30'
    };

    let pageTitle = '';
    if (activePage === 'kpis') {
      pageTitle = 'KPI & Statistiques de Pilotage';
    } else if (activePage === 'planning') {
      pageTitle = 'Planning & Disponibilités des Supports';
    } else if (activePage === 'settings') {
      pageTitle = 'Paramétrage & Configuration Système';
    } else if (activePage === 'audit') {
      pageTitle = "Journal d'Audit & Sécurité";
    } else if (activePage === 'dashboard') {
      pageTitle = tabTitles[activeTab] || 'Référentiel';
    }

    document.title = `AeroPub | Plateforme d'Affichage & Publicités Aéroportuaires — ${pageTitle}`;
  }, [user, activePage, activeTab]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const checkStatus = async () => {
    try {
      await checkHealthApi();
      setIsBackendOnline(true);
    } catch {
      setIsBackendOnline(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [refreshKey]);

  const handleRefresh = () => {
    checkStatus();
    setRefreshKey(prev => prev + 1);
  };

  // Synchronise la page active avec l'URL et le localStorage
  useEffect(() => {
    if (!activePage) return;

    // Sauvegarde locale
    localStorage.setItem('aeropub_last_page', activePage);
    if (activeTab) localStorage.setItem('aeropub_last_tab', activeTab);

    // Synchronisation de l'URL
    const newHash = activePage === 'dashboard'
      ? `#/dashboard/${activeTab}`
      : `#/${activePage}`;

    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [activePage, activeTab]);

  // Gestion de l'historique de navigation
  useEffect(() => {
    const handleHashChange = () => {
      const { page, tab } = parseHash();
      if (page) setActivePage(page);
      if (tab) setActiveTab(tab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);


  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      {/* Barre latérale de navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          setIsMobileSidebarOpen(false);
        }}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileSidebarOpen(false);
        }}
        isBackendOnline={isBackendOnline}
        theme={theme}
        toggleTheme={toggleTheme}
        onRefresh={handleRefresh}
        counts={counts}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Fond sombre sur mobile */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Menu mobile */}
      {!isMobileSidebarOpen && (
        <button
          type="button"
          className="mobile-fab-sidebar-btn"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Ouvrir le menu de navigation"
          title="Menu de navigation"
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      )}

      {/* Zone principale */}
      <div className="app-main-wrapper">
        <Header
          isBackendOnline={isBackendOnline}
          onRefresh={handleRefresh}
          theme={theme}
          toggleTheme={toggleTheme}
          activePage={activePage}
          activeTab={activeTab}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        <main className="main-content">
          <DiscreetBanner feedback={feedback} onDismiss={clearFeedback} />

          {activePage === 'kpis' ? (
            <KpiStatsPage
              key={refreshKey}
              onNavigateToAbonnements={(filterKey) => {
                setKpiFilter(filterKey);
                setActiveTab('abonnements');
                setActivePage('dashboard');
              }}
            />
          ) : activePage === 'dashboard' ? (
            <DashboardPage
              key={refreshKey}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onCountsLoaded={setCounts}
              kpiFilter={kpiFilter}
              onClearKpiFilter={() => setKpiFilter(null)}
            />
          ) : activePage === 'planning' ? (
            <PlanningPage key={refreshKey} />
          ) : activePage === 'import' ? (
            <ImportPage
              onImportSuccess={handleRefresh}
            />
          ) : (activePage === 'settings' || activePage === 'audit') ? (
            hasRole(user, ['Admin']) ? (
              <ParametragePage key={`${refreshKey}-${activePage}`} initialTab={activePage === 'audit' ? 'audit' : 'params'} />
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px', borderRadius: '16px' }}>
                <h3 style={{ color: '#ef4444', fontSize: '1.4rem', marginBottom: '0.75rem' }}>⛔ Accès refusé</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Le module <strong>Administration & Paramétrage</strong> est réservé aux utilisateurs ayant le rôle <strong>Administrateur</strong>.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setActivePage('planning')}
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '8px' }}
                >
                  Retourner au planning
                </button>
              </div>
            )
          ) : null}
        </main>

        <Footer />
      </div>
    </div>
  );
}
