import React from 'react';
import { BarChart3, RefreshCw, Sparkles, Plane, Calculator } from 'lucide-react';

export default function KpiHeroHeader({
  user,
  userContractsCount = 0,
  loading = false,
  onRefresh,
  onOpenCaCalculator,
  isCommercialSimple = false
}) {
  return (
    <section className="glass-panel kpi-hero-panel">
      <div className="hero-badge-platform" style={{ alignSelf: 'flex-start', margin: 0 }}>
        <Plane size={14} className="hero-badge-icon" />
        <span>Plateforme d'affichage publicitaire aéroportuaire</span>
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
              Indicateurs de performance et statistiques de pilotage
            </h1>
            <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
              {isCommercialSimple
                ? `Espace commercial • Portefeuille personnel : ${userContractsCount} contrat(s) attribué(s)`
                : `Vue consolidée • Direction et gestion : ${userContractsCount} contrat(s) au total`
              }
            </p>
          </div>
        </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {onOpenCaCalculator && (
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenCaCalculator}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.15rem',
              background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
              fontWeight: 600,
              borderRadius: '10px'
            }}
            title="Ouvrir le moniteur de calcul et de répartition du chiffre d'affaires contractuel"
          >
            <Calculator size={16} />
            <span>Répartition du CA</span>
          </button>
        )}

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
          Traçabilité des reconductions active
        </span>
      </div>
      </div>
    </section>
  );
}
