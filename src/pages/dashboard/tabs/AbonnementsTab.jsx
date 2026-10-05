import React, { useState, useEffect, useMemo } from 'react';
import { User, Search, RotateCcw, Plus, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import AbonnementDetailsModal from '../modals/AbonnementDetailsModal';
import AddAbonnementModal from '../modals/AddAbonnementModal';
import { useAuth } from '../../../context/AuthContext';
import { hasRole } from '../../../utils/rbac';
import { useFeedback } from '../../../context/FeedbackContext';

export default function AbonnementsTab({
  abonnements = [],
  emplacements = [],
  typeStatut = [],
  clients = [],
  utilisateurs = [],
  initialSearchQuery = '',
  onRefresh,
  kpiFilter = null,
  onClearKpiFilter
}) {
  const { user } = useAuth();
  const { showSuccess, showInfo } = useFeedback();

  // Permissions RBAC
  const canCreateOrDuplicate = hasRole(user, ['Admin', 'Resp_Com', 'Commercial']);
  const canViewGlobalFilter = hasRole(user, ['Admin', 'Direction', 'Resp_Com', 'Lecture_Seule']);
  const isRestrictedCommercial = !canViewGlobalFilter && hasRole(user, ['Commercial']);
  const canExport = hasRole(user, ['Admin', 'Direction', 'Resp_Com', 'Commercial', 'Lecture_Seule']);

  // Ensemble des contrats parents qui ont été renouvelés avec continuité
  const renewedParentRefs = useMemo(() => {
    const set = new Set();
    abonnements.forEach(c => {
      if (c.id_abonnement_precedent) {
        set.add(String(c.id_abonnement_precedent).trim());
      }
    });
    return set;
  }, [abonnements]);

  // Libellé explicatif pour la bannière de filtre KPI
  const kpiFilterLabel = useMemo(() => {
    switch (kpiFilter) {
      case 'echeance_7': return 'Échéance imminente (≤ 7 jours non renouvelés)';
      case 'echeance_30': return 'Échéance J-30 (8 à 30 jours non renouvelés)';
      case 'echeance_60': return 'Échéance J-60 (31 à 60 jours non renouvelés)';
      case 'echeance_90': return 'Échéance J-90 (61 à 90 jours non renouvelés)';
      case 'echus_non_renouveles': return 'Contrats échus non renouvelés (sans continuité -R)';
      case 'sans_action': return 'Contrats proches sans action commerciale planifiée';
      case 'montant_actifs': return 'Contrats Actifs (dernier statut enregistré : Actif)';
      case 'montant_renouveles': return 'Contrats Renouvelés (-R1, -R2...)';
      case 'a_valider': return 'Contrats À Valider (en attente de validation)';
      case 'brouillon': return 'Contrats Brouillons (non finalisés)';
      case 'montant_a_renouveler': return 'Contrats À Renouveler (≤ 90 jours)';
      default: return null;
    }
  }, [kpiFilter]);

  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCommercial, setSelectedCommercial] = useState('all');
  const [selectedPeriodicite, setSelectedPeriodicite] = useState('all');
  const [selectedProba, setSelectedProba] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('date_debut');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedAbonnement, setSelectedAbonnement] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);


  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedCommercial, selectedPeriodicite, selectedProba, selectedYear]);

  // Options dédupliquées pour les filtres
  const commercialOptions = useMemo(() => {
    const names = [...new Set(abonnements.map(a => a.nom_commercial).filter(Boolean))];
    return names.sort();
  }, [abonnements]);

  const periodiciteOptions = useMemo(() => {
    const p = [...new Set(abonnements.map(a => a.periodicite).filter(Boolean))];
    return p.sort();
  }, [abonnements]);

  const yearOptions = useMemo(() => {
    const years = new Set();
    abonnements.forEach(a => {
      if (a.date_debut) years.add(new Date(a.date_debut).getFullYear());
      if (a.date_echeance) years.add(new Date(a.date_echeance).getFullYear());
      if (a.date_fin) years.add(new Date(a.date_fin).getFullYear());
    });
    return [...years].filter(y => !isNaN(y)).sort((a, b) => b - a);
  }, [abonnements]);

  const availableStatuses = useMemo(() => {
    const set = new Set();
    typeStatut.forEach((a) => {
      set.add(String(a.nom_statut).trim());
    });
    return Array.from(set).sort();
  }, [abonnements]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedCommercial !== 'all' ||
    selectedPeriodicite !== 'all' ||
    selectedProba !== 'all' ||
    selectedYear !== 'all' ||
    Boolean(kpiFilter);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedCommercial('all');
    setSelectedPeriodicite('all');
    setSelectedProba('all');
    setSelectedYear('all');
    setCurrentPage(1);
    if (typeof onClearKpiFilter === 'function') {
      onClearKpiFilter();
    }
  };

  const handleClearKpi = () => {
    setCurrentPage(1);
    if (typeof onClearKpiFilter === 'function') {
      onClearKpiFilter();
    }
  };

  const filteredAbonnements = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return abonnements.filter((abo) => {
      // 1. Recherche textuelle
      if (q) {
        const matchText =
          (abo.reference || '').toLowerCase().includes(q) ||
          (abo.nom_client || abo.raison_sociale || '').toLowerCase().includes(q) ||
          (abo.nom_commercial || '').toLowerCase().includes(q) ||
          (abo.supports_associes || abo.reference_emplacement || '').toLowerCase().includes(q) ||
          (abo.annonceur_campagne || '').toLowerCase().includes(q);

        if (!matchText) return false;
      }

      // Restriction portefeuille pour commercial simple
      if (isRestrictedCommercial) {
        const userNom = (user?.nom || '').trim().toLowerCase();
        const aboCom = (abo.nom_commercial || '').trim().toLowerCase();
        const isMyContrat = (userNom && (aboCom.includes(userNom) || userNom.includes(aboCom))) ||
                            (abo.id_commercial && user?.id && String(abo.id_commercial) === String(user.id));
        if (!isMyContrat) return false;
      }

      // 2. Statut
      if (selectedStatus !== 'all') {
        const statut = (abo.statut_abonnement || abo.statut || 'Actif').toLowerCase();
        if (statut !== selectedStatus.toLowerCase()) return false;
      }

      // 3. Commercial (filtre global)
      if (canViewGlobalFilter && selectedCommercial !== 'all') {
        if ((abo.nom_commercial || '').toLowerCase() !== selectedCommercial.toLowerCase()) {
          return false;
        }
      }

      // 4. Périodicité
      if (selectedPeriodicite !== 'all') {
        if ((abo.periodicite || '').toLowerCase() !== selectedPeriodicite.toLowerCase()) {
          return false;
        }
      }

      // 5. Probabilité de renouvellement
      if (selectedProba !== 'all') {
        const probaNum = parseInt(abo.probabilite_renouvellement !== undefined && abo.probabilite_renouvellement !== null ? abo.probabilite_renouvellement : 80, 10);
        if (selectedProba === 'high' && probaNum < 75) return false;
        if (selectedProba === 'low' && probaNum >= 75) return false;
      }

      // 6. Année
      if (selectedYear !== 'all') {
        const targetYear = parseInt(selectedYear, 10);
        const startY = abo.date_debut ? new Date(abo.date_debut).getFullYear() : null;
        const endY = (abo.date_echeance || abo.date_fin) ? new Date(abo.date_echeance || abo.date_fin).getFullYear() : null;
        if (startY !== targetYear && endY !== targetYear) return false;
      }

      // 7. Filtre issu d'un clic sur un KPI Dashboard
      if (kpiFilter) {
        const now = new Date();
        const diffJours = Math.ceil((new Date(abo.date_echeance || abo.date_fin) - now) / 86400000);
        const statut = (abo.statut_abonnement || abo.statut || '').toLowerCase();
        const aEteRenouvele = renewedParentRefs.has(String(abo.reference).trim());
        const estFilsRenouvellement = Boolean(abo.id_abonnement_precedent) || /-R\d+$/i.test(abo.reference || '');

        if (kpiFilter === 'echeance_7' && (diffJours < 0 || diffJours > 7 || aEteRenouvele || statut === 'résilié')) return false;
        if (kpiFilter === 'echeance_30' && (diffJours <= 7 || diffJours > 30 || aEteRenouvele || statut === 'résilié')) return false;
        if (kpiFilter === 'echeance_60' && (diffJours <= 30 || diffJours > 60 || aEteRenouvele || statut === 'résilié')) return false;
        if (kpiFilter === 'echeance_90' && (diffJours <= 60 || diffJours > 90 || aEteRenouvele || statut === 'résilié')) return false;

        if (kpiFilter === 'echus_non_renouveles') {
          if (diffJours >= 0 || aEteRenouvele || statut === 'résilié') return false;
        }

        if (kpiFilter === 'sans_action') {
          if (diffJours < -15 || diffJours > 90 || aEteRenouvele || statut === 'résilié') return false;
        }

        if (kpiFilter === 'montant_actifs') {
          if (statut !== 'actif') return false;
        }
        if (kpiFilter === 'montant_renouveles') {
          if (!(estFilsRenouvellement || aEteRenouvele)) return false;
        }
        if (kpiFilter === 'a_valider') {
          const isAValider = statut === 'à valider' || statut === 'a valider' || statut.includes('valid');
          if (!isAValider) return false;
        }
        if (kpiFilter === 'brouillon') {
          if (statut !== 'brouillon') return false;
        }
        if (kpiFilter === 'montant_a_renouveler') {
          if (statut !== 'actif' || diffJours < 0 || diffJours > 90 || aEteRenouvele) return false;
        }
      }

      return true;
    });
  }, [abonnements, searchTerm, selectedStatus, selectedCommercial, selectedPeriodicite, selectedProba, selectedYear, isRestrictedCommercial, user, canViewGlobalFilter, kpiFilter, renewedParentRefs]);

  const sortedAbonnements = useMemo(() => {
    const list = [...filteredAbonnements];
    if (!sortField) return list;
    return list.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'reference':
          valA = a.reference || a.id || '';
          valB = b.reference || b.id || '';
          break;
        case 'client':
          valA = a.raison_sociale || a.nom_client || '';
          valB = b.raison_sociale || b.nom_client || '';
          break;
        case 'commercial':
          valA = a.nom_commercial || '';
          valB = b.nom_commercial || '';
          break;
        case 'supports':
          valA = a.supports_associes || a.reference_emplacement || '';
          valB = b.supports_associes || b.reference_emplacement || '';
          break;
        case 'tarif':
          valA = parseFloat(a.tarif) || 0;
          valB = parseFloat(b.tarif) || 0;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        case 'campagne':
          valA = a.annonceur_campagne || '';
          valB = b.annonceur_campagne || '';
          break;
        case 'date_debut':
          valA = a.date_debut ? new Date(a.date_debut).getTime() : 0;
          valB = b.date_debut ? new Date(b.date_debut).getTime() : 0;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        case 'probabilite':
          valA = a.probabilite_renouvellement !== undefined && a.probabilite_renouvellement !== null ? Number(a.probabilite_renouvellement) : 80;
          valB = b.probabilite_renouvellement !== undefined && b.probabilite_renouvellement !== null ? Number(b.probabilite_renouvellement) : 80;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        case 'statut':
          valA = a.statut_abonnement || a.statut || '';
          valB = b.statut_abonnement || b.statut || '';
          break;
        default:
          valA = a[sortField] || '';
          valB = b[sortField] || '';
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB, 'fr') : strB.localeCompare(strA, 'fr');
    });
  }, [filteredAbonnements, sortField, sortDirection]);

  const paginatedAbonnements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAbonnements.slice(start, start + pageSize);
  }, [sortedAbonnements, currentPage, pageSize]);

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

  // Fonction d'exportation Excel / CSV (Module 4)
  const handleExportCSV = () => {
    if (filteredAbonnements.length === 0) {
      showInfo('Aucun contrat à exporter.');
      return;
    }
    const headers = ['Reference', 'Client', 'Commercial', 'Supports', 'Tarif', 'Devise', 'Periodicite', 'Date_Debut', 'Date_Echeance', 'Statut'];
    const rows = filteredAbonnements.map(a => [
      `"${a.reference || a.id || ''}"`,
      `"${a.raison_sociale || a.nom_client || ''}"`,
      `"${a.nom_commercial || ''}"`,
      `"${a.supports_associes || a.reference_emplacement || ''}"`,
      `"${a.tarif || ''}"`,
      `"${a.devise || 'MGA'}"`,
      `"${a.periodicite || ''}"`,
      `"${a.date_debut ? new Date(a.date_debut).toLocaleDateString('fr-FR') : ''}"`,
      `"${a.date_echeance ? new Date(a.date_echeance).toLocaleDateString('fr-FR') : ''}"`,
      `"${a.statut_abonnement || a.statut || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contrats_aeropub_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Exportation des contrats réussie !');
  };

  return (
    <div>
      {/* Bannière d'état pour le filtre KPI interactif */}
      {kpiFilter && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.1))',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '10px',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#06b6d4', fontSize: '0.88rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🎯</span>
            <span>
              Filtre KPI actif : <strong>{kpiFilterLabel}</strong> ({filteredAbonnements.length} contrat{filteredAbonnements.length > 1 ? 's' : ''} correspondant{filteredAbonnements.length > 1 ? 's' : ''})
            </span>
          </div>
          {onClearKpiFilter && (
            <button
              type="button"
              onClick={handleClearKpi}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                borderRadius: '8px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>✕ Retirer le filtre KPI</span>
            </button>
          )}
        </div>
      )}

      {/* Barre de filtres multicritères */}
      <div className="ts-filters-bar">
        <div className="ts-filter-group">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="ts-filter-input"
            placeholder="Rechercher (Contrat, Client...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '190px' }}
          />
        </div>

        <div className="ts-filter-group">
          <span>Statut :</span>
          <select
            className="ts-filter-select"
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Tous les statuts</option>
            {availableStatuses.map((av) => (
              <option key={av} value={av}>
                {av.charAt(0).toUpperCase() + av.slice(1)}
              </option>
            ))}

          </select>
        </div>

        {/* Filtre global Commercial : réservé à Admin, Direction, Resp_Com, Lecture_Seule */}
        {canViewGlobalFilter ? (
          <div className="ts-filter-group">
            <span>Commercial :</span>
            <select
              className="ts-filter-select"
              value={selectedCommercial}
              onChange={(e) => setSelectedCommercial(e.target.value)}
            >
              <option value="all">Tous les commerciaux 👤</option>
              {commercialOptions.map((com) => (
                <option key={com} value={com}>
                  {com}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="ts-filter-group" style={{ opacity: 0.9 }}>
            <span>Portefeuille :</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)', padding: '0.2rem 0.5rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '6px' }}>
              👤 {user?.nom || 'Mon portefeuille'}
            </span>
          </div>
        )}

        <div className="ts-filter-group">
          <span>Périodicité :</span>
          <select
            className="ts-filter-select"
            value={selectedPeriodicite}
            onChange={(e) => setSelectedPeriodicite(e.target.value)}
          >
            <option value="all">Toutes 📅</option>
            {periodiciteOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="ts-filter-group">
          <span>Renouvellement :</span>
          <select
            className="ts-filter-select"
            value={selectedProba}
            onChange={(e) => setSelectedProba(e.target.value)}
          >
            <option value="all">Toutes probabilités</option>
            <option value="high">🟢 Élevé (≥ 75%)</option>
            <option value="low">🟡 Modéré / Faible (&lt; 75%)</option>
          </select>
        </div>

        {yearOptions.length > 0 && (
          <div className="ts-filter-group">
            <span>Année :</span>
            <select
              className="ts-filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">Toutes 📆</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

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

        {/* Bouton Exporter en Excel / PDF (Module 4) */}
        {canExport && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCSV}
            title="Exporter les contrats en fichier CSV / Excel"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
          >
            <Download size={14} />
            <span>Exporter (Excel / CSV)</span>
          </button>
        )}

        <div className="ts-filter-badge-count">
          {filteredAbonnements.length} / {abonnements.length} contrat{abonnements.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="aeropub-table-wrapper">
        {filteredAbonnements.length === 0 ? (
          <p className="empty-msg">Aucun contrat d'abonnement ne correspond à ces critères.</p>
        ) : (
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-emerald">
                <th className="table-head-cell sortable" onClick={() => handleSort('reference')}>
                  Réf Contrat {renderSortIcon('reference')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('client')}>
                  Client {renderSortIcon('client')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('commercial')}>
                  Commercial Attitré {renderSortIcon('commercial')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('supports')}>
                  Supports Associés {renderSortIcon('supports')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('tarif')}>
                  Tarif / Périodicité {renderSortIcon('tarif')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('campagne')}>
                  Campagne / Annonceur {renderSortIcon('campagne')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('date_debut')}>
                  Période Contractuelle {renderSortIcon('date_debut')}
                </th>
                <th className="table-head-cell sortable" style={{ textAlign: 'center' }} onClick={() => handleSort('probabilite')}>
                  Renouv. (%) {renderSortIcon('probabilite')}
                </th>
                <th className="table-head-cell sortable" style={{ textAlign: 'center' }} onClick={() => handleSort('statut')}>
                  Statut {renderSortIcon('statut')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAbonnements.map((abo) => {
                const formattedTarif = abo.tarif
                  ? `${Number(abo.tarif).toLocaleString('fr-FR')} ${abo.devise || 'MGA'}`
                  : 'N/A';
                const supportsStr = abo.supports_associes || abo.reference_emplacement || abo.reference || '-';
                const statutStr = abo.statut_abonnement || abo.statut || 'Actif';
                const proba = abo.probabilite_renouvellement !== undefined && abo.probabilite_renouvellement !== null
                  ? `${abo.probabilite_renouvellement}%`
                  : '80%';

                return (
                  <tr key={abo.reference || abo.id} className="table-body-row clickable-row" style={{ cursor: 'pointer' }} onClick={() => setSelectedAbonnement(abo)}>
                    <td className="cell-indigo" style={{ fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span>{abo.reference || `#${abo.id}`}</span>
                        {/* Badge si ce contrat est issu d'un renouvellement (-R ou id_precedent) */}
                        {(abo.id_abonnement_precedent || /-R\d+$/i.test(abo.reference || '')) && (
                          <span
                            title={`Issu du renouvellement du contrat parent : ${abo.id_abonnement_precedent || 'origine'}`}
                            style={{
                              background: 'rgba(6, 182, 212, 0.18)',
                              border: '1px solid rgba(6, 182, 212, 0.45)',
                              color: '#38bdf8',
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '9999px',
                              fontWeight: 700
                            }}
                          >
                            {abo.reference?.match(/-R\d+$/i) ? abo.reference.match(/-R\d+$/i)[0] : '🔄 R'}
                          </span>
                        )}
                        {/* Badge si ce contrat a déjà été renouvelé vers un successeur */}
                        {renewedParentRefs.has(String(abo.reference).trim()) && (
                          <span
                            title="Ce contrat a été reconduit vers un nouveau contrat successeur"
                            style={{
                              background: 'rgba(16, 185, 129, 0.18)',
                              border: '1px solid rgba(16, 185, 129, 0.45)',
                              color: '#10b981',
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '9999px',
                              fontWeight: 700
                            }}
                          >
                            ✓ Reconduit
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="cell-bold-white">
                      <strong>{abo.raison_sociale || abo.nom_client || `Client #${abo.id_client}`}</strong>
                    </td>
                    <td className="cell-cyan">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={13} style={{ color: 'var(--accent-primary)' }} />
                        {abo.nom_commercial || 'Direction / Admin'}
                      </span>
                    </td>
                    <td className="cell-cyan" style={{ fontWeight: 600 }}>
                      {supportsStr}
                    </td>
                    <td className="cell-emerald" style={{ fontWeight: 700 }}>
                      {formattedTarif}
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {abo.periodicite || 'Annuel'}
                      </span>
                    </td>
                    <td className="table-body-cell">
                      <span style={{ color: 'var(--text-main)' }}>{abo.annonceur_campagne || 'Campagne standard'}</span>
                    </td>
                    <td className="cell-muted" style={{ fontSize: '0.84rem' }}>
                      Du {abo.date_debut ? new Date(abo.date_debut).toLocaleDateString('fr-FR') : '-'} au {abo.date_echeance || abo.date_fin ? new Date(abo.date_echeance || abo.date_fin).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background: parseInt(proba, 10) >= 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: parseInt(proba, 10) >= 75 ? '#10b981' : '#f59e0b',
                        border: parseInt(proba, 10) >= 75 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                      }}>
                        {proba}
                      </span>
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'center' }}>
                      <span className={`wireframe-badge ${statutStr.toLowerCase() === 'actif' ? 'badge-available' : 'badge-occupied'}`}>
                        {statutStr}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination pour les abonnements */}
      <Pagination
        currentPage={currentPage}
        totalItems={sortedAbonnements.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Bouton d'ajout / duplication de contrat (Module 1 : Admin, Resp_Com, Commercial) */}
      {canCreateOrDuplicate && (
        <div className="add-support-bar">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-add-support"
          >
            <Plus size={20} strokeWidth={2.6} />
            <span>+ Créer un contrat / Dupliquer</span>
          </button>
        </div>
      )}


      {/* Modale createPortal des détails de l'abonnement */}
      {selectedAbonnement && (
        <AbonnementDetailsModal
          abonnement={selectedAbonnement}
          onClose={() => setSelectedAbonnement(null)}
          onRefresh={onRefresh}
          typeStatut={typeStatut}
          emplacements={emplacements}
          allAbonnements={abonnements}
          clients={clients}
          utilisateurs={utilisateurs}
        />
      )}

      {/* Modale d'ajout ou duplication de contrat */}
      {showAddModal && (
        <AddAbonnementModal
          onClose={() => setShowAddModal(false)}
          onRefresh={onRefresh}
          allAbonnements={abonnements}
          emplacements={emplacements}
          clients={clients}
          utilisateurs={utilisateurs}
          typeStatut={typeStatut}
        />
      )}

    </div>
  );
}
