import React, { useState, useEffect, useMemo } from 'react';
import { parametragesApi } from '../../../api';
import { Sliders, PlusCircle, Trash2, Edit3, Check, X, RefreshCw, Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import { useFeedback } from '../../../context/FeedbackContext';
import { sanitizeUserError } from '../../../utils/errorHandler';

export default function ParametragesTab({ onCountChange }) {
  const { showSuccess, showError } = useFeedback();
  const [parametrages, setParametrages] = useState([]);
  const [loadingParams, setLoadingParams] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [nomParametre, setNomParametre] = useState('');
  const [valeur, setValeur] = useState('');
  const [isSubmittingParam, setIsSubmittingParam] = useState(false);
  const [editingParamId, setEditingParamId] = useState(null);
  const [editValeur, setEditValeur] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchParametrages = async () => {
    setLoadingParams(true);
    try {
      const data = await parametragesApi.getAll();
      const list = data || [];
      setParametrages(list);
      if (onCountChange) onCountChange(list.length);
    } catch (err) {
      const msg = sanitizeUserError(err, 'Impossible de charger les paramètres.');
      showError(msg);
    } finally {
      setLoadingParams(false);
    }
  };

  useEffect(() => {
    fetchParametrages();
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

  const filteredParametrages = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return parametrages;
    return parametrages.filter(p => 
      (p.nom_parametre || '').toLowerCase().includes(q) ||
      (p.valeur || '').toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  }, [parametrages, searchTerm]);

  const sortedParametrages = useMemo(() => {
    if (!sortField) return filteredParametrages;
    return [...filteredParametrages].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'id') {
        valA = Number(a.id) || 0;
        valB = Number(b.id) || 0;
      } else if (sortField === 'nom_parametre') {
        valA = (a.nom_parametre || '').toLowerCase();
        valB = (b.nom_parametre || '').toLowerCase();
      } else if (sortField === 'valeur') {
        valA = (a.valeur || '').toLowerCase();
        valB = (b.valeur || '').toLowerCase();
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const compare = typeof valA === 'string' ? valA.localeCompare(valB, 'fr') : (valA > valB ? 1 : -1);
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [filteredParametrages, sortField, sortDirection]);

  const paginatedParametrages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedParametrages.slice(start, start + pageSize);
  }, [sortedParametrages, currentPage, pageSize]);

  const handleCreateParam = async (e) => {
    e.preventDefault();
    if (!nomParametre.trim() || !valeur.trim()) {
      showError('Veuillez remplir le nom du paramètre et sa valeur.');
      return;
    }
    setIsSubmittingParam(true);
    try {
      await parametragesApi.create({
        nom_parametre: nomParametre.trim(),
        valeur: valeur.trim()
      });
      showSuccess(`Paramètre « ${nomParametre} » créé avec succès !`);
      setNomParametre('');
      setValeur('');
      fetchParametrages();
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la création du paramètre.');
      showError(msg);
    } finally {
      setIsSubmittingParam(false);
    }
  };

  const handleUpdateParam = async (id, nomParam) => {
    if (!editValeur.trim()) {
      showError('La valeur ne peut pas être vide.');
      return;
    }
    setUpdatingId(id);
    try {
      await parametragesApi.update(id, { valeur: editValeur.trim() });
      showSuccess(`Paramètre « ${nomParam} » mis à jour !`);
      setEditingParamId(null);
      fetchParametrages();
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la mise à jour.');
      showError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteParam = async (id, nomParam) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le paramètre « ${nomParam} » ?`)) return;
    setDeletingId(id);
    try {
      await parametragesApi.delete(id);
      showSuccess(`Paramètre « ${nomParam} » supprimé.`);
      fetchParametrages();
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la suppression.');
      showError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Formulaire d'ajout */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={18} style={{ color: '#10b981' }} />
          Ajouter un Nouveau Paramètre
        </h3>

        <form onSubmit={handleCreateParam} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Nom du Paramètre (ex: DELAI_ALERTE_J_MOINS) :
            </label>
            <input
              type="text"
              className="search-input"
              style={{ borderRadius: '10px', padding: '0.65rem 0.9rem' }}
              placeholder="ex: PRIX_BASE_MENSUEL"
              value={nomParametre}
              onChange={(e) => setNomParametre(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Valeur :
            </label>
            <input
              type="text"
              className="search-input"
              style={{ borderRadius: '10px', padding: '0.65rem 0.9rem' }}
              placeholder="ex: 30"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmittingParam}
              className="btn-primary"
              style={{ width: '100%', padding: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {isSubmittingParam ? (
                <>
                  <Loader2 size={16} className="btn-spinner" />
                  <span>Ajout en cours...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Ajouter Paramètre</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tableau des paramètres */}
      {loadingParams ? (
        <div className="loading-container">
          <RefreshCw size={28} className="spinner-icon" />
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Chargement des paramètres...</p>
        </div>
      ) : parametrages.length === 0 ? (
        <div className="empty-msg">Aucun paramètre système enregistré pour le moment.</div>
      ) : (
        <>
          {/* Barre de recherche et filtre */}
          <div className="ts-filters-bar" style={{ marginBottom: '1rem' }}>
            <div className="ts-filter-group">
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="ts-filter-input"
                placeholder="Rechercher un paramètre..."
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
              {sortedParametrages.length} / {parametrages.length} paramètre{parametrages.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="aeropub-table-wrapper">
            <table className="aeropub-table">
              <thead>
                <tr className="table-head-row-indigo">
                  <th className="table-head-cell sortable" onClick={() => handleSort('id')} style={{ cursor: 'pointer', width: '90px' }}>
                    ID {renderSortIcon('id')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('nom_parametre')} style={{ cursor: 'pointer' }}>
                    Nom du Paramètre {renderSortIcon('nom_parametre')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('valeur')} style={{ cursor: 'pointer' }}>
                    Valeur {renderSortIcon('valeur')}
                  </th>
                  <th className="table-head-cell" style={{ textAlign: 'right', width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedParametrages.map((p) => (
                  <tr key={p.id} className="table-body-row">
                    <td className="cell-muted">#{p.id}</td>
                    <td className="cell-bold-white">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sliders size={14} style={{ color: '#06b6d4' }} />
                        {p.nom_parametre}
                      </span>
                    </td>
                    <td className="cell-cyan">
                      {editingParamId === p.id ? (
                        <input
                          type="text"
                          className="search-input"
                          style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.88rem', width: 'auto' }}
                          value={editValeur}
                          onChange={(e) => setEditValeur(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span>{p.valeur}</span>
                      )}
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'right' }}>
                      {editingParamId === p.id ? (
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleUpdateParam(p.id, p.nom_parametre)}
                            disabled={updatingId === p.id}
                            style={{ color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', cursor: updatingId === p.id ? 'not-allowed' : 'pointer' }}
                            title="Valider"
                          >
                            {updatingId === p.id ? <Loader2 size={16} className="btn-spinner" /> : <Check size={16} />}
                          </button>
                          <button
                            onClick={() => { setEditingParamId(null); setEditValeur(''); }}
                            disabled={updatingId === p.id}
                            style={{ color: '#9ca3af', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}
                            title="Annuler"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => { setEditingParamId(p.id); setEditValeur(p.valeur); }}
                            disabled={deletingId === p.id}
                            style={{ color: '#6366f1', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', cursor: 'pointer' }}
                            title="Modifier"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteParam(p.id, p.nom_parametre)}
                            disabled={deletingId === p.id}
                            style={{ color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', cursor: deletingId === p.id ? 'not-allowed' : 'pointer' }}
                            title="Supprimer"
                          >
                            {deletingId === p.id ? <Loader2 size={16} className="btn-spinner" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedParametrages.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={sortedParametrages.length}
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
