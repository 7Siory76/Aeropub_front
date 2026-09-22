import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Edit3, Trash2, Calendar, User, DollarSign, Layers, ShieldCheck,
  Percent, FileText, AlertTriangle, Plus, Clock, History, CheckCircle2, Gift
} from 'lucide-react';
import {
  abonnementsApi, emplacementsApi, clientsApi, utilisateursApi, typeStatutAbonnementApi
} from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { hasRole } from '../../../utils/rbac';
import { toast } from 'react-toastify';

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

  // Permissions RBAC (Module 1)
  const canEditDatesMontant = hasRole(user, ['Admin', 'Resp_Com', 'Commercial']);
  const canValidateRenewalDiscount = hasRole(user, ['Admin', 'Direction', 'Resp_Com']);
  const canDeleteContract = hasRole(user, ['Admin', 'Resp_Com']);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [remisePercent, setRemisePercent] = useState(10);
  const [remiseMotif, setRemiseMotif] = useState('');
  const [remiseDureeMois, setRemiseDureeMois] = useState(12);

  // État pour basculer en mode sélection rapide du statut
  const [isChangingStatut, setIsChangingStatut] = useState(false);
  const [selectedNewStatut, setSelectedNewStatut] = useState(abonnement?.statut_abonnement || abonnement?.statut || 'Actif');

  // Listes dynamiques pour les sélecteurs
  const [clientsList, setClientsList] = useState(clients);
  const [commercialsList, setCommercialsList] = useState(utilisateurs);
  const [typeStatutList, setTypeStatutList] = useState(typeStatut);
  const [availableEmplacements, setAvailableEmplacements] = useState(emplacements);
  const [abonnementsList, setAbonnementsList] = useState(allAbonnements);
  const [historiqueStatuts, setHistoriqueStatuts] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // Initialiser les supports rattachés
  const initialSupports = useMemo(() => {
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

  const [selectedSupports, setSelectedSupports] = useState(initialSupports);
  const [supportToAdd, setSupportToAdd] = useState('');

  const [dureeValeur, setDureeValeur] = useState(1);
  const [dureeUnite, setDureeUnite] = useState('an');
  const prevDurationRef = useRef({ val: 1, unite: 'an' });

  const getDureeContratText = (val, unite) => {
    const n = parseInt(val, 10) || 1;
    if (unite === 'an') {
      return `${n} ${n > 1 ? 'ans' : 'an'}`;
    }
    return `${n} mois`;
  };

  // Utilitaire pour formater la date au format YYYY-MM-DD requis par <input type="date" />
  const formatDateForInput = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // État local du formulaire d'édition
  const [formData, setFormData] = useState({
    id_client: abonnement?.id_client || '',
    id_commercial: abonnement?.id_commercial || '',
    annonceur_campagne: abonnement?.annonceur_campagne || '',
    tarif: abonnement?.tarif ?? '',
    devise: abonnement?.devise || 'MGA',
    periodicite: abonnement?.periodicite || 'Annuel',
    date_debut: formatDateForInput(abonnement?.date_debut),
    date_echeance: formatDateForInput(abonnement?.date_echeance || abonnement?.date_fin),
    probabilite_renouvellement: abonnement?.probabilite_renouvellement ?? 80,
    preavis_jours: abonnement?.preavis_jours ?? 30,
    reconduction_tacite: Boolean(abonnement?.reconduction_tacite),
    motif_non_renouvellement: abonnement?.motif_non_renouvellement || '',
    id_abonnement_precedent: abonnement?.id_abonnement_precedent || '',
    statut: abonnement?.statut_abonnement || abonnement?.statut || 'Actif',
    id_type_statut: abonnement?.id_type_statut || ''
  });

  // Recharger le formulaire et l'historique quand abonnement change
  useEffect(() => {
    if (abonnement) {
      setSelectedSupports(initialSupports);
      setFormData({
        id_client: abonnement.id_client || '',
        id_commercial: abonnement.id_commercial || '',
        annonceur_campagne: abonnement.annonceur_campagne || '',
        tarif: abonnement.tarif ?? '',
        devise: abonnement.devise || 'MGA',
        periodicite: abonnement.periodicite || 'Annuel',
        date_debut: formatDateForInput(abonnement.date_debut),
        date_echeance: formatDateForInput(abonnement.date_echeance || abonnement.date_fin),
        probabilite_renouvellement: abonnement.probabilite_renouvellement ?? 80,
        preavis_jours: abonnement.preavis_jours ?? 30,
        reconduction_tacite: Boolean(abonnement.reconduction_tacite),
        motif_non_renouvellement: abonnement.motif_non_renouvellement || '',
        id_abonnement_precedent: abonnement.id_abonnement_precedent || '',
        statut: abonnement.statut_abonnement || abonnement.statut || 'Actif',
        id_type_statut: abonnement.id_type_statut || ''
      });
      setSelectedNewStatut(abonnement.statut_abonnement || abonnement.statut || 'Actif');

      // Calculer la durée initiale pour initialiser le sélecteur
      if (abonnement.date_debut && (abonnement.date_echeance || abonnement.date_fin)) {
        const d1 = new Date(abonnement.date_debut);
        const d2 = new Date(abonnement.date_echeance || abonnement.date_fin);
        const diffMonths = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
        let initVal = 1;
        let initUnite = 'an';
        if (diffMonths > 0 && diffMonths % 12 === 0) {
          initVal = diffMonths / 12;
          initUnite = 'an';
        } else if (diffMonths > 0) {
          initVal = diffMonths;
          initUnite = 'mois';
        }
        setDureeValeur(initVal);
        setDureeUnite(initUnite);
        prevDurationRef.current = { val: initVal, unite: initUnite };
      }

      // Charger l'historique des statuts de l'abonnement
      setLoadingHistorique(true);
      abonnementsApi.getHistoriqueStatuts(abonnement.reference)
        .then(data => setHistoriqueStatuts(data || []))
        .catch(err => console.error('Erreur historique statut:', err))
        .finally(() => setLoadingHistorique(false));
    }
  }, [abonnement, initialSupports]);

  // Recalcul de l'échéance en mode édition lorsque la durée change
  useEffect(() => {
    if (!isEditing || !formData.date_debut) return;

    const [year, month, day] = formData.date_debut.split('-').map(Number);
    if (!year || !month || !day) return;

    const d = new Date(year, month - 1, day);
    const val = parseInt(dureeValeur, 10) || 1;

    if (dureeUnite === 'an') {
      d.setFullYear(d.getFullYear() + val);
    } else if (dureeUnite === 'mois') {
      d.setMonth(d.getMonth() + val);
    }

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');

    const durationChanged =
      prevDurationRef.current.val !== val ||
      prevDurationRef.current.unite !== dureeUnite;

    let autoPeriodicite = null;
    if (durationChanged) {
      if (dureeUnite === 'mois') {
        if (val <= 1) autoPeriodicite = 'Mensuel';
        else if (val >= 2 && val <= 4) autoPeriodicite = 'Trimestriel';
        else if (val >= 5 && val <= 8) autoPeriodicite = 'Semestriel';
        else autoPeriodicite = 'Annuel';
      } else {
        autoPeriodicite = 'Annuel';
      }
      prevDurationRef.current = { val, unite: dureeUnite };
    }

    setFormData(prev => ({
      ...prev,
      date_echeance: `${y}-${m}-${dayStr}`,
      ...(autoPeriodicite ? { periodicite: autoPeriodicite } : {})
    }));
  }, [isEditing, formData.date_debut, dureeValeur, dureeUnite]);

  // Charger les listes nécessaires si non passées en props
  useEffect(() => {
    if (emplacements && emplacements.length > 0) {
      setAvailableEmplacements(emplacements);
    } else {
      emplacementsApi.getAll().then(data => setAvailableEmplacements(data || [])).catch(() => {});
    }

    if (allAbonnements && allAbonnements.length > 0) {
      setAbonnementsList(allAbonnements);
    } else {
      abonnementsApi.getAll().then(data => setAbonnementsList(data || [])).catch(() => {});
    }

    if (clients && clients.length > 0) {
      setClientsList(clients);
    } else {
      clientsApi.getAll().then(data => setClientsList(data || [])).catch(() => {});
    }

    if (utilisateurs && utilisateurs.length > 0) {
      setCommercialsList(utilisateurs);
    } else {
      utilisateursApi.getAll().then(data => setCommercialsList(data || [])).catch(() => {});
    }

    if (typeStatut && typeStatut.length > 0) {
      setTypeStatutList(typeStatut);
    } else {
      typeStatutAbonnementApi.getAll().then(data => setTypeStatutList(data || [])).catch(() => {});
    }
  }, [emplacements, allAbonnements, clients, utilisateurs, typeStatut]);

  if (!abonnement) return null;

  // Règle métier : la modification des supports n'est permise que si non actif et non archivé
  const currentStatut = String(formData.statut || abonnement.statut_abonnement || abonnement.statut || '').trim().toLowerCase();
  const isLockedForSupportEdit = currentStatut.includes('actif') || currentStatut.includes('archiv');

  // Vérifier si un support est disponible sur l'intervalle [date_debut, date_echeance]
  const checkSupportAvailabilityOnDates = (empRef, startDateStr, endDateStr) => {
    if (!empRef || !startDateStr || !endDateStr) return { available: true };
    const cleanEmpRef = String(empRef).trim().toUpperCase();

    const targetStartTime = new Date(startDateStr + 'T00:00:00').getTime();
    const targetEndTime = new Date(endDateStr + 'T23:59:59').getTime();

    if (isNaN(targetStartTime) || isNaN(targetEndTime)) return { available: true };

    for (const otherAbo of abonnementsList) {
      // Ignorer le contrat actuel en cours d'édition
      if (otherAbo.reference === abonnement.reference) continue;

      // Ignorer les contrats archivés, résiliés, expirés ou annulés
      const rawSt = String(otherAbo.statut_abonnement || otherAbo.statut || '').trim().toLowerCase();
      const cleanSt = rawSt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (
        cleanSt.includes('archiv') || 
        cleanSt.includes('resili') || 
        cleanSt.includes('annul') || 
        cleanSt.includes('expir') ||
        rawSt.includes('résili') ||
        rawSt.includes('archiv') ||
        rawSt.includes('expir')
      ) {
        continue;
      }

      // Vérifier si ce contrat utilise ce support
      const supsList = (otherAbo.supports_associes || '')
        .split(',')
        .map(s => s.trim().toUpperCase());
      const firstSup = String(otherAbo.reference_emplacement || otherAbo.reference_support || '').trim().toUpperCase();
      if (firstSup) supsList.push(firstSup);

      if (Array.isArray(otherAbo.supports)) {
        otherAbo.supports.forEach(s => {
          const r = typeof s === 'string' ? s.trim().toUpperCase() : (s.reference_support || s.reference || '').trim().toUpperCase();
          if (r) supsList.push(r);
        });
      }

      if (!supsList.includes(cleanEmpRef)) continue;

      // Vérifier le chevauchement de dates
      const otherStartStr = String(otherAbo.date_debut || '').trim().replace(' ', 'T');
      const otherEndStr = String(otherAbo.date_fin || otherAbo.date_echeance || '').trim().replace(' ', 'T');
      const otherStartTime = new Date(otherStartStr).getTime();
      const otherEndTime = new Date(otherEndStr).getTime();

      if (isNaN(otherStartTime) || isNaN(otherEndTime)) continue;

      // Chevauchement : startA <= endB && endA >= startB
      if (otherStartTime <= targetEndTime && otherEndTime >= targetStartTime) {
        return {
          available: false,
          conflictWith: otherAbo,
          conflictDebut: otherAbo.date_debut,
          conflictFin: otherAbo.date_fin || otherAbo.date_echeance
        };
      }
    }

    return { available: true };
  };

  // Liste des emplacements strictement disponibles entre date_debut et date_echeance
  const filteredAvailableEmplacements = useMemo(() => {
    return availableEmplacements.filter(emp => {
      if (selectedSupports.includes(emp.reference)) return false;
      const check = checkSupportAvailabilityOnDates(emp.reference, formData.date_debut, formData.date_echeance);
      return check.available;
    });
  }, [availableEmplacements, selectedSupports, formData.date_debut, formData.date_echeance, abonnementsList]);

  // Retirer un support de la liste
  const handleRemoveSupport = (supRef) => {
    if (isLockedForSupportEdit) {
      alert("L'abonnement est déjà actif (ou archivé) : la suppression d'un support requiert une autorisation administrateur.");
      return;
    }
    setSelectedSupports(prev => prev.filter(s => s !== supRef));
  };

  // Ajouter un support à la liste
  const handleAddSupport = () => {
    if (isLockedForSupportEdit) {
      alert("L'abonnement est déjà actif (ou archivé) : l'ajout d'un support requiert une autorisation administrateur.");
      return;
    }
    if (!supportToAdd) return;

    const check = checkSupportAvailabilityOnDates(supportToAdd, formData.date_debut, formData.date_echeance);
    if (!check.available) {
      const conflictAbo = check.conflictWith;
      const deb = check.conflictDebut ? new Date(check.conflictDebut).toLocaleDateString('fr-FR') : '';
      const fin = check.conflictFin ? new Date(check.conflictFin).toLocaleDateString('fr-FR') : '';
      alert(
        `Le support "${supportToAdd}" n'est pas disponible sur la période sélectionnée : il est déjà réservé du ${deb} au ${fin} par le contrat ${conflictAbo?.reference} (${conflictAbo?.raison_sociale || 'Client'}).`
      );
      return;
    }

    if (!selectedSupports.includes(supportToAdd)) {
      setSelectedSupports(prev => [...prev, supportToAdd]);
    }
    setSupportToAdd('');
  };

  // Action rapide : Changer le statut directement depuis la vue détails
  const handleQuickStatutChange = async (newStatutNom) => {
    setLoading(true);
    try {
      await abonnementsApi.update(abonnement.reference, { statut: newStatutNom });
      alert(`Statut de l'abonnement mis à jour en "${newStatutNom}" !`);
      setIsChangingStatut(false);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors du changement de statut.");
    } finally {
      setLoading(false);
    }
  };

  // Action : Sauvegarder les modifications complètes
  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (formData.date_debut && formData.date_echeance && new Date(formData.date_echeance) < new Date(formData.date_debut)) {
      alert("La date d'échéance doit être postérieure ou égale à la date de début.");
      return;
    }
    setLoading(true);
    try {
      // 1. Vérification de la disponibilité de tous les supports sélectionnés sur la période
      for (const supRef of selectedSupports) {
        const check = checkSupportAvailabilityOnDates(supRef, formData.date_debut, formData.date_echeance);
        if (!check.available) {
          const conflictAbo = check.conflictWith;
          const deb = check.conflictDebut ? new Date(check.conflictDebut).toLocaleDateString('fr-FR') : '';
          const fin = check.conflictFin ? new Date(check.conflictFin).toLocaleDateString('fr-FR') : '';
          alert(
            `Impossible d'enregistrer : le support "${supRef}" n'est pas disponible du ${new Date(formData.date_debut).toLocaleDateString('fr-FR')} au ${new Date(formData.date_echeance).toLocaleDateString('fr-FR')} (déjà réservé du ${deb} au ${fin} par le contrat ${conflictAbo?.reference}).`
          );
          setLoading(false);
          return;
        }
      }

      await abonnementsApi.update(abonnement.reference, {
        id_client: formData.id_client ? parseInt(formData.id_client, 10) : undefined,
        id_commercial: formData.id_commercial ? parseInt(formData.id_commercial, 10) : undefined,
        annonceur_campagne: formData.annonceur_campagne,
        tarif: formData.tarif !== '' ? parseFloat(formData.tarif) : undefined,
        devise: formData.devise,
        periodicite: formData.periodicite,
        date_debut: formData.date_debut,
        date_echeance: formData.date_echeance,
        probabilite_renouvellement: formData.probabilite_renouvellement !== '' ? parseInt(formData.probabilite_renouvellement, 10) : undefined,
        preavis_jours: formData.preavis_jours !== '' ? parseInt(formData.preavis_jours, 10) : undefined,
        reconduction_tacite: formData.reconduction_tacite,
        motif_non_renouvellement: formData.motif_non_renouvellement,
        id_abonnement_precedent: formData.id_abonnement_precedent || null,
        statut: formData.statut,
        id_type_statut: formData.id_type_statut || undefined,
        supports: selectedSupports
      });

      alert(`Abonnement "${abonnement.reference}" mis à jour avec succès !`);
      setIsEditing(false);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l’abonnement:', err);
      const msg = err.response?.data?.message || "Erreur lors de l'enregistrement de l'abonnement.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Action : Supprimer le contrat (avec confirmation)
  const handleDelete = async () => {
    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le contrat "${abonnement.reference}" ?`);
    if (!confirmed) return;
    setLoading(true);
    try {
      await abonnementsApi.delete(abonnement.reference);
      alert(`Contrat "${abonnement.reference}" supprimé avec succès.`);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur de suppression:', err);
      alert("Impossible de supprimer cet abonnement.");
    } finally {
      setLoading(false);
    }
  };

  const statutStr = formData.statut || abonnement.statut_abonnement || abonnement.statut || 'Actif';
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
        probabilite_renouvellement: 100,
        statut_abonnement: 'Actif',
        commentaire: `Renouvellement validé par ${user?.nom || 'Direction'} avec remise exceptionnelle de ${remisePercent}%. Motif: ${remiseMotif || 'Geste commercial'}.`
      });

      toast.success(`🎉 Renouvellement validé avec ${remisePercent}% de remise (Nouveau tarif: ${newTarif.toLocaleString('fr-FR')} ${abonnement.devise || 'MGA'}) !`);
      setShowRenewalModal(false);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error('Erreur validation renouvellement:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la validation du renouvellement.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '840px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.25s ease' }}
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
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                    onClick={handleValidateRenewalWithDiscount}
                    disabled={loading}
                  >
                    {loading ? 'Validation...' : 'Valider le renouvellement'}
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

        {/* CONTENU : Soit Formulaire d'édition, soit Affichage des détails */}
        {isEditing ? (
          <form onSubmit={handleSaveUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '1.2rem' }}>

            {/* Ligne 1 : Client & Commercial */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
              <div className="modal-form-group">
                <label className="modal-label">Client (Raison Sociale) :</label>
                <select
                  className="modal-select"
                  value={formData.id_client}
                  onChange={(e) => setFormData({ ...formData, id_client: e.target.value })}
                >
                  <option value="">-- Sélectionner un client --</option>
                  {clientsList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.raison_sociale} {c.etat_client ? `(${c.etat_client})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Commercial Attitré :</label>
                <select
                  className="modal-select"
                  value={formData.id_commercial}
                  onChange={(e) => setFormData({ ...formData, id_commercial: e.target.value })}
                >
                  <option value="">-- Sélectionner un commercial --</option>
                  {commercialsList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nom} {u.role ? `(${u.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ligne 2 : Campagne / Annonceur */}
            <div className="modal-form-group">
              <label className="modal-label">Campagne / Annonceur :</label>
              <input
                type="text"
                className="modal-input"
                value={formData.annonceur_campagne}
                onChange={(e) => setFormData({ ...formData, annonceur_campagne: e.target.value })}
                placeholder="Ex: Campagne lancement été, Orange 5G..."
              />
            </div>

            {/* Section : Gestion des supports liés (Ajout / Suppression avec règle métier verrouillée si actif) */}
            <div className="modal-form-group" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <label className="modal-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={16} style={{ color: '#06b6d4' }} />
                  <span>Supports rattachés au contrat :</span>
                </label>
                {isLockedForSupportEdit && (
                  <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
                    🔒 Verrouillé (Actif / Archivé)
                  </span>
                )}
              </div>

              {/* Message d'avertissement si verrouillé */}
              {isLockedForSupportEdit && (
                <div style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#f59e0b',
                  fontSize: '0.82rem',
                  marginBottom: '0.75rem'
                }}>
                  ⚠️ L'abonnement est déjà actif (ou archivé) : la modification des supports liés requiert une autorisation de l'administrateur.
                </div>
              )}

              {/* Badges des supports actuels avec bouton de suppression si non actif */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: isLockedForSupportEdit ? '0' : '0.75rem' }}>
                {selectedSupports.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontStyle: 'italic' }}>
                    Aucun support associé à ce contrat
                  </span>
                ) : (
                  selectedSupports.map((sup) => {
                    const check = checkSupportAvailabilityOnDates(sup, formData.date_debut, formData.date_echeance);
                    const hasConflict = !check.available;
                    return (
                      <span
                        key={sup}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background: hasConflict ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                          color: hasConflict ? '#ef4444' : '#06b6d4',
                          border: hasConflict ? '1px solid #ef4444' : '1px solid rgba(6, 182, 212, 0.35)'
                        }}
                        title={hasConflict ? `Conflit détecté sur cette période avec le contrat ${check.conflictWith?.reference}` : ''}
                      >
                        📍 {sup}
                        {hasConflict && (
                          <span title="Attention : ce support est en conflit sur les dates choisies !" style={{ fontSize: '0.8rem', cursor: 'help' }}>
                            ⚠️
                          </span>
                        )}
                        {!isLockedForSupportEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSupport(sup)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              marginLeft: '0.2rem'
                            }}
                            title={`Retirer le support ${sup}`}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </span>
                    );
                  })
                )}
              </div>

              {/* Sélecteur pour ajouter un support (uniquement si non verrouillé) */}
              {!isLockedForSupportEdit && (
                <div style={{ marginTop: '0.6rem' }}>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <select
                      className="modal-select"
                      style={{ flex: 1 }}
                      value={supportToAdd}
                      onChange={(e) => setSupportToAdd(e.target.value)}
                    >
                      <option value="">
                        {filteredAvailableEmplacements.length > 0
                          ? `-- Sélectionner un support disponible à ajouter (${filteredAvailableEmplacements.length} libres) --`
                          : `-- Aucun support disponible sur cette période --`}
                      </option>
                      {filteredAvailableEmplacements.map(emp => (
                        <option key={emp.reference} value={emp.reference}>
                          {emp.reference} — {emp.nom_type_support || emp.nom_type || 'Support'} ({emp.nom_zone || 'Zone'})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="pill-btn active"
                      style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      onClick={handleAddSupport}
                      disabled={!supportToAdd}
                    >
                      + Ajouter
                    </button>
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: filteredAvailableEmplacements.length > 0 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {filteredAvailableEmplacements.length > 0
                      ? `✓ ${filteredAvailableEmplacements.length} support(s) disponible(s) entre le ${formData.date_debut || '...'} et le ${formData.date_echeance || '...'}`
                      : `⚠️ Aucun support disponible sur la période du ${formData.date_debut || '...'} au ${formData.date_echeance || '...'}`
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Ligne 3 : Tarif, Devise & Périodicité */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '0.8rem' }}>
              <div className="modal-form-group">
                <label className="modal-label">Tarif :</label>
                <input
                  type="number"
                  step="any"
                  className="modal-input"
                  value={formData.tarif}
                  onChange={(e) => setFormData({ ...formData, tarif: e.target.value })}
                  placeholder="Ex: 2500000"
                />
              </div>
              <div className="modal-form-group">
                <label className="modal-label">Devise :</label>
                <select
                  className="modal-select"
                  value={formData.devise}
                  onChange={(e) => setFormData({ ...formData, devise: e.target.value })}
                >
                  <option value="MGA">MGA</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="modal-form-group">
                <label className="modal-label">Périodicité :</label>
                <select
                  className="modal-select"
                  value={formData.periodicite}
                  onChange={(e) => setFormData({ ...formData, periodicite: e.target.value })}
                >
                  <option value="Mensuel">Mensuel</option>
                  <option value="Trimestriel">Trimestriel</option>
                  <option value="Semestriel">Semestriel</option>
                  <option value="Annuel">Annuel</option>
                </select>
              </div>
            </div>

            {/* Sélecteur de durée du contrat */}
            <div style={{ marginBottom: '0.8rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <label className="modal-label" style={{ marginBottom: '0.35rem', color: '#06b6d4', fontWeight: 600 }}>
                ⏱️ Durée du contrat :
              </label>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="modal-input"
                  style={{ width: '85px', textAlign: 'center', fontWeight: 700 }}
                  value={dureeValeur}
                  onChange={(e) => setDureeValeur(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
                <select
                  className="modal-select"
                  style={{ width: '130px' }}
                  value={dureeUnite}
                  onChange={(e) => setDureeUnite(e.target.value)}
                >
                  <option value="an">An(s)</option>
                  <option value="mois">Mois</option>
                </select>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  (Soit {getDureeContratText(dureeValeur, dureeUnite)})
                </span>
              </div>
            </div>

            {/* Ligne 4 : Date Début et Date Échéance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div className="modal-form-group">
                <label className="modal-label">Date de début :</label>
                <input
                  type="date"
                  className="modal-input"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                />
              </div>
              <div className="modal-form-group">
                <label className="modal-label">Date d'échéance (Calculée) :</label>
                <input
                  type="date"
                  className="modal-input"
                  value={formData.date_echeance}
                  onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
                />
              </div>
            </div>

            {/* Ligne 5 : Statut & Probabilité de renouvellement */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div className="modal-form-group">
                <label className="modal-label">Statut du contrat :</label>
                <select
                  className="modal-select"
                  value={formData.id_type_statut || formData.statut}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matchedType = typeStatutList.find(t => String(t.id) === String(val) || t.nom_statut.toLowerCase() === val.toLowerCase());
                    setFormData({
                      ...formData,
                      id_type_statut: matchedType ? matchedType.id : val,
                      statut: matchedType ? matchedType.nom_statut : val
                    });
                  }}
                >
                  {typeStatutList && typeStatutList.length > 0 ? (
                    typeStatutList.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.nom_statut.charAt(0).toUpperCase() + st.nom_statut.slice(1)}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Actif">Actif</option>
                      <option value="En attente">En attente</option>
                      <option value="Terminé">Terminé</option>
                      <option value="Résilié">Résilié</option>
                    </>
                  )}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Probabilité de renouvellement (%) :</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="modal-input"
                  value={formData.probabilite_renouvellement}
                  onChange={(e) => setFormData({ ...formData, probabilite_renouvellement: e.target.value })}
                />
              </div>
            </div>

            {/* Ligne 6 : Préavis & Reconduction tacite */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
              <div className="modal-form-group">
                <label className="modal-label">Préavis de résiliation (en jours) :</label>
                <input
                  type="number"
                  min="0"
                  className="modal-input"
                  value={formData.preavis_jours}
                  onChange={(e) => setFormData({ ...formData, preavis_jours: e.target.value })}
                  placeholder="30"
                />
              </div>

              <div className="modal-form-group" style={{ paddingTop: '1.2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={formData.reconduction_tacite}
                    onChange={(e) => setFormData({ ...formData, reconduction_tacite: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                  <span>Reconduction tacite automatique</span>
                </label>
              </div>
            </div>

            {/* Ligne 7 : Contrat Précédent & Motif de non-renouvellement */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div className="modal-form-group">
                <label className="modal-label">Contrat précédent (Remplacement/Avenant) :</label>
                <select
                  className="modal-select"
                  value={formData.id_abonnement_precedent}
                  onChange={(e) => setFormData({ ...formData, id_abonnement_precedent: e.target.value })}
                >
                  <option value="">-- Aucun contrat précédent --</option>
                  {abonnementsList
                    .filter(a => a.reference !== abonnement.reference)
                    .map(a => (
                      <option key={a.reference} value={a.reference}>
                        {a.reference} ({a.raison_sociale || 'Client'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Motif de non-renouvellement (si applicable) :</label>
                <input
                  type="text"
                  className="modal-input"
                  value={formData.motif_non_renouvellement}
                  onChange={(e) => setFormData({ ...formData, motif_non_renouvellement: e.target.value })}
                  placeholder="Ex: Budget annuel réduit, fin de campagne..."
                />
              </div>
            </div>

            {/* Pied du formulaire : Boutons */}
            <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="pill-btn"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="pill-btn active"
                disabled={loading}
                style={{ padding: '0.65rem 1.4rem' }}
              >
                {loading ? 'Enregistrement...' : '💾 Sauvegarder'}
              </button>
            </div>
          </form>
        ) : (
          /* MODE AFFICHAGE DÉTAILS */
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

              {/* Affichage soigné des supports liés sous forme de badges */}
              <div className="client-abo-card" style={{ gridColumn: 'span 2' }}>
                <span className="client-abo-label">Supports Liés / Emplacements :</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                  {selectedSupports.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>Aucun support associé</span>
                  ) : (
                    selectedSupports.map(s => (
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
                <span className="client-abo-label">Probabilité de Renouvellement :</span>
                <div className="client-abo-value" style={{ fontWeight: 700, color: (abonnement.probabilite_renouvellement ?? 80) >= 75 ? '#10b981' : '#f59e0b' }}>
                  {abonnement.probabilite_renouvellement ?? 80} %
                </div>
              </div>

              <div className="client-abo-card">
                <span className="client-abo-label">Préavis & Reconduction :</span>
                <div className="client-abo-value">
                  {abonnement.preavis_jours ? `${abonnement.preavis_jours} jours` : '30 jours'} {abonnement.reconduction_tacite ? '(Tacite)' : '(Non tacite)'}
                </div>
              </div>

              {/* STATUT ACTUEL AVEC CHANGEMENT RAPIDE AU CLIC */}
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

              {/* Contrat précédent (si présent) */}
              {abonnement.id_abonnement_precedent && (
                <div className="client-abo-card">
                  <span className="client-abo-label">Contrat Précédent :</span>
                  <div className="client-abo-value" style={{ color: '#06b6d4' }}>
                    Contrat N° {abonnement.id_abonnement_precedent}
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

            {/* Pied de Modale : Supprimer (Admin, Resp_Com), Fermer, Renouveler remise (Admin, Direction, Resp_Com), Modifier dates/montant (Admin, Resp_Com, Commercial) */}
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

                {/* Valider un renouvellement avec remise exceptionnelle (Module 1 : Admin, Direction, Resp_Com) */}
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

                {/* Modifier les dates / le montant (Module 1 : Admin, Resp_Com, Commercial) */}
                {canEditDatesMontant && (
                  <button
                    type="button"
                    className="pill-btn active"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => setIsEditing(true)}
                    title="Modifier les dates / le montant (Admin, Resp_Com, Commercial)"
                  >
                    <Edit3 size={15} />
                    <span>Modifier les dates / montant</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
