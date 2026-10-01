import React, { useState, useEffect } from 'react';
import { typeEtatSupportApi } from '../../../api';
import { PlusCircle, Trash2, Edit3, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function EtatsSupportsTab({ onCountChange }) {
  const [typesEtats, setTypesEtats] = useState([]);
  const [loadingEtats, setLoadingEtats] = useState(true);
  const [newNomEtat, setNewNomEtat] = useState('');
  const [isSubmittingEtat, setIsSubmittingEtat] = useState(false);
  const [editingEtatId, setEditingEtatId] = useState(null);
  const [editNomEtat, setEditNomEtat] = useState('');

  const fetchTypesEtats = async () => {
    setLoadingEtats(true);
    try {
      const data = await typeEtatSupportApi.getAll();
      const list = data || [];
      setTypesEtats(list);
      if (onCountChange) onCountChange(list.length);
    } catch (err) {
      console.error('Erreur chargement types états:', err);
      toast.error('❌ Impossible de charger les états des supports.');
    } finally {
      setLoadingEtats(false);
    }
  };

  useEffect(() => {
    fetchTypesEtats();
  }, []);

  const handleCreateEtat = async (e) => {
    e.preventDefault();
    if (!newNomEtat.trim()) {
      toast.error('❌ Veuillez saisir le nom du nouvel état.');
      return;
    }
    setIsSubmittingEtat(true);
    try {
      await typeEtatSupportApi.create({ nom_etat: newNomEtat.trim().toLowerCase() });
      toast.success(`🎉 Nouvel état « ${newNomEtat} » ajouté avec succès !`);
      setNewNomEtat('');
      fetchTypesEtats();
    } catch (err) {
      console.error(err);
      toast.error(`❌ ${err.response?.data?.message || "Erreur lors de l'ajout de l'état."}`);
    } finally {
      setIsSubmittingEtat(false);
    }
  };

  const handleUpdateEtat = async (id) => {
    if (!editNomEtat.trim()) {
      toast.error("❌ Le nom de l'état ne peut pas être vide.");
      return;
    }
    try {
      await typeEtatSupportApi.update(id, { nom_etat: editNomEtat.trim().toLowerCase() });
      toast.success(`✅ État mis à jour avec succès !`);
      setEditingEtatId(null);
      fetchTypesEtats();
    } catch (err) {
      console.error(err);
      toast.error('❌ Erreur lors de la mise à jour.');
    }
  };

  const handleDeleteEtat = async (id, nom) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'état de support « ${nom} » ?`)) return;
    try {
      await typeEtatSupportApi.delete(id);
      toast.success(`🗑️ État « ${nom} » supprimé.`);
      fetchTypesEtats();
    } catch (err) {
      console.error(err);
      toast.error(`❌ ${err.response?.data?.message || 'Erreur lors de la suppression (il est peut-être lié à des supports).'}`);
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
              <PlusCircle size={16} />
              <span>{isSubmittingEtat ? 'Ajout...' : 'Ajouter État'}</span>
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
        <div className="aeropub-table-wrapper">
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-indigo">
                <th className="table-head-cell" style={{ width: '80px' }}>ID</th>
                <th className="table-head-cell">Nom de l'État (Référentiel)</th>
                <th className="table-head-cell">Aperçu du Badge</th>
                <th className="table-head-cell" style={{ textAlign: 'right', width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {typesEtats.map((etat) => (
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
                          style={{ color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', cursor: 'pointer' }}
                          title="Valider"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => { setEditingEtatId(null); setEditNomEtat(''); }}
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
                          style={{ color: '#6366f1', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', cursor: 'pointer' }}
                          title="Modifier le nom"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEtat(etat.id, etat.nom_etat)}
                          style={{ color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', cursor: 'pointer' }}
                          title="Supprimer cet état"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
