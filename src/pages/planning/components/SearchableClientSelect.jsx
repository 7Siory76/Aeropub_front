import React from 'react';
import SearchableSelect from '../../../components/SearchableSelect';

/**
 * Composant de compatibilité qui délègue au SearchableSelect universel.
 */
export default function SearchableClientSelect({ clients = [], selectedClientId, onChange }) {
  return (
    <SearchableSelect
      options={clients}
      value={selectedClientId}
      onChange={onChange}
      placeholder="Rechercher un client (nom, secteur, contact)..."
      searchPlaceholder="Rechercher un client..."
      getOptionValue={(c) => c.id}
      getOptionLabel={(c) => c.raison_sociale || c.nom_client}
      getOptionSublabel={(c) => c.secteur_activite ? `Secteur : ${c.secteur_activite}` : (c.contact || null)}
      getOptionBadge={(c) => c.etat_client || null}
    />
  );
}
