import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, X } from 'lucide-react';

export default function ClientSubscriptionsModal({ selectedClient, onClose, abonnements = [] }) {
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  if (!selectedClient) return null;

  const clientName = selectedClient.raison_sociale || selectedClient.nom_client;

  // Filtrage multicritère des abonnements du client sélectionné
  const selectedClientAbos = abonnements.filter(abo => {
    const isClientMatch = (
      String(abo.id_client) === String(selectedClient.id) ||
      abo.nom_client?.toLowerCase() === clientName?.toLowerCase() ||
      abo.raison_sociale?.toLowerCase() === clientName?.toLowerCase()
    );
    if (!isClientMatch) return false;

    if (!clientSearchQuery) return true;
    const cq = clientSearchQuery.toLowerCase();
    return (
      abo.reference?.toLowerCase().includes(cq) ||
      abo.reference_emplacement?.toLowerCase().includes(cq) ||
      abo.supports_associes?.toLowerCase().includes(cq) ||
      abo.annonceur_campagne?.toLowerCase().includes(cq) ||
      abo.nom_commercial?.toLowerCase().includes(cq) ||
      (abo.date_debut && new Date(abo.date_debut).toLocaleDateString('fr-FR').includes(cq)) ||
      (abo.date_echeance && new Date(abo.date_echeance).toLocaleDateString('fr-FR').includes(cq)) ||
      (abo.date_fin && new Date(abo.date_fin).toLocaleDateString('fr-FR').includes(cq))
    );
  });

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '640px', animation: 'scaleUp 0.25s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="client-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
              <Users size={22} style={{ color: 'var(--accent-primary)' }} />
              <span>Contrats de {clientName}</span>
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              <span>📧 {selectedClient.contact || selectedClient.valeur_contact_principal || 'Aucun contact'}</span>
              {selectedClient.adresse_postale && (
                <span style={{ marginLeft: '0.8rem' }}>📍 {selectedClient.adresse_postale}</span>
              )}
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Barre de Filtre Multicritère */}
        <div className="search-input-wrapper client-modal-search" style={{ margin: '1rem 0' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '2.5rem', borderRadius: '10px', width: '100%' }}
            placeholder="Filtrer les contrats (Réf, Support, Campagne, Date)..."
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
        <div className="client-abos-list" style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {selectedClientAbos.length === 0 ? (
            <p className="empty-msg" style={{ padding: '2rem' }}>
              Aucun abonnement trouvé pour ce client {clientSearchQuery ? `correspondant à « ${clientSearchQuery} »` : ''}.
            </p>
          ) : (
            selectedClientAbos.map((abo) => {
              const supportsStr = abo.supports_associes || abo.reference_emplacement || abo.reference || '-';
              const tarifStr = abo.tarif ? `${Number(abo.tarif).toLocaleString('fr-FR')} ${abo.devise || 'MGA'}` : 'N/A';
              const statutStr = abo.statut_abonnement || abo.statut || 'Actif';

              return (
                <div key={abo.reference || abo.id} className="client-abo-card" style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1rem' }}>
                      CONTRAT : {abo.reference || `#${abo.id}`}
                    </span>
                    <span className={`wireframe-badge ${statutStr.toLowerCase() === 'actif' ? 'badge-available' : 'badge-occupied'}`}>
                      {statutStr}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                    <div>
                      <span className="client-abo-label">📺 Support(s) :</span>
                      <div className="client-abo-value" style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                        {supportsStr}
                      </div>
                    </div>

                    <div>
                      <span className="client-abo-label">💰 Tarif :</span>
                      <div className="client-abo-value" style={{ fontWeight: 700, color: 'var(--accent-success)' }}>
                        {tarifStr} ({abo.periodicite || 'Annuel'})
                      </div>
                    </div>

                    <div>
                      <span className="client-abo-label">📅 Période Contractuelle :</span>
                      <div className="client-abo-value">
                        Du {abo.date_debut ? new Date(abo.date_debut).toLocaleDateString('fr-FR') : '-'} au {abo.date_echeance || abo.date_fin ? new Date(abo.date_echeance || abo.date_fin).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </div>

                    <div>
                      <span className="client-abo-label">👤 Commercial :</span>
                      <div className="client-abo-value">
                        {abo.nom_commercial || 'Admin / Direction'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
