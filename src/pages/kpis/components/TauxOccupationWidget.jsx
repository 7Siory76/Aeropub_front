import React, { useState, useMemo } from 'react';
import { Percent } from 'lucide-react';

export default function TauxOccupationWidget({
  emplacements = [],
  userContracts = []
}) {
  const [periodeOccupation, setPeriodeOccupation] = useState('mois'); // 'mois' | 'trimestre' | 'annee'
  const now = new Date();

  const statsOccupation = useMemo(() => {
    const totalSupports = emplacements.length || 1;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let dateDebutPeriode = new Date(currentYear, currentMonth, 1);
    let dateFinPeriode = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    if (periodeOccupation === 'trimestre') {
      const quarterMonth = Math.floor(currentMonth / 3) * 3;
      dateDebutPeriode = new Date(currentYear, quarterMonth, 1);
      dateFinPeriode = new Date(currentYear, quarterMonth + 3, 0, 23, 59, 59);
    } else if (periodeOccupation === 'annee') {
      dateDebutPeriode = new Date(currentYear, 0, 1);
      dateFinPeriode = new Date(currentYear, 11, 31, 23, 59, 59);
    }

    const occupiedRefs = new Set();
    const reservedRefs = new Set();
    const availableRefs = new Set();

    if (periodeOccupation === 'mois') {
      // Pour le mois courant : s'appuyer directement sur l'état en base des supports
      emplacements.forEach(emp => {
        const ref = emp.reference;
        const st = (emp.statut || emp.etat || '').toLowerCase();
        if (st === 'occupé' || st === 'occupe' || emp.id_type_etat === 3) {
          occupiedRefs.add(ref);
        } else if (st === 'réservé' || st === 'reserve' || emp.id_type_etat === 2) {
          reservedRefs.add(ref);
        } else {
          availableRefs.add(ref);
        }
      });
    } else {
      // Pour trimestre / année : analyser les contrats actifs pendant cette période
      // Ignorer les contrats archivés, résiliés, ou annulés
      const activeContractsInPeriod = userContracts.filter(c => {
        const statut = (c.nom_statut || c.statut || '').toLowerCase();
        if (
          statut.includes('résilié') || statut.includes('resilie') ||
          statut.includes('archiv') ||
          statut.includes('annul')
        ) return false;

        const cDebut = new Date(c.date_debut);
        const cFin = new Date(c.date_echeance || c.date_fin);
        return cDebut <= dateFinPeriode && cFin >= dateDebutPeriode;
      });

      emplacements.forEach(emp => {
        const ref = emp.reference;
        const targetRef = (ref || '').toLowerCase();

        const matchingContract = activeContractsInPeriod.find(c => {
          const supList = (c.supports_associes || '')
            .split(/[,;]+/)
            .map(s => s.trim().toLowerCase());
          const directRef = (c.reference_emplacement || '').trim().toLowerCase();
          return supList.includes(targetRef) || directRef === targetRef;
        });

        if (matchingContract) {
          const cStatut = (matchingContract.nom_statut || matchingContract.statut || '').toLowerCase();
          if (cStatut.includes('brouillon')) {
            reservedRefs.add(ref);
          } else {
            occupiedRefs.add(ref);
          }
        } else {
          // Aucun contrat actif sur cette période -> vérifier état intrinsèque
          const st = (emp.statut || emp.etat || '').toLowerCase();
          if ((st === 'occupé' || st === 'occupe' || emp.id_type_etat === 3) && periodeOccupation !== 'annee') {
            occupiedRefs.add(ref);
          } else {
            availableRefs.add(ref);
          }
        }
      });
    }

    // Assurer que tout support non occupé et non réservé est classé disponible
    emplacements.forEach(emp => {
      if (!occupiedRefs.has(emp.reference) && !reservedRefs.has(emp.reference)) {
        availableRefs.add(emp.reference);
      }
    });

    const occupesCount = occupiedRefs.size;
    const reservedCount = reservedRefs.size;
    const disponiblesCount = availableRefs.size;
    const taux = Math.min(100, Math.round((occupesCount / totalSupports) * 100));

    return {
      totalSupports,
      occupesCount,
      reservedCount,
      disponiblesCount,
      taux,
      occupiedList: Array.from(occupiedRefs),
      availableList: Array.from(availableRefs),
      reservedList: Array.from(reservedRefs)
    };
  }, [emplacements, userContracts, periodeOccupation]);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Percent size={20} style={{ color: '#10b981' }} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Taux d'occupation des supports
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Rapport supports actifs / capacité totale
            </span>
          </div>
        </div>

        {/* Sélecteur de période */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '3px' }}>
          {['mois', 'trimestre', 'annee'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodeOccupation(p)}
              style={{
                background: periodeOccupation === p ? 'var(--accent-primary, #06b6d4)' : 'transparent',
                color: periodeOccupation === p ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '7px',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.3rem 0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {p === 'mois' ? 'Mois' : p === 'trimestre' ? 'Trimestre' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.75rem' }}>
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: statsOccupation.taux >= 70 ? '#10b981' : statsOccupation.taux >= 40 ? '#06b6d4' : '#ef4444',
          minWidth: '95px'
        }}>
          {statsOccupation.taux}%
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginBottom: '0.6rem'
          }}>
            <div style={{
              width: `${statsOccupation.taux}%`,
              height: '100%',
              background: statsOccupation.taux >= 70
                ? 'linear-gradient(90deg, #06b6d4, #10b981)'
                : statsOccupation.taux >= 40
                ? 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                : 'linear-gradient(90deg, #ef4444, #f43f5e)',
              borderRadius: '9999px',
              transition: 'width 0.5s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Occupés : <strong style={{ color: '#fff' }}>{statsOccupation.occupesCount}</strong></span>
            <span>Disponibles : <strong style={{ color: '#10b981' }}>{statsOccupation.disponiblesCount}</strong></span>
            <span>Total : <strong>{statsOccupation.totalSupports}</strong></span>
          </div>
        </div>
      </div>

      {/* Détail rapide des supports disponibles vs occupés */}
      <div style={{
        marginTop: '1.1rem',
        paddingTop: '0.9rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
        alignItems: 'center',
        fontSize: '0.78rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981' }}>
          <span>● Disponibles ({statsOccupation.availableList.length}) :</span>
          {statsOccupation.availableList.map(ref => (
            <span
              key={ref}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                fontWeight: 600
              }}
              title={ref === '4A1' ? 'Libéré suite à archivage/résiliation de contrat' : 'Disponible'}
            >
              {ref}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', marginLeft: 'auto' }}>
          <span>● Occupés ({statsOccupation.occupiedList.length}) :</span>
          {statsOccupation.occupiedList.map(ref => (
            <span
              key={ref}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                fontWeight: 600
              }}
            >
              {ref}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
