import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Shield, Check, User, Info, Lock } from 'lucide-react';
import { ROLES_GUIDE, getRoleGuide, normalizeRole } from '../utils/rbac';
import { useAuth } from '../context/AuthContext';

export default function RoleGuideModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const userNormRole = normalizeRole(user?.role);
  
  // Rôle sélectionné dans la modale (par défaut, le rôle de l'utilisateur connecté s'il existe)
  const [selectedRoleCode, setSelectedRoleCode] = useState(() => {
    const found = ROLES_GUIDE.find(r => r.code === userNormRole);
    return found ? found.code : ROLES_GUIDE[2].code; // default Commercial
  });

  // Mettre à jour la sélection lorsque la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      const found = ROLES_GUIDE.find(r => r.code === userNormRole);
      if (found) setSelectedRoleCode(found.code);
    }
  }, [isOpen, userNormRole]);

  // Fermeture par la touche Échap
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
    <div
      className="modal-backdrop-portal"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '16px',
          padding: '1.75rem',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          background: 'var(--bg-secondary, #0f172a)'
        }}
      >
        {/* En-tête de la modale */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={24} style={{ color: 'var(--accent-secondary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Guide des Rôles & Permissions
              </h3>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Consultez les habilitations, droits d'accès et restrictions de chaque profil utilisateur dans AeroPub.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.4rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Fermer (Échap)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Indicateur profil utilisateur actuel */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '10px',
            padding: '0.65rem 1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <User size={15} style={{ color: '#60a5fa' }} />
              <span>Connecté en tant que : <strong>{user.nom || user.email}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Votre rôle :</span>
              <span className={`user-role-pill role-${user.role?.toLowerCase()}`} style={{ margin: 0, fontSize: '0.72rem' }}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Sélecteur d'onglets pour chaque rôle */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {ROLES_GUIDE.map((r) => {
            const isSelected = selectedRoleCode === r.code;
            const isMe = r.code === userNormRole;
            return (
              <button
                key={r.code}
                type="button"
                onClick={() => setSelectedRoleCode(r.code)}
                className={`pill-btn ${isSelected ? 'active' : ''}`}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.4rem 0.85rem',
                  borderColor: isSelected ? r.badgeColor : undefined,
                  color: isSelected ? r.badgeColor : undefined,
                  fontWeight: isSelected ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>{r.nom}</span>
                {isMe && (
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.2)',
                    fontWeight: 700
                  }}>
                    Vous
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Carte détaillée du rôle sélectionné */}
        <div style={{
          background: currentRoleGuide.badgeBg,
          border: `1px solid ${currentRoleGuide.badgeBorder}`,
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                padding: '0.3rem 0.85rem',
                borderRadius: '9999px',
                background: 'rgba(0,0,0,0.35)',
                color: currentRoleGuide.badgeColor,
                border: `1px solid ${currentRoleGuide.badgeColor}`,
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Shield size={14} />
                <span>{currentRoleGuide.nom}</span>
              </span>

              {isUserOwnRole && (
                <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                  ✓ Vos droits actuels
                </span>
              )}
            </div>

            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Code système : <code>{currentRoleGuide.code}</code>
            </span>
          </div>

          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {currentRoleGuide.summary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
            {currentRoleGuide.permissions.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  fontSize: '0.84rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
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

        {/* Tableau récapitulatif comparatif rapide */}
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Comparatif rapide des modules :
          </h4>
          <div className="aeropub-table-wrapper" style={{ maxHeight: '200px' }}>
            <table className="aeropub-table" style={{ fontSize: '0.78rem' }}>
              <thead>
                <tr className="table-head-row-indigo">
                  <th className="table-head-cell">Module</th>
                  <th className="table-head-cell">Admin</th>
                  <th className="table-head-cell">Resp. Com</th>
                  <th className="table-head-cell">Commercial</th>
                  <th className="table-head-cell">Direction</th>
                  <th className="table-head-cell">Lecture Seule</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Créer / Modifier Contrat</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>✓ Tous</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>✓ Tous</td>
                  <td style={{ color: '#38bdf8', textAlign: 'center' }}>✓ Ses contrats</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Remise exceptionnelle</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>✓ Oui</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>✓ Oui</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>✓ Oui</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Supprimer Contrat / Client</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>✓ Oui</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>✓ Oui</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Changer commercial attitré</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>✓ Oui</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>✓ Oui</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Vue portefeuille</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>Globale</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>Globale</td>
                  <td style={{ color: '#f59e0b', textAlign: 'center' }}>🔒 Restreint</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>Globale</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>Globale</td>
                </tr>
                <tr className="table-body-row">
                  <td className="cell-bold-white">Paramètres & Audit Log</td>
                  <td style={{ color: '#10b981', textAlign: 'center' }}>✓ Exclusif</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                  <td style={{ color: '#ef4444', textAlign: 'center' }}>✗ Non</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bouton de fermeture en pied de page */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
