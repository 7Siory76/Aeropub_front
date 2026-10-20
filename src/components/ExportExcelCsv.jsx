import React from 'react';
import { Download } from 'lucide-react';
import { useFeedback } from '../context/FeedbackContext';

/**
 * Composant universel et réutilisable d'exportation Excel / CSV pour les tableaux de données
 * @param {Array} data - Tableau d'objets à exporter
 * @param {Array} columns - Définition des colonnes [{ header: 'Nom Colonne', key: 'champ' | accessor: (row) => ... }]
 * @param {string} filename - Nom du fichier exporté (sans extension)
 * @param {string} buttonText - Libellé affiché sur le bouton
 * @param {string} emptyMessage - Message d'information si aucune donnée n'est disponible
 * @param {string} successMessage - Message de confirmation après l'exportation
 * @param {boolean} canExport - Droit RBAC autorisant l'exportation
 * @param {string} className - Classe CSS du bouton
 * @param {object} style - Styles inline optionnels
 * @param {string} title - Infobulle (title) du bouton
 */
export default function ExportExcelCsv({
  data = [],
  columns = [],
  filename = 'export_aeropub',
  buttonText = 'Exporter (Excel / CSV)',
  emptyMessage = 'Aucune donnée à exporter.',
  successMessage = 'Exportation réussie !',
  canExport = true,
  className = 'btn-secondary',
  style,
  title = 'Exporter les données en fichier CSV / Excel'
}) {
  const { showSuccess, showInfo } = useFeedback();

  if (!canExport) return null;

  const handleExport = () => {
    if (!data || data.length === 0) {
      showInfo(emptyMessage);
      return;
    }

    // Si aucune colonne n'est explicitement fournie, déduire des clés du premier objet
    const effectiveColumns = columns.length > 0
      ? columns
      : Object.keys(data[0] || {}).map(key => ({ header: key, key }));

    const headers = effectiveColumns.map(col => col.header || col.key);

    const rows = data.map(item => {
      return effectiveColumns.map(col => {
        let val = '';
        if (typeof col.accessor === 'function') {
          val = col.accessor(item);
        } else if (col.key) {
          val = item[col.key];
        }
        if (val === null || val === undefined) val = '';
        const escapedVal = String(val).replace(/"/g, '""');
        return `"${escapedVal}"`;
      });
    });

    // Encodage UTF-8 avec BOM (\uFEFF) pour compatibilité immédiate avec Excel
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess(successMessage);
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleExport}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.82rem',
        padding: '0.45rem 0.85rem',
        minHeight: '36px',
        ...style
      }}
    >
      <Download size={14} />
      <span>{buttonText}</span>
    </button>
  );
}
