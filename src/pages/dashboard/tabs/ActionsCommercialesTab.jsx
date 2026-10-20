import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Calendar, User, Search, RotateCcw, Filter, Send, Settings, Mail, Check, X, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import { useAuth } from '../../../context/AuthContext';
import { hasRole } from '../../../utils/rbac';
import { useFeedback } from '../../../context/FeedbackContext';
import { sanitizeUserError } from '../../../utils/errorHandler';
import { actionsCommercialesApi } from '../../../api/actionsCommercialesApi';
import { modeleCourrielApi } from '../../../api/modeleCourrielApi';
import PreavisReconductionSection from '../components/PreavisReconductionSection';

export default function ActionsCommercialesTab({
  actions = [],
  abonnements = [],
  initialSearchQuery = '',
  onRefresh
}) {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useFeedback();

  // Permissions RBAC (Module 3)
  const canSendManualEmail = hasRole(user, ['Admin', 'Resp_Com', 'Commercial']);
  const canEditEmailTemplate = hasRole(user, ['Admin']);

  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedTypeAction, setSelectedTypeAction] = useState('all');
  const [selectedCommercial, setSelectedCommercial] = useState('all');
  const [selectedEmailStatus, setSelectedEmailStatus] = useState('all');
  const [showOnlyJ30, setShowOnlyJ30] = useState(false);
  const [alertSectionTab, setAlertSectionTab] = useState('preavis'); // 'preavis' ou 'j30'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('date_action');
  const [sortDirection, setSortDirection] = useState('desc');
  const [sendingRef, setSendingRef] = useState(null);

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

  // État des modèles d'email (Table Modele_Courriel)
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('PREAVIS_RECONDUCTION');
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({
    sujet: '',
    corps: ''
  });

  const fetchTemplate = async (code = selectedTemplateCode) => {
    try {
      setLoadingTemplate(true);
      const data = await modeleCourrielApi.getByCode(code);
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
    if (showTemplateModal) {
      fetchTemplate(selectedTemplateCode);
    }
  }, [showTemplateModal, selectedTemplateCode]);

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setSavingTemplate(true);
    try {
      await modeleCourrielApi.updateByCode(selectedTemplateCode, {
        sujet: emailTemplate.sujet,
        corps: emailTemplate.corps
      });
      showSuccess(`Modèle "${selectedTemplateCode === 'PREAVIS_RECONDUCTION' ? 'Préavis de reconduction' : 'Relance d\'échéance'}" mis à jour avec succès !`);
      setShowTemplateModal(false);
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la sauvegarde du modèle.');
      showError(msg);
    } finally {
      setSavingTemplate(false);
    }
  };

  // Envoi relance manuelle (Contrats standards J-30)
  const handleSendManualEmail = async (targetInfo) => {
    const ref = targetInfo.reference || targetInfo.id_abonnement;
    const client = targetInfo.nom_client || targetInfo.raison_sociale || 'Client';

    if (!ref) {
      showInfo("Impossible d'envoyer la relance : aucun contrat n'est associé à cette action.");
      return;
    }

    const confirmation = window.confirm(
      `Confirmation d'envoi de relance d'échéance\n\nÊtes-vous sûr de vouloir envoyer un courriel de relance pour le contrat "${ref}" au client "${client}" ?`
    );

    if (!confirmation) {
      return;
    }

    setSendingRef(ref);

    try {
      const res = await actionsCommercialesApi.envoyerRelanceManuelle(ref, user?.id);
      showSuccess(res?.message || `Courriel de relance envoyé avec succès pour ${ref} (${client}).`);
      if (onRefresh) onRefresh();
    } catch (err) {
      const errorMsg = sanitizeUserError(err, "Erreur lors de l'envoi du courriel.");
      showError(`Échec de l'envoi : ${errorMsg}`);
    } finally {
      setSendingRef(null);
    }
  };

  // Envoi préavis de résiliation / reconduction (Contrats reconduction tacite)
  const handleSendPreavisEmail = async (targetInfo) => {
    const ref = targetInfo.reference || targetInfo.id_abonnement;
    const client = targetInfo.nom_client || targetInfo.raison_sociale || 'Client';

    if (!ref) {
      showInfo("Impossible d'envoyer le préavis : aucun contrat n'est associé à cette action.");
      return;
    }

    const confirmation = window.confirm(
      `Confirmation d'envoi du préavis de reconduction tacite\n\nÊtes-vous sûr de vouloir envoyer le courriel de préavis pour le contrat "${ref}" au client "${client}" ?\n\nCe courriel informera le client de son délai de résiliation contractuel avant reconduction automatique.`
    );

    if (!confirmation) {
      return;
    }

    setSendingRef(ref);

    try {
      const res = await actionsCommercialesApi.envoyerPreavisReconduction(ref, user?.id);
      showSuccess(res?.message || `Courriel de préavis envoyé avec succès pour ${ref} (${client}).`);
      if (onRefresh) onRefresh();
    } catch (err) {
      const errorMsg = sanitizeUserError(err, "Erreur lors de l'envoi du préavis.");
      showError(`Échec de l'envoi : ${errorMsg}`);
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

  // 1. Contrats avec clause de Reconduction Tacite arrivant au préavis
  const alertPreavisAbos = useMemo(() => {
    return abonnements.filter((abo) => {
      // a. Clause tacite activée
      const isTacite = abo.reconduction_tacite === true || abo.reconduction_tacite === 'true' || abo.reconduction_tacite === 1;
      if (!isTacite) return false;

      // b. Statut ACTIF uniquement
      const statut = String(abo.statut || abo.nom_statut || abo.statut_abonnement || '').toLowerCase();
      if (statut !== 'actif') return false;

      // c. Aucun renouvellement existant
      const ref = String(abo.reference || '').trim();
      if (renewedParentRefs.has(ref) || abo.a_renouvellement) return false;

      // d. Échéance future
      if (!abo.date_echeance && !abo.date_fin) return false;
      const echeance = new Date(abo.date_echeance || abo.date_fin);
      const diffDaysEcheance = Math.ceil((echeance.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDaysEcheance <= 0) return false;

      // e. Calcul préavis
      const preavisJours = parseInt(abo.preavis_jours, 10) || 30;
      const dateLimitePreavis = new Date(echeance.getTime() - preavisJours * 24 * 3600 * 1000);
      const diffDaysPreavis = Math.ceil((dateLimitePreavis.getTime() - now.getTime()) / (1000 * 3600 * 24));

      // Afficher si le contrat approche du préavis (30 jours avant le préavis, et tout au long du préavis jusqu'à l'échéance)
      return diffDaysPreavis <= 30;
    }).map((abo) => {
      const echeance = new Date(abo.date_echeance || abo.date_fin);
      const preavisJours = parseInt(abo.preavis_jours, 10) || 30;
      const dateLimitePreavis = new Date(echeance.getTime() - preavisJours * 24 * 3600 * 1000);
      const diffDaysPreavis = Math.ceil((dateLimitePreavis.getTime() - now.getTime()) / (1000 * 3600 * 24));
      const diffDaysEcheance = Math.ceil((echeance.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return {
        ...abo,
        preavisJours,
        dateLimitePreavis,
        diffDaysPreavis,
        diffDaysEcheance
      };
    });
  }, [abonnements, renewedParentRefs, now]);

  // 2. Contrats standards sans reconduction tacite approchant de leur terme (J-30 classique)
  const alertJ30Abos = useMemo(() => {
    return abonnements.filter((abo) => {
      const isTacite = abo.reconduction_tacite === true || abo.reconduction_tacite === 'true' || abo.reconduction_tacite === 1;
      if (isTacite) return false; // Dédié au préavis

      if (!abo.date_echeance && !abo.date_fin) return false;
      const ref = String(abo.reference || '').trim();
      const statut = String(abo.statut || abo.nom_statut || abo.statut_abonnement || '').toLowerCase();

      if (statut !== 'actif') return false;
      if (renewedParentRefs.has(ref) || abo.a_renouvellement) return false;

      const echeance = new Date(abo.date_echeance || abo.date_fin);
      const diffDays = Math.ceil((echeance.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 30;
    });
  }, [abonnements, renewedParentRefs, now]);

  // 1. Actions spécifiques aux préavis de reconduction tacite (gérées dans la modale PreavisReconductionModal)
  const preavisActions = useMemo(() => {
    return actions.filter(act => {
      const type = (act.type_action || '').toLowerCase();
      const desc = (act.description || '').toLowerCase();
      return type.includes('préavis') || type.includes('preavis') || type.includes('reconduction') ||
             desc.includes('préavis') || desc.includes('preavis') || desc.includes('reconduction tacite');
    });
  }, [actions]);

  // 2. Actions des relances d'échéances et de suivi général (affichées dans la page principale)
  const echeanceActions = useMemo(() => {
    return actions.filter(act => {
      const type = (act.type_action || '').toLowerCase();
      const desc = (act.description || '').toLowerCase();
      const isPreavis = type.includes('préavis') || type.includes('preavis') || type.includes('reconduction') ||
                        desc.includes('préavis') || desc.includes('preavis') || desc.includes('reconduction tacite');
      return !isPreavis;
    });
  }, [actions]);

  const typeActionOptions = useMemo(() => {
    const types = [...new Set(echeanceActions.map(a => a.type_action).filter(Boolean))];
    return types.sort();
  }, [echeanceActions]);

  const commercialOptions = useMemo(() => {
    const coms = [...new Set(echeanceActions.map(a => a.nom_commercial).filter(Boolean))];
    return coms.sort();
  }, [echeanceActions]);

  const emailStatusOptions = useMemo(() => {
    const s = [...new Set(echeanceActions.map(a => a.statut_envoi_email).filter(Boolean))];
    return s.sort();
  }, [echeanceActions]);

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

    return echeanceActions.filter((act) => {
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

      // 5. J-30 uniquement (lié à un contrat en J-30 ou action relance)
      if (showOnlyJ30) {
        const isJ30 = alertJ30Abos.some(
          a => a.reference === act.id_abonnement ||
            a.nom_client === act.nom_client ||
            a.raison_sociale === act.nom_client
        ) || (act.type_action || '').toLowerCase().includes('relance') || (act.type_action || '').toLowerCase().includes('échéance');
        if (!isJ30) return false;
      }

      return true;
    });
  }, [echeanceActions, alertJ30Abos, searchTerm, selectedTypeAction, selectedCommercial, selectedEmailStatus, showOnlyJ30]);

  const sortedActions = useMemo(() => {
    if (!sortField) return filteredActions;
    return [...filteredActions].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'date_action') {
        valA = a.date_action ? new Date(a.date_action).getTime() : 0;
        valB = b.date_action ? new Date(b.date_action).getTime() : 0;
      } else if (sortField === 'type_action') {
        valA = (a.type_action || '').toLowerCase();
        valB = (b.type_action || '').toLowerCase();
      } else if (sortField === 'nom_client') {
        valA = (a.nom_client || '').toLowerCase();
        valB = (b.nom_client || '').toLowerCase();
      } else if (sortField === 'nom_commercial') {
        valA = (a.nom_commercial || '').toLowerCase();
        valB = (b.nom_commercial || '').toLowerCase();
      } else if (sortField === 'description') {
        valA = (a.description || '').toLowerCase();
        valB = (b.description || '').toLowerCase();
      } else if (sortField === 'statut_envoi_email') {
        valA = (a.statut_envoi_email || '').toLowerCase();
        valB = (b.statut_envoi_email || '').toLowerCase();
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const compare = typeof valA === 'string' ? valA.localeCompare(valB, 'fr') : (valA > valB ? 1 : -1);
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [filteredActions, sortField, sortDirection]);

  const paginatedActions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedActions.slice(start, start + pageSize);
  }, [sortedActions, currentPage, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Sélecteur d'onglets pour le suivi des alertes & actions : Côte à côte comme avant */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          className={`pill-btn ${alertSectionTab === 'preavis' ? 'active' : ''}`}
          style={{
            fontSize: '0.85rem',
            padding: '0.45rem 1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            borderColor: alertSectionTab === 'preavis' ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)',
            background: alertSectionTab === 'preavis' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.5)'
          }}
          onClick={() => setAlertSectionTab('preavis')}
        >
          <RotateCcw size={15} style={{ color: '#38bdf8' }} />
          <span style={{ fontWeight: 600 }}>Préavis Reconduction Tacite</span>
          <span style={{
            fontSize: '0.72rem',
            padding: '0.1rem 0.45rem',
            borderRadius: '999px',
            background: alertPreavisAbos.length > 0 ? '#0284c7' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            marginLeft: '0.2rem'
          }}>
            {alertPreavisAbos.length}
          </span>
        </button>

        <button
          type="button"
          className={`pill-btn ${alertSectionTab === 'j30' ? 'active' : ''}`}
          style={{
            fontSize: '0.85rem',
            padding: '0.45rem 1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            borderColor: alertSectionTab === 'j30' ? '#facc15' : 'rgba(250, 204, 21, 0.3)',
            background: alertSectionTab === 'j30' ? 'rgba(250, 204, 21, 0.15)' : 'rgba(15, 23, 42, 0.5)'
          }}
          onClick={() => setAlertSectionTab('j30')}
        >
          <Bell size={15} style={{ color: '#facc15' }} />
          <span style={{ fontWeight: 600 }}>Échéances Standards (J-30)</span>
          <span style={{
            fontSize: '0.72rem',
            padding: '0.1rem 0.45rem',
            borderRadius: '999px',
            background: alertJ30Abos.length > 0 ? '#ca8a04' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            marginLeft: '0.2rem'
          }}>
            {alertJ30Abos.length}
          </span>
        </button>
      </div>

      {/* 1. SECTION PRÉAVIS DE RECONDUCTION TACITE (Composant séparé sans createPortal) */}
      {alertSectionTab === 'preavis' && (
        <PreavisReconductionSection
          alertPreavisAbos={alertPreavisAbos}
          actions={preavisActions}
          canSendManualEmail={canSendManualEmail}
          canEditEmailTemplate={canEditEmailTemplate}
          onSendPreavisEmail={handleSendPreavisEmail}
          sendingRef={sendingRef}
          onOpenTemplateModal={() => {
            setSelectedTemplateCode('PREAVIS_RECONDUCTION');
            setShowTemplateModal(true);
          }}
        />
      )}

      {/* 2. SECTION ÉCHÉANCES STANDARDS (J-30) & RELANCES */}
      {alertSectionTab === 'j30' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Panneau Alerte : Échéances Standards J-30 */}
          <div className="glass-panel" style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid rgba(250, 204, 21, 0.4)',
            background: 'rgba(250, 204, 21, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bell size={18} style={{ color: 'var(--accent-secondary)' }} />
                <div>
                  <h4 style={{ margin: 0, color: 'var(--accent-secondary)', fontSize: '1rem', fontWeight: 700 }}>
                    Alertes Relance J-30 ({alertJ30Abos.length} contrat(s) en échéance proche)
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Contrats standards sans tacite reconduction arrivant à échéance sous 30 jours, sans contrat de renouvellement.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {canEditEmailTemplate && (
                  <button
                    type="button"
                    className="pill-btn"
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    onClick={() => {
                      setSelectedTemplateCode('RELANCE_ECHEANCE');
                      setShowTemplateModal(true);
                    }}
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
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Aucun contrat standard à renouveler sous les 30 prochains jours.
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
                    gap: '0.25rem',
                    minWidth: '260px',
                    flex: '1 1 calc(33.333% - 0.75rem)'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>{abo.reference}</strong> - <span>{abo.nom_client || abo.raison_sociale}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)' }}>
                      Échéance : {new Date(abo.date_echeance || abo.date_fin).toLocaleDateString('fr-FR')}
                    </div>
                    {canSendManualEmail && (
                      <button
                        type="button"
                        className="pill-btn active"
                        style={{ fontSize: '0.74rem', padding: '0.2rem 0.55rem', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}
                        onClick={() => handleSendManualEmail(abo)}
                        disabled={sendingRef === abo.reference}
                        title="Envoyer l'e-mail de relance manuel au client"
                      >
                        {sendingRef === abo.reference ? <Loader2 size={11} className="btn-spinner" /> : <Send size={11} />}
                        <span>{sendingRef === abo.reference ? 'Envoi en cours...' : 'Envoyer relance manuelle'}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

      {/* Historique des Relances d'Échéances Standards (J-30) */}
      <div>
        <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 600 }}>
          Historique des Relances d'Échéances (J-30)
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
            {filteredActions.length} / {echeanceActions.length} relance{echeanceActions.length > 1 ? 's' : ''}
          </div>
        </div>

        {filteredActions.length === 0 ? (
          <p className="empty-msg">Aucune action commerciale ne correspond à ces critères.</p>
        ) : (
          <div className="aeropub-table-wrapper">
            <table className="aeropub-table">
              <thead>
                <tr className="table-head-row-indigo">
                  <th className="table-head-cell sortable" onClick={() => handleSort('date_action')} style={{ cursor: 'pointer' }}>
                    Date {renderSortIcon('date_action')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('type_action')} style={{ cursor: 'pointer' }}>
                    Type d'Action {renderSortIcon('type_action')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('nom_client')} style={{ cursor: 'pointer' }}>
                    Client & Contrat {renderSortIcon('nom_client')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('nom_commercial')} style={{ cursor: 'pointer' }}>
                    Commercial {renderSortIcon('nom_commercial')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
                    Description {renderSortIcon('description')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('statut_envoi_email')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                    Statut Email {renderSortIcon('statut_envoi_email')}
                  </th>
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
                          title={(!act.id_abonnement && !act.reference) ? "Aucun contrat associé à cette action" : "Renvoyer l'e-mail de relance d'échéance (-30j) au client"}
                        >
                          {sendingRef === (act.id_abonnement || act.reference) ? <Loader2 size={11} className="btn-spinner" /> : <Send size={11} />}
                          <span>{sendingRef === (act.id_abonnement || act.reference) ? 'Envoi...' : 'Renvoyer mail échéance'}</span>
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
          totalItems={sortedActions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  )}

      {/* Modal Modification du Modèle de Courriel (Admin seul) */}
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
            maxWidth: '580px',
            width: '100%',
            padding: '1.75rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            background: 'var(--bg-secondary, #1e293b)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={20} style={{ color: 'var(--accent-secondary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  Modifier le modèle de courriel
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

            {/* Onglets de sélection du modèle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={`pill-btn ${selectedTemplateCode === 'PREAVIS_RECONDUCTION' ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}
                onClick={() => setSelectedTemplateCode('PREAVIS_RECONDUCTION')}
              >
                🔄 Préavis de reconduction tacite
              </button>
              <button
                type="button"
                className={`pill-btn ${selectedTemplateCode === 'RELANCE_ECHEANCE' ? 'active' : ''}`}
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}
                onClick={() => setSelectedTemplateCode('RELANCE_ECHEANCE')}
              >
                ⚠️ Relance d'échéance (J-30)
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
                  rows={8}
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

              {/* Guide des variables dynamiques selon le modèle choisi */}
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontSize: '0.78rem'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-secondary, #38bdf8)', marginBottom: '0.35rem' }}>
                  💡 Variables dynamiques pour {selectedTemplateCode === 'PREAVIS_RECONDUCTION' ? 'le préavis de reconduction' : 'la relance d\'échéance'} :
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(selectedTemplateCode === 'PREAVIS_RECONDUCTION' ? [
                    { tag: '{destNom}', desc: 'Nom du destinataire / client' },
                    { tag: '{reference}', desc: 'Réf contrat' },
                    { tag: '{supports}', desc: 'Supports' },
                    { tag: '{dateFr}', desc: 'Date d\'échéance' },
                    { tag: '{preavisJours}', desc: 'Délai préavis en jours' },
                    { tag: '{dateLimitePreavisFr}', desc: 'Date limite notification résiliation' },
                    { tag: '{diffJoursPreavis}', desc: 'Jours restants avant date limite préavis' },
                    { tag: '{diffJoursEcheance}', desc: 'Jours restants avant échéance' },
                    { tag: '{nbJoursRestants}', desc: 'Texte complet jours restants (avec rattrapage)' },
                    { tag: '{interlocuteur}', desc: 'Commercial' },
                  ] : [
                    { tag: '{destNom}', desc: 'Nom du destinataire / client' },
                    { tag: '{reference}', desc: 'Réf contrat' },
                    { tag: '{supports}', desc: 'Supports' },
                    { tag: '{diffJours}', desc: 'Jours restants' },
                    { tag: '{dateFr}', desc: 'Date d\'échéance' },
                    { tag: '{interlocuteur}', desc: 'Commercial' },
                  ]).map(({ tag, desc }) => (
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
                      title={`${desc} - Cliquer pour insérer`}
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
                  {savingTemplate ? <Loader2 size={14} className="btn-spinner" /> : <Check size={14} />}
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
