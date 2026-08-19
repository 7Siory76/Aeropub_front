import React from 'react';
import { X, ShoppingCart, Calendar, Tag, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ArticleModal({ article, onClose, onAddToCart }) {
  if (!article) return null;

  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(article.price || 0);

  const formattedDate = article.created_at
    ? new Date(article.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Récemment';

  const handleAdd = () => {
    onAddToCart(article);
    toast.success(`🛒 "${article.title}" ajouté au panier !`, {
      position: 'top-right'
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="card-category-tag" style={{ position: 'static', display: 'inline-block', marginBottom: '0.75rem' }}>
            <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {article.category || 'Général'}
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
            {article.title}
          </h2>
        </div>

        {/* Description */}
        <div style={{ color: '#d1d5db', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.75rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {article.content || 'Aucune description détaillée n\'est disponible pour cet article.'}
        </div>

        {/* Info Metadata */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>
            <Calendar size={16} style={{ color: '#06b6d4' }} />
            <span>Ajouté le {formattedDate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 800, fontSize: '1.25rem' }}>
            <DollarSign size={18} />
            <span>{formattedPrice}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">
            Fermer
          </button>
          <button onClick={handleAdd} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            <ShoppingCart size={18} />
            <span>Ajouter au Panier</span>
          </button>
        </div>
      </div>
    </div>
  );
}
