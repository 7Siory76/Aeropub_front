import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Edit3, Trash2, Layers, AlertCircle, History, Gift, Loader2
} from 'lucide-react';
import {
  abonnementsApi, typeStatutAbonnementApi
} from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { hasRole } from '../../../utils/rbac';
import { useFeedback } from '../../../context/FeedbackContext';
import { sanitizeUserError } from '../../../utils/errorHandler';
import AbonnementDocuments from '../../../components/AbonnementDocuments';
import AbonnementEditModal from './AbonnementEditModal';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function AbonnementDetailsModal({
  abonnement,
  onClose,
  onRefresh,
  typeStatut = [],
  emplacements = [],
  allAbonnements = [],
  clients = [],
  utilisateurs = []
}) {
  const { user } = useAuth();
  const { showSuccess, showError, scrollToTop } = useFeedback();

  // Permissions RBAC (Module 1)
  const canEditDatesMontant = hasRole(user, ['Admin', 'Resp_Com', 'Commercial']);
  const canValidateRenewalDiscount = hasRole(user, ['Admin', 'Direction', 'Resp_Com']);
  const canDeleteContract = hasRole(user, ['Admin', 'Resp_Com']);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (modalError) {
      scrollToTop();
    }
  }, [modalError, scrollToTop]);

  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [remisePercent, setRemisePercent] = useState(10);
  const [remiseMotif, setRemiseMotif] = useState('');
  const [remiseDureeMois, setRemiseDureeMois] = useState(12);

  // État pour basculer en mode sélection rapide du statut
  const [isChangingStatut, setIsChangingStatut] = useState(false);
  const [selectedNewStatut, setSelectedNewStatut] = useState(abonnement?.statut_abonnement || abonnement?.statut || 'Actif');
  const [typeStatutList, setTypeStatutList] = useState(typeStatut);

  const [historiqueStatuts, setHistoriqueStatuts] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // Détection du contrat successeur ayant renouvelé le contrat courant
  const renewedByContract = useMemo(() => {
    if (!abonnement?.reference) return null;
    return (allAbonnements || []).find(a =>
      String(a.id_abonnement_precedent || '').trim() === String(abonnement.reference).trim()
    );
  }, [abonnement, allAbonnements]);

  // Supports rattachés au contrat
  const supportsList = useMemo(() => {
    if (Array.isArray(abonnement?.supports) && abonnement.supports.length > 0) {
      return abonnement.supports.map(s => typeof s === 'string' ? s : (s.reference_support || s.reference)).filter(Boolean);
    }
    if (abonnement?.supports_associes) {
      return abonnement.supports_associes.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    }
    if (abonnement?.reference_emplacement) {
      return [abonnement.reference_emplacement.trim()];
    }
    return [];
  }, [abonnement]);

  // Recharger l'historique et le statut quand abonnement change
  useEffect(() => {
    if (abonnement) {
      setSelectedNewStatut(abonnement.statut_abonnement || abonnement.statut || 'Actif');

      setLoadingHistorique(true);
      abonnementsApi.getHistoriqueStatuts(abonnement.reference)
        .then(data => setHistoriqueStatuts(data || []))
        .catch(() => {})
        .finally(() => setLoadingHistorique(false));
    }
  }, [abonnement]);

  useEffect(() => {
    if (typeStatut && typeStatut.length > 0) {
      setTypeStatutList(typeStatut);
    } else {
      typeStatutAbonnementApi.getAll().then(data => setTypeStatutList(data || [])).catch(() => {});
    }
  }, [typeStatut]);

  if (!abonnement) return null;

  // Action rapide : Changer le statut directement depuis la vue détails
  const handleQuickStatutChange = async (newStatutNom) => {
    setLoading(true);
    setModalError('');
    try {
      await abonnementsApi.update(abonnement.reference, { statut: newStatutNom });
      showSuccess(`Statut de l'abonnement mis à jour en "${newStatutNom}" !`);
      setIsChangingStatut(false);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      const msg = sanitizeUserError(err, "Erreur lors du changement de statut.");
      setModalError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Action : Déclencher la modale de suppression sécurisée
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const statutStr = abonnement.statut_abonnement || abonnement.statut || 'Actif';
  const isActif = statutStr.toLowerCase() === 'actif';

  // Calcul de la durée en mois
  const getDurationMonths = () => {
    if (!abonnement.date_debut || (!abonnement.date_echeance && !abonnement.date_fin)) return null;
    const d1 = new Date(abonnement.date_debut);
    const d2 = new Date(abonnement.date_echeance || abonnement.date_fin);
    const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    return months > 0 ? months : 1;
  };

  // Validation d'un renouvellement avec remise exceptionnelle (Module 1 : Admin, Direction, Resp_Com)
  const handleValidateRenewalWithDiscount = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const baseTarif = Number(abonnement.tarif) || 0;
      const discountRatio = Math.max(0, Math.min(100, Number(remisePercent) || 0)) / 100;
      const newTarif = Math.round(baseTarif * (1 - discountRatio));

      const currentEnd = new Date(abonnement.date_echeance || abonnement.date_fin || Date.now());
      const nextEnd = new Date(currentEnd);
      nextEnd.setMonth(nextEnd.getMonth() + parseInt(remiseDureeMois, 10));

      await abonnementsApi.update(abonnement.reference, {
        tarif: newTarif,
        date_echeance: nextEnd.toISOString(),
        statut_abonnement: 'Actif',
        commentaire: `Renouvellement validé par ${user?.nom || 'Direction'} avec remise exceptionnelle de ${remisePercent}%. Motif: ${remiseMotif || 'Geste commercial'}.`
      });

      showSuccess(`Renouvellement validé avec ${remisePercent}% de remise (Nouveau tarif: ${newTarif.toLocaleString('fr-FR')} ${abonnement.devise || 'MGA'}).`);
      setShowRenewalModal(false);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la validation du renouvellement.');
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '840px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.25s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modale de validation de renouvellement avec remise exceptionnelle */}
        {showRenewalModal && (
          <div className="modal-backdrop-portal" style={{ zIndex: 10000 }} onClick={() => setShowRenewalModal(false)}>
            <div className="glass-panel client-modal-box" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
              <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                  <Gift size={20} />
                  <span>Renouvellement avec Remise Exceptionnelle</span>
                </h3>
                <button type="button" className="close-btn" onClick={() => setShowRenewalModal(false)}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Contrat : <strong style={{ color: 'var(--text-main)' }}>{abonnement.reference}</strong> ({abonnement.nom_client || abonnement.raison_sociale})
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Pourcentage de Remise Accordée (%) :</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    className="modal-input"
                    value={remisePercent}
                    onChange={(e) => setRemisePercent(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    {[5, 10, 15, 20, 25].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        className="pill-btn"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                        onClick={() => setRemisePercent(pct)}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Prolongation (durée) :</label>
                  <select
                    className="modal-select"
                    value={remiseDureeMois}
                    onChange={(e) => setRemiseDureeMois(e.target.value)}
                  >
                    <option value="6">6 mois</option>
                    <option value="12">1 an (12 mois)</option>
                    <option value="24">2 ans (24 mois)</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Motif de la remise :</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="Ex: Fidélité client grand compte, geste commercial..."
                    value={remiseMotif}
                    onChange={(e) => setRemiseMotif(e.target.value)}
                  />
                </div>

                {/* Calcul d'impact tarifaire en direct */}
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.88rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Tarif actuel : {Number(abonnement.tarif || 0).toLocaleString('fr-FR')} {abonnement.devise || 'MGA'}</div>
                  <div style={{ fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>
                    Nouveau tarif remisé : {Math.round(Number(abonnement.tarif || 0) * (1 - (remisePercent / 100))).toLocaleString('fr-FR')} {abonnement.devise || 'MGA'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="pill-btn" onClick={() => setShowRenewalModal(false)}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="pill-btn active"
                    style={{ background: '#10b981', borderColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={handleValidateRenewalWithDiscount}
                    disabled={loading}
                  >
                    {loading && <Loader2 size={15} className="btn-spinner" />}
                    <span>{loading ? 'Validation en cours...' : 'Valider le renouvellement'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* En-tête */}
        <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 className="client-modal-title" style={{ fontSize: '1.4rem' }}>
                📄 Contrat : {abonnement.reference || `#${abonnement.id}`}
              </h3>
              <span className={`wireframe-badge ${isActif ? 'badge-available' : 'badge-occupied'}`}>
                {statutStr}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Client : <strong>{abonnement.raison_sociale || abonnement.nom_client || 'Client standard'}</strong>
              {abonnement.date_creation && (
                <span style={{ marginLeft: '0.6rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  • Créé le {new Date(abonnement.date_creation).toLocaleDateString('fr-FR')}
                </span>
              )}
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {modalError && (
          <div className="modal-error-box">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{modalError}</span>
          </div>
        )}

        {/* AFFICHAGE DES DÉTAILS */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>

            <div className="client-abo-card">
              <span className="client-abo-label">Client & Raison Sociale :</span>
              <div className="client-abo-value" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                {abonnement.raison_sociale || abonnement.nom_client || 'N/A'}
              </div>
            </div>
            <div className="client-abo-card">
              <span className="client-abo-label">Commercial Attitré :</span>
              <div className="client-abo-value">
                {abonnement.nom_commercial || 'Direction / Admin'}
                {abonnement.email_commercial && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                    ({abonnement.email_commercial})
                  </span>
                )}
              </div>
            </div>

            {/* Supports liés sous forme de badges */}
            <div className="client-abo-card" style={{ gridColumn: 'span 2' }}>
              <span className="client-abo-label">Supports Liés / Emplacements :</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                {supportsList.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>Aucun support associé</span>
                ) : (
                  supportsList.map(s => (
                    <span key={s} style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: 'rgba(6, 182, 212, 0.15)',
                      color: '#06b6d4',
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    }}>
                      📍 {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="client-abo-card">
              <span className="client-abo-label">Tarif & Périodicité :</span>
              <div className="client-abo-value" style={{ color: '#10b981', fontWeight: 700 }}>
                {abonnement.tarif ? `${Number(abonnement.tarif).toLocaleString('fr-FR')} ${abonnement.devise || 'MGA'}` : 'Non renseigné'}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.4rem', fontWeight: 400 }}>
                  ({abonnement.periodicite || 'Annuel'})
                </span>
              </div>
            </div>

            <div className="client-abo-card">
              <span className="client-abo-label">Campagne / Annonceur :</span>
              <div className="client-abo-value">
                {abonnement.annonceur_campagne || 'Campagne standard'}
              </div>
            </div>

            <div className="client-abo-card">
              <span className="client-abo-label">Période de Validité :</span>
              <div className="client-abo-value" style={{ fontSize: '0.9rem' }}>
                Du {abonnement.date_debut ? new Date(abonnement.date_debut).toLocaleDateString('fr-FR') : '-'} au{' '}
                {abonnement.date_echeance || abonnement.date_fin ? new Date(abonnement.date_echeance || abonnement.date_fin).toLocaleDateString('fr-FR') : '-'}
                {getDurationMonths() && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                    ({getDurationMonths()} mois)
                  </span>
                )}
              </div>
            </div>

            <div className="client-abo-card">
              <span className="client-abo-label">Préavis & Reconduction :</span>
              <div className="client-abo-value">
                {abonnement.preavis_jours ? `${abonnement.preavis_jours} jours` : '30 jours'} {abonnement.reconduction_tacite ? '(Tacite)' : '(Non tacite)'}
              </div>
            </div>

            {/* Statut actuel avec changement rapide */}
            <div
              className="client-abo-card"
              style={{ cursor: 'pointer', border: '1px solid rgba(59, 130, 246, 0.4)', position: 'relative' }}
              onClick={() => !isChangingStatut && setIsChangingStatut(true)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="client-abo-label">STATUT ACTUEL :</span>
                {!isChangingStatut && (
                  <span style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'underline' }}>
                    Changer ▾
                  </span>
                )}
              </div>

              <div className="client-abo-value" style={{ marginTop: '0.35rem' }}>
                {isChangingStatut ? (
                  <select
                    autoFocus
                    disabled={loading}
                    className="ts-filter-select"
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem' }}
                    value={selectedNewStatut}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedNewStatut(val);
                      handleQuickStatutChange(val);
                    }}
                    onBlur={() => setIsChangingStatut(false)}
                  >
                    {typeStatutList && typeStatutList.length > 0 ? (
                      typeStatutList.map(st => (
                        <option key={st.id || st.nom_statut} value={st.nom_statut || st.nom}>
                          {st.nom_statut || st.nom}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Brouillon">Brouillon</option>
                        <option value="Soumis">Soumis</option>
                        <option value="Actif">Actif</option>
                        <option value="Expiré">Expiré</option>
                        <option value="Résilié">Résilié</option>
                      </>
                    )}
                  </select>
                ) : (
                  <span className={`wireframe-badge ${isActif ? 'badge-available' : 'badge-occupied'}`} style={{ fontSize: '0.85rem' }}>
                    {abonnement.statut_abonnement || abonnement.statut || 'Actif'}
                  </span>
                )}
              </div>
            </div>

            {/* Motif de non-renouvellement (si présent) */}
            {abonnement.motif_non_renouvellement && (
              <div className="client-abo-card" style={{ gridColumn: 'span 2', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span className="client-abo-label" style={{ color: '#ef4444' }}>Motif de non-renouvellement :</span>
                <div className="client-abo-value" style={{ fontSize: '0.88rem' }}>
                  {abonnement.motif_non_renouvellement}
                </div>
              </div>
            )}

            {/* Contrat précédent (Parent) */}
            {abonnement.id_abonnement_precedent && (
              <div className="client-abo-card" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <span className="client-abo-label" style={{ color: '#06b6d4' }}>🔄 Contrat Précédent (Origine) :</span>
                <div className="client-abo-value" style={{ color: '#38bdf8', fontWeight: 700 }}>
                  N° {abonnement.id_abonnement_precedent}
                </div>
              </div>
            )}

            {/* Contrat suivant (Successeur ayant renouvelé ce contrat) */}
            {renewedByContract && (
              <div className="client-abo-card" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                <span className="client-abo-label" style={{ color: '#10b981' }}>✅ Renouvelé avec succès par :</span>
                <div className="client-abo-value" style={{ color: '#10b981', fontWeight: 700 }}>
                  N° {renewedByContract.reference}
                </div>
              </div>
            )}

          </div>

          {/* Section Historique des Statuts du Contrat */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '10px',
            border: '1px solid var(--border-glass)',
            padding: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)' }}>
                <History size={16} /> Historique des statuts du contrat ({historiqueStatuts.length})
              </span>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}
              >
                {showHistory ? 'Masquer ▲' : 'Afficher ▼'}
              </button>
            </div>

            {showHistory && (
              loadingHistorique ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Chargement de l'historique...</p>
              ) : historiqueStatuts.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Aucun historique enregistré pour ce contrat.
                </p>
              ) : (
                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.35rem 0.5rem' }}>Statut</th>
                        <th style={{ padding: '0.35rem 0.5rem' }}>Période</th>
                        <th style={{ padding: '0.35rem 0.5rem' }}>Commentaire</th>
                        <th style={{ padding: '0.35rem 0.5rem' }}>Auteur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historiqueStatuts.map((h) => {
                        const hStatut = (h.nom_statut || '').toLowerCase();
                        const isHActive = !h.date_fin;
                        return (
                          <tr key={h.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: isHActive ? 'rgba(6, 182, 212, 0.05)' : 'transparent' }}>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <span style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '9999px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: hStatut.includes('actif') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: hStatut.includes('actif') ? '#10b981' : '#ef4444'
                              }}>
                                {h.nom_statut || 'Statut'}
                              </span>
                            </td>
                            <td style={{ padding: '0.4rem 0.5rem', whiteSpace: 'nowrap' }}>
                              Du {h.date_debut ? new Date(h.date_debut).toLocaleDateString('fr-FR') : '-'}
                              {h.date_fin ? ` au ${new Date(h.date_fin).toLocaleDateString('fr-FR')}` : ' (en cours)'}
                            </td>
                            <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)' }}>
                              {h.commentaire || '-'}
                            </td>
                            <td style={{ padding: '0.4rem 0.5rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                              {h.nom_utilisateur || 'Système'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>

          <AbonnementDocuments referenceAbonnement={abonnement.reference} />

          {/* Pied de Modale */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
            {canDeleteContract ? (
              <button
                type="button"
                className="pill-btn"
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={handleDelete}
                disabled={loading}
                title="Supprimer définitivement ce contrat (Admin / Resp_Com)"
              >
                <Trash2 size={15} />
                <span>Supprimer</span>
              </button>
            ) : (
              <div />
            )}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className="pill-btn"
                onClick={onClose}
              >
                Fermer
              </button>

              {/* Valider un renouvellement avec remise exceptionnelle */}
              {canValidateRenewalDiscount && (
                <button
                  type="button"
                  className="pill-btn"
                  style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => setShowRenewalModal(true)}
                  title="Valider un renouvellement avec remise exceptionnelle (Admin, Direction, Resp_Com)"
                >
                  <Gift size={15} />
                  <span>Valider renouvellement (remise)</span>
                </button>
              )}

              {/* Modifier les dates / le montant */}
              {canEditDatesMontant && (
                <button
                  type="button"
                  className="pill-btn active"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => setShowEditModal(true)}
                  title="Modifier les dates / le montant (Admin, Resp_Com, Commercial)"
                >
                  <Edit3 size={15} />
                  <span>Modifier les dates / montant</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modale d'édition séparée */}
        {showEditModal && (
          <AbonnementEditModal
            abonnement={abonnement}
            onClose={() => setShowEditModal(false)}
            onSaveSuccess={() => {
              setShowEditModal(false);
              onClose();
              if (onRefresh) onRefresh();
            }}
            typeStatut={typeStatutList}
            emplacements={emplacements}
            allAbonnements={allAbonnements}
            clients={clients}
            utilisateurs={utilisateurs}
          />
        )}

        {/* Modale de confirmation de suppression */}
        {showDeleteConfirm && (
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            title="Supprimer le contrat d'affichage"
            itemName={abonnement.reference}
            itemType="contrat"
            confirmDescription="Cette action supprimera définitivement le contrat, son historique et libérera les supports d'affichage associés."
            onConfirm={async () => {
              await abonnementsApi.delete(abonnement.reference);
              showSuccess(`Contrat "${abonnement.reference}" supprimé avec succès.`);
              onClose();
              if (onRefresh) onRefresh();
            }}
            onClose={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
