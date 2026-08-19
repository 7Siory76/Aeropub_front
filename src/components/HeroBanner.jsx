import React from 'react';
import { Search } from 'lucide-react';

export default function HeroBanner({ 
  searchQuery, 
  setSearchQuery 
}) {
  return (
    <section className="hero-container">
      <h1 className="hero-title">
        Plateforme d'Affichage & <span className="gradient-text">Publicités Aéroportuaires</span>
      </h1>
      <p className="hero-subtitle">
        Gestion et consultation en temps réel des espaces publicitaires, des zones d'affichage et des abonnements clients reliés à la base de données PostgreSQL.
      </p>

      {/* Barre de Recherche AeroPub */}
      <div className="search-filter-box">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher une publicité, un client ou un emplacement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
