import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function ClientsTab({ clients = [], abonnements = [], onSelectClient }) {
  if (clients.length === 0) {
    return <p className="empty-msg">Aucun client trouvé.</p>;
  }

  return (
    <div className="cards-grid">
      {clients.map((cli) => {
        const countAbos = abonnements.filter(
          a => String(a.id_client) === String(cli.id) || a.nom_client === cli.nom_client
        ).length;

        return (
          <div
            key={cli.id}
            className="client-card"
            style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
            onClick={() => onSelectClient(cli)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div className="client-name">{cli.nom_client}</div>
              <span className="client-badge-discrete" title={`${countAbos} abonnement(s)`}>
                {countAbos}
              </span>
            </div>

            <div className="client-contact">📧 {cli.contact || 'Aucun contact'}</div>

            {cli.secteur_activite && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                🏢 Secteur : {cli.secteur_activite}
              </div>
            )}

            <button
              type="button"
              className="flip-toggle-link"
              style={{ marginTop: '0.85rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <ExternalLink size={13} />
              <span>Voir abonnements</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
