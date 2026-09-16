import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3, Trash2, Calendar, User, DollarSign, Layers, ShieldCheck, Percent, FileText, AlertTriangle, Plus } from 'lucide-react';
import { abonnementsApi, emplacementsApi } from '../../../api';

export default function AbonnementDetailsModal({
    abonnement,
    onClose,
    onRefresh,
    typeStatut = [],
    emplacements = [],
    allAbonnements = []
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initialiser les supports rattachés
    const initialSupports = useMemo(() => {
        if (Array.isArray(abonnement?.supports)) {
            return abonnement.supports.map(s => typeof s === 'string' ? s : (s.reference_support || s.reference)).filter(Boolean);
        }
        if (abonnement?.supports_associes) {
            return abonnement.supports_associes.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (abonnement?.reference_emplacement) {
            return [abonnement.reference_emplacement.trim()];
        }
        return [];
    }, [abonnement]);

    const [selectedSupports, setSelectedSupports] = useState(initialSupports);
    const [supportToAdd, setSupportToAdd] = useState('');
    const [availableEmplacements, setAvailableEmplacements] = useState(emplacements);
    const [abonnementsList, setAbonnementsList] = useState(allAbonnements);

    useEffect(() => {
        setSelectedSupports(initialSupports);
    }, [initialSupports]);

    useEffect(() => {
        if (emplacements && emplacements.length > 0) {
            setAvailableEmplacements(emplacements);
        } else {
            emplacementsApi.getAll()
                .then(data => setAvailableEmplacements(data || []))
                .catch(() => {});
        }
    }, [emplacements]);

    useEffect(() => {
        if (allAbonnements && allAbonnements.length > 0) {
            setAbonnementsList(allAbonnements);
        } else {
            abonnementsApi.getAll()
                .then(data => setAbonnementsList(data || []))
                .catch(() => {});
        }
    }, [allAbonnements]);

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
        annonceur_campagne: abonnement?.annonceur_campagne || '',
        tarif: abonnement?.tarif || '',
        devise: abonnement?.devise || 'MGA',
        periodicite: abonnement?.periodicite || 'Annuel',
        date_debut: formatDateForInput(abonnement?.date_debut),
        date_echeance: formatDateForInput(abonnement?.date_echeance || abonnement?.date_fin),
        probabilite_renouvellement: abonnement?.probabilite_renouvellement ?? 80,
        statut: abonnement?.statut_abonnement || abonnement?.statut || 'Actif',
        id_type_statut: abonnement?.id_type_statut || ''
    });

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

            // Ignorer les contrats archivés, résiliés ou annulés
            const st = String(otherAbo.statut_abonnement || otherAbo.statut || '').trim().toLowerCase();
            if (st.includes('archiv') || st.includes('resili') || st.includes('annul')) continue;

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

    // 1. Action : Sauvegarder les modifications
    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Vérifier la disponibilité de tous les supports sélectionnés sur la période
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
                annonceur_campagne: formData.annonceur_campagne,
                tarif: formData.tarif,
                devise: formData.devise,
                periodicite: formData.periodicite,
                date_debut: formData.date_debut,
                date_echeance: formData.date_echeance,
                probabilite_renouvellement: formData.probabilite_renouvellement,
                statut: formData.statut,
                id_type_statut: formData.id_type_statut || undefined,
                supports: selectedSupports
            });
            alert(`Abonnement "${abonnement.reference}" mis à jour avec succès !`);
            setIsEditing(false);
            onClose();
            if (onRefresh) onRefresh();
        }
        catch (err) {
            console.error('Erreur lors de la mise à jour de l’abonnement:', err);
            const msg = err.response?.data?.message || "Erreur lors de l'enregistrement de l'abonnement.";
            alert(msg);
        }
        finally {
            setLoading(false);
        }
    };

    // 2. Action : Supprimer le contrat (avec confirmation)
    const handleDelete = async () => {
        const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le contrat "${abonnement.reference}" ?`);
        if (!confirmed) return;
        setLoading(true);
        try {
            await abonnementsApi.delete(abonnement.reference);
            alert(`Contrat "${abonnement.reference}" supprimé.`);
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

    return createPortal(
        <div className="modal-backdrop-portal" onClick={onClose}>
            <div
                className="glass-panel client-modal-box"
                style={{ maxWidth: '700px', animation: 'scaleUp 0.25s ease' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* En-tête */}
                <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <h3 className="client-modal-title" style={{ fontSize: '1.35rem' }}>
                                📄 Contrat : {abonnement.reference || `#${abonnement.id}`}
                            </h3>
                            <span className={`wireframe-badge ${isActif ? 'badge-available' : 'badge-occupied'}`}>
                                {statutStr}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Client : <strong>{abonnement.raison_sociale || abonnement.nom_client || 'Client standard'}</strong>
                        </p>
                    </div>
                    <button type="button" className="close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* CONTENU : Soit Formulaire d'édition, soit Affichage des détails */}
                {isEditing ? (
                    <form onSubmit={handleSaveUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '1.2rem' }}>

                        {/* Ligne 1 : Campagne / Annonceur */}
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

                        {/* Section : Gestion des supports liés (Ajout / Suppression) */}
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
                                                    {emp.reference} — {emp.nom_type_support || 'Support'} ({emp.nom_zone || 'Zone'})
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

                        {/* Ligne 2 : Tarif, Devise & Périodicité */}
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

                        {/* Ligne 3 : Date Début et Date Échéance */}
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
                                <label className="modal-label">Date d'échéance :</label>
                                <input
                                    type="date"
                                    className="modal-input"
                                    value={formData.date_echeance}
                                    onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Ligne 4 : Statut & Probabilité de renouvellement */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                            <div className="modal-form-group">
                                <label className="modal-label">Statut du contrat :</label>
                                <select
                                    className="modal-select"
                                    value={formData.id_type_statut || formData.statut}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const matchedType = typeStatut.find(t => String(t.id) === String(val) || t.nom_statut.toLowerCase() === val.toLowerCase());
                                        setFormData({
                                            ...formData,
                                            id_type_statut: matchedType ? matchedType.id : val,
                                            statut: matchedType ? matchedType.nom_statut : val
                                        });
                                    }}
                                >
                                    {typeStatut && typeStatut.length > 0 ? (
                                        typeStatut.map(st => (
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

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
                                    Du {abonnement.date_debut ? new Date(abonnement.date_debut).toLocaleDateString('fr-FR') : '-'} au {abonnement.date_echeance || abonnement.date_fin ? new Date(abonnement.date_echeance || abonnement.date_fin).toLocaleDateString('fr-FR') : '-'}
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
                                    {abonnement.preavis_jours ? `${abonnement.preavis_jours} jours` : '30 jours'} {abonnement.reconduction_tacite ? '(Tacite)' : ''}
                                </div>
                            </div>
                        </div>
                        {/* Pied de Modale : Supprimer, Fermer, Modifier */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                            <button
                                type="button"
                                className="pill-btn"
                                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <Trash2 size={15} />
                                <span>Supprimer</span>
                            </button>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    className="pill-btn"
                                    onClick={onClose}
                                >
                                    Fermer
                                </button>
                                <button
                                    type="button"
                                    className="pill-btn active"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit3 size={15} />
                                    <span>Modifier</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
