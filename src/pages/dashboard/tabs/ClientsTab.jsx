import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Mail, MapPin, Building2, Search, RotateCcw, Plus, Edit3, Trash2 } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import AddClientModal from '../modals/AddClientModal';
import EditClientModal from '../modals/EditClientModal';
import { clientsApi } from '../../../api';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import { hasRole } from '../../../utils/rbac';

export default function ClientsTab({
  clients = [],
  abonnements = [],
  initialSearchQuery = '',
  onSelectClient,
  onRefresh
}) {
  const { user } = useAuth();

  // Permissions RBAC (Module 2)
  const canCreateOrEditClient = hasRole(user, ['Admin', 'Resp_Com', 'Commercial']);
  const canDeleteClient = hasRole(user, ['Admin', 'Resp_Com']);

  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedEtat, setSelectedEtat] = useState('all');
  const [selectedSecteur, setSelectedSecteur] = useState('all');
  const [selectedAboStatus, setSelectedAboStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // États pour les modales d'ajout et de modification
  const [showAddModal, setShowAddModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEtat, selectedSecteur, selectedAboStatus]);

  const secteurOptions = useMemo(() => {
    const s = [...new Set(clients.map(c => c.secteur_activite).filter(Boolean))];
    return s.sort();
  }, [clients]);

  const etatOptions = useMemo(() => {
    const e = [...new Set(clients.map(c => c.etat_client).filter(Boolean))];
    return e.sort();
  }, [clients]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedEtat !== 'all' ||
    selectedSecteur !== 'all' ||
    selectedAboStatus !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedEtat('all');
    setSelectedSecteur('all');
    setSelectedAboStatus('all');
    setCurrentPage(1);
  };

  const getClientAboCount = (cli) => {
    const clientName = cli.raison_sociale || cli.nom_client;
    return abonnements.filter(
      a => String(a.id_client) === String(cli.id) ||
        a.nom_client === clientName ||
        a.raison_sociale === clientName
    ).length;
  };

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return clients.filter((cli) => {
      const clientName = cli.raison_sociale || cli.nom_client || '';

      // 1. Recherche textuelle
      if (q) {
        const matchText =
          clientName.toLowerCase().includes(q) ||
          (cli.contact || cli.valeur_contact_principal || '').toLowerCase().includes(q) ||
          (cli.adresse_postale || '').toLowerCase().includes(q) ||
          (cli.secteur_activite || '').toLowerCase().includes(q);

        if (!matchText) return false;
      }

      // 2. État client
      if (selectedEtat !== 'all') {
        const etat = (cli.etat_client || 'Actif').toLowerCase();
        if (etat !== selectedEtat.toLowerCase()) return false;
      }

      // 3. Secteur d'activité
      if (selectedSecteur !== 'all') {
        if ((cli.secteur_activite || '').toLowerCase() !== selectedSecteur.toLowerCase()) {
          return false;
        }
      }

      // 4. Statut abonnement
      if (selectedAboStatus !== 'all') {
        const count = getClientAboCount(cli);
        if (selectedAboStatus === 'with_abo' && count === 0) return false;
        if (selectedAboStatus === 'no_abo' && count > 0) return false;
      }

      return true;
    });
  }, [clients, abonnements, searchTerm, selectedEtat, selectedSecteur, selectedAboStatus]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  // Suppression d'un client avec confirmation
  const handleDeleteClient = async (cli) => {
    const clientName = cli.raison_sociale || cli.nom_client || `Client #${cli.id}`;
    if (!window.confirm(`Êtes-vous certain de vouloir supprimer le client « ${clientName} » ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await clientsApi.delete(cli.id);
      toast.success(`Client « ${clientName} » supprimé avec succès.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur suppression client:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression du client.');
    }
  };

  return (
    <div>
      {/* Barre de filtres multicritères */}
      <div className="ts-filters-bar">
        <div className="ts-filter-group">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="ts-filter-input"
            placeholder="Rechercher (Client, email...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '190px' }}
          />
        </div>

        <div className="ts-filter-group">
          <span>État :</span>
          <select
            className="ts-filter-select"
            value={selectedEtat}
            onChange={(e) => setSelectedEtat(e.target.value)}
          >
            <option value="all">Tous les états</option>
            {etatOptions.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <div className="ts-filter-group">
          <span>Secteur :</span>
          <select
            className="ts-filter-select"
            value={selectedSecteur}
            onChange={(e) => setSelectedSecteur(e.target.value)}
          >
            <option value="all">Tous les secteurs 🏢</option>
            {secteurOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="ts-filter-group">
          <span>Contrats :</span>
          <select
            className="ts-filter-select"
            value={selectedAboStatus}
            onChange={(e) => setSelectedAboStatus(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="with_abo">📄 Avec contrat(s) actif(s)</option>
            <option value="no_abo">Sans contrat actif</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="ts-reset-btn"
            onClick={resetFilters}
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw size={13} />
            <span>Réinitialiser</span>
          </button>
        )}

        <div className="ts-filter-badge-count">
          {filteredClients.length} / {clients.length} client{clients.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="cards-grid">
        {paginatedClients.map((cli) => {
          const clientName = cli.raison_sociale || cli.nom_client;
          const countAbos = getClientAboCount(cli);

          return (
            <div
              key={cli.id}
              className="client-card"
              style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
              onClick={() => onSelectClient && onSelectClient(cli)}
            >
              <div className="client-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Building2 size={20} style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="client-card-name">{clientName}</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`wireframe-badge ${cli.etat_client === 'Actif' ? 'badge-available' : 'badge-occupied'}`}>
                    {cli.etat_client || 'Actif'}
                  </span>


                </div>
              </div>

              <div className="client-card-body" style={{ marginTop: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                  <Mail size={14} />
                  <span>{cli.contact || cli.valeur_contact_principal || 'Aucun contact'}</span>
                </div>
                {cli.adresse_postale && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    <MapPin size={14} />
                    <span>{cli.adresse_postale}</span>
                  </div>
                )}
                {cli.secteur_activite && (
                  <div className="client-badge-sector" style={{ marginTop: '0.5rem' }}>
                    {cli.secteur_activite}
                  </div>
                )}
              </div>

              <div className="client-card-footer" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="client-abo-count" style={{ color: 'var(--accent-secondary)', fontWeight: 700, fontSize: '0.88rem' }}>
                  📄 {countAbos} contrat(s) actif(s)
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>Voir contrats</span>
                  <ExternalLink size={12} />
                </span>
              </div>
              {/* Actions Modifier / Supprimer selon RBAC (Module 2) */}
              {(canCreateOrEditClient || canDeleteClient) && (
                <>
                  <br />
                  <div className="client-card-actions">
                    {canCreateOrEditClient && (
                      <button
                        type="button"
                        className="client-action-btn btn-edit"
                        title="Modifier ce client"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientToEdit(cli);
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                    {canDeleteClient && (
                      <button
                        type="button"
                        className="client-action-btn btn-delete"
                        title="Supprimer ce client (Admin / Resp_Com)"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(cli);
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Dernière carte : contient uniquement "+" pour ajouter de nouveaux clients (Module 2 : Admin, Resp_Com, Commercial) */}
        {canCreateOrEditClient && (
          <div
            className="client-card client-card-add"
            onClick={() => setShowAddModal(true)}
            title="Ajouter un nouveau client"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowAddModal(true)}
          >
            <div className="client-card-add-icon">
              <Plus size={30} strokeWidth={2.5} />
            </div>
          </div>
        )}
      </div>

      {filteredClients.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredClients.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Modale d'ajout d'un nouveau client */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onRefresh={onRefresh}
        />
      )}

      {/* Modale de modification d'un client existant */}
      {clientToEdit && (
        <EditClientModal
          client={clientToEdit}
          onClose={() => setClientToEdit(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
