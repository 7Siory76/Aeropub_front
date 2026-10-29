import React, { useState, useEffect } from 'react';
import { Sliders, Tag, FileText, ScrollText, RefreshCw, Plane } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasRole } from '../../utils/rbac';
import ParametragesTab from './tabs/ParametragesTab';
import EtatsSupportsTab from './tabs/EtatsSupportsTab';
import StatutsContratsTab from './tabs/StatutsContratsTab';
import AuditLogsTab from './tabs/AuditLogsTab';

export default function ParametragePage({ initialTab = 'params' }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('aeropub_last_param_tab') || initialTab || 'params';
  });
  const [counts, setCounts] = useState({
    params: 0,
    etats: 0,
    statuts: 0,
    audit: 0
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const tabNames = {
      params: 'Paramètres généraux',
      etats: 'États des supports',
      statuts: 'Statuts des contrats',
      audit: "Journal d'audit et sécurité"
    };
    const tabName = tabNames[activeTab] || 'Administration';
    document.title = `AeroPub | Plateforme d'affichage et de publicités aéroportuaires — ${tabName}`;
    if (activeTab) {
      localStorage.setItem('aeropub_last_param_tab', activeTab);
    }
  }, [activeTab]);


  const updateCount = (key, count) => {
    setCounts(prev => ({ ...prev, [key]: count }));
  };

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (!hasRole(user, ['Admin'])) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px', borderRadius: '16px' }}>
        <h3 style={{ color: '#ef4444', fontSize: '1.4rem', marginBottom: '0.75rem' }}>⛔ Accès refusé</h3>
        <p style={{ color: 'var(--text-muted)' }}>Le module d'administration et paramétrage est strictement réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <section className="glass-panel dashboard-panel">
      {/* Badge super-titre plateforme */}
      <div className="hero-badge-platform" style={{ marginBottom: '0.65rem' }}>
        <Plane size={14} className="hero-badge-icon" />
        <span>Plateforme d'affichage et de publicités aéroportuaires</span>
      </div>

      {/* En-tête de la page avec H1 */}
      <div className="dashboard-header-box" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="dashboard-title" style={{ fontSize: '1.85rem' }}>
            {activeTab === 'audit'
              ? <>📜 Journal d'audit et <span className="gradient-text">sécurité</span></>
              : <>⚙️ Configuration et paramétrage du <span className="gradient-text">système AeroPub</span></>
            }
          </h1>
          <p className="dashboard-desc">
            {activeTab === 'audit'
              ? "Journal des opérations critiques, notifications système et traçabilité réglementaire."
              : "Administrez les paramètres globaux, les états des supports et les statuts des abonnements."
            }
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title="Actualiser l'onglet actif"
        >
          <RefreshCw size={16} className={refreshing ? 'btn-spinner' : ''} />
          <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
        </button>
      </div>

      {/* Barre d'onglets de navigation */}
      <div className="category-pills" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`pill-btn ${activeTab === 'params' ? 'active' : ''}`}
          onClick={() => setActiveTab('params')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Sliders size={15} />
          <span>Paramètres généraux</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({counts.params})</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeTab === 'etats' ? 'active' : ''}`}
          onClick={() => setActiveTab('etats')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Tag size={15} />
          <span>États des supports</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({counts.etats})</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeTab === 'statuts' ? 'active' : ''}`}
          onClick={() => setActiveTab('statuts')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileText size={15} />
          <span>Statuts des contrats</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({counts.statuts})</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ScrollText size={15} />
          <span>Journal d'audit et sécurité</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({counts.audit})</span>
        </button>
      </div>

      {/* =========================================================================
          CONTENU DES ONGLETS MODULARISÉS
          ========================================================================= */}
      {activeTab === 'params' && (
        <ParametragesTab
          key={`params-${refreshKey}`}
          onCountChange={(count) => updateCount('params', count)}
        />
      )}

      {activeTab === 'etats' && (
        <EtatsSupportsTab
          key={`etats-${refreshKey}`}
          onCountChange={(count) => updateCount('etats', count)}
        />
      )}

      {activeTab === 'statuts' && (
        <StatutsContratsTab
          key={`statuts-${refreshKey}`}
          onCountChange={(count) => updateCount('statuts', count)}
        />
      )}

      {activeTab === 'audit' && (
        <AuditLogsTab
          key={`audit-${refreshKey}`}
          onCountChange={(count) => updateCount('audit', count)}
        />
      )}
    </section>
  );
}
