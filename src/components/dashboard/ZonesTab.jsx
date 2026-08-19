import React from 'react';

export default function ZonesTab({ zones = [], localisations = [] }) {
  return (
    <div className="two-col-grid">
      <div>
        <h4 className="col-title-cyan">Zones Aéroportuaires</h4>
        {zones.length === 0 ? (
          <p className="empty-msg">Aucune zone.</p>
        ) : (
          zones.map((z) => (
            <div key={z.id} className="zone-card-cyan">
              #{z.id} - <strong style={{ color: 'var(--text-main)' }}>{z.type_zone}</strong>
            </div>
          ))
        )}
      </div>
      <div>
        <h4 className="col-title-pink">Localisations d'Affichage</h4>
        {localisations.length === 0 ? (
          <p className="empty-msg">Aucune localisation.</p>
        ) : (
          localisations.map((loc) => (
            <div key={loc.id} className="zone-card-pink">
              #{loc.id} - <strong style={{ color: 'var(--text-main)' }}>{loc.nom_lieu}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({loc.type_zone || 'Zone N/A'})</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
