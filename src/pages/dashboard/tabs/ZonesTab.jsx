import React, { useState, useEffect, useMemo } from 'react';
import { Plane, Compass, MapPin, Search, RotateCcw } from 'lucide-react';

export default function ZonesTab({
  zones = [],
  aeroports = [],
  perimetres = [],
  initialSearchQuery = ''
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedAeroport, setSelectedAeroport] = useState('all');
  const [selectedPerimetre, setSelectedPerimetre] = useState('all');

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const aeroList = aeroports.length > 0 ? aeroports : [
    { id: 1, nom: 'Ivato' },
    { id: 2, nom: 'Nosy Be' }
  ];

  const periList = perimetres.length > 0 ? perimetres : [
    { id: 1, nom: 'National' },
    { id: 2, nom: 'International' }
  ];

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedAeroport !== 'all' ||
    selectedPerimetre !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedAeroport('all');
    setSelectedPerimetre('all');
  };

  const filteredZones = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return zones.filter((z) => {
      // 1. Recherche textuelle
      if (q) {
        const match =
          (z.nom_zone || z.nom_lieu || z.type_zone || '').toLowerCase().includes(q) ||
          (z.nom_aeroport || '').toLowerCase().includes(q) ||
          (z.nom_perimetre || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Aéroport
      if (selectedAeroport !== 'all') {
        const aero = (z.nom_aeroport || '').toLowerCase();
        if (aero !== selectedAeroport.toLowerCase() && String(z.id_aeroport) !== String(selectedAeroport)) {
          return false;
        }
      }

      // 3. Périmètre
      if (selectedPerimetre !== 'all') {
        const peri = (z.nom_perimetre || '').toLowerCase();
        if (peri !== selectedPerimetre.toLowerCase() && String(z.id_perimetre) !== String(selectedPerimetre)) {
          return false;
        }
      }

      return true;
    });
  }, [zones, searchTerm, selectedAeroport, selectedPerimetre]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Ligne Aéroports & Périmètres */}
      <div className="two-col-grid">
        <div>
          <h4 className="col-title-cyan" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plane size={16} />
            <span>Aéroports Rattachés ({aeroList.length})</span>
          </h4>
          {aeroList.map((a) => (
            <div key={a.id} className="zone-card-cyan">
              #{a.id} - <strong style={{ color: 'var(--text-main)' }}>{a.nom}</strong>
            </div>
          ))}
        </div>

        <div>
          <h4 className="col-title-pink" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Compass size={16} />
            <span>Périmètres d'Exploitation ({periList.length})</span>
          </h4>
          {periList.map((p) => (
            <div key={p.id} className="zone-card-pink">
              #{p.id} - <strong style={{ color: 'var(--text-main)' }}>{p.nom}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Zones Terminales Aéroportuaires avec Filtres Multicritères */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 className="col-title-indigo" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={16} />
            <span>Zones Terminales d'Affichage</span>
          </h4>
        </div>

        {/* Barre de Filtres Multicritères */}
        <div className="ts-filters-bar">
          <div className="ts-filter-group">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="ts-filter-input"
              placeholder="Rechercher zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '180px' }}
            />
          </div>

          <div className="ts-filter-group">
            <span>Aéroport :</span>
            <select
              className="ts-filter-select"
              value={selectedAeroport}
              onChange={(e) => setSelectedAeroport(e.target.value)}
            >
              <option value="all">Tous les aéroports ✈️</option>
              {aeroList.map((a) => (
                <option key={a.id} value={a.nom}>
                  {a.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="ts-filter-group">
            <span>Périmètre :</span>
            <select
              className="ts-filter-select"
              value={selectedPerimetre}
              onChange={(e) => setSelectedPerimetre(e.target.value)}
            >
              <option value="all">Tous les périmètres 🧭</option>
              {periList.map((p) => (
                <option key={p.id} value={p.nom}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="ts-reset-btn"
              onClick={resetFilters}
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw size={13} />
              <span>Réinitialiser</span>
            </button>
          )}

          <div className="ts-filter-badge-count">
            {filteredZones.length} / {zones.length} zones
          </div>
        </div>

        {filteredZones.length === 0 ? (
          <p className="empty-msg">Aucune zone terminale ne correspond à ces critères.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.6rem' }}>
            {filteredZones.map((z) => (
              <div key={z.id} className="zone-card-indigo" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div>
                  #{z.id} - <strong style={{ color: 'var(--text-main)' }}>{z.nom_zone || z.nom_lieu || z.type_zone}</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Aéroport : <span style={{ color: 'var(--accent-primary)' }}>{z.nom_aeroport || 'Ivato'}</span> | Périmètre : <span style={{ color: 'var(--accent-secondary)' }}>{z.nom_perimetre || 'National'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
