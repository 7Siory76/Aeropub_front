import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 5,
  onPageChange,
  onPageSizeChange
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  // Calcul des numéros de page à afficher
  const pages = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination-wrapper" style={{ marginTop: '1.25rem' }}>
      <div className="pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <span>
          Affichage de <strong>{startIdx}</strong> à <strong>{endIdx}</strong> sur <strong>{totalItems}</strong> élément{totalItems > 1 ? 's' : ''}
        </span>

        {onPageSizeChange && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Lignes par page :</span>
            <select
              className="ts-filter-select"
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.82rem', borderRadius: '6px' }}
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        )}
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="Première page"
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Page suivante"
        >
          <ChevronRight size={16} />
        </button>

        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Dernière page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
