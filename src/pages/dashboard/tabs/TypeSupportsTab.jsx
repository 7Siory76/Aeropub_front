import React, { useState } from 'react';
import { Layers, ChevronRight, ChevronDown, ChevronUp, Search, RotateCcw } from 'lucide-react';

export default function TypeSupportsTab({
  typeSupports = [],
  emplacements = [],
  abonnements = [],
  clients = [],
  zones = [],
  initialSearchQuery = ''
}) {
  const [selectedTypeSupport, setSelectedTypeSupport] = useState(null);
  const [typeSearch, setTypeSearch] = useState('');
  const [supportSearch, setSupportSearch] = useState(initialSearchQuery);
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

  const activeTsName = activeTS?.nom || activeTS?.nom_type;

  // Emplacements / supports pour ce Type de Support
  const tsEmplacements = activeTS
    ? emplacements.filter(e => 
        e.id_type === activeTS.id ||
        e.id_type_support === activeTS.id ||
        e.nom_type_support === activeTsName ||
        e.nom_type === activeTsName
      )
    : [];

  const hasActiveFilters =
    supportSearch.trim() !== '' ||
    tsDateFilter !== 'all' ||
    tsZoneFilter !== 'all' ||
    tsClientFilter !== 'all' ||
    tsStatusFilter !== 'all';

  const resetFilters = () => {
    setSupportSearch('');
    setTsDateFilter('all');
    setTsZoneFilter('all');
    setTsClientFilter('all');
    setTsStatusFilter('all');
  };

  // Application des filtres : Recherche textuelle, Date, Client, Status, Zone
  const filteredTsEmps = tsEmplacements.filter(emp => {
    const abo = abonnements.find(a => 
      (a.reference_emplacement || a.reference) === emp.reference ||
      (a.supports_associes && a.supports_associes.includes(emp.reference))
    );

    // 1. Recherche textuelle dans le support
    if (supportSearch.trim()) {
      const q = supportSearch.toLowerCase().trim();
      const match =
        (emp.reference || '').toLowerCase().includes(q) ||
        (emp.caracteristiques || emp.ref_format || '').toLowerCase().includes(q) ||
        (emp.nom_zone || emp.nom_lieu || '').toLowerCase().includes(q) ||
        (emp.observation || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Filtre par Date sélectionnée (Contrat actif à cette date)
    if (tsDateFilter && tsDateFilter !== 'all') {
      if (!abo) return false;
      const dateParts = tsDateFilter.split('-');
      if (dateParts.length === 3) {
        const targetTime = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10), 12, 0, 0).getTime();
        const startStr = String(abo.date_debut || '').trim().replace(' ', 'T');
        const endStr = String(abo.date_echeance || abo.date_fin || '').trim().replace(' ', 'T');
        const startTime = new Date(startStr).getTime();
        const endTime = new Date(endStr).getTime();

        if (isNaN(startTime) || isNaN(endTime) || targetTime < startTime || targetTime > endTime) {
          return false;
        }
      }
    }

    // 3. Filtre Client
    if (tsClientFilter !== 'all') {
      if (!abo || (
        String(abo.id_client) !== String(tsClientFilter) && 
        abo.nom_client !== tsClientFilter && 
        abo.raison_sociale !== tsClientFilter
      )) {
        return false;
      }
    }

    // 4. Filtre Status (Occupé / Disponible)
    const empStatus = (emp.etat || emp.statut || 'disponible').toLowerCase();
    const isOccupied = !!abo || empStatus.includes('occup');

    if (tsStatusFilter === 'occupied') {
      if (!isOccupied) return false;
    } else if (tsStatusFilter === 'available') {
      if (isOccupied) return false;
    }

    // 5. Filtre Zone Aéroportuaire
    if (tsZoneFilter !== 'all') {
      const targetZone = zones.find(z => String(z.id) === String(tsZoneFilter));
      const empZone = emp.nom_zone || emp.type_zone || emp.nom_lieu;
      const targetZoneName = targetZone?.nom_zone || targetZone?.type_zone || targetZone?.nom_lieu;

      const isZoneMatch = (
        String(emp.id_zone) === String(tsZoneFilter) ||
        (empZone && targetZoneName && empZone.toLowerCase() === targetZoneName.toLowerCase())
      );
      if (!isZoneMatch) return false;
    }

    return true;
  });

  // Liste des types filtrés par recherche
  const filteredTypes = typeSupports.filter(ts => {
    if (!typeSearch.trim()) return true;
    const name = ts.nom || ts.nom_type || '';
    return name.toLowerCase().includes(typeSearch.toLowerCase().trim());
  });

  return (
    <div className="ts-two-panel-grid">
      {/* COLONNE 1 (GAUCHE) : Type de support */}
      <div className="ts-panel-box ts-left-panel">
        <h3 className="ts-panel-title">
          <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>Types de support</span>
        </h3>

        {/* Barre de recherche sur les types de support */}
        <div style={{ marginBottom: '0.85rem' }}>
          <input
            type="text"
            className="ts-filter-input"
            placeholder="Filtrer types (ex: Numérique)..."
            value={typeSearch}
            onChange={(e) => setTypeSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div className="ts-types-list">
          {filteredTypes.map((ts) => {
            const isSelected = activeTS?.id === ts.id;
            const currentTsName = ts.nom || ts.nom_type;
            const empCount = emplacements.filter(e => 
              e.id_type === ts.id || 
              e.id_type_support === ts.id || 
              e.nom_type_support === currentTsName ||
              e.nom_type === currentTsName
            ).length;

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
                  <div className="ts-card-name">{currentTsName}</div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {empCount} support{empCount > 1 ? 's' : ''}
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
                {activeTsName}
              </h3>
              <span className="client-badge-discrete" style={{ fontSize: '0.82rem', padding: '0.2rem 0.75rem' }}>
                {filteredTsEmps.length} / {tsEmplacements.length} REF
              </span>
            </div>

            {/* Barre de Filtres Multicritères */}
            <div className="ts-filters-bar">
              {/* Recherche textuelle support */}
              <div className="ts-filter-group">
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="ts-filter-input"
                  placeholder="Réf / Dimensions..."
                  value={supportSearch}
                  onChange={(e) => setSupportSearch(e.target.value)}
                  style={{ width: '150px' }}
                />
              </div>

              {/* Filtre par Date */}
              <div className="ts-filter-group">
                <span>Date :</span>
                <input
                  type="date"
                  className="ts-filter-select"
                  value={tsDateFilter === 'all' ? '' : tsDateFilter}
                  onChange={(e) => setTsDateFilter(e.target.value || 'all')}
                />
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
                      {z.nom_zone || z.type_zone} {z.nom_aeroport ? `(${z.nom_aeroport})` : ''}
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
                      {c.raison_sociale || c.nom_client}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Status */}
              <div className="ts-filter-group">
                <span>Statut :</span>
                <select
                  className="ts-filter-select"
                  value={tsStatusFilter}
                  onChange={(e) => setTsStatusFilter(e.target.value)}
                >
                  <option value="all">Tous ∨</option>
                  <option value="occupied">🔴 Occupé</option>
                  <option value="available">🟢 Disponible</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="ts-reset-btn"
                  onClick={resetFilters}
                  title="Réinitialiser les filtres"
                >
                  <RotateCcw size={13} />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>

            {/* Liste déroulante des Références Supports */}
            <div>
              {filteredTsEmps.length === 0 ? (
                <p className="empty-msg">Aucun support publicitaire ne correspond à ces critères.</p>
              ) : (
                filteredTsEmps.map((emp) => {
                  const abo = abonnements.find(a => 
                    (a.reference_emplacement || a.reference) === emp.reference ||
                    (a.supports_associes && a.supports_associes.includes(emp.reference))
                  );
                  const isExpanded = !!expandedRefAcc[emp.reference];
                  const stateVal = (emp.etat || emp.statut || 'Disponible').toLowerCase();
                  const isOccupied = !!abo || stateVal.includes('occup');

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
                          <span style={{ fontSize: '0.82rem' }}>{emp.caracteristiques || emp.ref_format || 'Format standard'}</span>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* Contenu Déroulé */}
                      {isExpanded && (
                        <div className="ts-ref-accordion-body">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
                            <div>
                              <span className="client-abo-label">Zone & Aéroport :</span>
                              <div className="client-abo-value">{emp.nom_zone || emp.nom_lieu || 'N/A'} ({emp.nom_aeroport || 'Ivato'})</div>
                            </div>

                            <div>
                              <span className="client-abo-label">Caractéristiques & Catégorie :</span>
                              <div className="client-abo-value" style={{ color: 'var(--accent-secondary)' }}>
                                {emp.caracteristiques || emp.ref_format || 'N/A'} | {emp.nom_categorie || 'Général'}
                              </div>
                            </div>

                            <div>
                              <span className="client-abo-label">Observation :</span>
                              <div className="client-abo-value">
                                {emp.observation || 'Aucune'}
                              </div>
                            </div>

                            <div>
                              <span className="client-abo-label">Statut Actuel :</span>
                              <div className="client-abo-value" style={{ color: isOccupied ? '#ef4444' : '#10b981' }}>
                                {emp.etat || emp.statut || 'Disponible'}
                              </div>
                            </div>
                          </div>

                          {/* Détails de l'Abonnement si présent */}
                          {abo && (
                            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-glass)' }}>
                              <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
                                📋 Détails du Contrat Actif ({abo.reference}) :
                              </h5>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                                <div>
                                  <span className="client-abo-label">Client :</span>
                                  <div className="client-abo-value">
                                    {abo.raison_sociale || abo.nom_client || `Client #${abo.id_client}`}
                                  </div>
                                </div>

                                <div>
                                  <span className="client-abo-label">Période du Contrat :</span>
                                  <div className="client-abo-value" style={{ color: 'var(--accent-success)' }}>
                                    Du {new Date(abo.date_debut).toLocaleDateString('fr-FR')} au {new Date(abo.date_echeance || abo.date_fin).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>

                                {abo.tarif && (
                                  <div>
                                    <span className="client-abo-label">Tarif Contractuel :</span>
                                    <div className="client-abo-value" style={{ fontWeight: 700 }}>
                                      {Number(abo.tarif).toLocaleString('fr-FR')} {abo.devise || 'MGA'} ({abo.periodicite || 'Annuel'})
                                    </div>
                                  </div>
                                )}

                                {abo.nom_commercial && (
                                  <div>
                                    <span className="client-abo-label">Commercial en charge :</span>
                                    <div className="client-abo-value">{abo.nom_commercial}</div>
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
