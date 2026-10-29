import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Shield, User } from 'lucide-react';
import { ROLES_GUIDE, normalizeRole } from '../utils/rbac';
import { useAuth } from '../context/AuthContext';
import './RoleGuideModal.css';

export default function RoleGuideModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const userNormRole = normalizeRole(user?.role);

  // Rôle sélectionné (par défaut, celui de l'utilisateur)
  const [selectedRoleCode, setSelectedRoleCode] = useState(() => {
    const found = ROLES_GUIDE.find(r => r.code === userNormRole);
    return found ? found.code : ROLES_GUIDE[2].code;
  });

  // Met à jour la sélection à l'ouverture
  useEffect(() => {
    if (isOpen) {
      const found = ROLES_GUIDE.find(r => r.code === userNormRole);
      if (found) setSelectedRoleCode(found.code);
    }
  }, [isOpen, userNormRole]);

  // Ferme avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRoleGuide = ROLES_GUIDE.find(r => r.code === selectedRoleCode) || ROLES_GUIDE[0];
  const isUserOwnRole = currentRoleGuide.code === userNormRole;

  return createPortal(
    <div className="role-guide-backdrop" onClick={onClose}>
      <div className="role-guide-dialog" onClick={(e) => e.stopPropagation()}>
        {/* En-tête de la modale */}
        <div className="role-guide-header">
          <div>
            <div className="role-guide-header-title">
              <ShieldCheck size={24} className="role-guide-header-icon" />
              <h3>Guide des Rôles & Permissions</h3>
            </div>
            <p className="role-guide-subtitle">
              Consultez les habilitations, droits d'accès et restrictions de chaque profil utilisateur dans AeroPub.
            </p>
          </div>

          <button
            type="button"
            className="role-guide-close-btn"
            onClick={onClose}
            title="Fermer (Échap)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Indicateur profil utilisateur actuel */}
        {user && (
          <div className="role-guide-user-bar">
            <div className="role-guide-user-info">
              <User size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>Connecté en tant que : <strong>{user.nom || user.email}</strong></span>
            </div>
            <div className="role-guide-user-badge-wrap">
              <span style={{ color: 'var(--text-muted)' }}>Votre rôle :</span>
              <span className={`user-role-pill role-${user.role?.toLowerCase()}`} style={{ margin: 0, fontSize: '0.72rem' }}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Sélecteur d'onglets pour chaque rôle */}
        <div className="role-guide-tabs">
          {ROLES_GUIDE.map((r) => {
            const isSelected = selectedRoleCode === r.code;
            const isMe = r.code === userNormRole;
            return (
              <button
                key={r.code}
                type="button"
                onClick={() => setSelectedRoleCode(r.code)}
                className={`role-guide-tab-btn ${isSelected ? 'active' : ''}`}
                style={{
                  borderColor: isSelected ? r.badgeColor : undefined,
                  color: isSelected ? r.badgeColor : undefined,
                  background: isSelected ? r.badgeBg : undefined
                }}
              >
                <span>{r.nom}</span>
                {isMe && (
                  <span className="role-guide-tab-you">
                    Vous
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Carte détaillée du rôle sélectionné */}
        <div
          className="role-guide-detail-card"
          style={{
            background: currentRoleGuide.badgeBg,
            border: `1px solid ${currentRoleGuide.badgeBorder}`
          }}
        >
          <div className="role-guide-detail-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                className="role-guide-badge"
                style={{
                  color: currentRoleGuide.badgeColor,
                  border: `1px solid ${currentRoleGuide.badgeColor}`
                }}
              >
                <Shield size={14} />
                <span>{currentRoleGuide.nom}</span>
              </span>

              {isUserOwnRole && (
                <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                  ✓ Vos droits actuels
                </span>
              )}
            </div>

            <span className="role-guide-code-tag">
              Code système : <code>{currentRoleGuide.code}</code>
            </span>
          </div>

          <p className="role-guide-summary">
            {currentRoleGuide.summary}
          </p>

          <div className="role-guide-permissions-grid">
            {currentRoleGuide.permissions.map((p, idx) => (
              <div key={idx} className="role-guide-perm-item">
                <span style={{
                  color: p.allowed ? '#10b981' : '#ef4444',
                  fontWeight: 800,
                  fontSize: '1rem',
                  lineHeight: 1
                }}>
                  {p.allowed ? '✓' : '✗'}
                </span>
                <span style={{ color: p.allowed ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {p.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tableau comparatif des accès */}
        <div className="role-guide-table-wrap">
          <h4 className="role-guide-table-heading">
            Comparatif des accès par rôle :
          </h4>
          <div className="aeropub-table-wrapper" style={{ maxHeight: '280px' }}>
            <table className="aeropub-table" style={{ fontSize: '0.78rem' }}>
              <thead>
                <tr className="table-head-row-indigo">
                  <th className="table-head-cell">Module / Action</th>
                  <th className="table-head-cell">Admin</th>
                  <th className="table-head-cell">Direction</th>
                  <th className="table-head-cell">Resp. Com</th>
                  <th className="table-head-cell">Commercial</th>
                  <th className="table-head-cell">Lecture Seule</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Création & Modif. Contrats / Clients</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Tous</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Tous</td>
                  <td style={{ color: '#0284c7', textAlign: 'center', fontWeight: 600 }}>✓ Ses dossiers</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Affectation & Suivi d'équipe</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Oui</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Oui</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Indicateurs & KPIs de pilotage</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Globaux</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Stratégiques</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Équipe</td>
                  <td style={{ color: '#0284c7', textAlign: 'center', fontWeight: 600 }}>✓ Portefeuille</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Consultation</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Relances & Comptes rendus (J-30)</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Tous</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Tous</td>
                  <td style={{ color: '#0284c7', textAlign: 'center', fontWeight: 600 }}>✓ Ses clients</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Activation d'un contrat</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Tous</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Tous</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Tous</td>
                  <td style={{ color: '#0284c7', textAlign: 'center', fontWeight: 600 }}>✓ Ses contrats</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Validation Remises / Renouvellements</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Oui</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Arbitrage</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Oui</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Importation de données (CSV)</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Oui</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Oui</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Oui</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Oui</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Oui</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Exportation (Excel / CSV)</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Exhaustif</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Global</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Équipe</td>
                  <td style={{ color: '#0284c7', textAlign: 'center', fontWeight: 600 }}>✓ Portefeuille</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Périmètre</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Paramétrage, Modèles & Journal d'Audit</td>
                  <td style={{ color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Exclusif</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>✗ Non</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bouton de fermeture en pied de page */}
        <div className="role-guide-footer">
          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
