import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Layers, AlertCircle, Loader2 } from 'lucide-react';
import {
  abonnementsApi, emplacementsApi, clientsApi, utilisateursApi, typeStatutAbonnementApi
} from '../../../api';
import { useFeedback } from '../../../context/FeedbackContext';
import { sanitizeUserError } from '../../../utils/errorHandler';
import SearchableSelect from '../../../components/SearchableSelect';
import AbonnementDocuments from '../../../components/AbonnementDocuments';

export default function AbonnementEditModal({
  abonnement,
  onClose,
  onSaveSuccess,
  typeStatut = [],
  emplacements = [],
  allAbonnements = [],
  clients = [],
  utilisateurs = []
}) {
  const { showSuccess, scrollToTop } = useFeedback();

  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (modalError) {
      scrollToTop();
    }
  }, [modalError, scrollToTop]);

  // Listes dynamiques pour les sélecteurs
  const [clientsList, setClientsList] = useState(clients);
  const [commercialsList, setCommercialsList] = useState(utilisateurs);
  const [typeStatutList, setTypeStatutList] = useState(typeStatut);
  const [availableEmplacements, setAvailableEmplacements] = useState(emplacements);
  const [abonnementsList, setAbonnementsList] = useState(allAbonnements);

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

  // Formater la date au format YYYY-MM-DD requis par <input type="date" />
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
    preavis_jours: abonnement?.preavis_jours ?? 30,
    reconduction_tacite: Boolean(abonnement?.reconduction_tacite),
    motif_non_renouvellement: abonnement?.motif_non_renouvellement || '',
    id_abonnement_precedent: abonnement?.id_abonnement_precedent || '',
    statut: abonnement?.statut_abonnement || abonnement?.statut || 'Actif',
    id_type_statut: abonnement?.id_type_statut || ''
  });

  // Recharger le formulaire quand l'abonnement change
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
        preavis_jours: abonnement.preavis_jours ?? 30,
        reconduction_tacite: Boolean(abonnement.reconduction_tacite),
        motif_non_renouvellement: abonnement.motif_non_renouvellement || '',
        id_abonnement_precedent: abonnement.id_abonnement_precedent || '',
        statut: abonnement.statut_abonnement || abonnement.statut || 'Actif',
        id_type_statut: abonnement.id_type_statut || ''
      });

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
    }
  }, [abonnement, initialSupports]);

  // Recalcul de l'échéance lorsque la durée change
  useEffect(() => {
    if (!formData.date_debut) return;

    const [year, month, day] = formData.date_debut.split('-').map(Number);
    if (!year || !month || !day) return;

    const dateCalculEcheance = new Date(year, month - 1, day);
    const nombreDuree = parseInt(dureeValeur, 10) || 1;

    if (dureeUnite === 'an') {
      dateCalculEcheance.setFullYear(dateCalculEcheance.getFullYear() + nombreDuree);
    } else if (dureeUnite === 'mois') {
      dateCalculEcheance.setMonth(dateCalculEcheance.getMonth() + nombreDuree);
    }

    const anneeEcheance = dateCalculEcheance.getFullYear();
    const moisEcheance = String(dateCalculEcheance.getMonth() + 1).padStart(2, '0');
    const jourEcheance = String(dateCalculEcheance.getDate()).padStart(2, '0');

    const durationChanged =
      prevDurationRef.current.val !== nombreDuree ||
      prevDurationRef.current.unite !== dureeUnite;

    let autoPeriodicite = null;
    if (durationChanged) {
      if (dureeUnite === 'mois') {
        if (nombreDuree <= 1) autoPeriodicite = 'Mensuel';
        else if (nombreDuree >= 2 && nombreDuree <= 4) autoPeriodicite = 'Trimestriel';
        else if (nombreDuree >= 5 && nombreDuree <= 8) autoPeriodicite = 'Semestriel';
        else autoPeriodicite = 'Annuel';
      } else {
        autoPeriodicite = 'Annuel';
      }
      prevDurationRef.current = { val: nombreDuree, unite: dureeUnite };
    }

    setFormData(prev => ({
      ...prev,
      date_echeance: `${anneeEcheance}-${moisEcheance}-${jourEcheance}`,
      ...(autoPeriodicite ? { periodicite: autoPeriodicite } : {})
    }));
  }, [formData.date_debut, dureeValeur, dureeUnite]);

  // Charger les listes nécessaires si non passées en props
  useEffect(() => {
    if (emplacements?.length) setAvailableEmplacements(emplacements);
    else emplacementsApi.getAll().then(data => setAvailableEmplacements(data || [])).catch(() => {});

    if (allAbonnements?.length) setAbonnementsList(allAbonnements);
    else abonnementsApi.getAll().then(data => setAbonnementsList(data || [])).catch(() => {});

    if (clients?.length) setClientsList(clients);
    else clientsApi.getAll().then(data => setClientsList(data || [])).catch(() => {});

    if (utilisateurs?.length) setCommercialsList(utilisateurs);
    else utilisateursApi.getAll().then(data => setCommercialsList(data || [])).catch(() => {});

    if (typeStatut?.length) setTypeStatutList(typeStatut);
    else typeStatutAbonnementApi.getAll().then(data => setTypeStatutList(data || [])).catch(() => {});
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
      if (otherAbo.reference === abonnement.reference) continue;

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

      const otherStartStr = String(otherAbo.date_debut || '').trim().replace(' ', 'T');
      const otherEndStr = String(otherAbo.date_fin || otherAbo.date_echeance || '').trim().replace(' ', 'T');
      const otherStartTime = new Date(otherStartStr).getTime();
      const otherEndTime = new Date(otherEndStr).getTime();

      if (isNaN(otherStartTime) || isNaN(otherEndTime)) continue;

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
    setModalError('');
    if (isLockedForSupportEdit) {
      setModalError("L'abonnement est déjà actif (ou archivé) : la suppression d'un support requiert une autorisation administrateur.");
      return;
    }
    setSelectedSupports(prev => prev.filter(s => s !== supRef));
  };

  // Ajouter un support à la liste
  const handleAddSupport = () => {
    setModalError('');
    if (isLockedForSupportEdit) {
      setModalError("L'abonnement est déjà actif (ou archivé) : l'ajout d'un support requiert une autorisation administrateur.");
      return;
    }
    if (!supportToAdd) return;

    const check = checkSupportAvailabilityOnDates(supportToAdd, formData.date_debut, formData.date_echeance);
    if (!check.available) {
      const conflictAbo = check.conflictWith;
      const deb = check.conflictDebut ? new Date(check.conflictDebut).toLocaleDateString('fr-FR') : '';
      const fin = check.conflictFin ? new Date(check.conflictFin).toLocaleDateString('fr-FR') : '';
      setModalError(
        `Le support "${supportToAdd}" n'est pas disponible sur la période sélectionnée : il est déjà réservé du ${deb} au ${fin} par le contrat ${conflictAbo?.reference} (${conflictAbo?.raison_sociale || 'Client'}).`
      );
      return;
    }

    if (!selectedSupports.includes(supportToAdd)) {
      setSelectedSupports(prev => [...prev, supportToAdd]);
    }
    setSupportToAdd('');
  };

  // Sauvegarder les modifications
  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    setModalError('');
    if (formData.date_debut && formData.date_echeance && new Date(formData.date_echeance) < new Date(formData.date_debut)) {
      setModalError("La date d'échéance doit être postérieure ou égale à la date de début.");
      return;
    }
    setLoading(true);
    try {
      for (const supRef of selectedSupports) {
        const check = checkSupportAvailabilityOnDates(supRef, formData.date_debut, formData.date_echeance);
        if (!check.available) {
          const conflictAbo = check.conflictWith;
          const deb = check.conflictDebut ? new Date(check.conflictDebut).toLocaleDateString('fr-FR') : '';
          const fin = check.conflictFin ? new Date(check.conflictFin).toLocaleDateString('fr-FR') : '';
          setModalError(
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
        preavis_jours: formData.preavis_jours !== '' ? parseInt(formData.preavis_jours, 10) : undefined,
        reconduction_tacite: formData.reconduction_tacite,
        motif_non_renouvellement: formData.motif_non_renouvellement,
        id_abonnement_precedent: formData.id_abonnement_precedent || null,
        statut: formData.statut,
        id_type_statut: formData.id_type_statut || undefined,
        supports: selectedSupports
      });

      showSuccess(`Abonnement "${abonnement.reference}" mis à jour avec succès !`);
      if (onSaveSuccess) onSaveSuccess();
      else onClose();
    } catch (err) {
      const msg = sanitizeUserError(err, "Erreur lors de l'enregistrement de l'abonnement.");
      setModalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose} style={{ zIndex: 10001 }}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '840px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.25s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la modale d'édition */}
        <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="client-modal-title" style={{ fontSize: '1.35rem' }}>
              ✏️ Modifier le Contrat : {abonnement.reference || `#${abonnement.id}`}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Client : <strong>{abonnement.raison_sociale || abonnement.nom_client || 'Client standard'}</strong>
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

        <form onSubmit={handleSaveUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '1.2rem' }}>

          {/* Ligne 1 : Client & Commercial */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <div className="modal-form-group">
              <label className="modal-label">Client (Raison Sociale) :</label>
              <SearchableSelect
                options={clientsList}
                value={formData.id_client}
                onChange={(selectedClientId) => setFormData(prev => ({ ...prev, id_client: selectedClientId }))}
                placeholder="-- Sélectionner un client --"
                searchPlaceholder="Rechercher un client (nom, secteur)..."
                getOptionValue={(c) => c.id}
                getOptionLabel={(c) => c.raison_sociale || c.nom_client}
                getOptionSublabel={(c) => c.secteur_activite ? `Secteur : ${c.secteur_activite}` : (c.contact || null)}
                getOptionBadge={(c) => c.etat_client || null}
              />
            </div>

            <div className="modal-form-group">
              <label className="modal-label">Commercial Attitré :</label>
              <SearchableSelect
                options={commercialsList}
                value={formData.id_commercial}
                onChange={(selectedCommercialId) => setFormData(prev => ({ ...prev, id_commercial: selectedCommercialId }))}
                placeholder="-- Sélectionner un commercial --"
                searchPlaceholder="Rechercher un commercial..."
                getOptionValue={(u) => u.id}
                getOptionLabel={(u) => u.nom}
                getOptionBadge={(u) => u.role || null}
              />
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

          {/* Section : Gestion des supports liés */}
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

            {!isLockedForSupportEdit && (
              <div style={{ marginTop: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <SearchableSelect
                      options={filteredAvailableEmplacements}
                      value={supportToAdd}
                      onChange={(selectedSupportRef) => setSupportToAdd(selectedSupportRef)}
                      placeholder={filteredAvailableEmplacements.length > 0
                        ? `-- Sélectionner un support disponible à ajouter (${filteredAvailableEmplacements.length} libres) --`
                        : `-- Aucun support disponible sur cette période --`}
                      searchPlaceholder="Rechercher par référence, type, zone..."
                      disabled={filteredAvailableEmplacements.length === 0}
                      getOptionValue={(emp) => emp.reference}
                      getOptionLabel={(emp) => `${emp.reference} — ${emp.nom_type_support || emp.nom_type || 'Support'}`}
                      getOptionSublabel={(emp) => emp.nom_zone ? `Zone : ${emp.nom_zone}` : null}
                    />
                  </div>
                  <button
                    type="button"
                    className="pill-btn active"
                    style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap', height: '44px' }}
                    onClick={handleAddSupport}
                    disabled={!supportToAdd || loading}
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

          {/* Ligne 5 : Statut */}
          <div className="modal-form-group">
            <label className="modal-label">Statut du contrat :</label>
            <select
              className="modal-select"
              value={formData.id_type_statut || formData.statut}
              onChange={(e) => {
                const selectedStatutValue = e.target.value;
                const matchedType = typeStatutList.find(t => String(t.id) === String(selectedStatutValue) || t.nom_statut.toLowerCase() === selectedStatutValue.toLowerCase());
                setFormData({
                  ...formData,
                  id_type_statut: matchedType ? matchedType.id : selectedStatutValue,
                  statut: matchedType ? matchedType.nom_statut : selectedStatutValue
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
              <SearchableSelect
                options={abonnementsList.filter(a => a.reference !== abonnement.reference)}
                value={formData.id_abonnement_precedent}
                onChange={(selectedParentAboRef) => setFormData(prev => ({ ...prev, id_abonnement_precedent: selectedParentAboRef }))}
                placeholder="-- Aucun contrat précédent --"
                searchPlaceholder="Rechercher par référence, client..."
                getOptionValue={(a) => a.reference}
                getOptionLabel={(a) => `${a.reference} (${a.raison_sociale || 'Client'})`}
                getOptionSublabel={(a) => a.annonceur_campagne || null}
              />
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

          {/* Documents & Pièces Jointes en mode Édition */}
          <AbonnementDocuments referenceAbonnement={abonnement.reference} />

          {/* Pied du formulaire : Boutons */}
          <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className="pill-btn"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="pill-btn active"
              disabled={loading}
              style={{ padding: '0.65rem 1.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {loading && <Loader2 size={15} className="btn-spinner" />}
              <span>{loading ? 'Enregistrement...' : '💾 Sauvegarder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
