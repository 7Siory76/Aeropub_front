import React from 'react';

export default function FormatsTab({ formats = [], categories = [] }) {
  return (
    <div className="two-col-grid">
      <div>
        <h4 className="col-title-indigo">Formats d'Affichage</h4>
        {formats.length === 0 ? (
          <p className="empty-msg">Aucun format.</p>
        ) : (
          formats.map((f) => (
            <div key={f.id} className="zone-card-indigo">
              #{f.id} - <strong style={{ color: 'var(--text-main)' }}>{f.ref_format}</strong>
            </div>
          ))
        )}
      </div>
      <div>
        <h4 className="col-title-emerald">Catégories d'Activité</h4>
        {categories.length === 0 ? (
          <p className="empty-msg">Aucune catégorie.</p>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="zone-card-emerald">
              #{c.id} - <strong style={{ color: 'var(--text-main)' }}>{c.nom_categorie}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
