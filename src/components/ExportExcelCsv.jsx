import React from 'react';
import { Download } from 'lucide-react';
import { useFeedback } from '../context/FeedbackContext';

// Bouton d'exportation des données au format CSV
export default function ExportExcelCsv({
  data = [],
  columns = [],
  filename = 'export_aeropub',
  buttonText = 'Exporter (CSV)',
  emptyMessage = 'Aucune donnée à exporter.',
  successMessage = 'Exportation réussie.',
  canExport = true,
  className = 'btn-secondary',
  style,
  title = 'Exporter les données au format CSV'
}) {
  const { showSuccess, showInfo } = useFeedback();

  if (!canExport) return null;

  const handleExport = () => {
    if (!data || data.length === 0) {
      showInfo(emptyMessage);
      return;
    }

    // Déduit les colonnes depuis le premier objet si non fournies
    const effectiveColumns = columns.length > 0
      ? columns
      : Object.keys(data[0] || {}).map(key => ({ header: key, key }));

    const headers = effectiveColumns.map(col => col.header || col.key);

    const rows = data.map(item => {
      return effectiveColumns.map(col => {
        let valeurCellule = '';
        if (typeof col.accessor === 'function') {
          valeurCellule = col.accessor(item);
        } else if (col.key) {
          valeurCellule = item[col.key];
        }
        if (valeurCellule === null || valeurCellule === undefined) valeurCellule = '';
        const escapedVal = String(valeurCellule).replace(/"/g, '""');
        return `"${escapedVal}"`;
      });
    });

    // Encodage UTF-8 avec BOM (\uFEFF) pour compatibilité immédiate avec Excel
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(';'),
      ...rows.map(ligne => ligne.join(';'))
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
