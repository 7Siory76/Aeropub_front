import React, { useState, useEffect } from 'react';
import { parametragesApi } from '../../api';
import { Sliders, PlusCircle, Trash2, Edit3, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ParametragePage() {
  const [parametrages, setParametrages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulaire d'ajout
  const [nomParametre, setNomParametre] = useState('');
  const [valeur, setValeur] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Édition en ligne
  const [editingId, setEditingId] = useState(null);
  const [editValeur, setEditValeur] = useState('');

  const fetchParametrages = async () => {
    setLoading(true);
    try {
      const data = await parametragesApi.getAll();
      setParametrages(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres:', err);
      toast.error('❌ Impossible de charger les paramètres.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParametrages();
  }, []);

  // Création d'un nouveau paramètre
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nomParametre.trim() || !valeur.trim()) {
      toast.error('❌ Veuillez remplir le nom du paramètre et sa valeur.');
      return;
    }

    setIsSubmitting(true);
    try {
      await parametragesApi.create({
        nom_parametre: nomParametre.trim(),
        valeur: valeur.trim()
      });
      toast.success(`🎉 Paramètre « ${nomParametre} » créé avec succès !`);
      setNomParametre('');
      setValeur('');
      fetchParametrages();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Erreur lors de la création du paramètre.';
      toast.error(`❌ ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Activer l'édition d'une ligne
  const startEdit = (param) => {
    setEditingId(param.id);
    setEditValeur(param.valeur);
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingId(null);
    setEditValeur('');
  };

  // Sauvegarder la modification
  const handleUpdate = async (id, nomParam) => {
    if (!editValeur.trim()) {
      toast.error('❌ La valeur ne peut pas être vide.');
      return;
    }

    try {
      await parametragesApi.update(id, { valeur: editValeur.trim() });
      toast.success(`✅ Paramètre « ${nomParam} » mis à jour !`);
      setEditingId(null);
      fetchParametrages();
    } catch (err) {
      console.error(err);
      toast.error('❌ Erreur lors de la mise à jour.');
    }
  };

  // Suppression d'un paramètre
  const handleDelete = async (id, nomParam) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le paramètre « ${nomParam} » ?`)) {
      return;
    }

    try {
      await parametragesApi.delete(id);
      toast.success(`🗑️ Paramètre « ${nomParam} » supprimé.`);
      fetchParametrages();
    } catch (err) {
      console.error(err);
      toast.error('❌ Erreur lors de la suppression.');
    }
  };

  return (
    <section className="glass-panel dashboard-panel">
      {/* En-tête de la page */}
      <div className="dashboard-header-box">
        <div>
          <h2 className="dashboard-title">
            ⚙️ Paramétrage du <span className="gradient-text">Système AeroPub</span>
          </h2>
          <p className="dashboard-desc">
            Consultez, ajoutez, modifiez ou supprimez les paramètres de configuration globale.
          </p>
        </div>

        <button 
          onClick={fetchParametrages} 
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={16} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Formulaire de création d'un Paramètre */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={18} style={{ color: '#10b981' }} />
          Ajouter un Nouveau Paramètre
        </h3>

        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Nom du Paramètre (ex: tva_pourcentage) :
            </label>
            <input
              type="text"
              className="search-input"
              style={{ borderRadius: '10px', padding: '0.65rem 0.9rem' }}
              placeholder="ex: prix_base_mensuel"
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
              placeholder="ex: 1500000"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: '100%', padding: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={16} />
              <span>{isSubmitting ? 'Ajout en cours...' : 'Ajouter Paramètre'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tableau des Paramètres */}
      {loading ? (
        <div className="loading-container">
          <RefreshCw size={28} className="spinner-icon" />
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Chargement des paramètres...</p>
        </div>
      ) : parametrages.length === 0 ? (
        <div className="empty-msg">
          Aucun paramètre système enregistré pour le moment.
        </div>
      ) : (
        <div className="aeropub-table-wrapper">
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-indigo">
                <th className="table-head-cell">ID</th>
                <th className="table-head-cell">Nom du Paramètre</th>
                <th className="table-head-cell">Valeur</th>
                <th className="table-head-cell" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parametrages.map((p) => (
                <tr key={p.id} className="table-body-row">
                  <td className="cell-muted">#{p.id}</td>
                  <td className="cell-bold-white">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sliders size={14} style={{ color: '#06b6d4' }} />
                      {p.nom_parametre}
                    </span>
                  </td>

                  {/* Cellule Valeur (Éditable en ligne) */}
                  <td className="cell-cyan">
                    {editingId === p.id ? (
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

                  {/* Actions */}
                  <td className="table-body-cell" style={{ textAlign: 'right' }}>
                    {editingId === p.id ? (
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleUpdate(p.id, p.nom_parametre)}
                          style={{ color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', cursor: 'pointer' }}
                          title="Valider"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{ color: '#9ca3af', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}
                          title="Annuler"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => startEdit(p)}
                          style={{ color: '#6366f1', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', cursor: 'pointer' }}
                          title="Modifier la valeur"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(p.id, p.nom_parametre)}
                          style={{ color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', cursor: 'pointer' }}
                          title="Supprimer ce paramètre"
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
    </section>
  );
}
