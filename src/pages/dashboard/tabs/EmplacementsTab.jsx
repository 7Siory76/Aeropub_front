import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  FileText,
  Calendar,
  User,
  Clock,
  Building2,
  Globe
} from 'lucide-react';
import Pagination from '../../../components/Pagination';
import { abonnementsApi } from '../../../api';
import styles from './EmplacementsTab.module.css';

export default function EmplacementsTab({
  emplacements = [],
  abonnements = [],
  typeSupports = [],
  categories = [],
  zones = [],
  aeroports = [],
  perimetres = [],
  typeEtats = [],
  initialSearchQuery = '',
  onSelectEmplacement,
  onAddEmplacementClick
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAeroport, setSelectedAeroport] = useState('all');
  const [selectedPerimetre, setSelectedPerimetre] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('reference');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Liste des abonnements pour résolution des clients et dates de réservation
  const [abonnementsList, setAbonnementsList] = useState(abonnements);
  const [tooltipData, setTooltipData] = useState(null);

  useEffect(() => {
    if (abonnements && abonnements.length > 0) {
      setAbonnementsList(abonnements);
    } else {
      abonnementsApi.getAll().then(data => setAbonnementsList(data || [])).catch(() => {});
    }
  }, [abonnements]);

  // Helper pour trouver les informations de réservation associées au support
  const getReservationInfo = (emp) => {
    if (!emp) return null;

    // 1. Si déjà fourni par le backend via la jointure latérale
    if (emp.reservation_client_nom && emp.reservation_date_debut) {
      return {
        clientNom: emp.reservation_client_nom,
        dateDebut: emp.reservation_date_debut,
        dateFin: emp.reservation_date_fin || emp.reservation_date_echeance,
        referenceAbo: emp.reservation_ref_abo,
        campagne: emp.reservation_campagne
      };
    }

    // 2. Recherche dans les abonnements chargés
    if (!abonnementsList || abonnementsList.length === 0) return null;

    const empRef = String(emp.reference || '').trim().toUpperCase();
    const now = Date.now();

    const matchingAbos = abonnementsList.filter(abo => {
      const rawSt = String(abo.statut_abonnement || abo.statut || '').trim().toLowerCase();
      const cleanSt = rawSt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (cleanSt.includes('archiv') || cleanSt.includes('resili') || cleanSt.includes('annul') || cleanSt.includes('expir')) {
        return false;
      }

      if (Array.isArray(abo.supports_details)) {
        if (abo.supports_details.some(s => String(s.reference_support || s.reference || '').trim().toUpperCase() === empRef)) {
          return true;
        }
      }
      if (abo.supports_associes) {
        const list = abo.supports_associes.split(/[,;]+/).map(s => s.trim().toUpperCase());
        if (list.includes(empRef)) return true;
      }
      if (String(abo.reference_emplacement || abo.reference_support || '').trim().toUpperCase() === empRef) {
        return true;
      }
      if (Array.isArray(abo.supports)) {
        if (abo.supports.some(s => {
          const r = typeof s === 'string' ? s.trim().toUpperCase() : String(s.reference_support || s.reference || '').trim().toUpperCase();
          return r === empRef;
        })) {
          return true;
        }
      }
      return false;
    });

    if (matchingAbos.length === 0) return null;

    // Prioriser le contrat en cours, sinon le prochain futur
    matchingAbos.sort((a, b) => {
      const startA = new Date(a.date_debut).getTime();
      const endA = new Date(a.date_echeance || a.date_fin).getTime();
      const startB = new Date(b.date_debut).getTime();
      const endB = new Date(b.date_echeance || b.date_fin).getTime();

      const isCurrentA = startA <= now && endA >= now;
      const isCurrentB = startB <= now && endB >= now;

      if (isCurrentA && !isCurrentB) return -1;
      if (!isCurrentA && isCurrentB) return 1;
      return startA - startB;
    });

    const bestAbo = matchingAbos[0];
    return {
      clientNom: bestAbo.raison_sociale || bestAbo.nom_client || 'Client standard',
      dateDebut: bestAbo.date_debut,
      dateFin: bestAbo.date_echeance || bestAbo.date_fin,
      referenceAbo: bestAbo.reference,
      campagne: bestAbo.annonceur_campagne
    };
  };

  const handleStatusMouseEnter = (e, emp, stateDisplay) => {
    const stLower = String(stateDisplay || '').toLowerCase();
    const isOccupied = stLower.includes('occup');
    const isReserved = stLower.includes('réserv') || stLower.includes('reserv');

    if (!isOccupied && !isReserved) return;

    const resInfo = getReservationInfo(emp);
    const rect = e.currentTarget.getBoundingClientRect();
    const isNearTop = rect.top < 180;

    setTooltipData({
      emp,
      resInfo,
      statut: stateDisplay,
      isOccupied,
      isReserved,
      top: isNearTop ? rect.bottom + 10 : rect.top - 10,
      left: rect.left + rect.width / 2,
      direction: isNearTop ? 'down' : 'up'
    });
  };

  const handleStatusMouseLeave = () => {
    setTooltipData(null);
  };

  const formatDateSafe = (d) => {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('fr-FR');
    } catch {
      return String(d);
    }
  };

  useEffect(() => {
    if (!tooltipData) return;
    const handleScroll = () => setTooltipData(null);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [tooltipData]);

  // Synchronisation avec la recherche globale
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Réinitialiser la pagination lors d'un changement de filtre
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCategory, selectedAeroport, selectedPerimetre, selectedZone, selectedStatus]);

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

  const perimetreOptions = useMemo(() => {
    if (perimetres && perimetres.length > 0) return perimetres;
    const names = [...new Set(emplacements.map(e => e.nom_perimetre || e.perimetre).filter(Boolean))];
    return names.map((n, i) => ({ id: i + 1, nom: n }));
  }, [perimetres, emplacements]);

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
    selectedPerimetre !== 'all' ||
    selectedZone !== 'all' ||
    selectedStatus !== 'all';

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedType !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (selectedAeroport !== 'all') count++;
    if (selectedPerimetre !== 'all') count++;
    if (selectedZone !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    return count;
  }, [selectedType, selectedCategory, selectedAeroport, selectedPerimetre, selectedZone, selectedStatus]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedAeroport('all');
    setSelectedPerimetre('all');
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
          (emp.nom_perimetre || emp.perimetre || '').toLowerCase().includes(q) ||
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

      // 5. Périmètre
      if (selectedPerimetre !== 'all') {
        const empPeri = (emp.nom_perimetre || emp.perimetre || '').toLowerCase();
        const targetPeri = selectedPerimetre.toLowerCase();
        if (
          empPeri !== targetPeri &&
          String(emp.id_perimetre) !== String(selectedPerimetre)
        ) {
          return false;
        }
      }

      // 6. Zone
      if (selectedZone !== 'all') {
        const empZone = (emp.nom_zone || emp.nom_lieu || emp.type_zone || '').toLowerCase();
        if (empZone !== selectedZone.toLowerCase() && String(emp.id_zone) !== String(selectedZone)) {
          return false;
        }
      }

      // 7. Statut
      if (selectedStatus !== 'all') {
        const stateDisplay = getStatusSupport(emp).toLowerCase();
        const targetState = selectedStatus.toLowerCase();
        if (stateDisplay !== targetState && !stateDisplay.includes(targetState) && !targetState.includes(stateDisplay)) {
          return false;
        }
      }

      return true;
    });
  }, [emplacements, searchTerm, selectedType, selectedCategory, selectedAeroport, selectedPerimetre, selectedZone, selectedStatus]);

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
        case 'perimetre':
          valA = a.nom_perimetre || a.perimetre || '';
          valB = b.nom_perimetre || b.perimetre || '';
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
      {/* Barre de filtres desktop */}
      <div className={`ts-filters-bar ${styles.desktopFiltersBar}`}>
        <div className={styles.filterGroup}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Rechercher (réf., dimensions...)"
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
          <span>Périmètre :</span>
          <select
            className={styles.filterSelect}
            value={selectedPerimetre}
            onChange={(e) => setSelectedPerimetre(e.target.value)}
          >
            <option value="all">Tous les périmètres 🌐</option>
            {perimetreOptions.map((p) => {
              const name = p.nom || p.nom_perimetre;
              return (
                <option key={p.id || name} value={name}>
                  {name}
                </option>
              );
            })}
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

      {/* Barre d'outils mobile */}
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

        {/* Badges de filtres actifs */}
        {activeFilterCount > 0 && (
          <div className={styles.mobileActiveFiltersChips}>
            {selectedType !== 'all' && (
              <span className={styles.mobileFilterChip}>
                Type : {selectedType}
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
                Catégorie : {selectedCategory}
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
                Aéroport : {selectedAeroport}
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
            {selectedPerimetre !== 'all' && (
              <span className={styles.mobileFilterChip}>
                Périmètre : {selectedPerimetre}
                <button
                  type="button"
                  className={styles.mobileFilterChipClear}
                  onClick={() => setSelectedPerimetre('all')}
                  aria-label="Retirer ce filtre"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedZone !== 'all' && (
              <span className={styles.mobileFilterChip}>
                Zone : {selectedZone}
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
                Statut : {selectedStatus}
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

      {/* Modale des filtres mobile */}
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
              <label className={styles.mobileFilterLabel}>Type de support</label>
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
              <label className={styles.mobileFilterLabel}>Périmètre</label>
              <select
                className={styles.mobileFilterSelect}
                value={selectedPerimetre}
                onChange={(e) => setSelectedPerimetre(e.target.value)}
              >
                <option value="all">Tous les périmètres 🌐</option>
                {perimetreOptions.map((p) => {
                  const name = p.nom || p.nom_perimetre;
                  return <option key={p.id || name} value={name}>{name}</option>;
                })}
              </select>
            </div>

            <div className={styles.mobileFilterField}>
              <label className={styles.mobileFilterLabel}>Zone d'affichage</label>
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

      {/* Tableau desktop */}
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
                  Type de support {renderSortIcon('type')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('categorie')}>
                  Catégorie {renderSortIcon('categorie')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('zone')}>
                  Zone & Aéroport {renderSortIcon('zone')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('perimetre')}>
                  Périmètre {renderSortIcon('perimetre')}
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
                const isReserved = stLower.includes('réserv') || stLower.includes('reserv');
                const isWarning = stLower.includes('maint') || isReserved;
                const badgeClass = isOccupied ? 'badge-occupied' : isWarning ? 'badge-warning' : 'badge-available';
                const hasHoverDetails = isOccupied || isReserved;

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
                    <td className="table-body-cell">
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          backgroundColor:
                            (emp.nom_perimetre || '').toLowerCase().includes('inter')
                              ? 'rgba(168, 85, 247, 0.15)'
                              : (emp.nom_perimetre || '').toLowerCase().includes('nat')
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(148, 163, 184, 0.15)',
                          color:
                            (emp.nom_perimetre || '').toLowerCase().includes('inter')
                              ? '#c084fc'
                              : (emp.nom_perimetre || '').toLowerCase().includes('nat')
                              ? '#60a5fa'
                              : '#cbd5e1',
                          border: `1px solid ${
                            (emp.nom_perimetre || '').toLowerCase().includes('inter')
                              ? 'rgba(168, 85, 247, 0.35)'
                              : (emp.nom_perimetre || '').toLowerCase().includes('nat')
                              ? 'rgba(59, 130, 246, 0.35)'
                              : 'rgba(148, 163, 184, 0.25)'
                          }`
                        }}
                      >
                        <Globe size={12} />
                        {emp.nom_perimetre || emp.perimetre || 'Non défini'}
                      </span>
                    </td>
                    <td className="cell-muted" style={{ fontSize: '0.84rem' }}>
                      {emp.caracteristiques || emp.ref_format || '-'}
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'center' }}>
                      <span
                        className={`wireframe-badge ${badgeClass}`}
                        style={{
                          cursor: hasHoverDetails ? 'help' : 'inherit',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => hasHoverDetails && handleStatusMouseEnter(e, emp, stateDisplay)}
                        onMouseLeave={handleStatusMouseLeave}
                      >
                        {stateDisplay}
                        {hasHoverDetails && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.8, marginLeft: '2px' }}>ℹ️</span>
                        )}
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

      {/* Cartes mobile */}
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
            const isReserved = stLower.includes('réserv') || stLower.includes('reserv');
            const isWarning = stLower.includes('maint') || isReserved;
            const hasHoverDetails = isOccupied || isReserved;

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
                {/* En-tête : Référence + Type + Statut */}
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

                  <span
                    className={`${styles.empStatusBadge} ${statusBadgeClass}`}
                    style={{
                      cursor: hasHoverDetails ? 'help' : 'inherit',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => hasHoverDetails && handleStatusMouseEnter(e, emp, stateDisplay)}
                    onMouseLeave={handleStatusMouseLeave}
                  >
                    {stateDisplay}
                    {hasHoverDetails && (
                      <span style={{ fontSize: '0.72rem', opacity: 0.8, marginLeft: '2px' }}>ℹ️</span>
                    )}
                  </span>
                </div>

                {/* Détails techniques : Zone, Caractéristiques, Catégorie */}
                <div className={styles.empCardBody}>
                  <div className={styles.empDetailRow}>
                    <MapPin size={15} className={styles.empDetailIcon} />
                    <div>
                      <span className={styles.empDetailLabel}>Emplacement :</span>
                      <strong>{zoneDisplay}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{aeroDisplay}</span>
                    </div>
                  </div>

                  <div className={styles.empDetailRow}>
                    <Globe size={15} className={styles.empDetailIcon} />
                    <div>
                      <span className={styles.empDetailLabel}>Périmètre :</span>
                      <span>{emp.nom_perimetre || emp.perimetre || 'Non défini'}</span>
                    </div>
                  </div>

                  <div className={styles.empDetailRow}>
                    <Maximize2 size={15} className={styles.empDetailIcon} />
                    <div>
                      <span className={styles.empDetailLabel}>Dimensions :</span>
                      <span>{emp.caracteristiques || emp.ref_format || 'Format standard'}</span>
                    </div>
                  </div>

                  <div className={styles.empDetailRow}>
                    <Layers size={15} className={styles.empDetailIcon} />
                    <div>
                      <span className={styles.empDetailLabel}>Catégorie :</span>
                      <span>{emp.nom_categorie || 'Général'}</span>
                    </div>
                  </div>

                  {emp.observation && (
                    <div className={styles.empObservationBox}>
                      « {emp.observation} »
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className={styles.empCardActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectEmplacement) onSelectEmplacement(emp);
                  }}
                >
                  <FileText size={16} />
                  <span>Détails et historique du support</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={sortedEmplacements.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Ajout de support */}
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

      {/* Info-bulle flottante (Survol statut Occupé / Réservé) */}
      {tooltipData && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${tooltipData.top}px`,
            left: `${tooltipData.left}px`,
            transform: tooltipData.direction === 'down' ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            zIndex: 999999,
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '12px 16px',
            minWidth: '260px',
            maxWidth: '340px',
            pointerEvents: 'none',
            color: '#f8fafc',
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            lineHeight: 1.45,
            transition: 'opacity 0.15s ease, transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tv size={14} style={{ color: '#38bdf8' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8', letterSpacing: '0.5px' }}>
                {tooltipData.emp?.reference}
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: tooltipData.isOccupied ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
              color: tooltipData.isOccupied ? '#fca5a5' : '#fde047',
              border: `1px solid ${tooltipData.isOccupied ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
            }}>
              {tooltipData.statut}
            </span>
          </div>

          {tooltipData.resInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Building2 size={15} style={{ color: '#38bdf8', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ wordBreak: 'break-word' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Client :</span>
                  <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{tooltipData.resInfo.clientNom}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Calendar size={15} style={{ color: '#34d399', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>Période d'occupation :</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                    Du <strong style={{ color: '#fff' }}>{formatDateSafe(tooltipData.resInfo.dateDebut)}</strong> au <strong style={{ color: '#fff' }}>{formatDateSafe(tooltipData.resInfo.dateFin)}</strong>
                  </span>
                </div>
              </div>

              {tooltipData.resInfo.referenceAbo && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#cbd5e1',
                  marginTop: '2px',
                  borderTop: '1px dashed rgba(255,255,255,0.1)',
                  paddingTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FileText size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  <span>
                    Abonnement : <strong style={{ color: '#f1f5f9' }}>{tooltipData.resInfo.referenceAbo}</strong>
                    {tooltipData.resInfo.campagne ? ` (${tooltipData.resInfo.campagne})` : ''}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem', padding: '4px 0' }}>
              Aucun détail de contrat en cours associé trouvé.
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
