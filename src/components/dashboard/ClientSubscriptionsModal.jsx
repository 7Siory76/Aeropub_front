import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, X } from 'lucide-react';

export default function ClientSubscriptionsModal({ selectedClient, onClose, abonnements = [] }) {
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  if (!selectedClient) return null;

  // Filtrage multicritère des abonnements du client sélectionné
  const selectedClientAbos = abonnements.filter(abo => {
    const isClientMatch = (
      String(abo.id_client) === String(selectedClient.id) ||
      abo.nom_client?.toLowerCase() === selectedClient.nom_client?.toLowerCase()
    );
    if (!isClientMatch) return false;

    if (!clientSearchQuery) return true;
    const cq = clientSearchQuery.toLowerCase();
    return (
      abo.reference?.toLowerCase().includes(cq) ||
      abo.reference_emplacement?.toLowerCase().includes(cq) ||
      abo.nom_lieu?.toLowerCase().includes(cq) ||
      abo.type_zone?.toLowerCase().includes(cq) ||
      abo.nom_type_support?.toLowerCase().includes(cq) ||
      abo.ref_format?.toLowerCase().includes(cq) ||
      abo.ref_facture?.toLowerCase().includes(cq) ||
      abo.duree_contrat?.toLowerCase().includes(cq) ||
      abo.statut_emplacement?.toLowerCase().includes(cq) ||
      (abo.date_debut && new Date(abo.date_debut).toLocaleDateString('fr-FR').includes(cq)) ||
      (abo.date_fin && new Date(abo.date_fin).toLocaleDateString('fr-FR').includes(cq))
    );
  });

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content client-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="client-modal-header">
          <h3 className="client-modal-title">
            <Users size={22} style={{ color: 'var(--accent-primary)' }} />
            <span>Abonnements de {selectedClient.nom_client}</span>
          </h3>
          <div className="client-modal-subinfo">
            <span>📧 Contact : {selectedClient.contact || 'N/A'}</span>
            {selectedClient.secteur_activite && (
              <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>🏢 Secteur : {selectedClient.secteur_activite}</span>
            )}
          </div>
        </div>

        {/* Barre de Filtre Multicritère */}
        <div className="search-input-wrapper client-modal-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '2.5rem', borderRadius: '10px' }}
            placeholder="Filtre multicritère (Réf, Lieu, Zone, Support, Format, Date, Facture)..."
            value={clientSearchQuery}
            onChange={(e) => setClientSearchQuery(e.target.value)}
          />
          {clientSearchQuery && (
            <button
              type="button"
              onClick={() => setClientSearchQuery('')}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Liste scrollable des Abonnements du Client */}
        <div className="client-abos-list">
          {selectedClientAbos.length === 0 ? (
            <p className="empty-msg" style={{ padding: '2rem' }}>
              Aucun abonnement trouvé pour ce client {clientSearchQuery ? `correspondant à « ${clientSearchQuery} »` : ''}.
            </p>
          ) : (
            selectedClientAbos.map((abo) => (
              <div key={abo.id} className="client-abo-card">
                <div className="client-abo-card-header">
                  <span className="client-abo-ref">
                    RÉF : {abo.reference_emplacement || abo.reference}
                  </span>
                  <span className={`wireframe-badge ${abo.statut_emplacement === 'disponible' ? 'badge-available' : 'badge-occupied'}`}>
                    {abo.statut_emplacement || 'location en cours'}
                  </span>
                </div>

                <div className="client-abo-grid">
                  <div>
                    <span className="client-abo-label">📍 Lieu & Zone :</span>
                    <div className="client-abo-value">
                      {abo.nom_lieu || 'N/A'} ({abo.type_zone || 'Zone N/A'})
                    </div>
                  </div>

                  <div>
                    <span className="client-abo-label">📺 Support & Format :</span>
                    <div className="client-abo-value" style={{ color: 'var(--accent-secondary)' }}>
                      {abo.nom_type_support || 'Support Standard'} | {abo.ref_format || 'Format N/A'}
                    </div>
                  </div>

                  <div>
                    <span className="client-abo-label">📅 Période Contrat :</span>
                    <div className="client-abo-value" style={{ color: 'var(--accent-success)' }}>
                      {new Date(abo.date_debut).toLocaleDateString('fr-FR')} ➔ {new Date(abo.date_fin).toLocaleDateString('fr-FR')} {abo.duree_contrat ? `(${abo.duree_contrat})` : ''}
                    </div>
                  </div>

                  <div>
                    <span className="client-abo-label">🧾 Facture & Quantité :</span>
                    <div className="client-abo-value">
                      Facture : {abo.ref_facture || 'N/A'} {abo.quantite > 1 ? `| Pack ${abo.quantite}x` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
