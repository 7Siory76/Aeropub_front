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
