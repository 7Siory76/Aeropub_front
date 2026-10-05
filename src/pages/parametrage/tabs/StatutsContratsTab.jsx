import React, { useState, useEffect, useMemo } from 'react';
import { typeStatutAbonnementApi } from '../../../api';
import { PlusCircle, Trash2, Edit3, Check, X, RefreshCw, Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import { useFeedback } from '../../../context/FeedbackContext';
import { sanitizeUserError } from '../../../utils/errorHandler';

export default function StatutsContratsTab({ onCountChange }) {
  const { showSuccess, showError } = useFeedback();
  const [typesStatuts, setTypesStatuts] = useState([]);
  const [loadingStatuts, setLoadingStatuts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [newNomStatut, setNewNomStatut] = useState('');
  const [isSubmittingStatut, setIsSubmittingStatut] = useState(false);
  const [editingStatutId, setEditingStatutId] = useState(null);
  const [editNomStatut, setEditNomStatut] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTypesStatuts = async () => {
    setLoadingStatuts(true);
    try {
      const data = await typeStatutAbonnementApi.getAll();
      const list = data || [];
      setTypesStatuts(list);
      if (onCountChange) onCountChange(list.length);
    } catch (err) {
      const msg = sanitizeUserError(err, "Impossible de charger les statuts d'abonnement.");
      showError(msg);
    } finally {
      setLoadingStatuts(false);
    }
  };

  useEffect(() => {
    fetchTypesStatuts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const filteredStatuts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return typesStatuts;
    return typesStatuts.filter(s => 
      (s.nom_statut || '').toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  }, [typesStatuts, searchTerm]);

  const sortedStatuts = useMemo(() => {
    if (!sortField) return filteredStatuts;
    return [...filteredStatuts].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'id') {
        valA = Number(a.id) || 0;
        valB = Number(b.id) || 0;
      } else if (sortField === 'nom_statut') {
        valA = (a.nom_statut || '').toLowerCase();
        valB = (b.nom_statut || '').toLowerCase();
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const compare = typeof valA === 'string' ? valA.localeCompare(valB, 'fr') : (valA > valB ? 1 : -1);
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [filteredStatuts, sortField, sortDirection]);

  const paginatedStatuts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStatuts.slice(start, start + pageSize);
  }, [sortedStatuts, currentPage, pageSize]);

  const handleCreateStatut = async (e) => {
    e.preventDefault();
    if (!newNomStatut.trim()) {
      showError('Veuillez saisir le nom du nouveau statut.');
      return;
    }
    setIsSubmittingStatut(true);
    try {
      await typeStatutAbonnementApi.create({ nom_statut: newNomStatut.trim().toLowerCase() });
      showSuccess(`Nouveau statut « ${newNomStatut} » ajouté avec succès !`);
      setNewNomStatut('');
      fetchTypesStatuts();
    } catch (err) {
      const msg = sanitizeUserError(err, "Erreur lors de l'ajout du statut.");
      showError(msg);
    } finally {
      setIsSubmittingStatut(false);
    }
  };

  const handleUpdateStatut = async (id) => {
    if (!editNomStatut.trim()) {
      showError("Le nom du statut ne peut pas être vide.");
      return;
    }
    setUpdatingId(id);
    try {
      await typeStatutAbonnementApi.update(id, { nom_statut: editNomStatut.trim().toLowerCase() });
      showSuccess(`Statut mis à jour avec succès !`);
      setEditingStatutId(null);
      fetchTypesStatuts();
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la mise à jour du statut.');
      showError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteStatut = async (id, nom) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le statut d'abonnement « ${nom} » ?`)) return;
    setDeletingId(id);
    try {
      await typeStatutAbonnementApi.delete(id);
      showSuccess(`Statut « ${nom} » supprimé.`);
      fetchTypesStatuts();
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la suppression (le statut est peut-être lié à des abonnements).');
      showError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const getBadgeClass = (nom) => {
    const val = String(nom || '').toLowerCase();
    if (val.includes('disponible') || val.includes('actif')) return 'badge-active';
    if (val.includes('réservé') || val.includes('attente') || val.includes('bientôt')) return 'badge-warning';
    if (val.includes('occupé') || val.includes('expiré') || val.includes('résilié') || val.includes('indisponible')) return 'badge-expired';
    return 'badge-neutral';
  };

  return (
    <>
      {/* Formulaire d'ajout de statut */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={18} style={{ color: '#facc15' }} />
          Ajouter un Nouveau Statut de Contrat / Abonnement
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Définit les statuts légaux et commerciaux applicables aux contrats (ex: brouillon, à valider, actif, bientôt échu, renouvelé, expiré, résilié, archivé).
        </p>

        <form onSubmit={handleCreateStatut} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end', maxWidth: '600px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Nom du statut (ex: suspendu temporairement) :
            </label>
            <input
              type="text"
              className="search-input"
              style={{ borderRadius: '10px', padding: '0.65rem 0.9rem' }}
              placeholder="ex: suspendu"
              value={newNomStatut}
              onChange={(e) => setNewNomStatut(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmittingStatut}
              className="btn-primary"
              style={{ padding: '0.7rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isSubmittingStatut ? (
                <>
                  <Loader2 size={16} className="btn-spinner" />
                  <span>Ajout en cours...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Ajouter Statut</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tableau des statuts */}
      {loadingStatuts ? (
        <div className="loading-container">
          <RefreshCw size={28} className="spinner-icon" />
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Chargement des statuts d'abonnements...</p>
        </div>
      ) : typesStatuts.length === 0 ? (
        <div className="empty-msg">Aucun statut d'abonnement enregistré.</div>
      ) : (
        <>
          {/* Barre de recherche et filtre */}
          <div className="ts-filters-bar" style={{ marginBottom: '1rem' }}>
            <div className="ts-filter-group">
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="ts-filter-input"
                placeholder="Rechercher un statut..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '220px' }}
              />
            </div>
            {searchTerm && (
              <button
                type="button"
                className="ts-reset-btn"
                onClick={() => setSearchTerm('')}
                title="Réinitialiser la recherche"
              >
                <RotateCcw size={13} />
                <span>Effacer</span>
              </button>
            )}
            <div className="ts-filter-badge-count">
              {sortedStatuts.length} / {typesStatuts.length} statut{typesStatuts.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="aeropub-table-wrapper">
            <table className="aeropub-table">
              <thead>
                <tr className="table-head-row-indigo">
                  <th className="table-head-cell sortable" onClick={() => handleSort('id')} style={{ cursor: 'pointer', width: '90px' }}>
                    ID {renderSortIcon('id')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('nom_statut')} style={{ cursor: 'pointer' }}>
                    Nom du Statut (Référentiel) {renderSortIcon('nom_statut')}
                  </th>
                  <th className="table-head-cell">Aperçu du Badge</th>
                  <th className="table-head-cell" style={{ textAlign: 'right', width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStatuts.map((statut) => (
                  <tr key={statut.id} className="table-body-row">
                    <td className="cell-muted">#{statut.id}</td>
                    <td className="cell-bold-white">
                      {editingStatutId === statut.id ? (
                        <input
                          type="text"
                          className="search-input"
                          style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.88rem', width: '220px' }}
                          value={editNomStatut}
                          onChange={(e) => setEditNomStatut(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{statut.nom_statut}</span>
                      )}
                    </td>
                    <td className="table-body-cell">
                      <span className={`status-badge ${getBadgeClass(editingStatutId === statut.id ? editNomStatut : statut.nom_statut)}`}>
                        {editingStatutId === statut.id ? (editNomStatut || 'Aperçu') : statut.nom_statut}
                      </span>
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'right' }}>
                      {editingStatutId === statut.id ? (
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleUpdateStatut(statut.id)}
                            disabled={updatingId === statut.id}
                            style={{ color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', cursor: updatingId === statut.id ? 'not-allowed' : 'pointer' }}
                            title="Valider"
                          >
                            {updatingId === statut.id ? <Loader2 size={16} className="btn-spinner" /> : <Check size={16} />}
                          </button>
                          <button
                            onClick={() => { setEditingStatutId(null); setEditNomStatut(''); }}
                            disabled={updatingId === statut.id}
                            style={{ color: '#9ca3af', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}
                            title="Annuler"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => { setEditingStatutId(statut.id); setEditNomStatut(statut.nom_statut); }}
                            disabled={deletingId === statut.id}
                            style={{ color: '#6366f1', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', cursor: 'pointer' }}
                            title="Modifier le nom"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteStatut(statut.id, statut.nom_statut)}
                            disabled={deletingId === statut.id}
                            style={{ color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', cursor: deletingId === statut.id ? 'not-allowed' : 'pointer' }}
                            title="Supprimer ce statut"
                          >
                            {deletingId === statut.id ? <Loader2 size={16} className="btn-spinner" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedStatuts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={sortedStatuts.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </>
      )}
    </>
  );
}
