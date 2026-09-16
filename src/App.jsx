import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NotificationTester from './components/NotificationTester';
import Footer from './components/Footer';
import { DashboardPage, PlanningPage, ParametragePage } from './pages';
import { checkHealthApi } from './api';
import { toast } from 'react-toastify';

export default function App() {
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activePage, setActivePage] = useState('planning'); // 'dashboard', 'planning' ou 'settings'
  const [activeTab, setActiveTab] = useState('emplacements'); // sous-compartiment CRUD sélectionné
  const [counts, setCounts] = useState({});

  // État du thème Nuit (dark) ou Jour (light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aeropub_theme') || 'dark';
  });

  // Appliquer l'attribut data-theme à l'élément <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aeropub_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    toast.info(nextTheme === 'light' ? '☀️ Mode Jour activé' : '🌙 Mode Nuit activé', {
      position: 'bottom-right',
      autoClose: 2000
    });
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

  return (
    <div className="app-container">
      {/* 1. Navbar latérale gauche avec poche accordéon pour les tables CRUD */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendOnline={isBackendOnline}
        theme={theme}
        toggleTheme={toggleTheme}
        onRefresh={handleRefresh}
        counts={counts}
      />

      {/* 2. Zone Principale (Header supérieur + Contenu de page + Footer) */}
      <div className="app-main-wrapper">
        <Header
          isBackendOnline={isBackendOnline}
          onRefresh={handleRefresh}
          theme={theme}
          toggleTheme={toggleTheme}
          activePage={activePage}
          activeTab={activeTab}
        />

        <main className="main-content">
          {activePage === 'dashboard' ? (
            /* Tableau de Bord Général AeroPub (avec recherche & HeroBanner) */
            <DashboardPage 
              key={refreshKey}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onCountsLoaded={setCounts}
            />
          ) : activePage === 'planning' ? (
            /* Page de Planning & Occupation des Emplacements par Zone */
            <PlanningPage key={refreshKey} />
          ) : (
            /* Page de Paramétrage des réglages système */
            <ParametragePage key={refreshKey} />
          )}

          {/* Panneau de Test des Notifications In-App */}
          <NotificationTester onSimulateImport={handleRefresh} />
        </main>

        <Footer />
      </div>
    </div>
  );
}
