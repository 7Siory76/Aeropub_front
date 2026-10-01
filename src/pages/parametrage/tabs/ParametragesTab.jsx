import React, { useState, useEffect } from 'react';
import { parametragesApi } from '../../../api';
import { Sliders, PlusCircle, Trash2, Edit3, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ParametragesTab({ onCountChange }) {
  const [parametrages, setParametrages] = useState([]);
  const [loadingParams, setLoadingParams] = useState(true);
  const [nomParametre, setNomParametre] = useState('');
  const [valeur, setValeur] = useState('');
  const [isSubmittingParam, setIsSubmittingParam] = useState(false);
  const [editingParamId, setEditingParamId] = useState(null);
  const [editValeur, setEditValeur] = useState('');

  const fetchParametrages = async () => {
    setLoadingParams(true);
    try {
      const data = await parametragesApi.getAll();
      const list = data || [];
      setParametrages(list);
      if (onCountChange) onCountChange(list.length);
    } catch (err) {
      console.error('Erreur chargement paramètres:', err);
      toast.error('❌ Impossible de charger les paramètres.');
    } finally {
      setLoadingParams(false);
    }
  };

  useEffect(() => {
    fetchParametrages();
  }, []);

  const handleCreateParam = async (e) => {
    e.preventDefault();
    if (!nomParametre.trim() || !valeur.trim()) {
      toast.error('❌ Veuillez remplir le nom du paramètre et sa valeur.');
      return;
    }
    setIsSubmittingParam(true);
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
      toast.error(`❌ ${err.response?.data?.message || 'Erreur lors de la création du paramètre.'}`);
    } finally {
      setIsSubmittingParam(false);
    }
  };

  const handleUpdateParam = async (id, nomParam) => {
    if (!editValeur.trim()) {
      toast.error('❌ La valeur ne peut pas être vide.');
      return;
    }
    try {
      await parametragesApi.update(id, { valeur: editValeur.trim() });
      toast.success(`✅ Paramètre « ${nomParam} » mis à jour !`);
      setEditingParamId(null);
      fetchParametrages();
    } catch (err) {
      console.error(err);
      toast.error('❌ Erreur lors de la mise à jour.');
    }
  };

  const handleDeleteParam = async (id, nomParam) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le paramètre « ${nomParam} » ?`)) return;
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
              <PlusCircle size={16} />
              <span>{isSubmittingParam ? 'Ajout...' : 'Ajouter Paramètre'}</span>
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
                          style={{ color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', cursor: 'pointer' }}
                          title="Valider"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => { setEditingParamId(null); setEditValeur(''); }}
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
                          style={{ color: '#6366f1', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', cursor: 'pointer' }}
                          title="Modifier"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteParam(p.id, p.nom_parametre)}
                          style={{ color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', cursor: 'pointer' }}
                          title="Supprimer"
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
