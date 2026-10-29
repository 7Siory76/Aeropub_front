import React, { useState, useEffect, useMemo } from 'react';
import { Search, RotateCcw } from 'lucide-react';

export default function FormatsTab({ formats = [], categories = [], initialSearchQuery = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const hasActiveFilters = searchTerm.trim() !== '';

  const filteredFormats = useMemo(() => {
    if (!searchTerm.trim()) return formats;
    const q = searchTerm.toLowerCase().trim();
    return formats.filter(f => (f.ref_format || f.nom || '').toLowerCase().includes(q));
  }, [formats, searchTerm]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const q = searchTerm.toLowerCase().trim();
    return categories.filter(c => (c.nom || c.nom_categorie || '').toLowerCase().includes(q));
  }, [categories, searchTerm]);

  return (
    <div>
      {/* Barre de Recherche et Filtre */}
      <div className="ts-filters-bar">
        <div className="ts-filter-group">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="ts-filter-input"
            placeholder="Rechercher format ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '240px' }}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="ts-reset-btn"
            onClick={() => setSearchTerm('')}
            title="Réinitialiser"
          >
            <RotateCcw size={13} />
            <span>Réinitialiser</span>
          </button>
        )}

        <div className="ts-filter-badge-count">
          {filteredFormats.length} formats | {filteredCategories.length} catégories
        </div>
      </div>

      <div className="two-col-grid">
        <div>
          <h4 className="col-title-indigo">Formats & Caractéristiques Spécifiques ({filteredFormats.length})</h4>
          {filteredFormats.length === 0 ? (
            <p className="empty-msg">Aucun format trouvé.</p>
          ) : (
            filteredFormats.map((f) => (
              <div key={f.id} className="zone-card-indigo">
                #{f.id} - <strong style={{ color: 'var(--text-main)' }}>{f.ref_format || f.nom}</strong>
              </div>
            ))
          )}
        </div>
        <div>
          <h4 className="col-title-emerald">Catégories de Support (base_v3.sql) ({filteredCategories.length})</h4>
          {filteredCategories.length === 0 ? (
            <p className="empty-msg">Aucune catégorie trouvée.</p>
          ) : (
            filteredCategories.map((c) => (
              <div key={c.id} className="zone-card-emerald">
                #{c.id} - <strong style={{ color: 'var(--text-main)' }}>{c.nom || c.nom_categorie}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
