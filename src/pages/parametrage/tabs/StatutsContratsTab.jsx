import React, { useState, useEffect } from 'react';
import { typeStatutAbonnementApi } from '../../../api';
import { PlusCircle, Trash2, Edit3, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function StatutsContratsTab({ onCountChange }) {
  const [typesStatuts, setTypesStatuts] = useState([]);
  const [loadingStatuts, setLoadingStatuts] = useState(true);
  const [newNomStatut, setNewNomStatut] = useState('');
  const [isSubmittingStatut, setIsSubmittingStatut] = useState(false);
  const [editingStatutId, setEditingStatutId] = useState(null);
  const [editNomStatut, setEditNomStatut] = useState('');

  const fetchTypesStatuts = async () => {
    setLoadingStatuts(true);
    try {
      const data = await typeStatutAbonnementApi.getAll();
      const list = data || [];
      setTypesStatuts(list);
      if (onCountChange) onCountChange(list.length);
    } catch (err) {
      console.error('Erreur chargement types statuts:', err);
      toast.error("❌ Impossible de charger les statuts d'abonnement.");
    } finally {
      setLoadingStatuts(false);
    }
  };

  useEffect(() => {
    fetchTypesStatuts();
  }, []);

  const handleCreateStatut = async (e) => {
    e.preventDefault();
    if (!newNomStatut.trim()) {
      toast.error('❌ Veuillez saisir le nom du nouveau statut.');
      return;
    }
    setIsSubmittingStatut(true);
    try {
      await typeStatutAbonnementApi.create({ nom_statut: newNomStatut.trim().toLowerCase() });
      toast.success(`🎉 Nouveau statut « ${newNomStatut} » ajouté avec succès !`);
      setNewNomStatut('');
      fetchTypesStatuts();
    } catch (err) {
      console.error(err);
      toast.error(`❌ ${err.response?.data?.message || "Erreur lors de l'ajout du statut."}`);
    } finally {
      setIsSubmittingStatut(false);
    }
  };

  const handleUpdateStatut = async (id) => {
    if (!editNomStatut.trim()) {
      toast.error("❌ Le nom du statut ne peut pas être vide.");
      return;
    }
    try {
      await typeStatutAbonnementApi.update(id, { nom_statut: editNomStatut.trim().toLowerCase() });
      toast.success(`✅ Statut mis à jour avec succès !`);
      setEditingStatutId(null);
      fetchTypesStatuts();
    } catch (err) {
      console.error(err);
      toast.error('❌ Erreur lors de la mise à jour.');
    }
  };

  const handleDeleteStatut = async (id, nom) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le statut d'abonnement « ${nom} » ?`)) return;
    try {
      await typeStatutAbonnementApi.delete(id);
      toast.success(`🗑️ Statut « ${nom} » supprimé.`);
      fetchTypesStatuts();
    } catch (err) {
      console.error(err);
      toast.error(`❌ ${err.response?.data?.message || 'Erreur lors de la suppression (il est peut-être lié à des abonnements).'}`);
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
              <PlusCircle size={16} />
              <span>{isSubmittingStatut ? 'Ajout...' : 'Ajouter Statut'}</span>
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
        <div className="aeropub-table-wrapper">
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-indigo">
                <th className="table-head-cell" style={{ width: '80px' }}>ID</th>
                <th className="table-head-cell">Nom du Statut (Référentiel)</th>
                <th className="table-head-cell">Aperçu du Badge</th>
                <th className="table-head-cell" style={{ textAlign: 'right', width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {typesStatuts.map((statut) => (
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
                          style={{ color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', cursor: 'pointer' }}
                          title="Valider"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => { setEditingStatutId(null); setEditNomStatut(''); }}
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
                          style={{ color: '#6366f1', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', cursor: 'pointer' }}
                          title="Modifier le nom"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteStatut(statut.id, statut.nom_statut)}
                          style={{ color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', cursor: 'pointer' }}
                          title="Supprimer ce statut"
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
