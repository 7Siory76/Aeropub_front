import React from 'react';
import { BarChart3, RefreshCw, Sparkles, Plane } from 'lucide-react';

export default function KpiHeroHeader({
  user,
  userContractsCount = 0,
  loading = false,
  onRefresh,
  isCommercialSimple = false
}) {
  return (
    <section className="glass-panel" style={{
      padding: '1.75rem 2rem',
      borderRadius: '16px',
      marginBottom: '1.75rem',
      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(30, 41, 59, 0.5))',
      border: '1px solid rgba(6, 182, 212, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="hero-badge-platform" style={{ alignSelf: 'flex-start', margin: 0 }}>
        <Plane size={14} className="hero-badge-icon" />
        <span>Plateforme d'Affichage &amp; Publicités Aéroportuaires</span>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 20px rgba(6, 182, 212, 0.35)'
          }}>
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="kpi-hero-h1">
              Indicateurs KPI &amp; Statistiques de Pilotage
            </h1>
            <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
              {isCommercialSimple
                ? `Espace Commercial • Portefeuille personnel : ${userContractsCount} contrat(s) attribué(s)`
                : `Vision Consolidée • Direction & Gestion : ${userContractsCount} contrat(s) au total`
              }
            </p>
          </div>
        </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onRefresh && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onRefresh}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
          >
            <RefreshCw size={15} className={loading ? 'btn-spinner' : ''} />
            <span>{loading ? 'Actualisation...' : 'Actualiser'}</span>
          </button>
        )}

        <span style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#10b981',
          padding: '0.5rem 0.9rem',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '0.8rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <Sparkles size={14} />
          Traçabilité -R1 / -R2 active
        </span>
      </div>
      </div>
    </section>
  );
}
