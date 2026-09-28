import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';

export default function EcheancesContratsWidget({
  userContracts = [],
  renewedParentRefs = new Set(),
  onFilterClick
}) {
  const now = new Date();

  const getDiffJours = (dateStr) => {
    if (!dateStr) return -9999;
    return Math.ceil((new Date(dateStr) - now) / 86400000);
  };

  const echeances = useMemo(() => {
    const actifsNonRenouveles = userContracts.filter(c => {
      const statut = (c.nom_statut || c.statut || '').toLowerCase();
      if (statut === 'résilié' || statut === 'resilie') return false;
      if (renewedParentRefs.has(String(c.reference || '').trim())) return false;
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      return diff >= 0 && diff <= 90;
    });

    const j7 = actifsNonRenouveles.filter(c => {
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      return diff >= 0 && diff <= 7;
    });

    const j30 = actifsNonRenouveles.filter(c => {
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      return diff > 7 && diff <= 30;
    });

    const j60 = actifsNonRenouveles.filter(c => {
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      return diff > 30 && diff <= 60;
    });

    const j90 = actifsNonRenouveles.filter(c => {
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      return diff > 60 && diff <= 90;
    });

    return { j7, j30, j60, j90, total: actifsNonRenouveles.length };
  }, [userContracts, renewedParentRefs]);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Calendar size={20} style={{ color: '#06b6d4' }} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Contrats arrivant à échéance
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Contrats actifs non encore reconduits
            </span>
          </div>
        </div>
        <span style={{
          background: 'rgba(6, 182, 212, 0.15)',
          color: '#06b6d4',
          padding: '0.2rem 0.6rem',
          borderRadius: '9999px',
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          {echeances.total} total
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {/* J-7 */}
        <div
          className="kpi-mini-card"
          onClick={() => onFilterClick && onFilterClick('echeance_7')}
          style={{
            background: echeances.j7.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            border: echeances.j7.length > 0 ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '0.85rem 0.5rem',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', display: 'block' }}>
            ≤ 7 jours
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: echeances.j7.length > 0 ? '#ef4444' : '#fff', marginTop: '0.25rem' }}>
            {echeances.j7.length}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Urgent
          </span>
        </div>

        {/* J-30 */}
        <div
          className="kpi-mini-card"
          onClick={() => onFilterClick && onFilterClick('echeance_30')}
          style={{
            background: echeances.j30.length > 0 ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            border: echeances.j30.length > 0 ? '1px solid rgba(249, 115, 22, 0.45)' : '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '0.85rem 0.5rem',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f97316', display: 'block' }}>
            ≤ 30 jours
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: echeances.j30.length > 0 ? '#f97316' : '#fff', marginTop: '0.25rem' }}>
            {echeances.j30.length}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Relance J-30
          </span>
        </div>

        {/* J-60 */}
        <div
          className="kpi-mini-card"
          onClick={() => onFilterClick && onFilterClick('echeance_60')}
          style={{
            background: echeances.j60.length > 0 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            border: echeances.j60.length > 0 ? '1px solid rgba(234, 179, 8, 0.45)' : '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '0.85rem 0.5rem',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#eab308', display: 'block' }}>
            ≤ 60 jours
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: echeances.j60.length > 0 ? '#eab308' : '#fff', marginTop: '0.25rem' }}>
            {echeances.j60.length}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Anticipation
          </span>
        </div>

        {/* J-90 */}
        <div
          className="kpi-mini-card"
          onClick={() => onFilterClick && onFilterClick('echeance_90')}
          style={{
            background: echeances.j90.length > 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            border: echeances.j90.length > 0 ? '1px solid rgba(59, 130, 246, 0.45)' : '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '0.85rem 0.5rem',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', display: 'block' }}>
            ≤ 90 jours
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: echeances.j90.length > 0 ? '#3b82f6' : '#fff', marginTop: '0.25rem' }}>
            {echeances.j90.length}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Préparation
          </span>
        </div>
      </div>
    </div>
  );
}
