import React, { useMemo } from 'react';
import { ShieldAlert, AlertTriangle, Clock } from 'lucide-react';

export default function AlertesCritiquesWidget({
  userContracts = [],
  actionsCommerciales = [],
  renewedParentRefs = new Set(),
  onFilterClick
}) {
  const now = new Date();

  const getDiffJours = (dateStr) => {
    if (!dateStr) return -9999;
    return Math.ceil((new Date(dateStr) - now) / 86400000);
  };

  const alertesCritiques = useMemo(() => {
    // 1. Contrats échus non renouvelés
    const echusNonRenouveles = userContracts.filter(c => {
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      const statut = (c.nom_statut || c.statut || '').toLowerCase();
      const estEchu = diff < 0;
      const aEteRenouvele = renewedParentRefs.has(String(c.reference || '').trim());
      const estResilie = statut === 'résilié' || statut === 'resilie';
      return estEchu && !aEteRenouvele && !estResilie;
    });

    // 2. Sans action commerciale planifiée
    const sansAction = userContracts.filter(c => {
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      const statut = (c.nom_statut || c.statut || '').toLowerCase();
      if (statut === 'résilié' || statut === 'resilie') return false;
      if (renewedParentRefs.has(String(c.reference || '').trim())) return false;

      const estSousTension = diff >= -15 && diff <= 90;
      if (!estSousTension) return false;

      const hasAction = actionsCommerciales.some(a =>
        String(a.id_abonnement || '').trim() === String(c.reference || '').trim()
      );
      return !hasAction;
    });

    return { echusNonRenouveles, sansAction };
  }, [userContracts, actionsCommerciales, renewedParentRefs]);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldAlert size={20} style={{ color: '#f43f5e' }} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Alertes Critiques
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pertes potentielles & absences d'action
            </span>
          </div>
        </div>
        <span style={{
          background: 'rgba(244, 63, 94, 0.15)',
          color: '#f43f5e',
          padding: '0.2rem 0.6rem',
          borderRadius: '9999px',
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          {alertesCritiques.echusNonRenouveles.length + alertesCritiques.sansAction.length} alerte(s)
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* 1. Échus non renouvelés */}
        <div
          className="kpi-mini-card"
          onClick={() => onFilterClick && onFilterClick('echus_non_renouveles')}
          style={{
            background: alertesCritiques.echusNonRenouveles.length > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.02)',
            border: alertesCritiques.echusNonRenouveles.length > 0 ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '1rem',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f43f5e', marginBottom: '0.4rem' }}>
            <AlertTriangle size={17} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Échus non renouvelés</span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: alertesCritiques.echusNonRenouveles.length > 0 ? '#f43f5e' : '#fff' }}>
            {alertesCritiques.echusNonRenouveles.length}
          </div>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Aucun contrat successeur lié via <code>id_abonnement_precedent</code>
          </p>
        </div>

        {/* 2. Sans action commerciale planifiée */}
        <div
          className="kpi-mini-card"
          onClick={() => onFilterClick && onFilterClick('sans_action')}
          style={{
            background: alertesCritiques.sansAction.length > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
            border: alertesCritiques.sansAction.length > 0 ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '1rem',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', marginBottom: '0.4rem' }}>
            <Clock size={17} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Sans action planifiée</span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: alertesCritiques.sansAction.length > 0 ? '#f59e0b' : '#fff' }}>
            {alertesCritiques.sansAction.length}
          </div>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Zéro relance enregistrée pour ce contrat à terme
          </p>
        </div>
      </div>
    </div>
  );
}
