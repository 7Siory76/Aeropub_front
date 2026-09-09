import React, { useState, useEffect, useMemo } from 'react';
import { User, Shield, Mail, Search, RotateCcw } from 'lucide-react';
import Pagination from '../../../components/Pagination';

export default function UtilisateursTab({ utilisateurs = [], initialSearchQuery = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedStatus]);

  const roleOptions = useMemo(() => {
    const roles = [...new Set(utilisateurs.map(u => u.nom_role).filter(Boolean))];
    return roles.sort();
  }, [utilisateurs]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedRole !== 'all' ||
    selectedStatus !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  const filteredUtilisateurs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return utilisateurs.filter((u) => {
      // 1. Recherche textuelle
      if (q) {
        const match =
          (u.nom || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.nom_role || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Rôle
      if (selectedRole !== 'all') {
        if ((u.nom_role || '').toLowerCase() !== selectedRole.toLowerCase()) {
          return false;
        }
      }

      // 3. Statut
      if (selectedStatus !== 'all') {
        const isActif = u.actif === true || String(u.actif) === '1';
        if (selectedStatus === 'Actif' && !isActif) return false;
        if (selectedStatus === 'Inactif' && isActif) return false;
      }

      return true;
    });
  }, [utilisateurs, searchTerm, selectedRole, selectedStatus]);

  const paginatedUtilisateurs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUtilisateurs.slice(start, start + pageSize);
  }, [filteredUtilisateurs, currentPage, pageSize]);

  return (
    <div>
      {/* Barre de filtres multicritères */}
      <div className="ts-filters-bar">
        <div className="ts-filter-group">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="ts-filter-input"
            placeholder="Rechercher utilisateur (Nom, email...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '220px' }}
          />
        </div>

        <div className="ts-filter-group">
          <span>Rôle :</span>
          <select
            className="ts-filter-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">Tous les rôles 🛡️</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
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
            <option value="Actif">🟢 Actif</option>
            <option value="Inactif">⚪ Inactif</option>
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
          {filteredUtilisateurs.length} / {utilisateurs.length} membre{utilisateurs.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="aeropub-table-wrapper">
        {filteredUtilisateurs.length === 0 ? (
          <p className="empty-msg">Aucun utilisateur ne correspond à ces critères.</p>
        ) : (
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-indigo">
                <th className="table-head-cell">ID</th>
                <th className="table-head-cell">Nom de l'Utilisateur</th>
                <th className="table-head-cell">Email</th>
                <th className="table-head-cell">Rôle & Droits</th>
                <th className="table-head-cell" style={{ textAlign: 'center' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUtilisateurs.map((u) => (
                <tr key={u.id} className="table-body-row">
                  <td className="cell-bold-white">#{u.id}</td>
                  <td className="cell-bold-white" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span>{u.nom}</span>
                  </td>
                  <td className="cell-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{u.email}</span>
                  </td>
                  <td className="cell-cyan">
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#60a5fa',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}>
                      <Shield size={13} />
                      <span>{u.nom_role || `Rôle #${u.id_role}`}</span>
                    </span>
                  </td>
                  <td className="table-body-cell" style={{ textAlign: 'center' }}>
                    <span className={`wireframe-badge ${u.actif ? 'badge-available' : 'badge-occupied'}`}>
                      {u.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination pour les utilisateurs */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredUtilisateurs.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
