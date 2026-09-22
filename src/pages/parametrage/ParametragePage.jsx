import React, { useState, useEffect, useMemo } from 'react';
import { parametragesApi, typeEtatSupportApi, typeStatutAbonnementApi, journalNotificationApi } from '../../api';
import { Sliders, PlusCircle, Trash2, Edit3, Check, X, RefreshCw, Tag, FileText, CheckCircle2, Clock, ScrollText, Eye, CheckCheck, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { hasRole } from '../../utils/rbac';

export default function ParametragePage({ initialTab = 'params' }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'params' | 'etats' | 'statuts' | 'audit'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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

  // =========================================================================
  // 4. ÉTATS : JOURNAL TECHNIQUE & AUDIT LOG (Table Journal_Notification)
  // =========================================================================
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditCategory, setAuditCategory] = useState('TOUTES');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditNonLu, setAuditNonLu] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const data = await journalNotificationApi.getAll(auditCategory, auditNonLu);
      setAuditLogs(data || []);
    } catch (err) {
      console.error('Erreur chargement journal audit:', err);
      toast.error('❌ Impossible de charger le journal technique.');
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await journalNotificationApi.markAsRead(id);
      setAuditLogs(prev => prev.map(l => l.id === id ? { ...l, lu_par_admin: true } : l));
      toast.success('Action marquée comme lue.');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await journalNotificationApi.markAllAsRead();
      setAuditLogs(prev => prev.map(l => ({ ...l, lu_par_admin: true })));
      toast.success('Toutes les actions ont été marquées comme lues.');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchParametrages();
    fetchTypesEtats();
    fetchTypesStatuts();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [auditCategory, auditNonLu]);

  const refreshActive = () => {
    if (activeTab === 'params') fetchParametrages();
    else if (activeTab === 'etats') fetchTypesEtats();
    else if (activeTab === 'statuts') fetchTypesStatuts();
    else if (activeTab === 'audit') fetchAuditLogs();
  };

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter(log => {
      if (!q) return true;
      return (
        (log.message_notification || '').toLowerCase().includes(q) ||
        (log.nom_utilisateur || '').toLowerCase().includes(q) ||
        (log.reference_entite || '').toLowerCase().includes(q) ||
        (log.entite_concernee || '').toLowerCase().includes(q) ||
        (log.categorie_action || '').toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditSearch]);

  const getAuditCategoryBadge = (cat) => {
    const c = String(cat || '').toUpperCase();
    if (c.includes('CREATION')) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    if (c.includes('MODIF')) return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
    if (c.includes('SUPPR') || c.includes('RESIL')) return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
    if (c.includes('RENOUV') || c.includes('ALERT')) return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
    return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' };
  };

  // Helper pour badges colorés
  const getBadgeClass = (nom) => {
    const val = String(nom || '').toLowerCase();
    if (val.includes('disponible') || val.includes('actif')) return 'badge-active';
    if (val.includes('réservé') || val.includes('attente') || val.includes('bientôt')) return 'badge-warning';
    if (val.includes('occupé') || val.includes('expiré') || val.includes('résilié') || val.includes('indisponible')) return 'badge-expired';
    return 'badge-neutral';
  };

  if (!hasRole(user, ['Admin'])) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', margin: '2rem auto', maxWidth: '600px', borderRadius: '16px' }}>
        <h3 style={{ color: '#ef4444', fontSize: '1.4rem', marginBottom: '0.75rem' }}>⛔ Accès Refusé</h3>
        <p style={{ color: 'var(--text-muted)' }}>Le module d'Administration & Paramétrage est strictement réservé aux administrateurs.</p>
      </div>
    );
  }

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

        <button
          type="button"
          className={`pill-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ScrollText size={15} />
          <span>Journal & Audit Log</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({auditLogs.length})</span>
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

      {/* =========================================================================
          CONTENU ONGLET 4 : JOURNAL TECHNIQUE & AUDIT LOG (Module 5 : Admin seul)
          ========================================================================= */}
      {activeTab === 'audit' && (
        <>
          {/* Barre d'outils et de filtres pour l'audit log */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '1.25rem',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ScrollText size={18} style={{ color: 'var(--accent-secondary)' }} />
                  Journal Technique & Piste d'Audit
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Traçabilité complète des actions : créations de contrats, modifications de statuts, ajouts de clients et relances.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleMarkAllAsRead}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <CheckCheck size={15} />
                  <span>Tout marquer comme lu</span>
                </button>
              </div>
            </div>

            {/* Filtres de recherche */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <div className="ts-filter-group">
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="ts-filter-input"
                  placeholder="Rechercher dans le journal..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  style={{ width: '220px' }}
                />
              </div>

              <div className="ts-filter-group">
                <span>Catégorie :</span>
                <select
                  className="ts-filter-select"
                  value={auditCategory}
                  onChange={(e) => setAuditCategory(e.target.value)}
                >
                  <option value="TOUTES">Toutes catégories</option>
                  <option value="CREATION">Création</option>
                  <option value="MODIFICATION">Modification</option>
                  <option value="SUPPRESSION">Suppression</option>
                  <option value="RENOUVELLEMENT">Renouvellement</option>
                  <option value="IMPORT">Importation</option>
                </select>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={auditNonLu}
                  onChange={(e) => setAuditNonLu(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Non lues uniquement</span>
              </label>

              <div className="ts-filter-badge-count" style={{ marginLeft: 'auto' }}>
                {filteredAuditLogs.length} entrée{filteredAuditLogs.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Tableau d'Audit Log */}
          {loadingAudit ? (
            <div className="loading-container">
              <RefreshCw size={28} className="spinner-icon" />
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Chargement de l'audit log...</p>
            </div>
          ) : filteredAuditLogs.length === 0 ? (
            <div className="empty-msg">Aucune entrée d'audit enregistrée correspondant à ces critères.</div>
          ) : (
            <div className="aeropub-table-wrapper">
              <table className="aeropub-table">
                <thead>
                  <tr className="table-head-row-indigo">
                    <th className="table-head-cell" style={{ width: '130px' }}>Date & Heure</th>
                    <th className="table-head-cell" style={{ width: '120px' }}>Catégorie</th>
                    <th className="table-head-cell">Entité / Réf</th>
                    <th className="table-head-cell">Auteur</th>
                    <th className="table-head-cell">Message d'audit</th>
                    <th className="table-head-cell" style={{ textAlign: 'center', width: '90px' }}>Détails</th>
                    <th className="table-head-cell" style={{ textAlign: 'center', width: '110px' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map((log) => {
                    const badgeStyle = getAuditCategoryBadge(log.categorie_action);
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="table-body-row" style={{ opacity: log.lu_par_admin ? 0.85 : 1 }}>
                          <td className="cell-muted" style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {log.date_action ? new Date(log.date_action).toLocaleString('fr-FR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            }) : '-'}
                          </td>
                          <td className="table-body-cell">
                            <span style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              background: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: badgeStyle.border,
                              fontWeight: 600,
                              fontSize: '0.78rem'
                            }}>
                              {log.categorie_action || 'ACTION'}
                            </span>
                          </td>
                          <td className="cell-bold-white">
                            <div>{log.entite_concernee || 'SYSTÈME'}</div>
                            {log.reference_entite && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Réf : {log.reference_entite}
                              </div>
                            )}
                          </td>
                          <td className="cell-muted" style={{ fontSize: '0.84rem' }}>
                            {log.nom_utilisateur || (log.id_utilisateur ? `Utilisateur #${log.id_utilisateur}` : 'Système')}
                          </td>
                          <td className="table-body-cell" style={{ fontSize: '0.85rem' }}>
                            {log.message_notification}
                          </td>
                          <td className="table-body-cell" style={{ textAlign: 'center' }}>
                            {log.valeur_apres ? (
                              <button
                                type="button"
                                className="pill-btn"
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                title="Voir les données payload"
                              >
                                <Eye size={12} style={{ marginRight: '3px' }} />
                                <span>{isExpanded ? 'Masquer' : 'Voir'}</span>
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                            )}
                          </td>
                          <td className="table-body-cell" style={{ textAlign: 'center' }}>
                            {log.lu_par_admin ? (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Lu</span>
                            ) : (
                              <button
                                type="button"
                                className="pill-btn active"
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                                onClick={() => handleMarkAsRead(log.id)}
                                title="Marquer comme lu"
                              >
                                Marquer lu
                              </button>
                            )}
                          </td>
                        </tr>

                        {isExpanded && log.valeur_apres && (
                          <tr style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                            <td colSpan={7} style={{ padding: '0.75rem 1.25rem' }}>
                              <div style={{
                                background: 'rgba(0, 0, 0, 0.35)',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                fontSize: '0.8rem',
                                fontFamily: 'monospace',
                                color: '#a5f3fc',
                                overflowX: 'auto',
                                maxHeight: '180px'
                              }}>
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                  {typeof log.valeur_apres === 'string'
                                    ? JSON.stringify(JSON.parse(log.valeur_apres), null, 2)
                                    : JSON.stringify(log.valeur_apres, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
