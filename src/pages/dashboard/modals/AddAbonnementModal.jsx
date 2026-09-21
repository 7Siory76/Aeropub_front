import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Plus, Copy, FileText, Layers, CheckCircle2,
    AlertTriangle, Calendar, User, DollarSign, Sparkles
} from 'lucide-react';
import {
    abonnementsApi, emplacementsApi, clientsApi,
    utilisateursApi, typeStatutAbonnementApi
} from '../../../api';


export default function AddAbonnementModal({
    onClose,
    onRefresh,
    allAbonnements = [],
    emplacements = [],
    clients = [],
    utilisateurs = [],
    typeStatut = []
}) {
    const [loading, setLoading] = useState(false);

    // Les modes de création
    const [creationMode, setCreationMode] = useState('vierge');
    const [selectedDuplicateRef, setSelectedDuplicateRef] = useState('');

    // Listes de données avec chargement automatique si non fournies
    const [clientsList, setClientsList] = useState(clients);
    const [commercialsList, setCommercialsList] = useState(utilisateurs);
    const [typeStatutList, setTypeStatutList] = useState(typeStatut);
    const [availableEmplacements, setAvailableEmplacements] = useState(emplacements);
    const [abonnementsList, setAbonnementsList] = useState(allAbonnements);

    const [dureeValeur, setDureeValeur] = useState(1);
    const [dureeUnite, setDureeUnite] = useState('an');

    const getDureeContratText = (val, unite) => {
        const n = parseInt(val, 10) || 1;
        if (unite === 'an') {
            return `${n} ${n > 1 ? 'ans' : 'an'}`;
        }
        return `${n} mois`;
    };

    const formatDateForInput = (d) => {
        if (!d) return '';
        try {
            return new Date(d).toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const todayStr = formatDateForInput(new Date());
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const nextYearStr = formatDateForInput(nextYear);

    // État initial du formulaire (Fiche vierge par défaut)
    const [formData, setFormData] = useState({
        reference: '',
        id_client: '',
        annonceur_campagne: '',
        tarif: '',
        devise: 'MGA',
        periodicite: 'Annuel',
        date_debut: todayStr,
        date_echeance: nextYearStr,
        probabilite_renouvellement: 80,
        preavis_jours: 30,
        reconduction_tacite: false,
        motif_non_renouvellement: '',
        id_abonnement_precedent: '',
        statut: 'Brouillon'
    });
    const [selectedSupports, setSelectedSupports] = useState([]);
    const [supportToAdd, setSupportToAdd] = useState('');

    // Recalcul automatique de la date d'échéance selon la durée et date_debut
    useEffect(() => {
        if (!formData.date_debut) return;
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

        let autoPeriodicite = 'Annuel';
        if (dureeUnite === 'mois') {
            if (val <= 1) autoPeriodicite = 'Mensuel';
            else if (val >= 2 && val <= 4) autoPeriodicite = 'Trimestriel';
            else if (val >= 5 && val <= 8) autoPeriodicite = 'Semestriel';
            else autoPeriodicite = 'Annuel';
        } else {
            autoPeriodicite = 'Annuel';
        }

        setFormData(prev => ({
            ...prev,
            date_echeance: `${y}-${m}-${dayStr}`,
            periodicite: autoPeriodicite
        }));
    }, [formData.date_debut, dureeValeur, dureeUnite]);

    //chargement des données
    useEffect(() => {
        if (clients && clients.length > 0) setClientsList(clients);
        else clientsApi.getAll().then(d => setClientsList(d || [])).catch(() => { });
        if (utilisateurs && utilisateurs.length > 0) setCommercialsList(utilisateurs);
        else utilisateursApi.getAll().then(d => setCommercialsList(d || [])).catch(() => { });
        if (emplacements && emplacements.length > 0) setAvailableEmplacements(emplacements);
        else emplacementsApi.getAll().then(d => setAvailableEmplacements(d || [])).catch(() => { });
        if (allAbonnements && allAbonnements.length > 0) setAbonnementsList(allAbonnements);
        else abonnementsApi.getAll().then(d => setAbonnementsList(d || [])).catch(() => { });
        if (typeStatut && typeStatut.length > 0) setTypeStatutList(typeStatut);
        else typeStatutAbonnementApi.getAll().then(d => setTypeStatutList(d || [])).catch(() => { });
    }, [clients, utilisateurs, emplacements, allAbonnements, typeStatut]);

    // Gestion de la duplication d'un contrat existant
    const handleSelectContractToDuplicate = async (ref) => {
        setSelectedDuplicateRef(ref);
        if (!ref) return;

        const source = abonnementsList.find(a =>
            String(a.reference) === String(ref) || String(a.id) === String(ref)
        );
        if (!source) return;

        // Fonction helper pour extraire tous les supports d'un objet contrat
        const extractSupports = (obj) => {
            if (!obj) return [];
            if (Array.isArray(obj.supports) && obj.supports.length > 0) {
                return obj.supports.map(s => typeof s === 'string' ? s : (s.reference_support || s.reference)).filter(Boolean);
            }
            if (obj.supports_associes || obj.supports_list) {
                const raw = obj.supports_associes || obj.supports_list;
                return String(raw).split(/[,;]+/).map(s => s.trim()).filter(Boolean);
            }
            if (obj.reference_emplacement || obj.reference_support) {
                const single = String(obj.reference_emplacement || obj.reference_support).trim();
                return single ? [single] : [];
            }
            return [];
        };

        const sourceSupports = extractSupports(source);

        // Pré-remplissage avec les données du contrat source
        setFormData({
            reference: '', // Nouvelle référence générée automatiquement
            id_client: source.id_client || '',
            id_commercial: source.id_commercial || '',
            annonceur_campagne: source.annonceur_campagne ? `Copie - ${source.annonceur_campagne}` : '',
            tarif: source.tarif ?? '',
            devise: source.devise || 'MGA',
            periodicite: source.periodicite || 'Annuel',
            date_debut: todayStr,
            date_echeance: nextYearStr,
            probabilite_renouvellement: source.probabilite_renouvellement ?? 80,
            preavis_jours: source.preavis_jours ?? 30,
            reconduction_tacite: Boolean(source.reconduction_tacite),
            motif_non_renouvellement: '',
            id_abonnement_precedent: source.reference, // Lie au contrat original
            statut: 'Brouillon'
        });

        setSelectedSupports(sourceSupports);

        // Récupération asynchrone des données fraîches via l'API au cas où
        try {
            const fresh = await abonnementsApi.getById(ref);
            if (fresh) {
                const freshSupports = extractSupports(fresh);
                if (freshSupports.length > 0) {
                    setSelectedSupports(freshSupports);
                }
            }
        } catch (err) {
            // Silencieux, sourceSupports est déjà actif
        }
    };
    // Basculer vers le mode Fiche Vierge
    const handleResetToVierge = () => {
        setCreationMode('vierge');
        setSelectedDuplicateRef('');
        setFormData({
            reference: '',
            id_client: '',
            id_commercial: '',
            annonceur_campagne: '',
            tarif: '',
            devise: 'MGA',
            periodicite: 'Annuel',
            date_debut: todayStr,
            date_echeance: nextYearStr,
            probabilite_renouvellement: 80,
            preavis_jours: 30,
            reconduction_tacite: false,
            motif_non_renouvellement: '',
            id_abonnement_precedent: '',
            statut: 'Brouillon'
        });
        setSelectedSupports([]);
    };

    // Règle métier : Vérification de la disponibilité d'un support sur [date_debut, date_echeance]
    const checkSupportAvailabilityOnDates = (empRef, startDateStr, endDateStr) => {
        if (!empRef || !startDateStr || !endDateStr) return { available: true };
        const cleanEmpRef = String(empRef).trim().toUpperCase();
        const targetStartTime = new Date(startDateStr + 'T00:00:00').getTime();
        const targetEndTime = new Date(endDateStr + 'T23:59:59').getTime();
        if (isNaN(targetStartTime) || isNaN(targetEndTime)) return { available: true };
        for (const otherAbo of abonnementsList) {
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
            const supsList = (otherAbo.supports_associes || '').split(',').map(s => s.trim().toUpperCase());
            const firstSup = String(otherAbo.reference_emplacement || otherAbo.reference_support || '').trim().toUpperCase();
            if (firstSup) supsList.push(firstSup);
            if (!supsList.includes(cleanEmpRef)) continue;
            const otherStart = new Date(String(otherAbo.date_debut || '').replace(' ', 'T')).getTime();
            const otherEnd = new Date(String(otherAbo.date_fin || otherAbo.date_echeance || '').replace(' ', 'T')).getTime();
            if (isNaN(otherStart) || isNaN(otherEnd)) continue;
            if (otherStart <= targetEndTime && otherEnd >= targetStartTime) {
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

    // Liste des supports disponibles sur la période
    const filteredAvailableEmplacements = useMemo(() => {
        return availableEmplacements.filter(emp => {
            if (selectedSupports.includes(emp.reference)) return false;
            const check = checkSupportAvailabilityOnDates(emp.reference, formData.date_debut, formData.date_echeance);
            return check.available;
        });
    }, [availableEmplacements, selectedSupports, formData.date_debut, formData.date_echeance, abonnementsList]);
    const handleAddSupport = () => {
        if (!supportToAdd) return;
        const check = checkSupportAvailabilityOnDates(supportToAdd, formData.date_debut, formData.date_echeance);
        if (!check.available) {
            const c = check.conflictWith;
            alert(`Le support "${supportToAdd}" est déjà réservé par le contrat ${c?.reference} sur cette période.`);
            return;
        }
        if (!selectedSupports.includes(supportToAdd)) {
            setSelectedSupports(prev => [...prev, supportToAdd]);
        }
        setSupportToAdd('');
    };
    const handleRemoveSupport = (supRef) => {
        setSelectedSupports(prev => prev.filter(s => s !== supRef));
    };

    // Soumission et enregistrement du nouveau contrat
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.id_client) {
            alert('Veuillez sélectionner un client.');
            return;
        }
        if (new Date(formData.date_echeance) < new Date(formData.date_debut)) {
            alert("La date d'échéance doit être postérieure à la date de début.");
            return;
        }
        // Vérification finale des conflits sur tous les supports sélectionnés
        for (const supRef of selectedSupports) {
            const check = checkSupportAvailabilityOnDates(supRef, formData.date_debut, formData.date_echeance);
            if (!check.available) {
                alert(`Impossible de créer le contrat : le support "${supRef}" est en conflit de dates.`);
                return;
            }
        }
        setLoading(true);
        try {
            await abonnementsApi.create({
                reference: formData.reference.trim() || undefined, // Auto-généré si non spécifié
                id_client: parseInt(formData.id_client, 10),
                id_commercial: formData.id_commercial ? parseInt(formData.id_commercial, 10) : 1,
                id_abonnement_precedent: formData.id_abonnement_precedent || null,
                annonceur_campagne: formData.annonceur_campagne || null,
                tarif: formData.tarif !== '' ? parseFloat(formData.tarif) : 0,
                devise: formData.devise || 'MGA',
                periodicite: formData.periodicite || 'Annuel',
                date_debut: formData.date_debut,
                date_echeance: formData.date_echeance,
                reconduction_tacite: formData.reconduction_tacite,
                preavis_jours: parseInt(formData.preavis_jours || 30, 10),
                probabilite_renouvellement: parseInt(formData.probabilite_renouvellement || 80, 10),
                motif_non_renouvellement: formData.motif_non_renouvellement || null,
                statut: formData.statut || 'Brouillon',
                supports: selectedSupports
            });
            alert('✅ Nouveau contrat créé avec succès !');
            onClose();
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Erreur création contrat:', err);
            alert(err.response?.data?.message || 'Erreur lors de la création du contrat.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop-portal" onClick={onClose}>
            <div
                className="glass-panel client-modal-box"
                style={{ maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto', animation: 'scaleUp 0.25s ease' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* En-tête */}
                <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <h3 className="client-modal-title" style={{ fontSize: '1.4rem' }}>
                                📄 Nouveau Contrat Publicitaire
                            </h3>
                            <span className="wireframe-badge badge-available">
                                {creationMode === 'dupliquer' ? 'Duplication' : 'Fiche vierge'}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Création d'un nouvel abonnement ou duplication à partir d'un contrat existant (base_v3.sql)
                        </p>
                    </div>
                    <button type="button" className="close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                {/* Onglets de sélection du mode : Fiche Vierge vs Dupliquer */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.1rem', marginBottom: '0.5rem' }}>
                    <button
                        type="button"
                        className={`pill-btn ${creationMode === 'vierge' ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1, justifyContent: 'center' }}
                        onClick={handleResetToVierge}
                    >
                        <FileText size={16} />
                        <span>Créer à partir d'une fiche vierge</span>
                    </button>
                    <button
                        type="button"
                        className={`pill-btn ${creationMode === 'dupliquer' ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1, justifyContent: 'center' }}
                        onClick={() => setCreationMode('dupliquer')}
                    >
                        <Copy size={16} />
                        <span>Dupliquer un contrat existant</span>
                    </button>
                </div>
                {/* Sélecteur de contrat en mode Duplication */}
                {creationMode === 'dupliquer' && (
                    <div style={{
                        background: 'rgba(6, 182, 212, 0.08)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        marginBottom: '0.85rem',
                        marginTop: '0.5rem'
                    }}>
                        <label className="modal-label" style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <Sparkles size={16} />
                            <span>Choisir le contrat modèle à dupliquer :</span>
                        </label>
                        <select
                            className="modal-select"
                            value={selectedDuplicateRef}
                            onChange={(e) => handleSelectContractToDuplicate(e.target.value)}
                        >
                            <option value="">-- Sélectionner un contrat source --</option>
                            {abonnementsList.map(a => (
                                <option key={a.reference} value={a.reference}>
                                    {a.reference} — {a.raison_sociale || a.nom_client || 'Client'} ({a.annonceur_campagne || 'Campagne standard'})
                                </option>
                            ))}
                        </select>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            ℹ️ Les informations de ce contrat (client, commercial, tarifs, supports, etc.) seront automatiquement injectées dans le formulaire.
                        </p>
                    </div>
                )}
                {/* Formulaire de saisie */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '0.8rem' }}>
                    {/* Référence personnalisée optionnelle */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.9rem' }}>
                        <div className="modal-form-group">
                            <label className="modal-label">Référence (optionnel) :</label>
                            <input
                                type="text"
                                className="modal-input"
                                placeholder="Ex: ABO-2026-042 (Auto si vide)"
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            />
                        </div>
                        <div className="modal-form-group">
                            <label className="modal-label">Campagne / Annonceur :</label>
                            <input
                                type="text"
                                className="modal-input"
                                placeholder="Ex: Lancement Fibre 2026, Campagne été..."
                                value={formData.annonceur_campagne}
                                onChange={(e) => setFormData({ ...formData, annonceur_campagne: e.target.value })}
                            />
                        </div>
                    </div>
                    {/* Client & Commercial */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                        <div className="modal-form-group">
                            <label className="modal-label">Client (Raison Sociale) * :</label>
                            <select
                                required
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
                    {/* Durée du contrat & Dates */}
                    <div style={{ marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                        <label className="modal-label" style={{ marginBottom: '0.4rem', color: '#06b6d4', fontWeight: 600 }}>
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
                                (Contrat de {getDureeContratText(dureeValeur, dureeUnite)})
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                        <div className="modal-form-group">
                            <label className="modal-label">Date de début * :</label>
                            <input
                                type="date"
                                required
                                className="modal-input"
                                value={formData.date_debut}
                                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                            />
                        </div>
                        <div className="modal-form-group">
                            <label className="modal-label">Date d'échéance * (Calculée) :</label>
                            <input
                                type="date"
                                required
                                className="modal-input"
                                value={formData.date_echeance}
                                onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
                            />
                        </div>
                    </div>
                    {/* Supports rattachés au contrat */}
                    <div className="modal-form-group" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                        <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                            <Layers size={16} style={{ color: '#06b6d4' }} />
                            <span>Supports rattachés au contrat :</span>
                        </label>
                        {/* Badges des supports */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {selectedSupports.length === 0 ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontStyle: 'italic' }}>
                                    Aucun support sélectionné pour ce contrat
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
                                            {hasConflict && <span>⚠️</span>}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSupport(sup)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    );
                                })
                            )}
                        </div>
                        {/* Ajout d'un support disponible */}
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <select
                                className="modal-select"
                                style={{ flex: 1 }}
                                value={supportToAdd}
                                onChange={(e) => setSupportToAdd(e.target.value)}
                            >
                                <option value="">
                                    {filteredAvailableEmplacements.length > 0
                                        ? `-- Choisir un support libre (${filteredAvailableEmplacements.length} disponibles) --`
                                        : `-- Aucun support disponible sur ces dates --`}
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
                    </div>
                    {/* Tarif, Devise, Périodicité */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '0.8rem' }}>
                        <div className="modal-form-group">
                            <label className="modal-label">Tarif :</label>
                            <input
                                type="number"
                                step="any"
                                className="modal-input"
                                placeholder="Ex: 2500000"
                                value={formData.tarif}
                                onChange={(e) => setFormData({ ...formData, tarif: e.target.value })}
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
                    {/* Statut & Probabilité */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                        <div className="modal-form-group">
                            <label className="modal-label">Statut initial :</label>
                            <select
                                className="modal-select"
                                value={formData.statut}
                                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                            >
                                {typeStatutList && typeStatutList.length > 0 ? (
                                    typeStatutList.map(st => (
                                        <option key={st.id || st.nom_statut} value={st.nom_statut}>
                                            {st.nom_statut.charAt(0).toUpperCase() + st.nom_statut.slice(1)}
                                        </option>
                                    ))
                                ) : (
                                    <>
                                        <option value="Brouillon">Brouillon</option>
                                        <option value="Soumis">Soumis</option>
                                        <option value="Actif">Actif</option>
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
                    {/* Préavis & Reconduction tacite */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
                        <div className="modal-form-group">
                            <label className="modal-label">Préavis (jours) :</label>
                            <input
                                type="number"
                                min="0"
                                className="modal-input"
                                value={formData.preavis_jours}
                                onChange={(e) => setFormData({ ...formData, preavis_jours: e.target.value })}
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
                    {/* Boutons d'action */}
                    <div className="modal-footer" style={{ marginTop: '0.6rem' }}>
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
                            style={{ padding: '0.65rem 1.6rem' }}
                        >
                            {loading ? 'Création en cours...' : '💾 Créer le contrat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );


}