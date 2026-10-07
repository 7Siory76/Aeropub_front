import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  MapPin,
  Maximize2,
  Tag,
  Tv,
  Layers,
  FileText
} from 'lucide-react';
import Pagination from '../../../components/Pagination';
import styles from './EmplacementsTab.module.css';

export default function EmplacementsTab({
  emplacements = [],
  typeSupports = [],
  categories = [],
  zones = [],
  aeroports = [],
  typeEtats = [],
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
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('reference');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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

  // État actuel du support (issu de la dernière saisie enregistrée)
  const getStatusSupport = (emp) => emp.etat || emp.statut || 'disponible';

  const etatOptions = useMemo(() => {
    if (typeEtats && typeEtats.length > 0) {
      return typeEtats;
    }
    const names = [...new Set(emplacements.map(e => getStatusSupport(e)).filter(Boolean))];
    return names.map((n, i) => ({ id: i + 1, nom_etat: n }));
  }, [typeEtats, emplacements]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedAeroport !== 'all' ||
    selectedZone !== 'all' ||
    selectedStatus !== 'all';

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedType !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (selectedAeroport !== 'all') count++;
    if (selectedZone !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    return count;
  }, [selectedType, selectedCategory, selectedAeroport, selectedZone, selectedStatus]);

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

      // 6. Statut
      if (selectedStatus !== 'all') {
        const stateDisplay = getStatusSupport(emp).toLowerCase();
        const targetState = selectedStatus.toLowerCase();
        if (stateDisplay !== targetState && !stateDisplay.includes(targetState) && !targetState.includes(stateDisplay)) {
          return false;
        }
      }

      return true;
    });
  }, [emplacements, searchTerm, selectedType, selectedCategory, selectedAeroport, selectedZone, selectedStatus]);

  // Tri des emplacements
  const sortedEmplacements = useMemo(() => {
    const list = [...filteredEmplacements];
    if (!sortField) return list;
    return list.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'reference':
          valA = a.reference || '';
          valB = b.reference || '';
          break;
        case 'type':
          valA = a.nom_type_support || a.nom_type || '';
          valB = b.nom_type_support || b.nom_type || '';
          break;
        case 'categorie':
          valA = a.nom_categorie || '';
          valB = b.nom_categorie || '';
          break;
        case 'zone':
          valA = a.nom_zone || a.nom_lieu || '';
          valB = b.nom_zone || b.nom_lieu || '';
          break;
        case 'caracteristiques':
          valA = a.caracteristiques || '';
          valB = b.caracteristiques || '';
          break;
        case 'statut':
          valA = getStatusSupport(a);
          valB = getStatusSupport(b);
          break;
        default:
          valA = a[sortField] || '';
          valB = b[sortField] || '';
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB, 'fr') : strB.localeCompare(strA, 'fr');
    });
  }, [filteredEmplacements, sortField, sortDirection]);

  // Découpage par pagination
  const paginatedEmplacements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEmplacements.slice(start, start + pageSize);
  }, [sortedEmplacements, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="table-head-sort-icon" style={{ opacity: 0.35 }} />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp size={13} className="table-head-sort-icon" style={{ color: 'var(--accent-secondary, #06b6d4)' }} />
      : <ArrowDown size={13} className="table-head-sort-icon" style={{ color: 'var(--accent-secondary, #06b6d4)' }} />;
  };

  return (
    <div className={styles.container}>
      {/* 1. BARRE DE FILTRES DESKTOP (Écrans > 768px) */}
      <div className={`ts-filters-bar ${styles.desktopFiltersBar}`}>
        <div className={styles.filterGroup}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Rechercher (Réf, dimensions...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '190px' }}
          />
        </div>

        <div className={styles.filterGroup}>
          <span>Type :</span>
          <select
            className={styles.filterSelect}
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

        <div className={styles.filterGroup}>
          <span>Catégorie :</span>
          <select
            className={styles.filterSelect}
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

        <div className={styles.filterGroup}>
          <span>Aéroport :</span>
          <select
            className={styles.filterSelect}
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

        <div className={styles.filterGroup}>
          <span>Zone :</span>
          <select
            className={styles.filterSelect}
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

        <div className={styles.filterGroup}>
          <span>Statut :</span>
          <select
            className={styles.filterSelect}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            {etatOptions.map((et) => {
              const name = et.nom_etat || et.nom;
              return (
                <option key={et.id || name} value={name}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </option>
              );
            })}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={resetFilters}
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw size={13} />
            <span>Réinitialiser</span>
          </button>
        )}

        <div className={styles.filterCountBadge}>
          {filteredEmplacements.length} / {emplacements.length} support{emplacements.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* 2. BARRE D'OUTILS MOBILE ERGONOMIQUE (< 768px) */}
      <div className={styles.mobileToolbar}>
        <div className={styles.mobileSearchRow}>
          <div className={styles.mobileSearchInputWrapper}>
            <Search size={18} className={styles.mobileSearchIcon} />
            <input
              type="text"
              className={styles.mobileSearchInput}
              placeholder="Rechercher un support publicitaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={styles.mobileFilterBtn}
            onClick={() => setIsMobileFilterOpen(true)}
            aria-label="Filtrer les supports"
          >
            <Filter size={18} />
            <span>Filtres</span>
            {activeFilterCount > 0 && <span className={styles.mobileFilterActiveDot} />}
          </button>
        </div>

        {/* Chips de filtres actifs avec suppression 1-clic */}
        {activeFilterCount > 0 && (
          <div className={styles.mobileActiveFiltersChips}>
            {selectedType !== 'all' && (
              <span className={styles.mobileFilterChip}>
                Type: {selectedType}
                <button
                  type="button"
                  className={styles.mobileFilterChipClear}
                  onClick={() => setSelectedType('all')}
                  aria-label="Retirer ce filtre"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className={styles.mobileFilterChip}>
                Cat: {selectedCategory}
                <button
                  type="button"
                  className={styles.mobileFilterChipClear}
                  onClick={() => setSelectedCategory('all')}
                  aria-label="Retirer ce filtre"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedAeroport !== 'all' && (
              <span className={styles.mobileFilterChip}>
                Aéroport: {selectedAeroport}
                <button
                  type="button"
                  className={styles.mobileFilterChipClear}
                  onClick={() => {
                    setSelectedAeroport('all');
                    setSelectedZone('all');
                  }}
                  aria-label="Retirer ce filtre"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedZone !== 'all' && (
              <span className={styles.mobileFilterChip}>
                Zone: {selectedZone}
                <button
                  type="button"
                  className={styles.mobileFilterChipClear}
                  onClick={() => setSelectedZone('all')}
                  aria-label="Retirer ce filtre"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className={styles.mobileFilterChip}>
                Statut: {selectedStatus}
                <button
                  type="button"
                  className={styles.mobileFilterChipClear}
                  onClick={() => setSelectedStatus('all')}
                  aria-label="Retirer ce filtre"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. MODALE PLEINE PAGE DES FILTRES MOBILE (< 768px) */}
      {isMobileFilterOpen && (
        <div className={styles.mobileFilterModalOverlay} onClick={() => setIsMobileFilterOpen(false)}>
          <div className={styles.mobileFilterModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileFilterModalHeader}>
              <div className={styles.mobileFilterModalTitle}>
                <Filter size={20} style={{ color: 'var(--accent-primary, #2563eb)' }} />
                <span>Filtrer les supports</span>
              </div>
              <button
                type="button"
                className={styles.mobileFilterCloseBtn}
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Fermer les filtres"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.mobileFilterField}>
              <label className={styles.mobileFilterLabel}>Type de Support</label>
              <select
                className={styles.mobileFilterSelect}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">Tous les types 🏷️</option>
                {typeOptions.map((t) => {
                  const name = t.nom || t.nom_type;
                  return <option key={t.id || name} value={name}>{name}</option>;
                })}
              </select>
            </div>

            <div className={styles.mobileFilterField}>
              <label className={styles.mobileFilterLabel}>Catégorie</label>
              <select
                className={styles.mobileFilterSelect}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Toutes les catégories 📁</option>
                {catOptions.map((c) => {
                  const name = c.nom || c.nom_categorie;
                  return <option key={c.id || name} value={name}>{name}</option>;
                })}
              </select>
            </div>

            <div className={styles.mobileFilterField}>
              <label className={styles.mobileFilterLabel}>Aéroport</label>
              <select
                className={styles.mobileFilterSelect}
                value={selectedAeroport}
                onChange={(e) => {
                  setSelectedAeroport(e.target.value);
                  setSelectedZone('all');
                }}
              >
                <option value="all">Tous les aéroports ✈️</option>
                {aeroOptions.map((a) => (
                  <option key={a.id || a.nom} value={a.nom}>{a.nom}</option>
                ))}
              </select>
            </div>

            <div className={styles.mobileFilterField}>
              <label className={styles.mobileFilterLabel}>Zone d'Affichage</label>
              <select
                className={styles.mobileFilterSelect}
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="all">Toutes les zones 📍</option>
                {zoneOptions.map((z) => (
                  <option key={z.id || z.nom} value={z.nom}>{z.nom}</option>
                ))}
              </select>
            </div>

            <div className={styles.mobileFilterField}>
              <label className={styles.mobileFilterLabel}>État / Disponibilité</label>
              <select
                className={styles.mobileFilterSelect}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                {etatOptions.map((et) => {
                  const name = et.nom_etat || et.nom;
                  return (
                    <option key={et.id || name} value={name}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={styles.mobileFilterModalFooter}>
              <button
                type="button"
                className={styles.mobileFilterApplyBtn}
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Afficher les résultats ({filteredEmplacements.length})
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  className={styles.mobileFilterResetBtn}
                  onClick={() => {
                    resetFilters();
                    setIsMobileFilterOpen(false);
                  }}
                >
                  Réinitialiser tous les filtres
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. VUE DESKTOP : TABLEAU COMPLET (> 768px) */}
      <div className={`aeropub-table-wrapper ${styles.desktopTableWrapper}`}>
        {filteredEmplacements.length === 0 ? (
          <p className="empty-msg">Aucun support ou emplacement ne correspond à ces critères.</p>
        ) : (
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-indigo">
                <th className="table-head-cell sortable" onClick={() => handleSort('reference')}>
                  Référence {renderSortIcon('reference')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('type')}>
                  Type de Support {renderSortIcon('type')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('categorie')}>
                  Catégorie {renderSortIcon('categorie')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('zone')}>
                  Zone & Aéroport {renderSortIcon('zone')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('caracteristiques')}>
                  Caractéristiques {renderSortIcon('caracteristiques')}
                </th>
                <th className="table-head-cell sortable" style={{ textAlign: 'center' }} onClick={() => handleSort('statut')}>
                  État / Statut {renderSortIcon('statut')}
                </th>
                <th className="table-head-cell">Observation</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmplacements.map((emp) => {
                const zoneDisplay = emp.nom_zone || emp.nom_lieu || 'Zone N/A';
                const aeroDisplay = emp.nom_aeroport ? ` - ${emp.nom_aeroport}` : (emp.type_zone ? ` (${emp.type_zone})` : '');
                const stateDisplay = getStatusSupport(emp);
                const stLower = stateDisplay.toLowerCase();
                const isOccupied = stLower.includes('occup');
                const isWarning = stLower.includes('maint') || stLower.includes('réserv') || stLower.includes('reserv');
                const badgeClass = isOccupied ? 'badge-occupied' : isWarning ? 'badge-warning' : 'badge-available';

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
                      <span className={`wireframe-badge ${badgeClass}`}>
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

      {/* 5. VUE MOBILE : FLUX DE CARTES EMPILÉES STYLE FACEBOOK (< 768px) */}
      <div className={styles.mobileCardsContainer}>
        {filteredEmplacements.length === 0 ? (
          <p className="empty-msg">Aucun support ne correspond à ces critères.</p>
        ) : (
          paginatedEmplacements.map((emp) => {
            const zoneDisplay = emp.nom_zone || emp.nom_lieu || 'Zone non définie';
            const aeroDisplay = emp.nom_aeroport ? ` - ${emp.nom_aeroport}` : (emp.type_zone ? ` (${emp.type_zone})` : '');
            const stateDisplay = getStatusSupport(emp);
            const stLower = stateDisplay.toLowerCase();
            const isOccupied = stLower.includes('occup');
            const isWarning = stLower.includes('maint') || stLower.includes('réserv') || stLower.includes('reserv');

            const borderClass = isOccupied
              ? styles.borderOccupied
              : isWarning
              ? styles.borderWarning
              : styles.borderAvailable;

            const statusBadgeClass = isOccupied
              ? styles.empStatusOccupied
              : isWarning
              ? styles.empStatusWarning
              : styles.empStatusAvailable;

            return (
              <div
                key={emp.reference}
                className={`${styles.empCard} ${borderClass}`}
                onClick={() => onSelectEmplacement && onSelectEmplacement(emp)}
              >
                {/* En-tête : Référence + Type + Badge statut */}
                <div className={styles.empCardHeader}>
                  <div className={styles.empCardHeaderLeft}>
                    <div className={styles.empRefTitle}>
                      <Tv size={18} style={{ color: 'var(--accent-primary, #2563eb)' }} />
                      <span>{emp.reference}</span>
                    </div>
                    <span className={styles.empTypeBadge}>
                      <Tag size={12} />
                      {emp.nom_type_support || emp.nom_type || 'Support'}
                    </span>
                  </div>

                  <span className={`${styles.empStatusBadge} ${statusBadgeClass}`}>
                    {stateDisplay}
                  </span>
                </div>

                {/* Détails techniques : Zone, Caractéristiques, Catégorie */}
                <div className={styles.empCardBody}>
                  <div className={styles.empDetailRow}>
                    <MapPin size={15} className={styles.empDetailIcon} />
                    <div>
                      <span className={styles.empDetailLabel}>Emplacement:</span>
                      <strong>{zoneDisplay}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{aeroDisplay}</span>
                    </div>
                  </div>

                  <div className={styles.empDetailRow}>
                    <Maximize2 size={15} className={styles.empDetailIcon} />
                    <div>
                      <span className={styles.empDetailLabel}>Dimensions:</span>
                      <span>{emp.caracteristiques || emp.ref_format || 'Format standard'}</span>
                    </div>
                  </div>

                  <div className={styles.empDetailRow}>
                    <Layers size={15} className={styles.empDetailIcon} />
                    <div>
                      <span className={styles.empDetailLabel}>Catégorie:</span>
                      <span>{emp.nom_categorie || 'Général'}</span>
                    </div>
                  </div>

                  {emp.observation && (
                    <div className={styles.empObservationBox}>
                      « {emp.observation} »
                    </div>
                  )}
                </div>

                {/* Bouton d'action tactile 100% largeur */}
                <button
                  type="button"
                  className={styles.empCardActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectEmplacement) onSelectEmplacement(emp);
                  }}
                >
                  <FileText size={16} />
                  <span>Détails &amp; Historique du Support</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 6. PAGINATION POUR LES SUPPORTS */}
      <Pagination
        currentPage={currentPage}
        totalItems={sortedEmplacements.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* 7. BOUTON D'AJOUT DE SUPPORT (Mobile-First 100% largeur & Desktop) */}
      <div className={`add-support-bar ${styles.addSupportBar}`}>
        <button
          type="button"
          onClick={onAddEmplacementClick}
          className={`btn-add-support ${styles.addSupportBtnFull}`}
        >
          <Plus size={20} strokeWidth={2.6} />
          <span>Ajouter un support publicitaire</span>
        </button>
      </div>
    </div>
  );
}
