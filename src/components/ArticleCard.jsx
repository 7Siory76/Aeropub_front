import React from 'react';
import { ShoppingCart, Eye, Package } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ArticleCard({ article, onSelectArticle, onAddToCart }) {
  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(article);
    toast.success(`🛒 "${article.title}" ajouté au panier !`, {
      position: 'top-right',
      autoClose: 3000
    });
  };

  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(article.price || 0);

  return (
    <div className="glass-panel article-card" onClick={() => onSelectArticle(article)}>
      {/* Visual Header Banner */}
      <div className="card-banner">
        <Package size={48} style={{ opacity: 0.25, color: '#06b6d4' }} />
        <span className="card-category-tag">{article.category || 'Général'}</span>
        <span className="card-price-badge">{formattedPrice}</span>
      </div>

      {/* Body Content */}
      <div className="card-body">
        <h3 className="card-title">{article.title}</h3>
        <p className="card-description">
          {article.content || 'Aucune description disponible pour cet article.'}
        </p>

        {/* Card Actions */}
        <div className="card-actions">
          <button onClick={handleAddToCart} className="btn-primary">
            <ShoppingCart size={16} />
            <span>Ajouter</span>
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSelectArticle(article);
            }} 
            className="btn-secondary"
            title="Détails"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
