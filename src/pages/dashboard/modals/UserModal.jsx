import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, User, Mail, Lock, Check } from 'lucide-react';
import { utilisateursApi } from '../../../api';
import { toast } from 'react-toastify';

export default function UserModal({ userToEdit, onClose, onRefresh }) {
  const isEditing = Boolean(userToEdit);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    id_role: 2,
    mot_de_passe: '',
    actif: true
  });

  // Charger les rôles disponibles depuis la base de données
  useEffect(() => {
    utilisateursApi.getAllRoles()
      .then((data) => {
        if (data && data.length > 0) {
          setRoles(data);
        }
      })
      .catch((err) => console.error('Erreur chargement des rôles:', err));
  }, []);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        nom: userToEdit.nom || '',
        email: userToEdit.email || '',
        id_role: userToEdit.id_role || 2,
        mot_de_passe: '', // Vide par défaut en édition
        actif: userToEdit.actif !== undefined ? userToEdit.actif : true
      });
    } else {
      setFormData({
        nom: '',
        email: '',
        id_role: 2,
        mot_de_passe: '',
        actif: true
      });
    }
  }, [userToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom.trim() || !formData.email.trim()) {
      toast.warning('Le nom et l\'adresse email sont obligatoires.');
      return;
    }

    if (!isEditing && !formData.mot_de_passe) {
      toast.warning('Veuillez définir un mot de passe initial pour ce nouvel utilisateur.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const payload = {
          nom: formData.nom.trim(),
          email: formData.email.trim(),
          id_role: parseInt(formData.id_role, 10),
          actif: formData.actif
        };
        // Inclure le mot de passe seulement s'il a été renseigné
        if (formData.mot_de_passe.trim()) {
          payload.mot_de_passe = formData.mot_de_passe.trim();
        }

        await utilisateursApi.update(userToEdit.id, payload);
        toast.success(`Utilisateur « ${formData.nom} » mis à jour avec succès (mot de passe haché) !`);
      } else {
        await utilisateursApi.create({
          nom: formData.nom.trim(),
          email: formData.email.trim(),
          id_role: parseInt(formData.id_role, 10),
          mot_de_passe: formData.mot_de_passe.trim(),
          actif: formData.actif
        });
        toast.success(`Utilisateur « ${formData.nom} » créé avec succès !`);
      }

      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error('Erreur enregistrement utilisateur:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'utilisateur.');
    } finally {
      setLoading(false);
    }
  };

  const defaultRoles = [
    { id: 1, nom_role: 'Administrateur' },
    { id: 2, nom_role: 'Commercial' },
    { id: 3, nom_role: 'Direction' }
  ];
  const displayRoles = roles.length > 0 ? roles : defaultRoles;

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '560px', animation: 'scaleUp 0.25s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="client-modal-title" style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={22} style={{ color: 'var(--accent-primary)' }} />
              <span>{isEditing ? `Modifier l'utilisateur #${userToEdit.id}` : 'Créer un nouvel utilisateur'}</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Attribution des rôles et hachage sécurisé du mot de passe
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', marginTop: '1.25rem' }}>
          {/* Nom complet */}
          <div className="modal-form-group">
            <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>Nom Complet * :</span>
            </label>
            <input
              type="text"
              required
              className="modal-input"
              placeholder="ex: Jean Dupont"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="modal-form-group">
            <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={15} style={{ color: 'var(--accent-secondary)' }} />
              <span>Adresse Email professionnelle * :</span>
            </label>
            <input
              type="email"
              required
              className="modal-input"
              placeholder="jean@aeropub.mg"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Rôle & Statut */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            <div className="modal-form-group">
              <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={14} style={{ color: '#60a5fa' }} />
                <span>Rôle & Permissions * :</span>
              </label>
              <select
                className="modal-select"
                value={formData.id_role}
                onChange={(e) => setFormData({ ...formData, id_role: e.target.value })}
              >
                {displayRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nom_role}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-form-group">
              <label className="modal-label">État du compte :</label>
              <select
                className="modal-select"
                value={formData.actif ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, actif: e.target.value === 'true' })}
              >
                <option value="true">🟢 Actif</option>
                <option value="false">⚪ Inactif (Désactivé)</option>
              </select>
            </div>
          </div>

          {/* Mot de passe avec indication de hachage */}
          <div className="modal-form-group">
            <label className="modal-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={15} style={{ color: 'var(--accent-warning)' }} />
                <span>{isEditing ? 'Nouveau Mot de Passe (optionnel) :' : 'Mot de Passe Initial * :'}</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                🔒 Haché avec bcrypt
              </span>
            </label>
            <input
              type="password"
              className="modal-input"
              required={!isEditing}
              placeholder={isEditing ? 'Laisser vide pour conserver le mot de passe actuel' : 'Saisir un mot de passe sécurisé'}
              value={formData.mot_de_passe}
              onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
            />
            {isEditing && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Si vous saisissez un nouveau mot de passe, il sera immédiatement haché et mis à jour.
              </span>
            )}
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
              <span>{loading ? 'Traitement...' : isEditing ? 'Mettre à jour' : 'Créer l\'utilisateur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
