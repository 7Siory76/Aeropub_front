import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Calendar, User, Search, RotateCcw, Filter, Send, Settings, Mail, Check, X, Loader2 } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import { useAuth } from '../../../context/AuthContext';
import { hasRole } from '../../../utils/rbac';
import { toast } from 'react-toastify';
import { actionsCommercialesApi } from '../../../api/actionsCommercialesApi';
import { modeleCourrielApi } from '../../../api/modeleCourrielApi';

export default function ActionsCommercialesTab({
  actions = [],
  abonnements = [],
  initialSearchQuery = '',
  onRefresh
}) {
  const { user } = useAuth();

  // Permissions RBAC (Module 3)
  const canSendManualEmail = hasRole(user, ['Admin', 'Resp_Com', 'Commercial']);
  const canEditEmailTemplate = hasRole(user, ['Admin']);

  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedTypeAction, setSelectedTypeAction] = useState('all');
  const [selectedCommercial, setSelectedCommercial] = useState('all');
  const [selectedEmailStatus, setSelectedEmailStatus] = useState('all');
  const [showOnlyJ30, setShowOnlyJ30] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sendingRef, setSendingRef] = useState(null);

  // État du modèle d'email par défaut (Table Modele_Courriel)
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({
    sujet: 'Échéance prochaine de votre contrat publicitaire AEROPUB - {reference}',
    corps: `Bonjour {destNom},\n\nNous vous informons que votre contrat n° {reference}, relatif au(x) support(s) {supports}, arrivera à échéance dans {diffJours} jour(s), le {dateFr}.\n\nVotre interlocuteur AEROPUB ({interlocuteur}) prendra contact avec vous afin d'étudier son renouvellement.\n\nBien cordialement,\nL'équipe commerciale AEROPUB`
  });

  const fetchTemplate = async () => {
    try {
      setLoadingTemplate(true);
      const data = await modeleCourrielApi.getByCode('RELANCE_ECHEANCE');
      if (data) {
        setEmailTemplate({
          sujet: data.sujet || '',
          corps: data.corps || ''
        });
      }
    } catch (err) {
      console.warn('Impossible de charger le modèle depuis la base :', err.message);
    } finally {
      setLoadingTemplate(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, []);

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setSavingTemplate(true);
    try {
      await modeleCourrielApi.updateByCode('RELANCE_ECHEANCE', {
        sujet: emailTemplate.sujet,
        corps: emailTemplate.corps
      });
      toast.success('Modèle de courriel mis à jour avec succès dans la base de données !');
      setShowTemplateModal(false);
    } catch (err) {
      toast.error(`Erreur lors de la sauvegarde : ${err.response?.data?.message || err.message}`);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSendManualEmail = async (targetInfo) => {
    const ref = targetInfo.reference || targetInfo.id_abonnement;
    const client = targetInfo.nom_client || targetInfo.raison_sociale || 'Client';

    if (!ref) {
      toast.warning("Impossible d'envoyer la relance : aucun contrat n'est associé à cette action.");
      return;
    }

    // 1. Alerte de confirmation préalable avant envoi
    const confirmation = window.confirm(
      `⚠️ Confirmation d'envoi de relance\n\nÊtes-vous sûr de vouloir envoyer un courriel de relance pour le contrat "${ref}" au client "${client}" ?`
    );

    if (!confirmation) {
      return; // L'utilisateur annule
    }

    setSendingRef(ref);
    const toastId = toast.loading(`Envoi du courriel de relance pour ${ref} en cours...`);

    try {
      const res = await actionsCommercialesApi.envoyerRelanceManuelle(ref, user?.id);
      toast.success(res?.message || `✉️ Courriel de relance envoyé avec succès pour ${ref} (${client}) !`, { id: toastId });
      if (onRefresh) onRefresh();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Erreur lors de l'envoi du courriel.";
      toast.error(`❌ Échec de l'envoi : ${errorMsg}`, { id: toastId });
    } finally {
      setSendingRef(null);
    }
  };

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTypeAction, selectedCommercial, selectedEmailStatus, showOnlyJ30]);

  // Calcul des contrats à échéance J-30 (alerte renouvellement)
  // Recuperation des references de contrats deja renouveles (ceux ayant un contrat enfant)
  const renewedParentRefs = useMemo(() => {
    const set = new Set();
    abonnements.forEach((c) => {
      if (c.id_abonnement_precedent) {
        set.add(String(c.id_abonnement_precedent).trim());
      }
    });
    return set;
  }, [abonnements]);

  const now = new Date();
  const alertJ30Abos = useMemo(() => {
    return abonnements.filter((abo) => {
      if (!abo.date_echeance && !abo.date_fin) return false;

      const ref = String(abo.reference || '').trim();
      const statut = String(abo.statut || abo.nom_statut || '').toLowerCase();

      if (['renouvelé', 'expiré', 'résilié', 'archivé'].includes(statut)) {
        return false;
      }
      if (renewedParentRefs.has(ref)) {
        return false;
      }
      const echeance = new Date(abo.date_echeance || abo.date_fin);
      const diffDays = Math.ceil((echeance.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 30;
    });
  }, [abonnements, renewedParentRefs])

  const typeActionOptions = useMemo(() => {
    const types = [...new Set(actions.map(a => a.type_action).filter(Boolean))];
    return types.sort();
  }, [actions]);

  const commercialOptions = useMemo(() => {
    const coms = [...new Set(actions.map(a => a.nom_commercial).filter(Boolean))];
    return coms.sort();
  }, [actions]);

  const emailStatusOptions = useMemo(() => {
    const s = [...new Set(actions.map(a => a.statut_envoi_email).filter(Boolean))];
    return s.sort();
  }, [actions]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedTypeAction !== 'all' ||
    selectedCommercial !== 'all' ||
    selectedEmailStatus !== 'all' ||
    showOnlyJ30;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTypeAction('all');
    setSelectedCommercial('all');
    setSelectedEmailStatus('all');
    setShowOnlyJ30(false);
    setCurrentPage(1);
  };

  const filteredActions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return actions.filter((act) => {
      // 1. Recherche textuelle
      if (q) {
        const match =
          (act.nom_client || '').toLowerCase().includes(q) ||
          (act.id_abonnement || '').toLowerCase().includes(q) ||
          (act.nom_commercial || '').toLowerCase().includes(q) ||
          (act.type_action || '').toLowerCase().includes(q) ||
          (act.description || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Type d'action
      if (selectedTypeAction !== 'all') {
        if ((act.type_action || '').toLowerCase() !== selectedTypeAction.toLowerCase()) {
          return false;
        }
      }

      // 3. Commercial
      if (selectedCommercial !== 'all') {
        if ((act.nom_commercial || '').toLowerCase() !== selectedCommercial.toLowerCase()) {
          return false;
        }
      }

      // 4. Statut Email
      if (selectedEmailStatus !== 'all') {
        if ((act.statut_envoi_email || '').toLowerCase() !== selectedEmailStatus.toLowerCase()) {
          return false;
        }
      }

      // 5. J-30 uniquement (lié à un contrat en J-30)
      if (showOnlyJ30) {
        const isJ30 = alertJ30Abos.some(
          a => a.reference === act.id_abonnement ||
            a.nom_client === act.nom_client ||
            a.raison_sociale === act.nom_client
        );
        if (!isJ30) return false;
      }

      return true;
    });
  }, [actions, alertJ30Abos, searchTerm, selectedTypeAction, selectedCommercial, selectedEmailStatus, showOnlyJ30]);

  const paginatedActions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActions.slice(start, start + pageSize);
  }, [filteredActions, currentPage, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Alerte J-30 pour les contrats approchant de leur terme */}
      <div className="glass-panel" style={{
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        border: '1px solid rgba(250, 204, 21, 0.4)',
        background: 'rgba(250, 204, 21, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={18} style={{ color: 'var(--accent-secondary)' }} />
            <h4 style={{ margin: 0, color: 'var(--accent-secondary)', fontSize: '1rem', fontWeight: 700 }}>
              Alertes Relance J-30 ({alertJ30Abos.length} contrat(s) en échéance proche)
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Bouton Modifier le modèle du courriel par défaut (Module 3 : Admin seul) */}
            {canEditEmailTemplate && (
              <button
                type="button"
                className="pill-btn"
                style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setShowTemplateModal(true)}
                title="Modifier le modèle du courriel par défaut (Réservé Admin)"
              >
                <Settings size={13} />
                <span>Modifier modèle courriel</span>
              </button>
            )}

            <button
              type="button"
              className={`pill-btn ${showOnlyJ30 ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem' }}
              onClick={() => setShowOnlyJ30(!showOnlyJ30)}
            >
              {showOnlyJ30 ? '✓ Filtré sur J-30' : 'Filtrer actions sur J-30'}
            </button>
          </div>
        </div>

        {alertJ30Abos.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Aucun contrat à renouveler sous les 30 prochains jours.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.6rem' }}>
            {alertJ30Abos.map((abo) => (
              <div key={abo.reference} style={{
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>{abo.reference}</strong> - <span>{abo.nom_client || abo.raison_sociale}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)' }}>
                  Échéance : {new Date(abo.date_echeance || abo.date_fin).toLocaleDateString('fr-FR')} (Probabilité : {abo.probabilite_renouvellement || 80}%)
                </div>
                {/* Bouton Envoyer/Renvoyer l'e-mail de relance manuel (Module 3 : Admin, Resp_Com, Commercial) */}
                {canSendManualEmail && (
                  <button
                    type="button"
                    className="pill-btn active"
                    style={{ fontSize: '0.74rem', padding: '0.2rem 0.55rem', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}
                    onClick={() => handleSendManualEmail(abo)}
                    disabled={sendingRef === abo.reference}
                    title="Envoyer l'e-mail de relance manuel au client"
                  >
                    {sendingRef === abo.reference ? <Loader2 size={11} className="spin" /> : <Send size={11} />}
                    <span>{sendingRef === abo.reference ? 'Envoi en cours...' : 'Envoyer relance manuelle'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique des Actions Commerciales */}
      <div>
        <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 600 }}>
          Historique des Actions Commerciales
        </h4>

        {/* Barre de Filtres Multicritères */}
        <div className="ts-filters-bar">
          <div className="ts-filter-group">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="ts-filter-input"
              placeholder="Rechercher (Client, contrat...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>

          <div className="ts-filter-group">
            <span>Action :</span>
            <select
              className="ts-filter-select"
              value={selectedTypeAction}
              onChange={(e) => setSelectedTypeAction(e.target.value)}
            >
              <option value="all">Toutes actions</option>
              {typeActionOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="ts-filter-group">
            <span>Commercial :</span>
            <select
              className="ts-filter-select"
              value={selectedCommercial}
              onChange={(e) => setSelectedCommercial(e.target.value)}
            >
              <option value="all">Tous 👤</option>
              {commercialOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="ts-filter-group">
            <span>Email :</span>
            <select
              className="ts-filter-select"
              value={selectedEmailStatus}
              onChange={(e) => setSelectedEmailStatus(e.target.value)}
            >
              <option value="all">Tous statuts</option>
              {emailStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
            {filteredActions.length} / {actions.length} action{actions.length > 1 ? 's' : ''}
          </div>
        </div>

        {filteredActions.length === 0 ? (
          <p className="empty-msg">Aucune action commerciale ne correspond à ces critères.</p>
        ) : (
          <div className="aeropub-table-wrapper">
            <table className="aeropub-table">
              <thead>
                <tr className="table-head-row-indigo">
                  <th className="table-head-cell">Date</th>
                  <th className="table-head-cell">Type d'Action</th>
                  <th className="table-head-cell">Client & Contrat</th>
                  <th className="table-head-cell">Commercial</th>
                  <th className="table-head-cell">Description</th>
                  <th className="table-head-cell" style={{ textAlign: 'center' }}>Statut Email</th>
                  {canSendManualEmail && <th className="table-head-cell" style={{ textAlign: 'center' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedActions.map((act) => (
                  <tr key={act.id} className="table-body-row">
                    <td className="cell-muted" style={{ whiteSpace: 'nowrap' }}>
                      <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {new Date(act.date_action).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="cell-cyan">
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        fontWeight: 600
                      }}>
                        {act.type_action || 'Relance'}
                      </span>
                    </td>
                    <td className="cell-bold-white">
                      <div>{act.nom_client || (act.id_client ? `Client #${act.id_client}` : 'Général')}</div>
                      {act.id_abonnement && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Réf: {act.id_abonnement}
                        </div>
                      )}
                    </td>
                    <td className="cell-muted">
                      <User size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {act.nom_commercial || `Utilisateur #${act.id_utilisateur}`}
                    </td>
                    <td className="table-body-cell" style={{ maxWidth: '280px' }}>
                      {act.description || 'Aucun détail'}
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'center' }}>
                      <span className={`wireframe-badge ${act.statut_envoi_email === 'Envoyé' ? 'badge-available' : 'badge-occupied'}`}>
                        {act.statut_envoi_email || 'En attente'}
                      </span>
                    </td>
                    {canSendManualEmail && (
                      <td className="table-body-cell" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="pill-btn"
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            opacity: (!act.id_abonnement && !act.reference) ? 0.45 : 1
                          }}
                          onClick={() => handleSendManualEmail(act)}
                          disabled={(!act.id_abonnement && !act.reference) || sendingRef === (act.id_abonnement || act.reference)}
                          title={(!act.id_abonnement && !act.reference) ? "Aucun contrat associé à cette action" : "Renvoyer l'e-mail de relance manuel"}
                        >
                          {sendingRef === (act.id_abonnement || act.reference) ? <Loader2 size={11} className="spin" /> : <Send size={11} />}
                          <span>Renvoyer</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination pour les actions commerciales */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredActions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Modal Modification du Modèle de Courriel par défaut (Admin seul) */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '550px',
            width: '100%',
            padding: '1.75rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            background: 'var(--bg-secondary, #1e293b)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={20} style={{ color: 'var(--accent-secondary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  Modifier le modèle de courriel par défaut
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Objet / Sujet du courriel :
                </label>
                <input
                  type="text"
                  value={emailTemplate.sujet}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, sujet: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Corps du message :
                </label>
                <textarea
                  rows={7}
                  value={emailTemplate.corps}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, corps: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Guide des variables dynamiques */}
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontSize: '0.78rem'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-secondary, #38bdf8)', marginBottom: '0.35rem' }}>
                  💡 Variables dynamiques (remplacées automatiquement à l'envoi) :
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {[
                    { tag: '{destNom}', desc: 'Nom du destinataire / client' },
                    { tag: '{reference}', desc: 'Réf contrat' },
                    { tag: '{supports}', desc: 'Supports' },
                    { tag: '{diffJours}', desc: 'Jours restants' },
                    { tag: '{dateFr}', desc: 'Date d\'échéance' },
                    { tag: '{interlocuteur}', desc: 'Commercial' },
                  ].map(({ tag, desc }) => (
                    <code
                      key={tag}
                      style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        color: '#93c5fd',
                        border: '1px solid rgba(147, 197, 253, 0.3)',
                        cursor: 'pointer'
                      }}
                      title={`${desc} - Cliquer pour insérer à la fin du message`}
                      onClick={() => setEmailTemplate(prev => ({ ...prev, corps: prev.corps + ' ' + tag }))}
                    >
                      {tag}
                    </code>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="pill-btn"
                  onClick={() => setShowTemplateModal(false)}
                  disabled={savingTemplate}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="pill-btn active"
                  disabled={savingTemplate}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {savingTemplate ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                  <span>{savingTemplate ? 'Enregistrement...' : 'Enregistrer le modèle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
