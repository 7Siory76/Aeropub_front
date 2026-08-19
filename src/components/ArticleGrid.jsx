import React from 'react';
import ArticleCard from './ArticleCard';
import { PackageX, Loader2 } from 'lucide-react';

export default function ArticleGrid({ articles, loading, onSelectArticle, onAddToCart }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Loader2 size={40} className="spin-icon" style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
        <p style={{ marginTop: '1rem', color: '#9ca3af' }}>Chargement du catalogue depuis la base PostgreSQL...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', marginTop: '2rem' }}>
        <PackageX size={56} style={{ color: '#6b7280', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.5rem' }}>Aucun article trouvé</h3>
        <p style={{ color: '#9ca3af', maxWidth: '450px', margin: '0 auto' }}>
          Aucun résultat ne correspond à votre recherche. Essayez avec un autre mot-clé ou modifiez la catégorie sélectionnée.
        </p>
      </div>
    );
  }

  return (
    <div className="articles-grid">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onSelectArticle={onSelectArticle}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
