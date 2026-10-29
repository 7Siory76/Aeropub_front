import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, Loader2, ShieldAlert } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  title = 'Confirmer la suppression',
  itemName = '',
  itemType = 'élément',
  associatedCount = 0,
  associatedLabel = 'élément(s) rattaché(s)',
  confirmDescription,
  onConfirm,
  onClose
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fermeture via la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isBlocked = associatedCount > 0;

  const handleExecuteDelete = async () => {
    if (isBlocked) return;
    setLoading(true);
    setError('');
    try {
      if (onConfirm) {
        await onConfirm();
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Erreur lors de la suppression.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="modal-backdrop-portal"
      onClick={!loading ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 24, 0.8)',
        backdropFilter: 'blur(6px)',
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
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-secondary, #0f172a)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.15)',
          color: 'var(--text-main, #f8fafc)'
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}
            >
              <Trash2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {title}
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Opération irréversible
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.4rem',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Message d'erreur éventuel */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.84rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Corps principal : avertissement */}
        {isBlocked ? (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <ShieldAlert size={22} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
                Suppression impossible (contrainte d'intégrité)
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#fde68a', lineHeight: 1.45 }}>
                Cet élément ({itemType}) <strong>« {itemName} »</strong> est actuellement lié à <strong>{associatedCount} {associatedLabel}</strong>.
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Pour garantir l'intégrité des données, veuillez réassigner ou supprimer ces éléments rattachés avant de procéder à cette suppression.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
              Souhaitez-vous vraiment supprimer définitivement cet élément ({itemType}) :
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              fontWeight: 800,
              fontSize: '1.05rem',
              color: '#38bdf8'
            }}>
              {itemName}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.75rem 0 0 0' }}>
              {confirmDescription || "Cette action est irréversible. Toutes les informations associées seront définitivement effacées."}
            </p>
          </div>
        )}

        {/* Boutons d'action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {isBlocked ? 'Compris, fermer' : 'Annuler'}
          </button>

          {!isBlocked && (
            <button
              type="button"
              onClick={handleExecuteDelete}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.25rem',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="btn-spinner" />
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Supprimer définitivement</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
