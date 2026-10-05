import React, { useState, useEffect, useMemo } from 'react';
import { User, Shield, Mail, Search, RotateCcw, Plus, Edit3, Trash2, UserCheck, Lock, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import UserModal from '../modals/UserModal';
import { utilisateursApi } from '../../../api';
import { useFeedback } from '../../../context/FeedbackContext';
import { sanitizeUserError } from '../../../utils/errorHandler';
import { useAuth } from '../../../context/AuthContext';
import { ROLES_GUIDE, getRoleGuide } from '../../../utils/rbac';

export default function UtilisateursTab({
  utilisateurs = [],
  initialSearchQuery = '',
  onRefresh
}) {
  const { showSuccess, showError, showInfo } = useFeedback();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="table-head-sort-icon" style={{ opacity: 0.35, marginLeft: 4 }} />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={13} className="table-head-sort-icon" style={{ color: '#38bdf8', marginLeft: 4 }} />
      : <ArrowDown size={13} className="table-head-sort-icon" style={{ color: '#38bdf8', marginLeft: 4 }} />;
  };

  // État du panneau d'aide des rôles & permissions
  const [showRoleGuide, setShowRoleGuide] = useState(false);
  const [selectedGuideRole, setSelectedGuideRole] = useState(ROLES_GUIDE[0].code);

  // Modales d'ajout et d'édition d'utilisateur
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  const sortedUtilisateurs = useMemo(() => {
    if (!sortField) return filteredUtilisateurs;
    return [...filteredUtilisateurs].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'nom') {
        valA = (a.nom || '').toLowerCase();
        valB = (b.nom || '').toLowerCase();
      } else if (sortField === 'email') {
        valA = (a.email || '').toLowerCase();
        valB = (b.email || '').toLowerCase();
      } else if (sortField === 'nom_role') {
        valA = (a.nom_role || '').toLowerCase();
        valB = (b.nom_role || '').toLowerCase();
      } else if (sortField === 'actif') {
        valA = a.actif ? 1 : 0;
        valB = b.actif ? 1 : 0;
      } else if (sortField === 'id') {
        valA = Number(a.id) || 0;
        valB = Number(b.id) || 0;
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const compare = typeof valA === 'string' ? valA.localeCompare(valB, 'fr') : (valA > valB ? 1 : -1);
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [filteredUtilisateurs, sortField, sortDirection]);

  const paginatedUtilisateurs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUtilisateurs.slice(start, start + pageSize);
  }, [sortedUtilisateurs, currentPage, pageSize]);

  // Supprimer un utilisateur
  const handleDeleteUser = async (u) => {
    if (currentUser && currentUser.id === u.id) {
      showInfo('Vous ne pouvez pas supprimer votre propre compte administrateur actuellement connecté.');
      return;
    }

    if (!window.confirm(`Êtes-vous certain de vouloir supprimer définitivement l'utilisateur « ${u.nom} » ?`)) {
      return;
    }

    try {
      setDeletingId(u.id);
      await utilisateursApi.delete(u.id);
      showSuccess(`Utilisateur « ${u.nom} » supprimé avec succès.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la suppression de l\'utilisateur.');
      showError(msg);
    } finally {
      setDeletingId(null);
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Bouton d'aide des rôles & permissions */}
          <button
            type="button"
            className={`pill-btn ${showRoleGuide ? 'active' : ''}`}
            onClick={() => setShowRoleGuide(!showRoleGuide)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              padding: '0.45rem 0.85rem'
            }}
            title="Consulter le guide des rôles et des autorisations"
          >
            <HelpCircle size={15} />
            <span>{showRoleGuide ? 'Masquer l\'aide' : 'Guide des Rôles 💡'}</span>
            {showRoleGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

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
      </div>

      {/* Panneau d'aide & Matrice des Rôles (Qui peut faire quoi ?) */}
      {showRoleGuide && (
        <div className="glass-panel" style={{
          marginBottom: '1.25rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(15, 23, 42, 0.65)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <ShieldCheck size={18} style={{ color: 'var(--accent-secondary)' }} />
                <span>Guide des Rôles : Qui peut faire quoi ?</span>
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Consultez les habilitations, droits d'accès et restrictions assignés à chaque profil utilisateur.
              </p>
            </div>

            {/* Boutons d'onglets pour chaque rôle */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {ROLES_GUIDE.map((r) => {
                const isSelected = selectedGuideRole === r.code;
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => setSelectedGuideRole(r.code)}
                    className={`pill-btn ${isSelected ? 'active' : ''}`}
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.25rem 0.65rem',
                      borderColor: isSelected ? r.badgeColor : undefined,
                      color: isSelected ? r.badgeColor : undefined,
                      fontWeight: isSelected ? 700 : 500
                    }}
                  >
                    {r.nom}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carte détaillée du rôle sélectionné dans l'aide */}
          {(() => {
            const activeGuide = ROLES_GUIDE.find(r => r.code === selectedGuideRole) || ROLES_GUIDE[0];
            return (
              <div style={{
                background: activeGuide.badgeBg,
                border: `1px solid ${activeGuide.badgeBorder}`,
                borderRadius: '10px',
                padding: '1rem 1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    background: 'rgba(0,0,0,0.3)',
                    color: activeGuide.badgeColor,
                    border: `1px solid ${activeGuide.badgeColor}`,
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>
                    {activeGuide.nom}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {activeGuide.summary}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '0.55rem' }}>
                  {activeGuide.permissions.map((p, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.55rem',
                      fontSize: '0.82rem',
                      background: 'rgba(0,0,0,0.22)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <span style={{ color: p.allowed ? '#10b981' : '#ef4444', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.1 }}>
                        {p.allowed ? '✓' : '✗'}
                      </span>
                      <span style={{ color: p.allowed ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {p.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="aeropub-table-wrapper">
        {filteredUtilisateurs.length === 0 ? (
          <p className="empty-msg">Aucun utilisateur ne correspond à ces critères.</p>
        ) : (
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-indigo">
                <th className="table-head-cell sortable" onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                  ID {renderSortIcon('id')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('nom')} style={{ cursor: 'pointer' }}>
                  Nom de l'Utilisateur {renderSortIcon('nom')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                  Email {renderSortIcon('email')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('nom_role')} style={{ cursor: 'pointer' }}>
                  Rôle & Droits {renderSortIcon('nom_role')}
                </th>
                <th className="table-head-cell sortable" onClick={() => handleSort('actif')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                  Statut {renderSortIcon('actif')}
                </th>
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
                      {(() => {
                        const roleInfo = getRoleGuide(u.nom_role || u.id_role);
                        return (
                          <div>
                            <span
                              title={roleInfo.summary}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.22rem 0.65rem',
                                borderRadius: '9999px',
                                background: roleInfo.badgeBg,
                                border: `1px solid ${roleInfo.badgeBorder}`,
                                color: roleInfo.badgeColor,
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: 'help'
                              }}
                            >
                              <Shield size={13} />
                              <span>{u.nom_role || roleInfo.nom}</span>
                            </span>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.2rem', maxWidth: '210px', lineHeight: 1.25 }}>
                              {roleInfo.summary}
                            </div>
                          </div>
                        );
                      })()}
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
                          disabled={isCurrent || deletingId === u.id}
                          style={isCurrent || deletingId === u.id ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                          onClick={() => handleDeleteUser(u)}
                        >
                          {deletingId === u.id ? <Loader2 size={14} className="btn-spinner" /> : <Trash2 size={14} />}
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
        totalItems={sortedUtilisateurs.length}
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
