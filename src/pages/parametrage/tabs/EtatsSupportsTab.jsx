import React, { useState, useEffect, useMemo } from 'react';
import { typeEtatSupportApi } from '../../../api';
import { PlusCircle, Trash2, Edit3, Check, X, RefreshCw, Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import { useFeedback } from '../../../context/FeedbackContext';
import { sanitizeUserError } from '../../../utils/errorHandler';

export default function EtatsSupportsTab({ onCountChange }) {
  const { showSuccess, showError } = useFeedback();
  const [typesEtats, setTypesEtats] = useState([]);
  const [loadingEtats, setLoadingEtats] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [newNomEtat, setNewNomEtat] = useState('');
  const [isSubmittingEtat, setIsSubmittingEtat] = useState(false);
  const [editingEtatId, setEditingEtatId] = useState(null);
  const [editNomEtat, setEditNomEtat] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTypesEtats = async () => {
    setLoadingEtats(true);
    try {
      const data = await typeEtatSupportApi.getAll();
      const list = data || [];
      setTypesEtats(list);
      if (onCountChange) onCountChange(list.length);
    } catch (err) {
      const msg = sanitizeUserError(err, 'Impossible de charger les états des supports.');
      showError(msg);
    } finally {
      setLoadingEtats(false);
    }
  };

  useEffect(() => {
    fetchTypesEtats();
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

  const filteredEtats = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return typesEtats;
    return typesEtats.filter(e => 
      (e.nom_etat || '').toLowerCase().includes(q) ||
      String(e.id).includes(q)
    );
  }, [typesEtats, searchTerm]);

  const sortedEtats = useMemo(() => {
    if (!sortField) return filteredEtats;
    return [...filteredEtats].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'id') {
        valA = Number(a.id) || 0;
        valB = Number(b.id) || 0;
      } else if (sortField === 'nom_etat') {
        valA = (a.nom_etat || '').toLowerCase();
        valB = (b.nom_etat || '').toLowerCase();
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const compare = typeof valA === 'string' ? valA.localeCompare(valB, 'fr') : (valA > valB ? 1 : -1);
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [filteredEtats, sortField, sortDirection]);

  const paginatedEtats = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEtats.slice(start, start + pageSize);
  }, [sortedEtats, currentPage, pageSize]);

  const handleCreateEtat = async (e) => {
    e.preventDefault();
    if (!newNomEtat.trim()) {
      showError('Veuillez saisir le nom du nouvel état.');
      return;
    }
    setIsSubmittingEtat(true);
    try {
      await typeEtatSupportApi.create({ nom_etat: newNomEtat.trim().toLowerCase() });
      showSuccess(`Nouvel état « ${newNomEtat} » ajouté avec succès !`);
      setNewNomEtat('');
      fetchTypesEtats();
    } catch (err) {
      const msg = sanitizeUserError(err, "Erreur lors de l'ajout de l'état.");
      showError(msg);
    } finally {
      setIsSubmittingEtat(false);
    }
  };

  const handleUpdateEtat = async (id) => {
    if (!editNomEtat.trim()) {
      showError("Le nom de l'état ne peut pas être vide.");
      return;
    }
    setUpdatingId(id);
    try {
      await typeEtatSupportApi.update(id, { nom_etat: editNomEtat.trim().toLowerCase() });
      showSuccess(`État mis à jour avec succès !`);
      setEditingEtatId(null);
      fetchTypesEtats();
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la mise à jour.');
      showError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteEtat = async (id, nom) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'état de support « ${nom} » ?`)) return;
    setDeletingId(id);
    try {
      await typeEtatSupportApi.delete(id);
      showSuccess(`État « ${nom} » supprimé.`);
      fetchTypesEtats();
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la suppression (le statut est peut-être lié à des supports).');
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
      {/* Formulaire d'ajout d'état */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={18} style={{ color: '#3b82f6' }} />
          Ajouter un Nouvel État de Support
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Définit les états techniques et d'occupation possibles pour les supports publicitaires (ex: disponible, réservé, occupé, en maintenance, archivé).
        </p>

        <form onSubmit={handleCreateEtat} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end', maxWidth: '600px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Nom de l'état (ex: en rénovation) :
            </label>
            <input
              type="text"
              className="search-input"
              style={{ borderRadius: '10px', padding: '0.65rem 0.9rem' }}
              placeholder="ex: en rénovation"
              value={newNomEtat}
              onChange={(e) => setNewNomEtat(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmittingEtat}
              className="btn-primary"
              style={{ padding: '0.7rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isSubmittingEtat ? (
                <>
                  <Loader2 size={16} className="btn-spinner" />
                  <span>Ajout en cours...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Ajouter État</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tableau des états */}
      {loadingEtats ? (
        <div className="loading-container">
          <RefreshCw size={28} className="spinner-icon" />
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Chargement des états de supports...</p>
        </div>
      ) : typesEtats.length === 0 ? (
        <div className="empty-msg">Aucun état de support enregistré.</div>
      ) : (
        <>
          {/* Barre de recherche et filtre */}
          <div className="ts-filters-bar" style={{ marginBottom: '1rem' }}>
            <div className="ts-filter-group">
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="ts-filter-input"
                placeholder="Rechercher un état..."
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
              {sortedEtats.length} / {typesEtats.length} état{typesEtats.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="aeropub-table-wrapper">
            <table className="aeropub-table">
              <thead>
                <tr className="table-head-row-indigo">
                  <th className="table-head-cell sortable" onClick={() => handleSort('id')} style={{ cursor: 'pointer', width: '90px' }}>
                    ID {renderSortIcon('id')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('nom_etat')} style={{ cursor: 'pointer' }}>
                    Nom de l'État (Référentiel) {renderSortIcon('nom_etat')}
                  </th>
                  <th className="table-head-cell">Aperçu du Badge</th>
                  <th className="table-head-cell" style={{ textAlign: 'right', width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEtats.map((etat) => (
                  <tr key={etat.id} className="table-body-row">
                    <td className="cell-muted">#{etat.id}</td>
                    <td className="cell-bold-white">
                      {editingEtatId === etat.id ? (
                        <input
                          type="text"
                          className="search-input"
                          style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.88rem', width: '220px' }}
                          value={editNomEtat}
                          onChange={(e) => setEditNomEtat(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{etat.nom_etat}</span>
                      )}
                    </td>
                    <td className="table-body-cell">
                      <span className={`status-badge ${getBadgeClass(editingEtatId === etat.id ? editNomEtat : etat.nom_etat)}`}>
                        {editingEtatId === etat.id ? (editNomEtat || 'Aperçu') : etat.nom_etat}
                      </span>
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'right' }}>
                      {editingEtatId === etat.id ? (
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleUpdateEtat(etat.id)}
                            disabled={updatingId === etat.id}
                            style={{ color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', cursor: updatingId === etat.id ? 'not-allowed' : 'pointer' }}
                            title="Valider"
                          >
                            {updatingId === etat.id ? <Loader2 size={16} className="btn-spinner" /> : <Check size={16} />}
                          </button>
                          <button
                            onClick={() => { setEditingEtatId(null); setEditNomEtat(''); }}
                            disabled={updatingId === etat.id}
                            style={{ color: '#9ca3af', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}
                            title="Annuler"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => { setEditingEtatId(etat.id); setEditNomEtat(etat.nom_etat); }}
                            disabled={deletingId === etat.id}
                            style={{ color: '#6366f1', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', cursor: 'pointer' }}
                            title="Modifier le nom"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEtat(etat.id, etat.nom_etat)}
                            disabled={deletingId === etat.id}
                            style={{ color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', cursor: deletingId === etat.id ? 'not-allowed' : 'pointer' }}
                            title="Supprimer cet état"
                          >
                            {deletingId === etat.id ? <Loader2 size={16} className="btn-spinner" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedEtats.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={sortedEtats.length}
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
