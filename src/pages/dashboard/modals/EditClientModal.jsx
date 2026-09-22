import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3, Check, Building2, Mail, MapPin, User } from 'lucide-react';
import { clientsApi, utilisateursApi } from '../../../api';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import { hasRole } from '../../../utils/rbac';

export default function EditClientModal({ client, onClose, onRefresh }) {
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
    id_commercial: ''
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

  useEffect(() => {
    if (client) {
      setFormData({
        raison_sociale: client.raison_sociale || client.nom_client || '',
        nom_contact: client.nom_contact_principal || '',
        contact: client.valeur_contact_principal || client.contact || '',
        adresse_postale: client.adresse_postale || '',
        adresse_facturation: client.adresse_facturation || '',
        etat_client: client.etat_client || 'Actif',
        id_commercial: client.id_commercial || ''
      });
    }
  }, [client]);

  if (!client) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.raison_sociale.trim()) {
      toast.warning('La raison sociale ne peut pas être vide.');
      return;
    }

    setLoading(true);
    try {
      await clientsApi.update(client.id, {
        raison_sociale: formData.raison_sociale.trim(),
        nom_contact: formData.nom_contact.trim() || undefined,
        contact: formData.contact.trim() || undefined,
        adresse_postale: formData.adresse_postale.trim() || undefined,
        adresse_facturation: formData.adresse_facturation.trim() || undefined,
        etat_client: formData.etat_client,
        id_commercial: formData.id_commercial ? parseInt(formData.id_commercial, 10) : undefined
      });

      toast.success(`Client « ${formData.raison_sociale} » mis à jour avec succès !`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du client:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du client.');
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
              <Edit3 size={22} style={{ color: 'var(--accent-primary)' }} />
              <span>Modifier le Client #{client.id}</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Mettre à jour les coordonnées et le statut de l'entreprise
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
              value={formData.raison_sociale}
              onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
            />
          </div>

          {/* Contact Principal & Valeur Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="modal-form-group">
              <label className="modal-label">Nom du Contact :</label>
              <input
                type="text"
                className="modal-input"
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
                value={formData.adresse_postale}
                onChange={(e) => setFormData({ ...formData, adresse_postale: e.target.value })}
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Adresse Facturation :</label>
              <input
                type="text"
                className="modal-input"
                value={formData.adresse_facturation}
                onChange={(e) => setFormData({ ...formData, adresse_facturation: e.target.value })}
              />
            </div>
          </div>

          {/* Statut & Assignation Commercial Responsable (Module 2) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="modal-form-group">
              <label className="modal-label">Statut :</label>
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
                <span>Commercial Attitré :</span>
              </label>
              {canAssignCommercial ? (
                /* Assignation : Changer le commercial responsable d'un client (Admin & Resp_Com) */
                <select
                  className="modal-select"
                  value={formData.id_commercial}
                  onChange={(e) => setFormData({ ...formData, id_commercial: e.target.value })}
                >
                  <option value="">-- Aucun commercial attitré --</option>
                  {commercials.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} ({c.nom_role || 'Commercial'})
                    </option>
                  ))}
                </select>
              ) : (
                /* Commercial simple : affichage en lecture seule */
                <div style={{ padding: '0.55rem 0.75rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  👤 {commercials.find(c => c.id === formData.id_commercial)?.nom || user?.nom || 'Non modifiable'}
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
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
