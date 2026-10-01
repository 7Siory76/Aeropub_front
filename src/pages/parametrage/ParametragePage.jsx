import React, { useState, useEffect } from 'react';
import { Sliders, Tag, FileText, ScrollText, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasRole } from '../../utils/rbac';
import ParametragesTab from './tabs/ParametragesTab';
import EtatsSupportsTab from './tabs/EtatsSupportsTab';
import StatutsContratsTab from './tabs/StatutsContratsTab';
import AuditLogsTab from './tabs/AuditLogsTab';

export default function ParametragePage({ initialTab = 'params' }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'params' | 'etats' | 'statuts' | 'audit'
  const [counts, setCounts] = useState({
    params: 0,
    etats: 0,
    statuts: 0,
    audit: 0
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const updateCount = (key, count) => {
    setCounts(prev => ({ ...prev, [key]: count }));
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!hasRole(user, ['Admin'])) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px', borderRadius: '16px' }}>
        <h3 style={{ color: '#ef4444', fontSize: '1.4rem', marginBottom: '0.75rem' }}>⛔ Accès Refusé</h3>
        <p style={{ color: 'var(--text-muted)' }}>Le module d'Administration & Paramétrage est strictement réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <section className="glass-panel dashboard-panel">
      {/* En-tête de la page */}
      <div className="dashboard-header-box" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 className="dashboard-title">
            ⚙️ Paramétrage du <span className="gradient-text">Système AeroPub</span>
          </h2>
          <p className="dashboard-desc">
            Administrez les paramètres globaux, les états des supports et les statuts des abonnements.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title="Actualiser l'onglet actif"
        >
          <RefreshCw size={16} />
          <span>Actualiser</span>
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
          <span>Paramètres Généraux</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({counts.params})</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeTab === 'etats' ? 'active' : ''}`}
          onClick={() => setActiveTab('etats')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Tag size={15} />
          <span>États des Supports</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({counts.etats})</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeTab === 'statuts' ? 'active' : ''}`}
          onClick={() => setActiveTab('statuts')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileText size={15} />
          <span>Statuts des Abonnements</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({counts.statuts})</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ScrollText size={15} />
          <span>Journal & Audit Log</span>
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
