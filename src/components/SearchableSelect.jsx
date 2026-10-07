import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X, Check, SearchX } from 'lucide-react';
import './SearchableSelect.css';

/**
 * Normalise une chaîne de caractères pour une recherche insensible à la casse et aux accents.
 */
function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Composant de sélection avec moniteur de recherche en direct (SearchableSelect / Combobox).
 * Optimisé UX : support tactile mobile (>= 44px), police anti-zoom iOS (>= 16px),
 * navigation au clavier (flèches + Entrée + Echap), et compatibilité thèmes clair/sombre.
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  name,
  id,
  placeholder = '-- Sélectionner une option --',
  searchPlaceholder = 'Rechercher parmi les options...',
  disabled = false,
  required = false,
  clearable = true,
  getOptionValue = (opt) => (opt && typeof opt === 'object' ? (opt.value ?? opt.id ?? opt.reference) : opt),
  getOptionLabel = (opt) => (opt && typeof opt === 'object' ? (opt.label ?? opt.nom_client ?? opt.raison_sociale ?? opt.nom ?? opt.reference) : String(opt ?? '')),
  getOptionSublabel,
  getOptionBadge,
  className = '',
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalisation des options sous un format uniforme
  const parsedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.map((opt, idx) => {
      if (opt === null || opt === undefined) return null;
      const optVal = getOptionValue ? getOptionValue(opt) : (opt.value ?? opt.id ?? opt);
      const optLabel = getOptionLabel ? getOptionLabel(opt) : (opt.label ?? opt.nom ?? String(opt));
      const optSub = getOptionSublabel ? getOptionSublabel(opt) : (opt.sublabel || opt.secteur_activite || opt.nom_aeroport || null);
      const optBadge = getOptionBadge ? getOptionBadge(opt) : (opt.badge || opt.role || opt.nom_role || null);
      return {
        raw: opt,
        value: optVal,
        label: String(optLabel ?? ''),
        sublabel: optSub ? String(optSub) : null,
        badge: optBadge ? String(optBadge) : null,
        key: `${optVal}-${idx}`
      };
    }).filter(Boolean);
  }, [options, getOptionValue, getOptionLabel, getOptionSublabel, getOptionBadge]);

  // Option actuellement sélectionnée
  const selectedOption = useMemo(() => {
    if (value === '' || value === null || value === undefined) return null;
    return parsedOptions.find((opt) => String(opt.value) === String(value)) || null;
  }, [parsedOptions, value]);

  // Filtrage multi-critères avec moniteur de recherche
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return parsedOptions;
    const query = normalizeText(searchTerm);
    return parsedOptions.filter((opt) => {
      const labelNorm = normalizeText(opt.label);
      const subNorm = normalizeText(opt.sublabel);
      const badgeNorm = normalizeText(opt.badge);
      const valNorm = normalizeText(opt.value);
      return (
        labelNorm.includes(query) ||
        subNorm.includes(query) ||
        badgeNorm.includes(query) ||
        valNorm.includes(query)
      );
    });
  }, [parsedOptions, searchTerm]);

  // Fermer le dropdown lors d'un clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus automatique sur le champ de recherche à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Défilement automatique vers l'élément survolé au clavier
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('.searchable-select-option');
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedIndex]);

  // Émission du changement
  const handleSelect = (option) => {
    const newVal = option ? option.value : '';
    setIsOpen(false);
    setSearchTerm('');
    if (onChange) {
      // Supporte à la fois onChange(value) et onChange({ target: { name, value } })
      const syntheticEvent = {
        target: { name: name || '', value: newVal },
        currentTarget: { name: name || '', value: newVal }
      };
      onChange(newVal, syntheticEvent);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    handleSelect(null);
  };

  // Gestion du clavier
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[focusedIndex]);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0]);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-select-container ${className}`}
      style={style}
      onKeyDown={handleKeyDown}
    >
      {/* Champ HTML invisible pour la conformité et la validation native `required` */}
      <input
        type="text"
        name={name}
        id={id}
        value={value || ''}
        required={required}
        readOnly
        tabIndex={-1}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px',
          margin: '-1px'
        }}
        onChange={() => {}}
      />

      {/* Déclencheur (Trigger Box) */}
      <div
        className={`searchable-select-trigger ${isOpen ? 'is-open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
      >
        <div className="searchable-select-value">
          {selectedOption ? (
            <>
              <span style={{ fontWeight: 600, color: 'inherit' }}>{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="searchable-select-option-badge">
                  {selectedOption.badge}
                </span>
              )}
              {selectedOption.sublabel && !selectedOption.badge && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', opacity: 0.85 }}>
                  ({selectedOption.sublabel})
                </span>
              )}
            </>
          ) : (
            <span className="searchable-select-placeholder">{placeholder}</span>
          )}
        </div>

        <div className="searchable-select-actions">
          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              className="searchable-select-clear-btn"
              onClick={handleClear}
              title="Effacer la sélection"
              aria-label="Effacer"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={17}
            className={`searchable-select-chevron ${isOpen ? 'rotated' : ''}`}
          />
        </div>
      </div>

      {/* Menu Déroulant (Dropdown Popup) avec Moniteur de Recherche */}
      {isOpen && (
        <div className="searchable-select-dropdown" role="listbox">
          {/* Moniteur de recherche */}
          <div className="searchable-select-search-box">
            <Search size={16} className="searchable-select-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select-search-input"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFocusedIndex(0);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                className="searchable-select-clear-btn"
                onClick={() => setSearchTerm('')}
                title="Effacer la recherche"
              >
                <X size={12} />
              </button>
            )}
            <span className="searchable-select-badge-count">
              {filteredOptions.length}
            </span>
          </div>

          {/* Liste déroulante des options filtrées */}
          <div ref={listRef} className="searchable-select-options-list">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">
                <SearchX size={24} style={{ opacity: 0.5, marginBottom: '0.25rem' }} />
                <div>Aucun résultat pour « {searchTerm} »</div>
                <div className="searchable-select-empty-sub">
                  Vérifiez l'orthographe ou essayez un autre mot-clé
                </div>
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isFocused = idx === focusedIndex;

                return (
                  <div
                    key={opt.key}
                    className={`searchable-select-option ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    <div className="searchable-select-option-content">
                      <div className="searchable-select-option-main">
                        <span>{opt.label}</span>
                      </div>
                      {opt.sublabel && (
                        <div className="searchable-select-option-sub">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                      {opt.badge && (
                        <span className="searchable-select-option-badge">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check size={16} className="searchable-select-option-check" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
