import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FolderKanban, X, Check, Loader2 } from 'lucide-react';
import { categoriesApi } from '../../../api';
import { useFeedback } from '../../../context/FeedbackContext';
import { sanitizeUserError } from '../../../utils/errorHandler';

export default function CategorieModal({
  isOpen,
  category = null,
  onClose,
  onRefresh
}) {
  const { showSuccess, showError } = useFeedback();
  const isEditing = Boolean(category);

  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Synchronisation avec la catégorie sélectionnée
  useEffect(() => {
    if (isOpen) {
      setNom(category?.nom || category?.nom_categorie || '');
      setModalError('');
    }
  }, [isOpen, category]);

  // Fermeture par la touche Échap
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const trimmedNom = nom.trim();
    if (!trimmedNom) {
      setModalError('Le nom de la catégorie est obligatoire.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await categoriesApi.update(category.id, { nom: trimmedNom });
        showSuccess(`Catégorie « ${trimmedNom} » mise à jour avec succès !`);
      } else {
        await categoriesApi.create({ nom: trimmedNom });
        showSuccess(`Catégorie « ${trimmedNom} » créée avec succès !`);
      }

      if (onRefresh) await onRefresh();
      onClose();
    } catch (err) {
      const errMsg = sanitizeUserError(err, `Erreur lors de ${isEditing ? 'la mise à jour' : 'la création'} de la catégorie.`);
      setModalError(errMsg);
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
          maxWidth: '480px',
          background: 'var(--bg-secondary, #0f172a)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)',
          color: 'var(--text-main, #f8fafc)'
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <FolderKanban size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isEditing ? `Identifiant : #${category?.id}` : 'Référentiel des formats publicitaires'}
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

        {/* Message d'erreur */}
        {modalError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.84rem',
            marginBottom: '1rem'
          }}>
            {modalError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-main)' }}>
              Nom de la catégorie * :
            </label>
            <input
              type="text"
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: 'var(--text-main, #ffffff)',
                fontSize: '0.92rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Ex. : Prestige, Standard, Dynamique, Événementiel..."
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              autoFocus
              maxLength={50}
              required
            />
            <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Le nom doit être unique et comporter au maximum 50 caractères.
            </span>
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
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
              disabled={loading || !nom.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.25rem' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="btn-spinner" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{isEditing ? 'Enregistrer les modifications' : 'Créer la catégorie'}</span>
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
