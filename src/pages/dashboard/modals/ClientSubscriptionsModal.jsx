import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, X, Layers, Coins } from 'lucide-react';

export default function ClientSubscriptionsModal({ selectedClient, onClose, abonnements = [] }) {
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  if (!selectedClient) return null;

  const clientName = selectedClient.raison_sociale || selectedClient.nom_client;

  // Filtrage multicritère des abonnements du client sélectionné
  const selectedClientAbos = useMemo(() => {
    return abonnements.filter(abo => {
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
  }, [abonnements, selectedClient, clientName, clientSearchQuery]);

  // Calcul du montant total cumulé de tous les abonnements du client
  const totalPrixTousAbonnements = useMemo(() => {
    return selectedClientAbos.reduce((acc, abo) => {
      const t = parseFloat(abo.tarif);
      return acc + (isNaN(t) ? 0 : t);
    }, 0);
  }, [selectedClientAbos]);

  const defaultDevise = selectedClientAbos[0]?.devise || 'MGA';

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.25s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la modale */}
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

        {/* Bannière récapitulative : Total de tous les abonnements */}
        <div style={{
          marginTop: '0.9rem',
          padding: '0.85rem 1.1rem',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <Coins size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Total de tous les contrats ({selectedClientAbos.length})
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                {totalPrixTousAbonnements.toLocaleString('fr-FR')} {defaultDevise}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Cumul contractuel
          </span>
        </div>

        {/* Barre de recherche */}
        <div className="search-input-wrapper client-modal-search" style={{ margin: '0.9rem 0 0.6rem 0' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '2.5rem', borderRadius: '10px', width: '100%' }}
            placeholder="Filtrer les contrats (référence, support, campagne, date)..."
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

        {/* Liste des contrats du client */}
        <div className="client-abos-list" style={{ maxHeight: '440px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {selectedClientAbos.length === 0 ? (
            <p className="empty-msg" style={{ padding: '2rem' }}>
              Aucun contrat trouvé pour ce client{clientSearchQuery ? ` correspondant à « ${clientSearchQuery} »` : ''}.
            </p>
          ) : (
            selectedClientAbos.map((abo) => {
              const statutStr = abo.statut_abonnement || abo.statut || 'Actif';
              const aboDevise = abo.devise || 'MGA';
              const tarifAboNum = parseFloat(abo.tarif) || 0;

              // Décodage des supports avec leur prix individuel
              let parsedSupports = [];
              if (Array.isArray(abo.supports_details)) {
                parsedSupports = abo.supports_details;
              } else if (typeof abo.supports_details === 'string') {
                try {
                  parsedSupports = JSON.parse(abo.supports_details);
                } catch {
                  parsedSupports = [];
                }
              }

              return (
                <div key={abo.reference || abo.id} className="client-abo-card" style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1rem' }}>
                      Contrat : {abo.reference || `#${abo.id}`}
                    </span>
                    <span className={`wireframe-badge ${statutStr.toLowerCase() === 'actif' ? 'badge-available' : 'badge-occupied'}`}>
                      {statutStr}
                    </span>
                  </div>

                  {/* Section des supports avec ref + prix individuel */}
                  <div style={{ marginBottom: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <Layers size={14} style={{ color: '#06b6d4' }} />
                      <span className="client-abo-label" style={{ margin: 0, fontWeight: 700, color: '#06b6d4' }}>
                        Supports et prix :
                      </span>
                    </div>

                    {parsedSupports && parsedSupports.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {parsedSupports.map((sup, idx) => {
                          const supRef = sup.reference_support || sup.reference;
                          const supPrix = parseFloat(sup.prix_support) || 0;
                          return (
                            <div key={idx} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              fontSize: '0.84rem'
                            }}>
                              <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                                📍 {supRef}
                              </span>
                              <span style={{ fontWeight: 600, color: '#10b981' }}>
                                {supPrix.toLocaleString('fr-FR')} {aboDevise}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        {abo.supports_associes || abo.reference_emplacement || 'Aucun support rattaché'}
                      </div>
                    )}
                  </div>

                  {/* Informations financières et contractuelles */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                    <div>
                      <span className="client-abo-label">💰 Total contrat :</span>
                      <div className="client-abo-value" style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>
                        {tarifAboNum.toLocaleString('fr-FR')} {aboDevise}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.35rem' }}>
                          ({abo.periodicite || 'Annuel'})
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="client-abo-label">📢 Annonceur / Campagne :</span>
                      <div className="client-abo-value">
                        {abo.annonceur_campagne || 'Campagne standard'}
                      </div>
                    </div>

                    <div>
                      <span className="client-abo-label">📅 Période contractuelle :</span>
                      <div className="client-abo-value">
                        Du {abo.date_debut ? new Date(abo.date_debut).toLocaleDateString('fr-FR') : '-'} au {abo.date_echeance || abo.date_fin ? new Date(abo.date_echeance || abo.date_fin).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </div>

                    <div>
                      <span className="client-abo-label">👤 Commercial attitré :</span>
                      <div className="client-abo-value">
                        {abo.nom_commercial || 'Direction commerciale'}
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
