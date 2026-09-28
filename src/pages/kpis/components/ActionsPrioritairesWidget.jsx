import React from 'react';
import { CheckCircle2, ChevronRight, Eye } from 'lucide-react';

export default function ActionsPrioritairesWidget({
  alertesCritiques = { echusNonRenouveles: [], sansAction: [] },
  echeances = { j7: [], j30: [] },
  onSelectAbonnement,
  onViewAll
}) {
  const now = new Date();
  const getDiffJours = (dateStr) => {
    if (!dateStr) return -9999;
    return Math.ceil((new Date(dateStr) - now) / 86400000);
  };

  const priorityContracts = [
    ...(alertesCritiques.echusNonRenouveles || []),
    ...(echeances.j7 || []),
    ...(echeances.j30 || [])
  ];

  return (
    <section className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
            Dossiers Nécessitant une Action Commerciale
          </h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Contrats échus non renouvelés et échéances imminentes à traiter en priorité
          </p>
        </div>

        {onViewAll && (
          <button
            type="button"
            className="btn-primary"
            onClick={onViewAll}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>Voir la liste complète dans les Contrats</span>
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {priorityContracts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 0.5rem auto' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Parfait ! Aucun contrat échu non renouvelé ou en alerte urgente J-7.</p>
        </div>
      ) : (
        <div className="aeropub-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-emerald">
                <th className="table-head-cell">Réf Contrat</th>
                <th className="table-head-cell">Client</th>
                <th className="table-head-cell">Commercial</th>
                <th className="table-head-cell">Échéance</th>
                <th className="table-head-cell">Montant</th>
                <th className="table-head-cell" style={{ textAlign: 'center' }}>Urgence / Alerte</th>
                <th className="table-head-cell" style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {priorityContracts.slice(0, 8).map((c) => {
                const diff = getDiffJours(c.date_echeance || c.date_fin);
                const isEchu = diff < 0;
                return (
                  <tr key={c.reference || c.id} className="table-body-row">
                    <td className="cell-indigo" style={{ fontWeight: 700 }}>
                      {c.reference || `#${c.id}`}
                    </td>
                    <td className="cell-bold-white">
                      {c.raison_sociale || c.nom_client || `Client #${c.id_client}`}
                    </td>
                    <td className="cell-cyan">
                      {c.nom_commercial || 'Direction'}
                    </td>
                    <td className="cell-muted" style={{ fontSize: '0.84rem' }}>
                      {c.date_echeance || c.date_fin ? new Date(c.date_echeance || c.date_fin).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="cell-emerald" style={{ fontWeight: 700 }}>
                      {c.tarif ? `${Number(c.tarif).toLocaleString('fr-FR')} ${c.devise || 'MGA'}` : '-'}
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'center' }}>
                      {isEchu ? (
                        <span style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          ⚠️ Échu non renouvelé
                        </span>
                      ) : diff <= 7 ? (
                        <span style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          Échéance ≤ 7j ({diff}j)
                        </span>
                      ) : (
                        <span style={{
                          background: 'rgba(249, 115, 22, 0.2)',
                          color: '#f97316',
                          border: '1px solid rgba(249, 115, 22, 0.4)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          Échéance J-30 ({diff}j)
                        </span>
                      )}
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onSelectAbonnement && onSelectAbonnement(c)}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Eye size={13} />
                        <span>Détails</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
