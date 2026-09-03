import React from 'react';
import { Plus } from 'lucide-react';

export default function EmplacementsTab({ emplacements = [], onSelectEmplacement, onAddEmplacementClick }) {
  return (
    <div>
      <div className="aeropub-table-wrapper">
        {emplacements.length === 0 ? (
          <p className="empty-msg">Aucun emplacement trouvé.</p>
        ) : (
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-indigo">
                <th className="table-head-cell">Référence</th>
                <th className="table-head-cell">Type de Support</th>
                <th className="table-head-cell">Format</th>
                <th className="table-head-cell">Catégorie</th>
                <th className="table-head-cell">Localisation</th>
                <th className="table-head-cell">Qté</th>
                <th className="table-head-cell">Statut</th>
                <th className="table-head-cell">Observation</th>
              </tr>
            </thead>
            <tbody>
              {emplacements.map((emp) => (
                <tr
                  key={emp.reference}
                  className="table-body-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectEmplacement && onSelectEmplacement(emp)}
                >
                  <td className="cell-bold-white">{emp.reference}</td>
                  <td className="cell-cyan">{emp.nom_type_support || 'N/A'}</td>
                  <td className="cell-muted">{emp.ref_format || 'N/A'}</td>
                  <td className="cell-muted">{emp.nom_categorie || 'Général'}</td>
                  <td className="table-body-cell">{emp.nom_lieu || 'N/A'} ({emp.type_zone || 'Zone N/A'})</td>
                  <td className="cell-bold-white" style={{ textAlign: 'center' }}>{emp.quantite || 1}</td>
                  <td className="table-body-cell">
                    <span className={`wireframe-badge ${emp.statut === 'disponible' ? 'badge-available' : 'badge-occupied'}`}>
                      {emp.statut || 'disponible'}
                    </span>
                  </td>
                  <td className="cell-muted" style={{ fontSize: '0.82rem' }}>{emp.observation || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bouton "+" pour Ajouter un Emplacement en bas de la liste */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
        <button
          type="button"
          className="pill-btn active"
          style={{
            padding: '0.65rem 1.4rem',
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '9999px'
          }}
          onClick={onAddEmplacementClick}
          title="Ajouter un nouvel emplacement"
        >
          <Plus size={18} />
          <span>Ajouter un emplacement</span>
        </button>
      </div>
    </div>
  );
}
