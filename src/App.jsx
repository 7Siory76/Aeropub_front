import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import AeroPubDashboard from './components/AeroPubDashboard';
import ZonePlanningPage from './components/ZonePlanningPage';
import ParametragePage from './components/ParametragePage';
import NotificationTester from './components/NotificationTester';
import Footer from './components/Footer';
import { checkHealthApi } from './api/apiService';
import { toast } from 'react-toastify';

export default function App() {
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activePage, setActivePage] = useState('planning'); // 'dashboard', 'planning' ou 'settings'
  
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
      {/* Navigation Header avec Statut API, Switcher de Page & Thème */}
      <Header
        isBackendOnline={isBackendOnline}
        onRefresh={handleRefresh}
        theme={theme}
        toggleTheme={toggleTheme}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* Main Body */}
      <main className="main-content">
        {activePage === 'dashboard' ? (
          <>
            {/* Banner avec recherche d'emplacements et publicités */}
            <HeroBanner
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {/* Tableau de Bord Général AeroPub */}
            <AeroPubDashboard 
              key={refreshKey}
              searchQuery={searchQuery}
            />
          </>
        ) : activePage === 'planning' ? (
          /* Page de Planning & Occupation des Emplacements par Zone */
          <ZonePlanningPage key={refreshKey} />
        ) : (
          /* Page de Paramétrage des réglages système */
          <ParametragePage key={refreshKey} />
        )}

        {/* Panneau de Test des Notifications In-App */}
        <NotificationTester onSimulateImport={handleRefresh} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
