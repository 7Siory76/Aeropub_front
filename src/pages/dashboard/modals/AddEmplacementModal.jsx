import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, PlusCircle, Check, AlertCircle, Loader2 } from 'lucide-react';
import { emplacementsApi, typeEtatSupportApi } from '../../../api';
import { useFeedback } from '../../../context/FeedbackContext';
import { sanitizeUserError } from '../../../utils/errorHandler';
import SearchableSelect from '../../../components/SearchableSelect';

export default function AddEmplacementModal({
  onClose,
  onRefresh,
  typeSupports = [],
  categories = [],
  zones = [],
  typeEtats = []
}) {
  const { navigateWithFeedback, scrollToTop } = useFeedback();
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [etatsList, setEtatsList] = useState(typeEtats);

  useEffect(() => {
    if (modalError) {
      scrollToTop();
    }
  }, [modalError, scrollToTop]);

  useEffect(() => {
    if (typeEtats && typeEtats.length > 0) {
      setEtatsList(typeEtats);
    } else {
      typeEtatSupportApi.getAll()
        .then((data) => {
          if (data && data.length > 0) {
            setEtatsList(data);
            const dispo = data.find(e => (e.nom_etat || '').toLowerCase().includes('dispo'));
            if (dispo) {
              setFormData(prev => ({ ...prev, etat: dispo.nom_etat }));
            }
          }
        })
        .catch(err => console.error('Erreur chargement états supports:', err));
    }
  }, [typeEtats]);

  const [formData, setFormData] = useState({
    reference: '',
    id_type: typeSupports[0]?.id || 1,
    id_categorie: categories[0]?.id || 1,
    id_zone: zones[0]?.id || 1,
    caracteristiques: '',
    etat: 'disponible',
    observation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    const cleanRef = formData.reference.trim();
    if (!cleanRef) {
      setModalError('Veuillez saisir une référence unique (ex: 4A3, NLB2, A2...).');
      return;
    }

    setLoading(true);
    try {
      await emplacementsApi.create({
        reference: cleanRef.toUpperCase(),
        id_type: parseInt(formData.id_type, 10),
        id_categorie: parseInt(formData.id_categorie, 10),
        id_zone: parseInt(formData.id_zone, 10),
        caracteristiques: formData.caracteristiques.trim() || null,
        etat: formData.etat,
        statut: formData.etat,
        observation: formData.observation.trim() || null
      });

      onClose();
      if (onRefresh) onRefresh();
      navigateWithFeedback('dashboard', 'emplacements', `Support "${cleanRef.toUpperCase()}" créé avec succès !`);
    } catch (err) {
      const msg = sanitizeUserError(err, 'Erreur lors de la création du support. La référence existe peut-être déjà.');
      setModalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleUp 0.25s ease' }}
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

        {modalError && (
          <div className="modal-error-box">
            <AlertCircle size={16} />
            <span>{modalError}</span>
          </div>
        )}

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
              <SearchableSelect
                options={typeSupports}
                value={formData.id_type}
                onChange={(val) => setFormData(prev => ({ ...prev, id_type: val }))}
                placeholder="-- Choisir un type de support --"
                searchPlaceholder="Rechercher un type (Panneau, Caisson...)..."
                getOptionValue={(ts) => ts.id}
                getOptionLabel={(ts) => ts.nom || ts.nom_type}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Catégorie */}
            <div className="modal-form-group">
              <label className="modal-label">Catégorie :</label>
              <SearchableSelect
                options={categories}
                value={formData.id_categorie}
                onChange={(val) => setFormData(prev => ({ ...prev, id_categorie: val }))}
                placeholder="-- Choisir une catégorie --"
                searchPlaceholder="Rechercher une catégorie..."
                getOptionValue={(c) => c.id}
                getOptionLabel={(c) => c.nom || c.nom_categorie}
              />
            </div>

            {/* Zone Terminale */}
            <div className="modal-form-group">
              <label className="modal-label">Zone Terminale :</label>
              <SearchableSelect
                options={zones}
                value={formData.id_zone}
                onChange={(val) => setFormData(prev => ({ ...prev, id_zone: val }))}
                placeholder="-- Choisir une zone terminale --"
                searchPlaceholder="Rechercher une zone, un aéroport..."
                getOptionValue={(z) => z.id}
                getOptionLabel={(z) => z.nom_zone || z.nom_lieu || z.type_zone}
                getOptionSublabel={(z) => z.nom_aeroport ? `Aéroport : ${z.nom_aeroport}` : null}
              />
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
                {etatsList && etatsList.length > 0 ? (
                  etatsList.map((et) => (
                    <option key={et.id} value={et.nom_etat}>
                      {et.nom_etat.charAt(0).toUpperCase() + et.nom_etat.slice(1)}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="disponible">Disponible</option>
                    <option value="réservé">Réservé</option>
                    <option value="occupé">Occupé</option>
                    <option value="en maintenance">En maintenance</option>
                    <option value="indisponible">Indisponible</option>
                    <option value="archivé">Archivé</option>
                  </>
                )}
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
              {loading ? (
                <>
                  <Loader2 size={16} className="btn-spinner" />
                  <span>Création en cours...</span>
                </>
              ) : (
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
