import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, PlusCircle, Check } from 'lucide-react';
import { emplacementsApi } from '../../api/apiService';

export default function AddEmplacementModal({
  onClose,
  onRefresh,
  typeSupports = [],
  formats = [],
  categories = [],
  localisations = []
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reference: '',
    id_type_support: typeSupports[0]?.id || '',
    id_format: formats[0]?.id || '',
    id_categorie: categories[0]?.id || '',
    id_localisation: localisations[0]?.id || '',
    quantite: 1,
    statut: 'disponible',
    observation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reference.trim()) {
      alert('Veuillez saisir une référence unique (ex: 4A3, NLB2...).');
      return;
    }

    setLoading(true);
    try {
      await emplacementsApi.create({
        reference: formData.reference.trim(),
        id_type_support: parseInt(formData.id_type_support, 10) || 1,
        id_format: parseInt(formData.id_format, 10) || 1,
        id_categorie: parseInt(formData.id_categorie, 10) || 1,
        id_localisation: parseInt(formData.id_localisation, 10) || 1,
        quantite: parseInt(formData.quantite, 10) || 1,
        statut: formData.statut,
        observation: formData.observation.trim() || null
      });

      alert(`✅ Emplacement "${formData.reference}" créé avec succès !`);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur lors de la création de l\'emplacement:', err);
      alert('❌ Erreur lors de la création de l\'emplacement. La référence existe peut-être déjà.');
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
              <span>Nouveau Support / Emplacement</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Renseignez les détails pour ajouter un nouvel espace publicitaire
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Formulaire de création */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Référence */}
            <div>
              <label className="client-abo-label">Référence (ex: 4A3, NLB2) * :</label>
              <input
                type="text"
                required
                className="search-input"
                style={{ borderRadius: '8px', padding: '0.6rem 0.8rem' }}
                placeholder="ex: 4A3"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>

            {/* Type de Support */}
            <div>
              <label className="client-abo-label">Type de Support :</label>
              <select
                className="ts-filter-select"
                style={{ width: '100%', padding: '0.6rem' }}
                value={formData.id_type_support}
                onChange={(e) => setFormData({ ...formData, id_type_support: e.target.value })}
              >
                {typeSupports.map(ts => (
                  <option key={ts.id} value={ts.id}>
                    {ts.nom_type}
                  </option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div>
              <label className="client-abo-label">Format :</label>
              <select
                className="ts-filter-select"
                style={{ width: '100%', padding: '0.6rem' }}
                value={formData.id_format}
                onChange={(e) => setFormData({ ...formData, id_format: e.target.value })}
              >
                {formats.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.ref_format}
                  </option>
                ))}
              </select>
            </div>

            {/* Localisation / Lieu */}
            <div>
              <label className="client-abo-label">Localisation & Zone :</label>
              <select
                className="ts-filter-select"
                style={{ width: '100%', padding: '0.6rem' }}
                value={formData.id_localisation}
                onChange={(e) => setFormData({ ...formData, id_localisation: e.target.value })}
              >
                {localisations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nom_lieu} ({l.type_zone || 'Zone N/A'})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantité */}
            <div>
              <label className="client-abo-label">Quantité :</label>
              <input
                type="number"
                min="1"
                className="search-input"
                style={{ borderRadius: '8px', padding: '0.6rem 0.8rem' }}
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value, 10) || 1 })}
              />
            </div>

            {/* Statut */}
            <div>
              <label className="client-abo-label">Statut Initial :</label>
              <select
                className="ts-filter-select"
                style={{ width: '100%', padding: '0.6rem' }}
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              >
                <option value="disponible">🟢 Disponible</option>
                <option value="occupe">🔴 Occupé</option>
              </select>
            </div>
          </div>

          {/* Observation */}
          <div>
            <label className="client-abo-label">Observation / Remarques :</label>
            <textarea
              className="search-input"
              style={{ borderRadius: '8px', padding: '0.6rem', height: '70px', resize: 'vertical' }}
              value={formData.observation}
              onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              placeholder="Observation technique ou remarques (facultatif)..."
            />
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)' }}>
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              disabled={loading}
            >
              <Check size={16} />
              <span>{loading ? 'Création...' : 'Créer l\'emplacement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
