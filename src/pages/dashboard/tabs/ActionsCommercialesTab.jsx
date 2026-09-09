import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Calendar, User, Search, RotateCcw, Filter } from 'lucide-react';
import Pagination from '../../../components/Pagination';

export default function ActionsCommercialesTab({
  actions = [],
  abonnements = [],
  initialSearchQuery = ''
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedTypeAction, setSelectedTypeAction] = useState('all');
  const [selectedCommercial, setSelectedCommercial] = useState('all');
  const [selectedEmailStatus, setSelectedEmailStatus] = useState('all');
  const [showOnlyJ30, setShowOnlyJ30] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTypeAction, selectedCommercial, selectedEmailStatus, showOnlyJ30]);

  // Calcul des contrats à échéance J-30 (alerte renouvellement)
  const now = new Date();
  const alertJ30Abos = useMemo(() => {
    return abonnements.filter((abo) => {
      if (!abo.date_echeance && !abo.date_fin) return false;
      const echeance = new Date(abo.date_echeance || abo.date_fin);
      const diffDays = Math.ceil((echeance.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 30;
    });
  }, [abonnements]);

  const typeActionOptions = useMemo(() => {
    const types = [...new Set(actions.map(a => a.type_action).filter(Boolean))];
    return types.sort();
  }, [actions]);

  const commercialOptions = useMemo(() => {
    const coms = [...new Set(actions.map(a => a.nom_commercial).filter(Boolean))];
    return coms.sort();
  }, [actions]);

  const emailStatusOptions = useMemo(() => {
    const s = [...new Set(actions.map(a => a.statut_envoi_email).filter(Boolean))];
    return s.sort();
  }, [actions]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedTypeAction !== 'all' ||
    selectedCommercial !== 'all' ||
    selectedEmailStatus !== 'all' ||
    showOnlyJ30;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTypeAction('all');
    setSelectedCommercial('all');
    setSelectedEmailStatus('all');
    setShowOnlyJ30(false);
    setCurrentPage(1);
  };

  const filteredActions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return actions.filter((act) => {
      // 1. Recherche textuelle
      if (q) {
        const match =
          (act.nom_client || '').toLowerCase().includes(q) ||
          (act.id_abonnement || '').toLowerCase().includes(q) ||
          (act.nom_commercial || '').toLowerCase().includes(q) ||
          (act.type_action || '').toLowerCase().includes(q) ||
          (act.description || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Type d'action
      if (selectedTypeAction !== 'all') {
        if ((act.type_action || '').toLowerCase() !== selectedTypeAction.toLowerCase()) {
          return false;
        }
      }

      // 3. Commercial
      if (selectedCommercial !== 'all') {
        if ((act.nom_commercial || '').toLowerCase() !== selectedCommercial.toLowerCase()) {
          return false;
        }
      }

      // 4. Statut Email
      if (selectedEmailStatus !== 'all') {
        if ((act.statut_envoi_email || '').toLowerCase() !== selectedEmailStatus.toLowerCase()) {
          return false;
        }
      }

      // 5. J-30 uniquement (lié à un contrat en J-30)
      if (showOnlyJ30) {
        const isJ30 = alertJ30Abos.some(
          a => a.reference === act.id_abonnement ||
               a.nom_client === act.nom_client ||
               a.raison_sociale === act.nom_client
        );
        if (!isJ30) return false;
      }

      return true;
    });
  }, [actions, alertJ30Abos, searchTerm, selectedTypeAction, selectedCommercial, selectedEmailStatus, showOnlyJ30]);

  const paginatedActions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActions.slice(start, start + pageSize);
  }, [filteredActions, currentPage, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Alerte J-30 pour les contrats approchant de leur terme */}
      <div className="glass-panel" style={{
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        border: '1px solid rgba(250, 204, 21, 0.4)',
        background: 'rgba(250, 204, 21, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={18} style={{ color: 'var(--accent-secondary)' }} />
            <h4 style={{ margin: 0, color: 'var(--accent-secondary)', fontSize: '1rem', fontWeight: 700 }}>
              Alertes Relance J-30 ({alertJ30Abos.length} contrat(s) en échéance proche)
            </h4>
          </div>

          <button
            type="button"
            className={`pill-btn ${showOnlyJ30 ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem' }}
            onClick={() => setShowOnlyJ30(!showOnlyJ30)}
          >
            {showOnlyJ30 ? '✓ Filtré sur J-30' : 'Filtrer actions sur J-30'}
          </button>
        </div>

        {alertJ30Abos.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Aucun contrat à renouveler sous les 30 prochains jours.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.6rem' }}>
            {alertJ30Abos.map((abo) => (
              <div key={abo.reference} style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                fontSize: '0.85rem'
              }}>
                <strong style={{ color: 'var(--text-main)' }}>{abo.reference}</strong> - <span>{abo.nom_client || abo.raison_sociale}</span>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>
                  Échéance : {new Date(abo.date_echeance || abo.date_fin).toLocaleDateString('fr-FR')} (Probabilité : {abo.probabilite_renouvellement || 80}%)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique des Actions Commerciales */}
      <div>
        <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 600 }}>
          Historique des Actions Commerciales
        </h4>

        {/* Barre de Filtres Multicritères */}
        <div className="ts-filters-bar">
          <div className="ts-filter-group">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="ts-filter-input"
              placeholder="Rechercher (Client, contrat...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>

          <div className="ts-filter-group">
            <span>Action :</span>
            <select
              className="ts-filter-select"
              value={selectedTypeAction}
              onChange={(e) => setSelectedTypeAction(e.target.value)}
            >
              <option value="all">Toutes actions</option>
              {typeActionOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="ts-filter-group">
            <span>Commercial :</span>
            <select
              className="ts-filter-select"
              value={selectedCommercial}
              onChange={(e) => setSelectedCommercial(e.target.value)}
            >
              <option value="all">Tous 👤</option>
              {commercialOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="ts-filter-group">
            <span>Email :</span>
            <select
              className="ts-filter-select"
              value={selectedEmailStatus}
              onChange={(e) => setSelectedEmailStatus(e.target.value)}
            >
              <option value="all">Tous statuts</option>
              {emailStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
            {filteredActions.length} / {actions.length} action{actions.length > 1 ? 's' : ''}
          </div>
        </div>

        {filteredActions.length === 0 ? (
          <p className="empty-msg">Aucune action commerciale ne correspond à ces critères.</p>
        ) : (
          <div className="aeropub-table-wrapper">
            <table className="aeropub-table">
              <thead>
                <tr className="table-head-row-indigo">
                  <th className="table-head-cell">Date</th>
                  <th className="table-head-cell">Type d'Action</th>
                  <th className="table-head-cell">Client & Contrat</th>
                  <th className="table-head-cell">Commercial</th>
                  <th className="table-head-cell">Description</th>
                  <th className="table-head-cell" style={{ textAlign: 'center' }}>Statut Email</th>
                </tr>
              </thead>
              <tbody>
                {paginatedActions.map((act) => (
                  <tr key={act.id} className="table-body-row">
                    <td className="cell-muted" style={{ whiteSpace: 'nowrap' }}>
                      <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {new Date(act.date_action).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="cell-cyan">
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        fontWeight: 600
                      }}>
                        {act.type_action || 'Relance'}
                      </span>
                    </td>
                    <td className="cell-bold-white">
                      <div>{act.nom_client || (act.id_client ? `Client #${act.id_client}` : 'Général')}</div>
                      {act.id_abonnement && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Réf: {act.id_abonnement}
                        </div>
                      )}
                    </td>
                    <td className="cell-muted">
                      <User size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {act.nom_commercial || `Utilisateur #${act.id_utilisateur}`}
                    </td>
                    <td className="table-body-cell" style={{ maxWidth: '280px' }}>
                      {act.description || 'Aucun détail'}
                    </td>
                    <td className="table-body-cell" style={{ textAlign: 'center' }}>
                      <span className={`wireframe-badge ${act.statut_envoi_email === 'Envoyé' ? 'badge-available' : 'badge-occupied'}`}>
                        {act.statut_envoi_email || 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination pour les actions commerciales */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredActions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
