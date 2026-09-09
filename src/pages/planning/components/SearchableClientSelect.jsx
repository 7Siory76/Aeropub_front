import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle2 } from 'lucide-react';

/**
 * Composant de sélection de client hybride :
 * - Si clients.length <= 20 : select classique
 * - Si clients.length > 20 : sélecteur avec champ de recherche dynamique (nom, secteur, contact)
 */
export default function SearchableClientSelect({ clients = [], selectedClientId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Fermer le dropdown lors d'un clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedClient = clients.find(c => String(c.id) === String(selectedClientId));

  // Filtrage dynamique sur nom, secteur d'activité et contact
  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.nom_client?.toLowerCase().includes(q) ||
      c.raison_sociale?.toLowerCase().includes(q) ||
      c.secteur_activite?.toLowerCase().includes(q) ||
      c.contact?.toLowerCase().includes(q)
    );
  });

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div
        className="search-input"
        style={{
          borderRadius: '10px',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          border: isOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
          background: 'var(--bg-glass)'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main)',
            width: '100%',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
          placeholder="Rechercher un client (nom, secteur, contact)..."
          value={isOpen ? searchTerm : (selectedClient ? `${selectedClient.raison_sociale || selectedClient.nom_client} ${selectedClient.secteur_activite ? `(${selectedClient.secteur_activite})` : ''}` : '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {selectedClientId && (
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              setSearchTerm('');
              onChange('');
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '105%',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            background: 'var(--bg-card-hover)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-glow)',
            zIndex: 1000,
            padding: '0.25rem'
          }}
        >
          {filteredClients.length === 0 ? (
            <div style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              Aucun client trouvé pour « {searchTerm} »
            </div>
          ) : (
            filteredClients.map(c => {
              const isSelected = String(c.id) === String(selectedClientId);
              const displayName = c.raison_sociale || c.nom_client;
              return (
                <div
                  key={c.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent'}
                  onClick={() => {
                    onChange(c.id);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)' }}>{displayName}</strong>
                    {c.secteur_activite && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)' }}>🏢 {c.secteur_activite}</span>
                    )}
                  </div>
                  {isSelected && <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)' }} />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
