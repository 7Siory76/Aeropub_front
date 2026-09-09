import React, { useState, useEffect, useMemo } from 'react';
import { User, Search, RotateCcw } from 'lucide-react';
import Pagination from '../../../components/Pagination';

export default function AbonnementsTab({ abonnements = [], initialSearchQuery = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCommercial, setSelectedCommercial] = useState('all');
  const [selectedPeriodicite, setSelectedPeriodicite] = useState('all');
  const [selectedProba, setSelectedProba] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedCommercial !== 'all' ||
    selectedPeriodicite !== 'all' ||
    selectedProba !== 'all' ||
    selectedYear !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedCommercial('all');
    setSelectedPeriodicite('all');
    setSelectedProba('all');
    setSelectedYear('all');
    setCurrentPage(1);
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

      // 2. Statut
      if (selectedStatus !== 'all') {
        const statut = (abo.statut_abonnement || abo.statut || 'Actif').toLowerCase();
        if (statut !== selectedStatus.toLowerCase()) return false;
      }

      // 3. Commercial
      if (selectedCommercial !== 'all') {
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

      return true;
    });
  }, [abonnements, searchTerm, selectedStatus, selectedCommercial, selectedPeriodicite, selectedProba, selectedYear]);

  const paginatedAbonnements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAbonnements.slice(start, start + pageSize);
  }, [filteredAbonnements, currentPage, pageSize]);

  return (
    <div>
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
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="Actif">🟢 Actif</option>
            <option value="Terminé">⚪ Terminé</option>
            <option value="En attente">🟡 En attente</option>
          </select>
        </div>

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
                <th className="table-head-cell">Réf Contrat</th>
                <th className="table-head-cell">Client</th>
                <th className="table-head-cell">Commercial Attitré</th>
                <th className="table-head-cell">Supports Associés</th>
                <th className="table-head-cell">Tarif / Périodicité</th>
                <th className="table-head-cell">Campagne / Annonceur</th>
                <th className="table-head-cell">Période Contractuelle</th>
                <th className="table-head-cell" style={{ textAlign: 'center' }}>Renouv. (%)</th>
                <th className="table-head-cell" style={{ textAlign: 'center' }}>Statut</th>
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
                  <tr key={abo.reference || abo.id} className="table-body-row">
                    <td className="cell-indigo" style={{ fontWeight: 700 }}>
                      {abo.reference || `#${abo.id}`}
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
        totalItems={filteredAbonnements.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
