import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3, Trash2, MapPin, Layers, Monitor, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { emplacementsApi } from '../../../api';

export default function EmplacementDetailsModal({
  emplacement,
  onClose,
  onRefresh,
  typeSupports = [],
  categories = [],
  zones = []
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // État du formulaire d'édition
  const [formData, setFormData] = useState({
    etat: emplacement?.etat || emplacement?.statut || 'Disponible',
    caracteristiques: emplacement?.caracteristiques || '',
    observation: emplacement?.observation || ''
  });

  if (!emplacement) return null;

  // Action : Supprimer le support via l'API REST
  const handleDelete = async () => {
    const confirmed = window.confirm(`Êtes-vous sûr de supprimer le support "${emplacement.reference}" ?`);
    if (!confirmed) return;
    setLoading(true);
    try {
      await emplacementsApi.delete(emplacement.reference);
      alert(`Support "${emplacement.reference}" supprimé avec succès.`);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur de suppression:', err);
      alert(`Impossible de supprimer le support "${emplacement.reference}".`);
    } finally {
      setLoading(false);
    }
  };

  // Action : Enregistrer les modifications via l'API REST
  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await emplacementsApi.update(emplacement.reference, {
        etat: formData.etat,
        statut: formData.etat,
        caracteristiques: formData.caracteristiques,
        observation: formData.observation
      });
      alert(`Support "${emplacement.reference}" mis à jour avec succès !`);
      setIsEditing(false);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur de mise à jour:', err);
      alert('Erreur lors de la mise à jour du support.');
    } finally {
      setLoading(false);
    }
  };

  const isOccupied = (emplacement.etat || emplacement.statut || '').toLowerCase().includes('occup');

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '620px', animation: 'scaleUp 0.25s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la Modale */}
        <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 className="client-modal-title" style={{ fontSize: '1.4rem' }}>
                📍 REF : {emplacement.reference}
              </h3>
              <span className={`wireframe-badge ${!isOccupied ? 'badge-available' : 'badge-occupied'}`}>
                {emplacement.etat || emplacement.statut || 'Disponible'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Fiche détaillée et gestion du support publicitaire (base_v3.sql)
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Mode Édition (Formulaire) */}
        {isEditing ? (
          <form onSubmit={handleSaveUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div className="modal-form-group">
              <label className="modal-label">État du Support :</label>
              <select
                className="modal-select"
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
              >
                <option value="Disponible">Disponible</option>
                <option value="Occupé">Occupé</option>
                <option value="En maintenance">En maintenance</option>
                <option value="Réservé">Réservé</option>
              </select>
            </div>

            <div className="modal-form-group">
              <label className="modal-label">Caractéristiques / Dimensions :</label>
              <input
                type="text"
                className="modal-input"
                value={formData.caracteristiques}
                onChange={(e) => setFormData({ ...formData, caracteristiques: e.target.value })}
                placeholder="ex: 1.60 x 2.40, Pack 8 écrans..."
              />
            </div>

            <div className="modal-form-group">
              <label className="modal-label">Observation & Remarques :</label>
              <textarea
                className="modal-input"
                style={{ height: '80px', resize: 'vertical' }}
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                placeholder="Remarques techniques ou attribution..."
              />
            </div>

            <div className="modal-footer">
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
          /* Mode Affichage Détails */
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="client-abo-card">
                <span className="client-abo-label">Type de Support :</span>
                <div className="client-abo-value" style={{ color: 'var(--accent-primary)' }}>
                  {emplacement.nom_type_support || emplacement.nom_type || 'N/A'}
                </div>
              </div>
              <div className="client-abo-card">
                <span className="client-abo-label">Catégorie :</span>
                <div className="client-abo-value">
                  {emplacement.nom_categorie || 'Général'}
                </div>
              </div>
              <div className="client-abo-card">
                <span className="client-abo-label">Zone Terminale :</span>
                <div className="client-abo-value">
                  {emplacement.nom_zone || emplacement.nom_lieu || 'N/A'}
                </div>
              </div>
              <div className="client-abo-card">
                <span className="client-abo-label">Aéroport & Périmètre :</span>
                <div className="client-abo-value">
                  {emplacement.nom_aeroport || 'Ivato'} ({emplacement.nom_perimetre || emplacement.type_zone || 'National'})
                </div>
              </div>
              <div className="client-abo-card">
                <span className="client-abo-label">Caractéristiques :</span>
                <div className="client-abo-value">
                  {emplacement.caracteristiques || emplacement.ref_format || 'Non spécifié'}
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
