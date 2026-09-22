import React, { useState, useEffect, useMemo } from 'react';
import { User, Shield, Mail, Search, RotateCcw, Plus, Edit3, Trash2, UserCheck, Lock } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import UserModal from '../modals/UserModal';
import { utilisateursApi } from '../../../api';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';

export default function UtilisateursTab({
  utilisateurs = [],
  initialSearchQuery = '',
  onRefresh
}) {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modales d'ajout et d'édition d'utilisateur
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

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

  // Supprimer un utilisateur
  const handleDeleteUser = async (u) => {
    if (currentUser && currentUser.id === u.id) {
      toast.warning('Vous ne pouvez pas supprimer votre propre compte administrateur actuellement connecté.');
      return;
    }

    if (!window.confirm(`Êtes-vous certain de vouloir supprimer définitivement l'utilisateur « ${u.nom} » ?`)) {
      return;
    }

    try {
      await utilisateursApi.delete(u.id);
      toast.success(`Utilisateur « ${u.nom} » supprimé avec succès.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur suppression utilisateur:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur.');
    }
  };

  return (
    <div>
      {/* Barre d'en-tête avec Filtres et Bouton d'Ajout */}
      <div className="ts-filters-bar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
          <div className="ts-filter-group">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="ts-filter-input"
              placeholder="Rechercher utilisateur (Nom, email...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '210px' }}
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

        {/* Bouton Créer Utilisateur */}
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', fontSize: '0.88rem' }}
        >
          <Plus size={16} />
          <span>Nouvel Utilisateur</span>
        </button>
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
                <th className="table-head-cell" style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUtilisateurs.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="table-body-row">
                    <td className="cell-bold-white">#{u.id}</td>
                    <td className="cell-bold-white">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#60a5fa',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          {u.nom ? u.nom.charAt(0).toUpperCase() : <User size={14} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.nom}</div>
                          {isCurrent && (
                            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                              (Vous)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="cell-muted">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="cell-cyan">
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.22rem 0.65rem',
                        borderRadius: '9999px',
                        background: u.nom_role?.toLowerCase() === 'administrateur'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : u.nom_role?.toLowerCase() === 'direction'
                          ? 'rgba(168, 85, 247, 0.15)'
                          : 'rgba(59, 130, 246, 0.15)',
                        border: u.nom_role?.toLowerCase() === 'administrateur'
                          ? '1px solid rgba(239, 68, 68, 0.35)'
                          : u.nom_role?.toLowerCase() === 'direction'
                          ? '1px solid rgba(168, 85, 247, 0.35)'
                          : '1px solid rgba(59, 130, 246, 0.35)',
                        color: u.nom_role?.toLowerCase() === 'administrateur'
                          ? '#f87171'
                          : u.nom_role?.toLowerCase() === 'direction'
                          ? '#c084fc'
                          : '#60a5fa',
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
                    <td className="table-body-cell" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          className="client-action-btn btn-edit"
                          title="Modifier le profil, rôle ou mot de passe"
                          onClick={() => setUserToEdit(u)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className="client-action-btn btn-delete"
                          title="Supprimer cet utilisateur"
                          disabled={isCurrent}
                          style={isCurrent ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                          onClick={() => handleDeleteUser(u)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* Modale d'ajout d'utilisateur */}
      {showAddModal && (
        <UserModal
          userToEdit={null}
          onClose={() => setShowAddModal(false)}
          onRefresh={onRefresh}
        />
      )}

      {/* Modale de modification d'utilisateur (Rôles & Mot de passe haché) */}
      {userToEdit && (
        <UserModal
          userToEdit={userToEdit}
          onClose={() => setUserToEdit(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
