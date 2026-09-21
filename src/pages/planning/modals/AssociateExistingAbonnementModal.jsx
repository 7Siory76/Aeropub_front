import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertTriangle, Calendar, User, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { abonnementsApi } from '../../../api';

export default function AssociateExistingAbonnementModal({
    targetEmp,
    abonnements = [],
    selectedDate,
    onClose,
    onSuccess
}) {
    const [loading, setLoading] = useState(false);

    // 1. Filtrer les abonnements : Date comprise + Pas actif + Pas archivé
    const eligibleAbonnements = useMemo(() => {
        if (!selectedDate) return [];
        const targetTime = new Date(selectedDate + 'T12:00:00').getTime();
        return abonnements.filter((abo) => {
            const rawSt = String(abo.statut_abonnement || abo.statut || '').trim().toLowerCase();
            const cleanSt = rawSt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            // Exclure "actif", "archivé", "résilié", "annulé", "expiré"
            if (
                cleanSt.includes('actif') || 
                cleanSt.includes('archiv') || 
                cleanSt.includes('resili') || 
                cleanSt.includes('annul') || 
                cleanSt.includes('expir')
            ) {
                return false;
            }
            // Vérifier que la date sélectionnée est comprise entre début et fin
            const startStr = String(abo.date_debut || '').trim().replace(' ', 'T');
            const endStr = String(abo.date_fin || abo.date_echeance || '').trim().replace(' ', 'T');

            const startTime = new Date(startStr).getTime();
            const endTime = new Date(endStr).getTime();

            if (isNaN(startTime) || isNaN(endTime)) return false;
            return targetTime >= startTime && targetTime <= endTime;
        });
    }, [abonnements, selectedDate]);

    const [selectedAboRef, setSelectedAboRef] = useState(
        eligibleAbonnements[0]?.reference || ''
    );
    // Détails de l'abonnement actuellement sélectionné dans le menu déroulant
    const currentSelectedAbo = useMemo(() => {
        return eligibleAbonnements.find((a) => a.reference === selectedAboRef) || null;
    }, [eligibleAbonnements, selectedAboRef]);

    // 2. Action : Lier l'emplacement au contrat sélectionné
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAboRef) {
            toast.error('Veuillez sélectionner un abonnement dans la liste.');
            return;
        }
        setLoading(true);
        try {
            // Met à jour l'abonnement en lui associant le support
            await abonnementsApi.update(selectedAboRef, {
                reference_support: targetEmp.reference
            });
            toast.success(
                `L'emplacement ${targetEmp.reference} a été associé avec succès à l'abonnement ${selectedAboRef} !`
            );
            onClose();
            if (onSuccess) onSuccess(); // Rafraîchit les données du planning
        } catch (err) {
            console.error("Erreur lors de l'association :", err);
            const msg = err.response?.data?.message || "Erreur lors de l'association de l'abonnement.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };
    const formatDateFr = (dStr) => {
        if (!dStr) return '-';
        const d = new Date(String(dStr).replace(' ', 'T'));
        return isNaN(d.getTime()) ? dStr : d.toLocaleDateString('fr-FR');
    };


    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
                <button className="modal-close-btn" onClick={onClose} type="button">
                    <X size={20} />
                </button>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                    🔗 Associer à un abonnement non actif
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                    Emplacement cible : <strong style={{ color: '#6366f1' }}>{targetEmp?.reference}</strong> ({targetEmp?.nom_type_support || 'Support'}) — Date : <strong>{formatDateFr(selectedDate)}</strong>
                </p>
                {eligibleAbonnements.length === 0 ? (
                    /* Cas où aucun abonnement ne correspond */
                    <div style={{
                        padding: '1.5rem',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        textAlign: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <AlertTriangle size={32} style={{ color: '#ef4444', margin: '0 auto 0.5rem' }} />
                        <p style={{ color: 'var(--text-main)', fontWeight: 600, margin: 0 }}>
                            Aucun abonnement en attente trouvé
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                            Il n'existe aucun contrat non actif et non archivé couvrant la date du <strong>{formatDateFr(selectedDate)}</strong>.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            style={{ marginTop: '1rem' }}
                        >
                            Fermer
                        </button>
                    </div>
                ) : (
                    /* Formulaire de sélection de l'abonnement */
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                                Choisir l'abonnement ({eligibleAbonnements.length} disponible{eligibleAbonnements.length > 1 ? 's' : ''}) :
                            </label>
                            <select
                                className="search-input"
                                style={{ borderRadius: '10px', padding: '0.75rem', width: '100%' }}
                                value={selectedAboRef}
                                onChange={(e) => setSelectedAboRef(e.target.value)}
                            >
                                {eligibleAbonnements.map((abo) => {
                                    const clientNom = abo.raison_sociale || abo.nom_client || `Client #${abo.id_client}`;
                                    const statutAbo = abo.statut_abonnement || abo.statut || 'En attente';
                                    return (
                                        <option key={abo.reference} value={abo.reference}>
                                            {abo.reference} — {clientNom} ({statutAbo})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        {/* Fiche récapitulative de l'abonnement sélectionné */}
                        {currentSelectedAbo && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '10px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border-glass)',
                                marginBottom: '1.5rem',
                                fontSize: '0.86rem',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.75rem'
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Client :</span>
                                    <strong>{currentSelectedAbo.raison_sociale || currentSelectedAbo.nom_client}</strong>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Statut actuel :</span>
                                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                                        {currentSelectedAbo.statut_abonnement || currentSelectedAbo.statut || 'En attente'}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Période contractuelle :</span>
                                    <span>Du {formatDateFr(currentSelectedAbo.date_debut)} au {formatDateFr(currentSelectedAbo.date_fin || currentSelectedAbo.date_echeance)}</span>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Campagne :</span>
                                    <span>{currentSelectedAbo.annonceur_campagne || 'Standard'}</span>
                                </div>
                            </div>
                        )}
                        {/* Boutons d'action */}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                                Annuler
                            </button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Association en cours...' : 'Associer ce support'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
