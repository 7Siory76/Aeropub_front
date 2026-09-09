import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RotateCcw } from 'lucide-react';
import Pagination from '../../../components/Pagination';

export default function EmplacementsTab({
  emplacements = [],
  typeSupports = [],
  categories = [],
  zones = [],
  aeroports = [],
  initialSearchQuery = '',
  onSelectEmplacement,
  onAddEmplacementClick
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAeroport, setSelectedAeroport] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Synchronisation avec la recherche globale
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Réinitialiser la pagination lors d'un changement de filtre
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCategory, selectedAeroport, selectedZone, selectedStatus]);

  // Listes déroulantes dédupliquées pour les filtres
  const typeOptions = useMemo(() => {
    if (typeSupports.length > 0) return typeSupports;
    const names = [...new Set(emplacements.map(e => e.nom_type_support || e.nom_type).filter(Boolean))];
    return names.map((n, i) => ({ id: i + 1, nom: n }));
  }, [typeSupports, emplacements]);

  const catOptions = useMemo(() => {
    if (categories.length > 0) return categories;
    const names = [...new Set(emplacements.map(e => e.nom_categorie).filter(Boolean))];
    return names.map((n, i) => ({ id: i + 1, nom: n }));
  }, [categories, emplacements]);

  const aeroOptions = useMemo(() => {
    if (aeroports.length > 0) return aeroports;
    const names = [...new Set(emplacements.map(e => e.nom_aeroport).filter(Boolean))];
    return names.map((n, i) => ({ id: i + 1, nom: n }));
  }, [aeroports, emplacements]);

  const zoneOptions = useMemo(() => {
    let baseZones = zones.length > 0 ? zones : emplacements.map(e => ({ nom_zone: e.nom_zone || e.nom_lieu }));
    if (selectedAeroport !== 'all') {
      baseZones = baseZones.filter(z => (z.nom_aeroport || '').toLowerCase() === selectedAeroport.toLowerCase());
    }
    const names = [...new Set(baseZones.map(z => z.nom_zone || z.nom_lieu || z.type_zone).filter(Boolean))];
    return names.map((n, i) => ({ id: i + 1, nom: n }));
  }, [zones, emplacements, selectedAeroport]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedAeroport !== 'all' ||
    selectedZone !== 'all' ||
    selectedStatus !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedAeroport('all');
    setSelectedZone('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  // Filtrage multicritère combiné
  const filteredEmplacements = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return emplacements.filter((emp) => {
      // 1. Recherche textuelle
      if (q) {
        const matchText =
          (emp.reference || '').toLowerCase().includes(q) ||
          (emp.nom_type_support || emp.nom_type || '').toLowerCase().includes(q) ||
          (emp.nom_categorie || '').toLowerCase().includes(q) ||
          (emp.nom_zone || emp.nom_lieu || '').toLowerCase().includes(q) ||
          (emp.nom_aeroport || '').toLowerCase().includes(q) ||
          (emp.caracteristiques || emp.ref_format || '').toLowerCase().includes(q) ||
          (emp.observation || '').toLowerCase().includes(q);

        if (!matchText) return false;
      }

      // 2. Type de Support
      if (selectedType !== 'all') {
        const empType = (emp.nom_type_support || emp.nom_type || '').toLowerCase();
        if (empType !== selectedType.toLowerCase() && String(emp.id_type) !== String(selectedType) && String(emp.id_type_support) !== String(selectedType)) {
          return false;
        }
      }

      // 3. Catégorie
      if (selectedCategory !== 'all') {
        const empCat = (emp.nom_categorie || '').toLowerCase();
        if (empCat !== selectedCategory.toLowerCase() && String(emp.id_categorie) !== String(selectedCategory)) {
          return false;
        }
      }

      // 4. Aéroport
      if (selectedAeroport !== 'all') {
        const empAero = (emp.nom_aeroport || '').toLowerCase();
        if (empAero !== selectedAeroport.toLowerCase() && String(emp.id_aeroport) !== String(selectedAeroport)) {
          return false;
        }
      }

      // 5. Zone
      if (selectedZone !== 'all') {
        const empZone = (emp.nom_zone || emp.nom_lieu || emp.type_zone || '').toLowerCase();
        if (empZone !== selectedZone.toLowerCase() && String(emp.id_zone) !== String(selectedZone)) {
          return false;
        }
      }

      // 6. Statut (Disponible / Occupé)
      if (selectedStatus !== 'all') {
        const stateDisplay = (emp.etat || emp.statut || 'Disponible').toLowerCase();
        const isOccupied = stateDisplay.includes('occup');
        if (selectedStatus === 'Disponible' && isOccupied) return false;
        if (selectedStatus === 'Occupé' && !isOccupied) return false;
      }

      return true;
    });
  }, [emplacements, searchTerm, selectedType, selectedCategory, selectedAeroport, selectedZone, selectedStatus]);

  // Découpage par pagination
  const paginatedEmplacements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmplacements.slice(start, start + pageSize);
  }, [filteredEmplacements, currentPage, pageSize]);

  return (
    <div>
      {/* Barre de Filtres Multicritères */}
      <div className="ts-filters-bar">
        <div className="ts-filter-group">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="ts-filter-input"
            placeholder="Rechercher (Réf, dimensions...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '190px' }}
          />
        </div>

        <div className="ts-filter-group">
          <span>Type :</span>
          <select
            className="ts-filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">Tous les types 🏷️</option>
            {typeOptions.map((t) => {
              const name = t.nom || t.nom_type;
              return (
                <option key={t.id || name} value={name}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="ts-filter-group">
          <span>Catégorie :</span>
          <select
            className="ts-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Toutes 📁</option>
            {catOptions.map((c) => {
              const name = c.nom || c.nom_categorie;
              return (
                <option key={c.id || name} value={name}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="ts-filter-group">
          <span>Aéroport :</span>
          <select
            className="ts-filter-select"
            value={selectedAeroport}
            onChange={(e) => {
              setSelectedAeroport(e.target.value);
              setSelectedZone('all');
            }}
          >
            <option value="all">Tous les aéroports ✈️</option>
            {aeroOptions.map((a) => (
              <option key={a.id || a.nom} value={a.nom}>
                {a.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="ts-filter-group">
          <span>Zone :</span>
          <select
            className="ts-filter-select"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
          >
            <option value="all">Toutes les zones 📍</option>
            {zoneOptions.map((z) => (
              <option key={z.id || z.nom} value={z.nom}>
                {z.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="ts-filter-group">
          <span>Statut :</span>
          <select
            className="ts-filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="Disponible">🟢 Disponible</option>
            <option value="Occupé">🔴 Occupé</option>
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
          {filteredEmplacements.length} / {emplacements.length} support{emplacements.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="aeropub-table-wrapper">
        {filteredEmplacements.length === 0 ? (
          <p className="empty-msg">Aucun support ou emplacement ne correspond à ces critères.</p>
        ) : (
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-indigo">
                <th className="table-head-cell">Référence</th>
                <th className="table-head-cell">Type de Support</th>
                <th className="table-head-cell">Catégorie</th>
                <th className="table-head-cell">Zone & Aéroport</th>
                <th className="table-head-cell">Caractéristiques</th>
                <th className="table-head-cell" style={{ textAlign: 'center' }}>État / Statut</th>
                <th className="table-head-cell">Observation</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmplacements.map((emp) => {
                const zoneDisplay = emp.nom_zone || emp.nom_lieu || 'Zone N/A';
                const aeroDisplay = emp.nom_aeroport ? ` - ${emp.nom_aeroport}` : (emp.type_zone ? ` (${emp.type_zone})` : '');
                const stateDisplay = emp.etat || emp.statut || 'Disponible';
                const isOccupied = stateDisplay.toLowerCase() === 'occupé' || stateDisplay.toLowerCase() === 'occupe';

                return (
                  <tr
                    key={emp.reference}
                    className="table-body-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectEmplacement && onSelectEmplacement(emp)}
                  >
                    <td className="cell-bold-white">{emp.reference}</td>
                    <td className="cell-cyan">{emp.nom_type_support || emp.nom_type || 'N/A'}</td>
                    <td className="cell-muted">{emp.nom_categorie || 'Général'}</td>
                    <td className="table-body-cell">
                      <strong>{zoneDisplay}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{aeroDisplay}</span>
                    </td>
                    <td className="cell-muted" style={{ fontSize: '0.84rem' }}>
                      {emp.caracteristiques || emp.ref_format || '-'}
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'center' }}>
                      <span className={`wireframe-badge ${!isOccupied ? 'badge-available' : 'badge-occupied'}`}>
                        {stateDisplay}
                      </span>
                    </td>
                    <td className="cell-muted" style={{ fontSize: '0.82rem' }}>{emp.observation || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination pour les supports */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredEmplacements.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Bouton d'ajout de support publicitaire (CSS corrigé et stylé) */}
      <div className="add-support-bar">
        <button
          type="button"
          onClick={onAddEmplacementClick}
          className="btn-add-support"
        >
          <Plus size={20} strokeWidth={2.6} />
          <span>Ajouter un support publicitaire</span>
        </button>
      </div>
    </div>
  );
}
