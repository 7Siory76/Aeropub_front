import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3, Trash2, Calendar, User, DollarSign, Layers, ShieldCheck, Percent, FileText } from 'lucide-react';
import { abonnementsApi } from '../../../../../FRONT_OFFICE/src/api';

export default function AbonnementDetailsModal({
    abonnement,
    onClose,
    onRefresh,
    typeStatut = []
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

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

    // 1. Action : Sauvegarder les modifications
    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await abonnementsApi.update(abonnement.reference, {
                annonceur_campagne: formData.annonceur_campagne,
                tarif: formData.tarif,
                devise: formData.devise,
                periodicite: formData.periodicite,
                date_debut: formData.date_debut,
                date_echeance: formData.date_echeance,
                probabilite_renouvellement: formData.probabilite_renouvellement,
                statut: formData.statut,
                id_type_statut: formData.id_type_statut || undefined
            });
            alert(`Abonnement "${abonnement.reference}" mis à jour avec succès !`);
            setIsEditing(false);
            onClose();
            if (onRefresh) onRefresh();
        }
        catch (err) {
            console.error('Erreur lors de la mise à jour de l’abonnement:', err);
            alert("Erreur lors de l'enregistrement de l'abonnement.");
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
                style={{ maxWidth: '680px', animation: 'scaleUp 0.25s ease' }}
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
                            <div className="client-abo-card">
                                <span className="client-abo-label">Supports Liés / Emplacements :</span>
                                <div className="client-abo-value" style={{ color: '#06b6d4', fontWeight: 600 }}>
                                    {abonnement.supports_associes || abonnement.reference_emplacement || 'Aucun support associé'}
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



