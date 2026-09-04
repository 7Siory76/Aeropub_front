import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3, Trash2, MapPin, Layers, Monitor, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { emplacementsApi } from '../../api/apiService';

export default function EmplacementDetailsModal({ emplacement, onClose, onRefresh, typeSupports = [],
    formats = [], localisations = []
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    //Etat du formulaire d'edition
    const [formData, setFormData] = useState({
        quantite: emplacement.quantite || 1,
        statut: emplacement.statut || 'disponible',
        observation: emplacement.observation || ''
    });
    if (!emplacement) return null;

    //action: supprimer l emplacement via l api rest
    const handleDelete = async () => {
        const confirmed = window.confirm(`Etes-vous sure de supprimer l'emplacement "${emplacement.id}" ?`);
        if (!confirmed) return;
        setLoading(true);
        try {
            await emplacementsApi.delete(emplacement.reference);
            alert(`Emplacement : "${emplacement.reference}" supprimé avec succès`);
            onClose();
            if (onRefresh) onRefresh();

        } catch (err) {
            console.error('erreur de suppression:', err);
            alert(`Impossible de supprimer l'emplacement "${emplacement.reference}". Verifier tout les information`);
        } finally {
            setLoading(false);
        }
    };

    //Action : Enregistrer les modifications via l'Api REST
    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await emplacementsApi.update(emplacement.reference, formData);
            alert(`Emplacement "${emplacement.reference}" est mis à jour !!!!!!`);
            setIsEditing(false);
            onClose();
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('erreurn de mis à jour:', err);
            alert('Erreur lors de la mis à jour le l\'emplacement.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop-portal" onClick={onClose} >
            <div className="glass-panel client-modal-box"
                style={{ maxWidth: '600px', animation: 'scaleUp 0.25s ease' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* En-tête de la Modale */}
                <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <h3 className="client-modal-title" style={{ fontSize: '1.4rem' }}>
                                📍 REF : {emplacement.reference}
                            </h3>
                            <span className={`wireframe-badge ${emplacement.statut === 'disponible' ? 'badge-available' : 'badge-occupied'}`}>
                                {emplacement.statut || 'disponible'}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Fiche détaillée et gestion de l'emplacement publicitaire
                        </p>
                    </div>
                    <button type="button" className="close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>


                {/* Mode Édition (Formulaire) */}
                {isEditing ? (
                    <form onSubmit={handleSaveUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="client-abo-label">Statut :</label>
                            <select className="ts-filter-select"
                                style={{ width: '100%', padding: '0.6rem' }}
                                value={formData.statut}
                                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                            >
                                <option value="disponible">Disponible</option>
                                <option value="occupe">Occupe</option>

                            </select>
                        </div>
                        <div>
                            <label className="client-abo-label">Quantité :</label>
                            <input
                                type="number"
                                min="1"
                                className="search-input"
                                style={{ borderRadius: '8px', padding: '0.5rem 0.75rem' }}
                                value={formData.quantite}
                                onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value, 10) || 1 })}
                            />
                        </div>
                        <div>
                            <label className="client-abo-label">Observation :</label>
                            <textarea
                                className="search-input"
                                style={{ borderRadius: '8px', padding: '0.6rem', height: '80px', resize: 'vertical' }}
                                value={formData.observation}
                                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                                placeholder="Remarques ou détails techniques..."
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
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
                            >
                                {loading ? 'Enregistrement...' : '💾 Sauvegarder'}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Mode Affichage Détails */
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="client-abo-card">
                                <span className="client-abo-label">Type de Support :</span>
                                <div className="client-abo-value" style={{ color: 'var(--accent-primary)' }}>
                                    {emplacement.nom_type_support || 'N/A'}
                                </div>
                            </div>
                            <div className="client-abo-card">
                                <span className="client-abo-label">Format :</span>
                                <div className="client-abo-value">
                                    {emplacement.ref_format || 'N/A'}
                                </div>
                            </div>
                            <div className="client-abo-card">
                                <span className="client-abo-label">Zone & Localisation :</span>
                                <div className="client-abo-value">
                                    {emplacement.nom_lieu || 'N/A'} ({emplacement.type_zone || 'Zone N/A'})
                                </div>
                            </div>
                            <div className="client-abo-card">
                                <span className="client-abo-label">Catégorie :</span>
                                <div className="client-abo-value">
                                    {emplacement.nom_categorie || 'Général'}
                                </div>
                            </div>
                            <div className="client-abo-card">
                                <span className="client-abo-label">Quantité :</span>
                                <div className="client-abo-value">
                                    {emplacement.quantite || 1} unité(s)
                                </div>
                            </div>
                            <div className="client-abo-card">
                                <span className="client-abo-label">Observation :</span>
                                <div className="client-abo-value" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                                    {emplacement.observation || 'Aucune observation'}
                                </div>
                            </div>
                        </div>
                        {/* Pied de Modale : Boutons Modifier, Supprimer, Fermer */}
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
