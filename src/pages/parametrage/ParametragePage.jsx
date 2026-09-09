import React, { useState, useEffect } from 'react';
import { parametragesApi, typeEtatSupportApi, typeStatutAbonnementApi } from '../../api';
import { Sliders, PlusCircle, Trash2, Edit3, Check, X, RefreshCw, Tag, FileText, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ParametragePage() {
  const [activeTab, setActiveTab] = useState('params'); // 'params' | 'etats' | 'statuts'

  // =========================================================================
  // 1. ÉTATS : PARAMÈTRES GÉNÉRAUX (Table Parametrage)
  // =========================================================================
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
      setParametrages(data || []);
    } catch (err) {
      console.error('Erreur chargement paramètres:', err);
      toast.error('❌ Impossible de charger les paramètres.');
    } finally {
      setLoadingParams(false);
    }
  };

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

  // =========================================================================
  // 2. ÉTATS : TYPES D'ÉTATS DES SUPPORTS (Table Type_Etat_Support)
  // =========================================================================
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
      setTypesEtats(data || []);
    } catch (err) {
      console.error('Erreur chargement types états:', err);
      toast.error('❌ Impossible de charger les états des supports.');
    } finally {
      setLoadingEtats(false);
    }
  };

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

  // =========================================================================
  // 3. ÉTATS : TYPES DE STATUTS DES ABONNEMENTS (Table Type_Statut_Abonnement)
  // =========================================================================
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
      setTypesStatuts(data || []);
    } catch (err) {
      console.error('Erreur chargement types statuts:', err);
      toast.error('❌ Impossible de charger les statuts d\'abonnement.');
    } finally {
      setLoadingStatuts(false);
    }
  };

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

  // Chargement initial
  useEffect(() => {
    fetchParametrages();
    fetchTypesEtats();
    fetchTypesStatuts();
  }, []);

  const refreshActive = () => {
    if (activeTab === 'params') fetchParametrages();
    else if (activeTab === 'etats') fetchTypesEtats();
    else if (activeTab === 'statuts') fetchTypesStatuts();
  };

  // Helper pour badges colorés
  const getBadgeClass = (nom) => {
    const val = String(nom || '').toLowerCase();
    if (val.includes('disponible') || val.includes('actif')) return 'badge-active';
    if (val.includes('réservé') || val.includes('attente') || val.includes('bientôt')) return 'badge-warning';
    if (val.includes('occupé') || val.includes('expiré') || val.includes('résilié') || val.includes('indisponible')) return 'badge-expired';
    return 'badge-neutral';
  };

  return (
    <section className="glass-panel dashboard-panel">
      {/* En-tête de la page */}
      <div className="dashboard-header-box" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 className="dashboard-title">
            ⚙️ Paramétrage du <span className="gradient-text">Système AeroPub</span>
          </h2>
          <p className="dashboard-desc">
            Administrez les paramètres globaux, les états des supports et les statuts des abonnements.
          </p>
        </div>

        <button 
          onClick={refreshActive} 
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={16} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Barre d'onglets de navigation */}
      <div className="category-pills" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`pill-btn ${activeTab === 'params' ? 'active' : ''}`}
          onClick={() => setActiveTab('params')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Sliders size={15} />
          <span>Paramètres Généraux</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({parametrages.length})</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeTab === 'etats' ? 'active' : ''}`}
          onClick={() => setActiveTab('etats')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Tag size={15} />
          <span>États des Supports</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({typesEtats.length})</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeTab === 'statuts' ? 'active' : ''}`}
          onClick={() => setActiveTab('statuts')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileText size={15} />
          <span>Statuts des Abonnements</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({typesStatuts.length})</span>
        </button>
      </div>

      {/* =========================================================================
          CONTENU ONGLET 1 : PARAMÈTRES GÉNÉRAUX
          ========================================================================= */}
      {activeTab === 'params' && (
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

          {/* Tableau */}
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
      )}

      {/* =========================================================================
          CONTENU ONGLET 2 : TYPES D'ÉTATS DES SUPPORTS (Type_Etat_Support)
          ========================================================================= */}
      {activeTab === 'etats' && (
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
      )}

      {/* =========================================================================
          CONTENU ONGLET 3 : TYPES DE STATUTS DES ABONNEMENTS (Type_Statut_Abonnement)
          ========================================================================= */}
      {activeTab === 'statuts' && (
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
      )}
    </section>
  );
}
