import React, { useState, useMemo } from 'react';
import { 
  RotateCcw, 
  Settings, 
  Send, 
  Loader2, 
  Calendar, 
  User, 
  Search, 
  Mail, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';
import Pagination from '../../../components/Pagination';

// Gestion des préavis de reconduction tacite et historique des notifications
export default function PreavisReconductionSection({
  alertPreavisAbos = [],
  actions = [],
  canSendManualEmail = false,
  canEditEmailTemplate = false,
  onSendPreavisEmail,
  sendingRef,
  onOpenTemplateModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('date_action');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filtrage des actions de reconduction
  const filteredActions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return actions.filter((act) => {
      // 1. Recherche textuelle
      if (q) {
        const match =
          (act.nom_client || '').toLowerCase().includes(q) ||
          (act.id_abonnement || '').toLowerCase().includes(q) ||
          (act.reference || '').toLowerCase().includes(q) ||
          (act.nom_commercial || '').toLowerCase().includes(q) ||
          (act.description || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Statut envoi email
      if (selectedStatus !== 'all') {
        if ((act.statut_envoi_email || '').toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [actions, searchTerm, selectedStatus]);

  // Tri
  const sortedActions = useMemo(() => {
    if (!sortField) return filteredActions;
    return [...filteredActions].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'date_action') {
        valA = a.date_action ? new Date(a.date_action).getTime() : 0;
        valB = b.date_action ? new Date(b.date_action).getTime() : 0;
      } else if (sortField === 'nom_client') {
        valA = (a.nom_client || '').toLowerCase();
        valB = (b.nom_client || '').toLowerCase();
      } else if (sortField === 'nom_commercial') {
        valA = (a.nom_commercial || '').toLowerCase();
        valB = (b.nom_commercial || '').toLowerCase();
      } else if (sortField === 'statut_envoi_email') {
        valA = (a.statut_envoi_email || '').toLowerCase();
        valB = (b.statut_envoi_email || '').toLowerCase();
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const compare = typeof valA === 'string' ? valA.localeCompare(valB, 'fr') : (valA > valB ? 1 : -1);
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [filteredActions, sortField, sortDirection]);

  // Pagination
  const paginatedActions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedActions.slice(start, start + pageSize);
  }, [sortedActions, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="table-head-sort-icon" style={{ opacity: 0.35, marginLeft: 4 }} />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={13} className="table-head-sort-icon" style={{ color: '#38bdf8', marginLeft: 4 }} />
      : <ArrowDown size={13} className="table-head-sort-icon" style={{ color: '#38bdf8', marginLeft: 4 }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. PANNEAU ALERTE : PRÉAVIS DE RECONDUCTION TACITE */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        background: 'rgba(56, 189, 248, 0.07)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <RotateCcw size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '1.05rem', fontWeight: 700 }}>
                Préavis de reconduction tacite ({alertPreavisAbos.length} contrat{alertPreavisAbos.length > 1 ? 's' : ''} actif{alertPreavisAbos.length > 1 ? 's' : ''} sous préavis)
              </h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Contrats soumis à reconduction automatique sans renouvellement enregistré. Informez les clients avant la date limite s'ils souhaitent résilier.
              </p>
            </div>
          </div>

          {canEditEmailTemplate && onOpenTemplateModal && (
            <button
              type="button"
              className="pill-btn"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={onOpenTemplateModal}
              title="Modifier le modèle de courriel de préavis (Administrateur)"
            >
              <Settings size={14} />
              <span>Modèle de préavis</span>
            </button>
          )}
        </div>

        {alertPreavisAbos.length === 0 ? (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Aucun contrat actif soumis à préavis actuellement.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '0.85rem' }}>
            {alertPreavisAbos.map((abo) => (
              <div key={abo.reference} style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                minWidth: '280px',
                flex: '1 1 calc(33.333% - 0.85rem)',
                maxWidth: '100%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{abo.reference}</strong>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: abo.diffDaysPreavis > 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: abo.diffDaysPreavis > 0 ? '#38bdf8' : '#f87171',
                    border: abo.diffDaysPreavis > 0 ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)'
                  }}>
                    {abo.diffDaysPreavis > 0 
                      ? `⏳ Reste ${abo.diffDaysPreavis} j pour résilier` 
                      : (abo.diffDaysEcheance > 0 ? `🔒 Préavis clos (Reste ${abo.diffDaysEcheance} j)` : '🔒 Échéance atteinte')}
                  </span>
                </div>

                <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                  {abo.nom_client || abo.raison_sociale}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <div>
                    📅 Échéance : <strong>{new Date(abo.date_echeance || abo.date_fin).toLocaleDateString('fr-FR')}</strong>
                  </div>
                  <div>
                    ⏱️ Préavis : <strong>{abo.preavisJours} jours</strong>
                  </div>
                  <div style={{ color: abo.diffDaysPreavis > 0 ? '#38bdf8' : '#fca5a5', fontWeight: 600 }}>
                    ⚠️ Date limite de résiliation : {abo.dateLimitePreavis.toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {canSendManualEmail && onSendPreavisEmail && (
                  <button
                    type="button"
                    className="pill-btn active"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.75rem',
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      marginTop: '0.35rem',
                      background: '#0284c7',
                      borderColor: '#38bdf8'
                    }}
                    onClick={() => onSendPreavisEmail(abo)}
                    disabled={sendingRef === abo.reference}
                    title="Envoyer le courriel de préavis au client"
                  >
                    {sendingRef === abo.reference ? <Loader2 size={12} className="btn-spinner" /> : <Send size={12} />}
                    <span>{sendingRef === abo.reference ? 'Envoi en cours...' : 'Envoyer le préavis de résiliation'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. TABLEAU : HISTORIQUE DES PRÉAVIS DE RECONDUCTION TACITE */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 600 }}>
              Historique des préavis de reconduction ({filteredActions.length})
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Historique des notifications de reconduction tacite et réexpédition des courriels.
            </p>
          </div>

          {/* Filtres de recherche */}
          <div className="ts-filters-bar" style={{ margin: 0 }}>
            <div className="ts-filter-group">
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="ts-filter-input"
                placeholder="Rechercher client, réf..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ width: '190px' }}
              />
            </div>

            <div className="ts-filter-group">
              <span>Statut :</span>
              <select
                className="ts-filter-select"
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">Tous les statuts</option>
                <option value="Envoyé">Envoyé</option>
                <option value="En attente">En attente</option>
                <option value="Échec">Échec</option>
              </select>
            </div>
          </div>
        </div>

        {filteredActions.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
            <Mail size={32} style={{ opacity: 0.35, marginBottom: '0.5rem', color: '#38bdf8' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Aucun préavis de reconduction ne correspond à ces critères.
            </p>
          </div>
        ) : (
          <div className="aeropub-table-wrapper">
            <table className="aeropub-table">
              <thead>
                <tr className="table-head-row-indigo">
                  <th className="table-head-cell sortable" onClick={() => handleSort('date_action')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Date {renderSortIcon('date_action')}
                  </th>
                  <th className="table-head-cell">Type d'action</th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('nom_client')} style={{ cursor: 'pointer' }}>
                    Client & Contrat {renderSortIcon('nom_client')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('nom_commercial')} style={{ cursor: 'pointer' }}>
                    Commercial {renderSortIcon('nom_commercial')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
                    Description {renderSortIcon('description')}
                  </th>
                  <th className="table-head-cell sortable" onClick={() => handleSort('statut_envoi_email')} style={{ textAlign: 'center', cursor: 'pointer' }}>
                    Statut du courriel {renderSortIcon('statut_envoi_email')}
                  </th>
                  {canSendManualEmail && <th className="table-head-cell" style={{ textAlign: 'center' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedActions.map((act) => {
                  const aboRef = act.id_abonnement || act.reference;
                  const isSending = sendingRef === aboRef;

                  return (
                    <tr key={act.id} className="table-body-row">
                      <td className="cell-muted" style={{ whiteSpace: 'nowrap' }}>
                        <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {new Date(act.date_action).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="cell-cyan">
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          color: '#38bdf8',
                          fontWeight: 600,
                          fontSize: '0.78rem'
                        }}>
                          {act.type_action || 'Préavis de reconduction'}
                        </span>
                      </td>
                      <td className="cell-bold-white">
                        <div>{act.nom_client || (act.id_client ? `Client #${act.id_client}` : 'Général')}</div>
                        {aboRef && (
                          <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                            Réf. : {aboRef}
                          </div>
                        )}
                      </td>
                      <td className="cell-muted">
                        <User size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {act.nom_commercial || `Utilisateur #${act.id_utilisateur}`}
                      </td>
                      <td className="table-body-cell" style={{ maxWidth: '280px', fontSize: '0.82rem' }}>
                        {act.description || 'Préavis de reconduction tacite'}
                      </td>
                      <td className="table-body-cell" style={{ textAlign: 'center' }}>
                        <span className={`wireframe-badge ${act.statut_envoi_email === 'Envoyé' ? 'badge-available' : 'badge-occupied'}`}>
                          {act.statut_envoi_email || 'En attente'}
                        </span>
                      </td>
                      {canSendManualEmail && (
                        <td className="table-body-cell" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="pill-btn active"
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.22rem 0.55rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              background: '#0284c7',
                              borderColor: '#38bdf8',
                              opacity: !aboRef ? 0.45 : 1
                            }}
                            onClick={() => onSendPreavisEmail && onSendPreavisEmail(act)}
                            disabled={!aboRef || isSending}
                            title={!aboRef ? "Aucun contrat associé à cette action" : "Renvoyer le courriel de préavis de reconduction tacite au client"}
                          >
                            {isSending ? <Loader2 size={11} className="btn-spinner" /> : <Send size={11} />}
                            <span>{isSending ? 'Envoi...' : 'Renvoyer le courriel'}</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={sortedActions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
