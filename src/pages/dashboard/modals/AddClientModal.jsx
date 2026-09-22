import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Check, Building2, Mail, MapPin, User } from 'lucide-react';
import { clientsApi, utilisateursApi } from '../../../api';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import { hasRole } from '../../../utils/rbac';

export default function AddClientModal({ onClose, onRefresh }) {
  const { user } = useAuth();
  const canAssignCommercial = hasRole(user, ['Admin', 'Resp_Com']);

  const [loading, setLoading] = useState(false);
  const [commercials, setCommercials] = useState([]);
  const [formData, setFormData] = useState({
    raison_sociale: '',
    nom_contact: '',
    contact: '',
    adresse_postale: '',
    adresse_facturation: '',
    etat_client: 'Actif',
    id_commercial: user?.id || ''
  });

  useEffect(() => {
    utilisateursApi.getAll()
      .then((users) => {
        if (users) {
          const coms = users.filter(u => u.nom_role?.toLowerCase().includes('com') || u.nom_role?.toLowerCase().includes('admin'));
          setCommercials(coms.length > 0 ? coms : users);
        }
      })
      .catch((err) => console.error('Erreur chargement commerciaux:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.raison_sociale.trim()) {
      toast.warning('Veuillez renseigner le nom ou la raison sociale du client.');
      return;
    }

    setLoading(true);
    try {
      await clientsApi.create({
        raison_sociale: formData.raison_sociale.trim(),
        nom_contact: formData.nom_contact.trim() || undefined,
        contact: formData.contact.trim() || undefined,
        adresse_postale: formData.adresse_postale.trim() || undefined,
        adresse_facturation: formData.adresse_facturation.trim() || undefined,
        etat_client: formData.etat_client,
        id_commercial: formData.id_commercial ? parseInt(formData.id_commercial, 10) : undefined
      });

      toast.success(`Client « ${formData.raison_sociale} » ajouté avec succès !`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la création du client:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la création du client.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '600px', animation: 'scaleUp 0.25s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="client-modal-title" style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={22} style={{ color: 'var(--accent-primary)' }} />
              <span>Nouveau Client Partenaire</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Ajouter une nouvelle entreprise ou annonceur publicitaire
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', marginTop: '1.25rem' }}>
          {/* Raison Sociale */}
          <div className="modal-form-group">
            <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>Raison Sociale / Nom de l'Entreprise * :</span>
            </label>
            <input
              type="text"
              required
              className="modal-input"
              placeholder="ex: Orange Madagascar, Air France, Telma..."
              value={formData.raison_sociale}
              onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
            />
          </div>

          {/* Contact Principal & Valeur Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="modal-form-group">
              <label className="modal-label">Nom du Contact Principal :</label>
              <input
                type="text"
                className="modal-input"
                placeholder="ex: M. Ravelo (Directeur Com)"
                value={formData.nom_contact}
                onChange={(e) => setFormData({ ...formData, nom_contact: e.target.value })}
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} style={{ color: 'var(--accent-secondary)' }} />
                <span>Contact (Email / Téléphone) :</span>
              </label>
              <input
                type="text"
                className="modal-input"
                placeholder="contact@entreprise.mg / +261..."
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>

          {/* Adresses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="modal-form-group">
              <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Adresse Postale / Siège :</span>
              </label>
              <input
                type="text"
                className="modal-input"
                placeholder="ex: Ankorondrano, Antananarivo"
                value={formData.adresse_postale}
                onChange={(e) => setFormData({ ...formData, adresse_postale: e.target.value })}
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Adresse Facturation :</label>
              <input
                type="text"
                className="modal-input"
                placeholder="ex: BP 1234, Antananarivo 101"
                value={formData.adresse_facturation}
                onChange={(e) => setFormData({ ...formData, adresse_facturation: e.target.value })}
              />
            </div>
          </div>

          {/* Statut & Assignation Commercial Responsable (Module 2) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="modal-form-group">
              <label className="modal-label">Statut Initial :</label>
              <select
                className="modal-select"
                value={formData.etat_client}
                onChange={(e) => setFormData({ ...formData, etat_client: e.target.value })}
              >
                <option value="Actif">🟢 Actif</option>
                <option value="Prospect">🟡 Prospect</option>
                <option value="Inactif">⚪ Inactif</option>
              </select>
            </div>

            <div className="modal-form-group">
              <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>Commercial Responsable :</span>
              </label>
              {canAssignCommercial ? (
                /* Assignation réservée à Admin & Resp_Com */
                <select
                  className="modal-select"
                  value={formData.id_commercial}
                  onChange={(e) => setFormData({ ...formData, id_commercial: e.target.value })}
                >
                  <option value="">-- Assigner un commercial --</option>
                  {commercials.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} ({c.nom_role || 'Commercial'})
                    </option>
                  ))}
                </select>
              ) : (
                /* Commercial simple : assigné automatiquement à lui-même */
                <div style={{ padding: '0.55rem 0.75rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.88rem', color: 'var(--accent-primary)' }}>
                  👤 {user?.nom || 'Votre compte'}
                </div>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Check size={16} />
              <span>{loading ? 'Création en cours...' : 'Créer le Client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
