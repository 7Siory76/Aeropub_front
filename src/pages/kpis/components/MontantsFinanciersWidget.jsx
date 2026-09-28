import React, { useMemo } from 'react';
import { DollarSign, RefreshCw, Clock, ArrowUpRight, FileCheck, FileEdit } from 'lucide-react';

export default function MontantsFinanciersWidget({
  userContracts = [],
  renewedParentRefs = new Set(),
  onFilterClick
}) {
  const now = new Date();

  const getDiffJours = (dateStr) => {
    if (!dateStr) return -9999;
    return Math.ceil((new Date(dateStr) - now) / 86400000);
  };

  const montants = useMemo(() => {
    let actifs = 0;
    let renouveles = 0;
    let aValider = 0;
    let brouillons = 0;
    let aRenouveler = 0;

    let nbActifs = 0;
    let nbRenouveles = 0;
    let nbAValider = 0;
    let nbBrouillons = 0;
    let nbARenouveler = 0;

    userContracts.forEach(c => {
      const tarif = parseFloat(c.tarif) || 0;
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      // Le statut retourné par l'API correspond à la dernière ligne insérée dans Statut_Abonnement (ORDER BY sa.id DESC LIMIT 1)
      const statut = (c.nom_statut || c.statut_abonnement || c.statut || '').trim().toLowerCase();

      const estFilsRenouvellement = Boolean(c.id_abonnement_precedent) || /-R\d+$/i.test(c.reference || '');
      const estParentRenouvele = renewedParentRefs.has(String(c.reference || '').trim());
      const isRenouvele = estFilsRenouvellement || estParentRenouvele;

      // 1. Contrat Actif : le dernier statut dans l'historique est STRICTEMENT 'actif'
      const isActif = statut === 'actif';
      if (isActif) {
        actifs += tarif;
        nbActifs += 1;
      }

      // 2. Contrat Renouvelé : reconduit via id_abonnement_precedent ou parent renouvelé
      if (isRenouvele) {
        renouveles += tarif;
        nbRenouveles += 1;
      }

      // 3. Contrat À Valider : dernier statut 'à valider' / 'a valider'
      const isAValider = statut === 'à valider' || statut === 'a valider' || statut.includes('valid');
      if (isAValider) {
        aValider += tarif;
        nbAValider += 1;
      }

      // 4. Contrat Brouillon : dernier statut 'brouillon'
      const isBrouillon = statut === 'brouillon';
      if (isBrouillon) {
        brouillons += tarif;
        nbBrouillons += 1;
      }

      // 5. À Renouveler : contrat actif dont l'échéance arrive sous 90j et non encore renouvelé
      if (isActif && diff >= 0 && diff <= 90 && !estParentRenouvele) {
        aRenouveler += tarif;
        nbARenouveler += 1;
      }
    });

    return {
      actifs, nbActifs,
      renouveles, nbRenouveles,
      aValider, nbAValider,
      brouillons, nbBrouillons,
      aRenouveler, nbARenouveler
    };
  }, [userContracts, renewedParentRefs]);

  const formatMontant = (val) => new Intl.NumberFormat('fr-MG').format(Math.round(val)) + ' MGA';

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={18} style={{ color: '#10b981' }} />
          <span>Statut des Contrats & Performances Financières</span>
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Nombres en 1er plan • Cliquez sur une carte pour filtrer les contrats
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.15rem'
      }}>
        {/* 1. Actifs */}
        <div
          className="kpi-card-hover"
          onClick={() => onFilterClick && onFilterClick('montant_actifs')}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.02))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '14px',
            padding: '1.25rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Contrats Actifs
            </span>
            <div style={{ background: 'rgba(16, 185, 129, 0.18)', padding: '0.5rem', borderRadius: '10px', color: '#10b981' }}>
              <DollarSign size={20} />
            </div>
          </div>

          {/* 1ER PLAN : NOMBRE */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {montants.nbActifs}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
              contrat{montants.nbActifs > 1 ? 's' : ''}
            </span>
          </div>

          {/* 2E PLAN : MONTANT */}
          <div style={{ marginTop: '0.45rem', padding: '0.35rem 0.6rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total :</span>
            <strong style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 800 }}>{formatMontant(montants.actifs)}</strong>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            Dernier statut enregistré : <strong style={{ color: '#10b981' }}>Actif</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontSize: '0.75rem', marginTop: '0.65rem', fontWeight: 600 }}>
            <span>Voir les {montants.nbActifs} contrat(s) actifs</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* 2. Renouvelés (-R1, -R2...) */}
        <div
          className="kpi-card-hover"
          onClick={() => onFilterClick && onFilterClick('montant_renouveles')}
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.02))',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: '14px',
            padding: '1.25rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Contrats Renouvelés
            </span>
            <div style={{ background: 'rgba(168, 85, 247, 0.18)', padding: '0.5rem', borderRadius: '10px', color: '#c084fc' }}>
              <RefreshCw size={20} />
            </div>
          </div>

          {/* 1ER PLAN : NOMBRE */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {montants.nbRenouveles}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>
              reconduit{montants.nbRenouveles > 1 ? 's' : ''}
            </span>
          </div>

          {/* 2E PLAN : MONTANT */}
          <div style={{ marginTop: '0.45rem', padding: '0.35rem 0.6rem', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total :</span>
            <strong style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 800 }}>{formatMontant(montants.renouveles)}</strong>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            Liés via <code style={{ color: '#c084fc' }}>id_abonnement_precedent</code>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#c084fc', fontSize: '0.75rem', marginTop: '0.65rem', fontWeight: 600 }}>
            <span>Voir les renouvellements</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* 3. À Valider */}
        <div
          className="kpi-card-hover"
          onClick={() => onFilterClick && onFilterClick('a_valider')}
          style={{
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(234, 179, 8, 0.02))',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: '14px',
            padding: '1.25rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', color: '#eab308', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Contrats À Valider
            </span>
            <div style={{ background: 'rgba(234, 179, 8, 0.18)', padding: '0.5rem', borderRadius: '10px', color: '#eab308' }}>
              <FileCheck size={20} />
            </div>
          </div>

          {/* 1ER PLAN : NOMBRE */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {montants.nbAValider}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#eab308', textTransform: 'uppercase' }}>
              contrat{montants.nbAValider > 1 ? 's' : ''}
            </span>
          </div>

          {/* 2E PLAN : MONTANT */}
          <div style={{ marginTop: '0.45rem', padding: '0.35rem 0.6rem', background: 'rgba(234, 179, 8, 0.08)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total :</span>
            <strong style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 800 }}>{formatMontant(montants.aValider)}</strong>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            Dernier statut : <strong style={{ color: '#eab308' }}>À valider</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#eab308', fontSize: '0.75rem', marginTop: '0.65rem', fontWeight: 600 }}>
            <span>Examiner les dossiers</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* 4. Brouillons */}
        <div
          className="kpi-card-hover"
          onClick={() => onFilterClick && onFilterClick('brouillon')}
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(6, 182, 212, 0.02))',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '14px',
            padding: '1.25rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Contrats Brouillons
            </span>
            <div style={{ background: 'rgba(6, 182, 212, 0.18)', padding: '0.5rem', borderRadius: '10px', color: '#06b6d4' }}>
              <FileEdit size={20} />
            </div>
          </div>

          {/* 1ER PLAN : NOMBRE */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {montants.nbBrouillons}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase' }}>
              brouillon{montants.nbBrouillons > 1 ? 's' : ''}
            </span>
          </div>

          {/* 2E PLAN : MONTANT */}
          <div style={{ marginTop: '0.45rem', padding: '0.35rem 0.6rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total :</span>
            <strong style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 800 }}>{formatMontant(montants.brouillons)}</strong>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            Dernier statut : <strong style={{ color: '#06b6d4' }}>Brouillon</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#06b6d4', fontSize: '0.75rem', marginTop: '0.65rem', fontWeight: 600 }}>
            <span>Finaliser les brouillons</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* 5. À renouveler (≤ 90j) */}
        <div
          className="kpi-card-hover"
          onClick={() => onFilterClick && onFilterClick('montant_a_renouveler')}
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(249, 115, 22, 0.02))',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            borderRadius: '14px',
            padding: '1.25rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', color: '#f97316', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              À Renouveler (≤ 90j)
            </span>
            <div style={{ background: 'rgba(249, 115, 22, 0.18)', padding: '0.5rem', borderRadius: '10px', color: '#f97316' }}>
              <Clock size={20} />
            </div>
          </div>

          {/* 1ER PLAN : NOMBRE */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {montants.nbARenouveler}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase' }}>
              contrat{montants.nbARenouveler > 1 ? 's' : ''}
            </span>
          </div>

          {/* 2E PLAN : MONTANT */}
          <div style={{ marginTop: '0.45rem', padding: '0.35rem 0.6rem', background: 'rgba(249, 115, 22, 0.08)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total :</span>
            <strong style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 800 }}>{formatMontant(montants.aRenouveler)}</strong>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            Actifs en attente d'action commerciale
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f97316', fontSize: '0.75rem', marginTop: '0.65rem', fontWeight: 600 }}>
            <span>Dossiers à négocier</span>
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

