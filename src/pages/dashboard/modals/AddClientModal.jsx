import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Check, Building2, Mail, MapPin, User, Loader2, Plus, Trash2, Users, Star, Phone } from 'lucide-react';
import { clientsApi, utilisateursApi } from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { useFeedback } from '../../../context/FeedbackContext';
import { sanitizeUserError } from '../../../utils/errorHandler';
import { hasRole } from '../../../utils/rbac';

export default function AddClientModal({ onClose, onRefresh }) {
  const { user } = useAuth();
  const { navigateWithFeedback, scrollToTop } = useFeedback();
  const canAssignCommercial = hasRole(user, ['Admin', 'Resp_Com']);

  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [commercials, setCommercials] = useState([]);
  const [contacts, setContacts] = useState([
    { id: 1, type: 'Téléphone', nom_contact: '', valeur: '', est_principal: true }
  ]);
  const [formData, setFormData] = useState({
    raison_sociale: '',
    adresse_postale: '',
    adresse_facturation: '',
    etat_client: 'Actif',
    id_commercial: user?.id || ''
  });

  const handleAddContact = () => {
    setContacts(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'Téléphone',
        nom_contact: '',
        valeur: '',
        est_principal: prev.length === 0
      }
    ]);
  };

  const handleRemoveContact = (idToRemove) => {
    setContacts(prev => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter(c => c.id !== idToRemove);
      if (!filtered.some(c => c.est_principal) && filtered.length > 0) {
        filtered[0].est_principal = true;
      }
      return filtered;
    });
  };

  const handleContactChange = (id, field, value) => {
    setContacts(prev => prev.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleSetPrincipal = (id) => {
    setContacts(prev => prev.map(c => ({ ...c, est_principal: c.id === id })));
  };

  useEffect(() => {
    if (modalError) {
      scrollToTop();
    }
  }, [modalError, scrollToTop]);

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
    setModalError('');
    if (!formData.raison_sociale.trim()) {
      setModalError('Veuillez renseigner le nom ou la raison sociale du client.');
      return;
    }

    setLoading(true);
    try {
      const cleanContacts = contacts
        .filter(c => c.valeur.trim() || c.nom_contact.trim())
        .map(c => {
          const rawNom = (c.nom_contact || '').replace(/^\[.*?\]\s*/, '').trim();
          const fallback = c.type === 'Email' ? 'email' : (c.type === 'Téléphone' ? 'telephone' : c.type?.toLowerCase() || 'contact');
          return {
            type: c.type,
            nom_contact: rawNom || fallback,
            valeur: c.valeur.trim(),
            est_principal: Boolean(c.est_principal)
          };
        });

      const primaryContact = cleanContacts.find(c => c.est_principal) || cleanContacts[0];

      await clientsApi.create({
        raison_sociale: formData.raison_sociale.trim(),
        nom_contact: primaryContact?.nom_contact || undefined,
        contact: primaryContact?.valeur || undefined,
        contacts: cleanContacts,
        adresse_postale: formData.adresse_postale.trim() || undefined,
        adresse_facturation: formData.adresse_facturation.trim() || undefined,
        etat_client: formData.etat_client,
        id_commercial: formData.id_commercial ? parseInt(formData.id_commercial, 10) : undefined
      });

      if (onRefresh) onRefresh();
      onClose();
      navigateWithFeedback('dashboard', 'clients', `Client « ${formData.raison_sociale} » ajouté avec succès !`);
    } catch (err) {
      const friendlyMsg = sanitizeUserError(err, 'Impossible de créer ce client. Vérifiez les informations saisies.');
      setModalError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleUp 0.25s ease' }}
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

        {modalError && (
          <div className="modal-error-box">
            <span>⚠️ {modalError}</span>
          </div>
        )}

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

          {/* Section Contacts Multiples avec Type (Téléphone, Mail, WhatsApp, etc.) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <label className="modal-label" style={{ fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                  <Users size={16} />
                  <span>Contacts de l'Entreprise ({contacts.length})</span>
                </label>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Sélectionnez le canal (Téléphone, Mail, WhatsApp...), indiquez le libellé et la valeur. Cochez le contact principal.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddContact}
                className="pill-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: 'var(--accent-secondary)',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                <span>Ajouter contact</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {contacts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '125px 1fr 1fr auto auto',
                    gap: '0.5rem',
                    alignItems: 'center',
                    background: c.est_principal ? 'rgba(6, 182, 212, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '8px',
                    border: c.est_principal ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.07)'
                  }}
                >
                  {/* Choix du type de contact */}
                  <select
                    className="modal-select"
                    style={{ padding: '0.42rem 0.5rem', fontSize: '0.84rem' }}
                    value={c.type}
                    onChange={(e) => handleContactChange(c.id, 'type', e.target.value)}
                  >
                    <option value="Téléphone">📞 Téléphone</option>
                    <option value="Email">✉️ Email</option>
                    <option value="WhatsApp">💬 WhatsApp</option>
                    <option value="Mobile">📱 Mobile</option>
                    <option value="Fixe">☎️ Fixe</option>
                    <option value="Autre">🌐 Autre</option>
                  </select>

                  {/* Libellé ou Nom du contact */}
                  <input
                    type="text"
                    className="modal-input"
                    style={{ padding: '0.42rem 0.55rem', fontSize: '0.84rem' }}
                    placeholder={c.type === 'Email' ? "Nom (ou vide pour 'email')" : "Nom/Rôle (ex: Direction)"}
                    value={c.nom_contact}
                    onChange={(e) => handleContactChange(c.id, 'nom_contact', e.target.value)}
                  />

                  {/* Valeur */}
                  <input
                    type="text"
                    className="modal-input"
                    style={{ padding: '0.42rem 0.55rem', fontSize: '0.84rem' }}
                    placeholder={c.type === 'Email' ? 'contact@ent.mg' : '+261 34 00 000 00'}
                    value={c.valeur}
                    onChange={(e) => handleContactChange(c.id, 'valeur', e.target.value)}
                  />

                  {/* Définir comme contact principal */}
                  <button
                    type="button"
                    onClick={() => handleSetPrincipal(c.id)}
                    title={c.est_principal ? "Contact principal" : "Définir comme contact principal"}
                    style={{
                      background: c.est_principal ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
                      border: c.est_principal ? '1px solid rgba(234, 179, 8, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: c.est_principal ? '#eab308' : 'var(--text-muted)',
                      borderRadius: '6px',
                      padding: '0.42rem 0.55rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.74rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Star size={13} fill={c.est_principal ? '#eab308' : 'none'} />
                    <span>{c.est_principal ? 'Principal' : 'Définir'}</span>
                  </button>

                  {/* Bouton Supprimer */}
                  <button
                    type="button"
                    onClick={() => handleRemoveContact(c.id)}
                    disabled={contacts.length <= 1}
                    title="Supprimer ce contact"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: contacts.length <= 1 ? 'rgba(255,255,255,0.2)' : '#ef4444',
                      cursor: contacts.length <= 1 ? 'not-allowed' : 'pointer',
                      padding: '0.35rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
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
              {loading ? (
                <>
                  <Loader2 size={16} className="btn-spinner" />
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Créer le Client</span>
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
