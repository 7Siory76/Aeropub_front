import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, FolderKanban, Search, RotateCcw, Plus, Edit, Trash2 } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import CategorieModal from '../modals/CategorieModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import { categoriesApi } from '../../../api';
import { useFeedback } from '../../../context/FeedbackContext';

export default function CategoriesTab({
  categories = [],
  emplacements = [],
  abonnements = [],
  clients = [],
  zones = [],
  initialSearchQuery = '',
  onRefresh
}) {
  const { showSuccess, showError } = useFeedback();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [catSearch, setCatSearch] = useState('');
  const [supportSearch, setSupportSearch] = useState(initialSearchQuery);
  const [catDateFilter, setCatDateFilter] = useState('all');
  const [catClientFilter, setCatClientFilter] = useState('all');
  const [catStatusFilter, setCatStatusFilter] = useState('all');
  const [catZoneFilter, setCatZoneFilter] = useState('all');
  const [expandedRefAcc, setExpandedRefAcc] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const toggleRefExpand = (ref) => {
    setExpandedRefAcc(prev => ({
      ...prev,
      [ref]: !prev[ref]
    }));
  };

  const activeCategory = selectedCategory || categories[0];

  if (categories.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', margin: '1rem auto', maxWidth: '600px', borderRadius: '16px' }}>
        <FolderKanban size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1rem', opacity: 0.7 }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Aucune catégorie de support trouvée</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Vous pouvez initialiser votre référentiel en créant une première catégorie d'affichage.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setCategoryToEdit(null);
            setShowAddEditModal(true);
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem' }}
        >
          <Plus size={16} />
          <span>Créer une Catégorie</span>
        </button>

        <CategorieModal
          isOpen={showAddEditModal}
          category={categoryToEdit}
          onClose={() => {
            setShowAddEditModal(false);
            setCategoryToEdit(null);
          }}
          onRefresh={onRefresh}
        />
      </div>
    );
  }

  const activeCatName = activeCategory?.nom || activeCategory?.nom_categorie;

  // Emplacements / supports pour cette catégorie
  const catEmplacements = activeCategory
    ? emplacements.filter(e =>
        e.id_categorie === activeCategory.id ||
        e.nom_categorie === activeCatName
      )
    : [];

  const hasActiveFilters =
    supportSearch.trim() !== '' ||
    catDateFilter !== 'all' ||
    catZoneFilter !== 'all' ||
    catClientFilter !== 'all' ||
    catStatusFilter !== 'all';

  const resetFilters = () => {
    setSupportSearch('');
    setCatDateFilter('all');
    setCatZoneFilter('all');
    setCatClientFilter('all');
    setCatStatusFilter('all');
    setCurrentPage(1);
  };

  // Réinitialiser la page si la catégorie ou un filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory?.id, supportSearch, catDateFilter, catZoneFilter, catClientFilter, catStatusFilter]);

  // Déclenchement de la modale de suppression sécurisée
  const handleDeleteCategory = (cat) => {
    setCategoryToDelete(cat);
  };

  // Application des filtres : Recherche textuelle, Format, Date, Client, Status, Zone
  const filteredCatEmps = catEmplacements.filter(emp => {
    const abo = abonnements.find(a =>
      (a.reference_emplacement || a.reference) === emp.reference ||
      (a.supports_associes && a.supports_associes.includes(emp.reference))
    );

    // 1. Recherche textuelle dans le support
    if (supportSearch.trim()) {
      const q = supportSearch.toLowerCase().trim();
      const match =
        (emp.reference || '').toLowerCase().includes(q) ||
        (emp.caracteristiques || emp.ref_format || '').toLowerCase().includes(q) ||
        (emp.nom_zone || emp.nom_lieu || '').toLowerCase().includes(q) ||
        (emp.observation || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    // 3. Filtre par Date sélectionnée (Contrat actif à cette date)
    if (catDateFilter && catDateFilter !== 'all') {
      if (!abo) return false;
      const dateParts = catDateFilter.split('-');
      if (dateParts.length === 3) {
        const targetTime = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10), 12, 0, 0).getTime();
        const startStr = String(abo.date_debut || '').trim().replace(' ', 'T');
        const endStr = String(abo.date_echeance || abo.date_fin || '').trim().replace(' ', 'T');
        const startTime = new Date(startStr).getTime();
        const endTime = new Date(endStr).getTime();

        if (isNaN(startTime) || isNaN(endTime) || targetTime < startTime || targetTime > endTime) {
          return false;
        }
      }
    }

    // 4. Filtre Client
    if (catClientFilter !== 'all') {
      if (!abo || (
        String(abo.id_client) !== String(catClientFilter) &&
        abo.nom_client !== catClientFilter &&
        abo.raison_sociale !== catClientFilter
      )) {
        return false;
      }
    }

    // 5. Filtre Status (Occupé / Disponible)
    const empStatus = (emp.etat || emp.statut || 'disponible').toLowerCase();
    const isOccupied = !!abo || empStatus.includes('occup');

    if (catStatusFilter === 'occupied') {
      if (!isOccupied) return false;
    } else if (catStatusFilter === 'available') {
      if (isOccupied) return false;
    }

    // 6. Filtre Zone Aéroportuaire
    if (catZoneFilter !== 'all') {
      const targetZone = zones.find(z => String(z.id) === String(catZoneFilter));
      const empZone = emp.nom_zone || emp.type_zone || emp.nom_lieu;
      const targetZoneName = targetZone?.nom_zone || targetZone?.type_zone || targetZone?.nom_lieu;

      const isZoneMatch = (
        String(emp.id_zone) === String(catZoneFilter) ||
        (empZone && targetZoneName && empZone.toLowerCase() === targetZoneName.toLowerCase())
      );
      if (!isZoneMatch) return false;
    }

    return true;
  });

  // Découpage paginé des supports de la catégorie
  const paginatedCatEmps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCatEmps.slice(start, start + pageSize);
  }, [filteredCatEmps, currentPage, pageSize]);

  // Catégories filtrées par la recherche de gauche
  const filteredCategories = categories.filter(c => {
    if (!catSearch.trim()) return true;
    const name = c.nom || c.nom_categorie || '';
    return name.toLowerCase().includes(catSearch.toLowerCase().trim());
  });

  return (
    <div className="ts-two-panel-grid">
      {/* COLONNE 1 (GAUCHE) : Liste des Catégories */}
      <div className="ts-panel-box ts-left-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h3 className="ts-panel-title" style={{ margin: 0 }}>
            <FolderKanban size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Catégories ({categories.length})</span>
          </h3>
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '8px' }}
            onClick={() => {
              setCategoryToEdit(null);
              setShowAddEditModal(true);
            }}
            title="Ajouter une nouvelle catégorie"
          >
            <Plus size={14} />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Barre de recherche sur les catégories */}
        <div style={{ marginBottom: '0.85rem' }}>
          <input
            type="text"
            className="ts-filter-input"
            placeholder="Filtrer catégories..."
            value={catSearch}
            onChange={(e) => setCatSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div className="ts-types-list">
          {filteredCategories.map((cat) => {
            const isSelected = activeCategory?.id === cat.id;
            const currentCatName = cat.nom || cat.nom_categorie;
            const empCount = emplacements.filter(e =>
              e.id_categorie === cat.id ||
              e.nom_categorie === currentCatName
            ).length;

            return (
              <div
                key={cat.id}
                className={`ts-card-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setExpandedRefAcc({});
                  setCurrentPage(1);
                }}
              >
                <div>
                  <div className="ts-card-name">{currentCatName}</div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {empCount} support{empCount > 1 ? 's' : ''} rattaché{empCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryToEdit(cat);
                      setShowAddEditModal(true);
                    }}
                    title="Modifier cette catégorie"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                    title="Supprimer cette catégorie"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight size={18} style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }} className="ts-card-arrow" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Détails de la catégorie sélectionnée */}
      <div className="ts-panel-box">
        {!activeCategory ? (
          <p className="empty-msg">Sélectionnez une catégorie.</p>
        ) : (
          <div>
            {/* En-tête de la Catégorie sélectionnée */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.5px', color: 'var(--text-main)', textTransform: 'uppercase', margin: 0 }}>
                  Catégorie : {activeCatName}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ID #{activeCategory.id} &bull; {catEmplacements.length} support{catEmplacements.length > 1 ? 's' : ''} au total
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="client-badge-discrete" style={{ fontSize: '0.82rem', padding: '0.25rem 0.75rem' }}>
                  {filteredCatEmps.length} / {catEmplacements.length} SUPPORT{catEmplacements.length > 1 ? 'S' : ''}
                </span>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setCategoryToEdit(activeCategory);
                    setShowAddEditModal(true);
                  }}
                  title="Modifier le nom de cette catégorie"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}
                >
                  <Edit size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>Modifier</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleDeleteCategory(activeCategory)}
                  title="Supprimer cette catégorie"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', padding: '0.35rem 0.8rem', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#ef4444' }}
                >
                  <Trash2 size={14} />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>

            {/* Barre de Filtres Multicritères */}
            <div className="ts-filters-bar">
              {/* Recherche textuelle support */}
              <div className="ts-filter-group">
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="ts-filter-input"
                  placeholder="Réf / Dimensions..."
                  value={supportSearch}
                  onChange={(e) => setSupportSearch(e.target.value)}
                  style={{ width: '150px' }}
                />
              </div>

              {/* Filtre par Date */}
              <div className="ts-filter-group">
                <span>Date :</span>
                <input
                  type="date"
                  className="ts-filter-select"
                  value={catDateFilter === 'all' ? '' : catDateFilter}
                  onChange={(e) => setCatDateFilter(e.target.value || 'all')}
                />
              </div>

              {/* Filtre Zone Aéroportuaire */}
              <div className="ts-filter-group">
                <span>Zone :</span>
                <select
                  className="ts-filter-select"
                  value={catZoneFilter}
                  onChange={(e) => setCatZoneFilter(e.target.value)}
                >
                  <option value="all">Toutes 🗺️</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>
                      {z.nom_zone || z.type_zone} {z.nom_aeroport ? `(${z.nom_aeroport})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Client */}
              <div className="ts-filter-group">
                <span>Client :</span>
                <select
                  className="ts-filter-select"
                  value={catClientFilter}
                  onChange={(e) => setCatClientFilter(e.target.value)}
                >
                  <option value="all">Tous 🔍</option>
                  {clients.map(cl => (
                    <option key={cl.id} value={cl.id}>
                      {cl.raison_sociale || cl.nom_client}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Status */}
              <div className="ts-filter-group">
                <span>Statut :</span>
                <select
                  className="ts-filter-select"
                  value={catStatusFilter}
                  onChange={(e) => setCatStatusFilter(e.target.value)}
                >
                  <option value="all">Tous ∨</option>
                  <option value="occupied">🔴 Occupé</option>
                  <option value="available">🟢 Disponible</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="ts-reset-btn"
                  onClick={resetFilters}
                  title="Réinitialiser les filtres"
                >
                  <RotateCcw size={13} />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>

            {/* Liste en accordéon des supports liés à cette catégorie */}
            <div>
              {filteredCatEmps.length === 0 ? (
                <p className="empty-msg">Aucun support publicitaire ne correspond à ces critères pour cette catégorie.</p>
              ) : (
                paginatedCatEmps.map((emp) => {
                  const abo = abonnements.find(a =>
                    (a.reference_emplacement || a.reference) === emp.reference ||
                    (a.supports_associes && a.supports_associes.includes(emp.reference))
                  );
                  const isExpanded = !!expandedRefAcc[emp.reference];
                  const stateVal = (emp.etat || emp.statut || 'Disponible').toLowerCase();
                  const isOccupied = !!abo || stateVal.includes('occup');

                  return (
                    <div key={emp.reference} className="ts-ref-accordion-item">
                      {/* En-tête Référence */}
                      <div
                        className="ts-ref-accordion-header"
                        onClick={() => toggleRefExpand(emp.reference)}
                      >
                        <div className="ts-ref-title">
                          <span>{emp.reference}</span>
                          <span className={`wireframe-badge ${isOccupied ? 'badge-occupied' : 'badge-available'}`} style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem' }}>
                            {isOccupied ? 'Occupé' : 'Disponible'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                          <span style={{ fontSize: '0.82rem' }}>{emp.caracteristiques || emp.ref_format || 'Format standard'}</span>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* Contenu Déroulé */}
                      {isExpanded && (
                        <div className="ts-ref-accordion-body">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
                            <div>
                              <span className="client-abo-label">Zone & Aéroport :</span>
                              <div className="client-abo-value">{emp.nom_zone || emp.nom_lieu || 'N/A'} ({emp.nom_aeroport || 'Ivato'})</div>
                            </div>

                            <div>
                              <span className="client-abo-label">Caractéristiques & Type :</span>
                              <div className="client-abo-value" style={{ color: 'var(--accent-secondary)' }}>
                                {emp.caracteristiques || emp.ref_format || 'N/A'} | {emp.nom_type_support || 'Standard'}
                              </div>
                            </div>

                            <div>
                              <span className="client-abo-label">Observation :</span>
                              <div className="client-abo-value">
                                {emp.observation || 'Aucune'}
                              </div>
                            </div>

                            <div>
                              <span className="client-abo-label">Statut Actuel :</span>
                              <div className="client-abo-value" style={{ color: isOccupied ? '#ef4444' : '#10b981' }}>
                                {emp.etat || emp.statut || 'Disponible'}
                              </div>
                            </div>
                          </div>

                          {/* Détails de l'Abonnement si présent */}
                          {abo && (
                            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-glass)' }}>
                              <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
                                📋 Contrat Actif Associé ({abo.reference}) :
                              </h5>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                                <div>
                                  <span className="client-abo-label">Client :</span>
                                  <div className="client-abo-value">
                                    {abo.raison_sociale || abo.nom_client || `Client #${abo.id_client}`}
                                  </div>
                                </div>

                                <div>
                                  <span className="client-abo-label">Période du Contrat :</span>
                                  <div className="client-abo-value" style={{ color: 'var(--accent-success)' }}>
                                    Du {new Date(abo.date_debut).toLocaleDateString('fr-FR')} au {new Date(abo.date_echeance || abo.date_fin).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>

                                {abo.tarif && (
                                  <div>
                                    <span className="client-abo-label">Tarif :</span>
                                    <div className="client-abo-value" style={{ fontWeight: 700 }}>
                                      {Number(abo.tarif).toLocaleString('fr-FR')} {abo.devise || 'MGA'} ({abo.periodicite || 'Annuel'})
                                    </div>
                                  </div>
                                )}

                                {abo.nom_commercial && (
                                  <div>
                                    <span className="client-abo-label">Commercial :</span>
                                    <div className="client-abo-value">{abo.nom_commercial}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {filteredCatEmps.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredCatEmps.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modale d'ajout ou modification de catégorie */}
      <CategorieModal
        isOpen={showAddEditModal}
        category={categoryToEdit}
        onClose={() => {
          setShowAddEditModal(false);
          setCategoryToEdit(null);
        }}
        onRefresh={onRefresh}
      />

      {/* Modale de confirmation de suppression */}
      {categoryToDelete && (
        <DeleteConfirmModal
          isOpen={!!categoryToDelete}
          title="Supprimer la catégorie"
          itemName={categoryToDelete.nom || categoryToDelete.nom_categorie || `Catégorie #${categoryToDelete.id}`}
          itemType="catégorie"
          associatedCount={
            emplacements.filter(e =>
              e.id_categorie === categoryToDelete.id ||
              e.nom_categorie === (categoryToDelete.nom || categoryToDelete.nom_categorie)
            ).length
          }
          associatedLabel="support(s) rattaché(s)"
          onConfirm={async () => {
            const catName = categoryToDelete.nom || categoryToDelete.nom_categorie || `Catégorie #${categoryToDelete.id}`;
            await categoriesApi.delete(categoryToDelete.id);
            showSuccess(`Catégorie « ${catName} » supprimée avec succès.`);
            if (selectedCategory?.id === categoryToDelete.id) {
              setSelectedCategory(null);
            }
            if (onRefresh) onRefresh();
          }}
          onClose={() => setCategoryToDelete(null)}
        />
      )}
    </div>
  );
}
