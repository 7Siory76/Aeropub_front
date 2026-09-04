import React, { useState } from 'react';
import { Layers, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

export default function TypeSupportsTab({ typeSupports = [], emplacements = [], abonnements = [], clients = [], zones = [] }) {
  const [selectedTypeSupport, setSelectedTypeSupport] = useState(null);
  const [tsDateFilter, setTsDateFilter] = useState('all');
  const [tsClientFilter, setTsClientFilter] = useState('all');
  const [tsStatusFilter, setTsStatusFilter] = useState('all');
  const [tsZoneFilter, setTsZoneFilter] = useState('all');
  const [expandedRefAcc, setExpandedRefAcc] = useState({});

  const toggleRefExpand = (ref) => {
    setExpandedRefAcc(prev => ({
      ...prev,
      [ref]: !prev[ref]
    }));
  };

  const activeTS = selectedTypeSupport || typeSupports[0];

  if (typeSupports.length === 0) {
    return <p className="empty-msg">Aucun type de support trouvé.</p>;
  }

  // Emplacements pour ce Type de Support
  const tsEmplacements = activeTS
    ? emplacements.filter(e => e.id_type_support === activeTS.id || e.nom_type_support === activeTS.nom_type)
    : [];

  // Application des filtres : Date (Intervalle Contrat), Client, Status, Zone
  const filteredTsEmps = tsEmplacements.filter(emp => {
    const abo = abonnements.find(a => (a.reference_emplacement || a.reference) === emp.reference);

    // 1. Filtre par Date sélectionnée (Contrat actif à cette date)
    if (tsDateFilter && tsDateFilter !== 'all') {
      if (!abo) return false;
      const dateParts = tsDateFilter.split('-');
      if (dateParts.length === 3) {
        const targetTime = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10), 12, 0, 0).getTime();
        const startStr = String(abo.date_debut || '').trim().replace(' ', 'T');
        const endStr = String(abo.date_fin || '').trim().replace(' ', 'T');
        const startTime = new Date(startStr).getTime();
        const endTime = new Date(endStr).getTime();

        if (isNaN(startTime) || isNaN(endTime) || targetTime < startTime || targetTime > endTime) {
          return false;
        }
      }
    }

    // 2. Filtre Client
    if (tsClientFilter !== 'all') {
      if (!abo || (String(abo.id_client) !== String(tsClientFilter) && abo.nom_client !== tsClientFilter)) {
        return false;
      }
    }

    // 3. Filtre Status (Occupé / Disponible)
    if (tsStatusFilter === 'occupied') {
      if (!abo && emp.statut === 'disponible') return false;
    } else if (tsStatusFilter === 'available') {
      if (abo || emp.statut !== 'disponible') return false;
    }

    // 4. Filtre Zone Aéroportuaire
    if (tsZoneFilter !== 'all') {
      const targetZone = zones.find(z => String(z.id) === String(tsZoneFilter));
      const empZone = emp.type_zone || emp.nom_zone;
      const targetZoneName = targetZone?.type_zone || targetZone?.nom_zone;

      const isZoneMatch = (
        String(emp.id_zone) === String(tsZoneFilter) ||
        (empZone && targetZoneName && empZone.toLowerCase() === targetZoneName.toLowerCase())
      );
      if (!isZoneMatch) return false;
    }

    return true;
  });

  return (
    <div className="ts-two-panel-grid">
      {/* COLONNE 1 (GAUCHE) : Type de support */}
      <div className="ts-panel-box ts-left-panel">
        <h3 className="ts-panel-title">
          <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>Type de support</span>
        </h3>

        <div className="ts-types-list">
          {typeSupports.map((ts) => {
            const isSelected = activeTS?.id === ts.id;
            const empCount = emplacements.filter(e => e.id_type_support === ts.id || e.nom_type_support === ts.nom_type).length;

            return (
              <div
                key={ts.id}
                className={`ts-card-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTypeSupport(ts);
                  setExpandedRefAcc({});
                }}
              >
                <div>
                  <div className="ts-card-name">{ts.nom_type}</div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {empCount} emplacement{empCount > 1 ? 's' : ''}
                  </span>
                </div>
                <ChevronRight size={18} style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }} className="ts-card-arrow" />
              </div>
            );
          })}
        </div>
      </div>

      {/* COLONNE 2 (DROITE) : Vue détaillée du Type de Support sélectionné */}
      <div className="ts-panel-box">
        {!activeTS ? (
          <p className="empty-msg">Veuillez sélectionner un type de support.</p>
        ) : (
          <div>
            {/* Titre du Type de Support sélectionné */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.5px', color: 'var(--text-main)', textTransform: 'uppercase' }}>
                {activeTS.nom_type}
              </h3>
              <span className="client-badge-discrete" style={{ fontSize: '0.82rem', padding: '0.2rem 0.75rem' }}>
                {filteredTsEmps.length} REF
              </span>
            </div>

            {/* Barre de Filtres */}
            <div className="ts-filters-bar">
              {/* Filtre par Date */}
              <div className="ts-filter-group">
                <span>Date / Mois :</span>
                <input
                  type="date"
                  className="ts-filter-select"
                  value={tsDateFilter === 'all' ? '' : tsDateFilter}
                  onChange={(e) => setTsDateFilter(e.target.value || 'all')}
                />
                {tsDateFilter !== 'all' && (
                  <button
                    type="button"
                    className="pill-btn"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                    onClick={() => setTsDateFilter('all')}
                    title="Réinitialiser le filtre date"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Filtre Zone Aéroportuaire */}
              <div className="ts-filter-group">
                <span>Zone :</span>
                <select
                  className="ts-filter-select"
                  value={tsZoneFilter}
                  onChange={(e) => setTsZoneFilter(e.target.value)}
                >
                  <option value="all">Toutes 🗺️</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>
                      {z.type_zone || z.nom_zone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Client */}
              <div className="ts-filter-group">
                <span>Client :</span>
                <select
                  className="ts-filter-select"
                  value={tsClientFilter}
                  onChange={(e) => setTsClientFilter(e.target.value)}
                >
                  <option value="all">Tous 🔍</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom_client}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Status */}
              <div className="ts-filter-group">
                <span>Status :</span>
                <select
                  className="ts-filter-select"
                  value={tsStatusFilter}
                  onChange={(e) => setTsStatusFilter(e.target.value)}
                >
                  <option value="all">Tous ∨</option>
                  <option value="occupied">Occupé</option>
                  <option value="available">Disponible</option>
                </select>
              </div>
            </div>

            {/* Liste déroulante des Références Emplacements (REF: ... ∨) */}
            <div>
              {filteredTsEmps.length === 0 ? (
                <p className="empty-msg">Aucun emplacement trouvé pour ce type de support et ces critères.</p>
              ) : (
                filteredTsEmps.map((emp) => {
                  const abo = abonnements.find(a => (a.reference_emplacement || a.reference) === emp.reference);
                  const isExpanded = !!expandedRefAcc[emp.reference];
                  const isOccupied = !!abo || (emp.statut && emp.statut !== 'disponible');

                  return (
                    <div key={emp.reference} className="ts-ref-accordion-item">
                      {/* En-tête Référence */}
                      <div
                        className="ts-ref-accordion-header"
                        onClick={() => toggleRefExpand(emp.reference)}
                      >
                        <div className="ts-ref-title">
                          <span>{emp.reference}</span>
                          <span className={`wireframe-badge ${isOccupied ? 'badge-occupied' : 'badge-available'}`} style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem' }}>
                            {isOccupied ? 'Occupé' : 'Disponible'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                          <span style={{ fontSize: '0.82rem' }}>{emp.ref_format || 'Format N/A'}</span>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* Contenu Déroulé */}
                      {isExpanded && (
                        <div className="ts-ref-accordion-body">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
                            <div>
                              <span className="client-abo-label">Localisation & Zone :</span>
                              <div className="client-abo-value">{emp.nom_lieu || 'N/A'} ({emp.type_zone || 'Zone N/A'})</div>
                            </div>

                            <div>
                              <span className="client-abo-label">Format & Catégorie :</span>
                              <div className="client-abo-value" style={{ color: 'var(--accent-secondary)' }}>
                                {emp.ref_format || 'N/A'} | {emp.nom_categorie || 'Général'}
                              </div>
                            </div>

                            <div>
                              <span className="client-abo-label">Quantité & Observation :</span>
                              <div className="client-abo-value">
                                Qté : {emp.quantite || 1} {emp.observation ? `(${emp.observation})` : ''}
                              </div>
                            </div>

                            <div>
                              <span className="client-abo-label">Statut Emplacement :</span>
                              <div className="client-abo-value" style={{ color: isOccupied ? '#ef4444' : '#10b981' }}>
                                {emp.statut || 'disponible'}
                              </div>
                            </div>
                          </div>

                          {/* Détails de l'Abonnement si présent */}
                          {abo && (
                            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-glass)' }}>
                              <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
                                📋 Détails de l'Abonnement en cours :
                              </h5>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                                <div>
                                  <span className="client-abo-label">Client :</span>
                                  <div className="client-abo-value">{abo.nom_client || `Client #${abo.id_client}`} {abo.secteur_activite ? `(${abo.secteur_activite})` : ''}</div>
                                </div>

                                <div>
                                  <span className="client-abo-label">Période du Contrat :</span>
                                  <div className="client-abo-value" style={{ color: 'var(--accent-success)' }}>
                                    Du {new Date(abo.date_debut).toLocaleDateString('fr-FR')} au {new Date(abo.date_fin).toLocaleDateString('fr-FR')} {abo.duree_contrat ? `(${abo.duree_contrat})` : ''}
                                  </div>
                                </div>

                                {abo.ref_facture && (
                                  <div>
                                    <span className="client-abo-label">Facture / Cde :</span>
                                    <div className="client-abo-value">{abo.ref_facture}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
