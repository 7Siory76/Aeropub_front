import React from 'react';

export default function AbonnementsTab({ abonnements = [] }) {
  if (abonnements.length === 0) {
    return <p className="empty-msg">Aucun abonnement trouvé.</p>;
  }

  return (
    <div className="aeropub-table-wrapper">
      <table className="aeropub-table">
        <thead>
          <tr className="table-head-row-emerald">
            <th className="table-head-cell">ID</th>
            <th className="table-head-cell">Réf Emplacement</th>
            <th className="table-head-cell">Nom du Client</th>
            <th className="table-head-cell">Secteur</th>
            <th className="table-head-cell">Facture / Durée</th>
            <th className="table-head-cell">Période d'Abonnement</th>
          </tr>
        </thead>
        <tbody>
          {abonnements.map((abo) => (
            <tr key={abo.id} className="table-body-row">
              <td className="cell-bold-white">#{abo.id}</td>
              <td className="cell-indigo">{abo.reference_emplacement || abo.reference}</td>
              <td className="cell-bold-white">{abo.nom_client || `Client #${abo.id_client}`}</td>
              <td className="cell-muted">{abo.secteur_activite || 'N/A'}</td>
              <td className="cell-cyan">
                {abo.ref_facture || 'N/A'} {abo.duree_contrat ? `(${abo.duree_contrat})` : ''}
              </td>
              <td className="cell-emerald">
                {new Date(abo.date_debut).toLocaleDateString('fr-FR')} ➔ {new Date(abo.date_fin).toLocaleDateString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
