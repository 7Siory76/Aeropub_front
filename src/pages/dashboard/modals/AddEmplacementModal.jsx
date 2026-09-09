import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, PlusCircle, Check } from 'lucide-react';
import { emplacementsApi } from '../../../api';

export default function AddEmplacementModal({
  onClose,
  onRefresh,
  typeSupports = [],
  categories = [],
  zones = []
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reference: '',
    id_type: typeSupports[0]?.id || 1,
    id_categorie: categories[0]?.id || 1,
    id_zone: zones[0]?.id || 1,
    caracteristiques: '',
    etat: 'Disponible',
    observation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reference.trim()) {
      alert('Veuillez saisir une référence unique (ex: 4A3, NLB2, A2...).');
      return;
    }

    setLoading(true);
    try {
      await emplacementsApi.create({
        reference: formData.reference.trim().toUpperCase(),
        id_type: parseInt(formData.id_type, 10),
        id_categorie: parseInt(formData.id_categorie, 10),
        id_zone: parseInt(formData.id_zone, 10),
        caracteristiques: formData.caracteristiques.trim() || null,
        etat: formData.etat,
        statut: formData.etat,
        observation: formData.observation.trim() || null
      });

      alert(`✅ Support "${formData.reference}" créé avec succès !`);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur lors de la création du support:', err);
      alert('❌ Erreur lors de la création du support. La référence existe peut-être déjà.');
    } finally {
      setLoading(false);
    }
  };

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
            <h3 className="client-modal-title" style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>Nouveau Support Publicitaire</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Ajouter un espace publicitaire dans l'infrastructure aéroportuaire (base_v3.sql)
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Formulaire de création */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Référence */}
            <div className="modal-form-group">
              <label className="modal-label">Référence (ex: NLB2, 4A2) * :</label>
              <input
                type="text"
                required
                className="modal-input"
                placeholder="ex: NLB2"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>

            {/* Type de Support */}
            <div className="modal-form-group">
              <label className="modal-label">Type de Support :</label>
              <select
                className="modal-select"
                value={formData.id_type}
                onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
              >
                {typeSupports.map((ts) => (
                  <option key={ts.id} value={ts.id}>
                    {ts.nom || ts.nom_type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Catégorie */}
            <div className="modal-form-group">
              <label className="modal-label">Catégorie :</label>
              <select
                className="modal-select"
                value={formData.id_categorie}
                onChange={(e) => setFormData({ ...formData, id_categorie: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom || c.nom_categorie}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone Terminale */}
            <div className="modal-form-group">
              <label className="modal-label">Zone Terminale :</label>
              <select
                className="modal-select"
                value={formData.id_zone}
                onChange={(e) => setFormData({ ...formData, id_zone: e.target.value })}
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nom_zone || z.nom_lieu || z.type_zone} {z.nom_aeroport ? `(${z.nom_aeroport})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Caractéristiques & Dimensions */}
          <div className="modal-form-group">
            <label className="modal-label">Caractéristiques / Dimensions :</label>
            <input
              type="text"
              className="modal-input"
              placeholder="ex: 1.60 x 2.40, 4x3 face route..."
              value={formData.caracteristiques}
              onChange={(e) => setFormData({ ...formData, caracteristiques: e.target.value })}
            />
          </div>

          {/* État initial & Observation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.25rem' }}>
            <div className="modal-form-group">
              <label className="modal-label">État Initial :</label>
              <select
                className="modal-select"
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
              >
                <option value="Disponible">Disponible</option>
                <option value="Occupé">Occupé</option>
                <option value="En maintenance">En maintenance</option>
              </select>
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Observation / Remarques :</label>
              <input
                type="text"
                className="modal-input"
                placeholder="Optionnel..."
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="modal-footer">
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.4rem' }}
            >
              {loading ? 'Création en cours...' : (
                <>
                  <Check size={16} />
                  <span>Enregistrer le Support</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
