import React, { useState, useEffect, useMemo } from 'react';
import { journalNotificationApi } from '../../../api';
import { ScrollText, RefreshCw, CheckCheck, Search, Clock, Eye } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AuditLogsTab({ onCountChange }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditCategory, setAuditCategory] = useState('TOUTES');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditNonLu, setAuditNonLu] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await journalNotificationApi.getAll(auditCategory, auditNonLu);
      const logs = Array.isArray(res) ? res : (res?.data || []);
      setAuditLogs(logs);
      if (onCountChange) onCountChange(logs.length);
    } catch (err) {
      console.error('Erreur chargement journal audit:', err);
      toast.error('❌ Impossible de charger le journal technique.');
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [auditCategory, auditNonLu]);

  const handleMarkAsRead = async (id) => {
    try {
      await journalNotificationApi.markAsRead(id);
      setAuditLogs(prev => prev.map(l => l.id === id ? { ...l, lu_par_admin: true } : l));
      toast.success('Action marquée comme lue.');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await journalNotificationApi.markAllAsRead();
      setAuditLogs(prev => prev.map(l => ({ ...l, lu_par_admin: true })));
      toast.success('Toutes les actions ont été marquées comme lues.');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const filteredAuditLogs = useMemo(() => {
    const list = Array.isArray(auditLogs) ? auditLogs : [];
    const q = auditSearch.trim().toLowerCase();
    return list.filter(log => {
      if (!q) return true;
      return (
        (log.message_notification || '').toLowerCase().includes(q) ||
        (log.nom_utilisateur || '').toLowerCase().includes(q) ||
        (log.reference_entite || '').toLowerCase().includes(q) ||
        (log.entite_concernee || '').toLowerCase().includes(q) ||
        (log.categorie_action || '').toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditSearch]);

  const getAuditCategoryBadge = (cat) => {
    const c = String(cat || '').toUpperCase();
    if (c.includes('CREATION')) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    if (c.includes('MODIF')) return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
    if (c.includes('SUPPR') || c.includes('RESIL')) return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
    if (c.includes('RENOUV') || c.includes('ALERT') || c.includes('ECHEANCE')) return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
    if (c.includes('EMAIL')) return { bg: 'rgba(220, 92, 246, 0.15)', color: '#dc5cf6', border: '1px solid rgba(220, 92, 246, 0.3)' };
    return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' };
  };

  return (
    <>
      {/* Barre d'outils et de filtres pour l'audit log */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '1.25rem',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ScrollText size={18} style={{ color: 'var(--accent-secondary)' }} />
              Journal Technique & Piste d'Audit
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Traçabilité complète des actions : créations de contrats, modifications de statuts, ajouts de clients et relances.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleMarkAllAsRead}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCheck size={15} />
              <span>Tout marquer comme lu</span>
            </button>
          </div>
        </div>

        {/* Filtres de recherche */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div className="ts-filter-group">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="ts-filter-input"
              placeholder="Rechercher dans le journal..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              style={{ width: '220px' }}
            />
          </div>

          <div className="ts-filter-group">
            <span>Catégorie :</span>
            <select
              className="ts-filter-select"
              value={auditCategory}
              onChange={(e) => setAuditCategory(e.target.value)}
            >
              <option value="TOUTES">Toutes catégories</option>
              <option value="CREATION">Création</option>
              <option value="MODIFICATION">Modification</option>
              <option value="SUPPRESSION">Suppression</option>
              <option value="STATUT">Changement Statut</option>
              <option value="RENOUVELLEMENT">Renouvellement</option>
              <option value="ECHEANCE">Alerte Échéance</option>
              <option value="EMAIL_ECHEANCE">Email Échéance</option>
              <option value="IMPORT">Importation</option>
            </select>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}>
            <input
              type="checkbox"
              checked={auditNonLu}
              onChange={(e) => setAuditNonLu(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Non lues uniquement</span>
          </label>

          <div className="ts-filter-badge-count" style={{ marginLeft: 'auto' }}>
            {filteredAuditLogs.length} entrée{filteredAuditLogs.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Tableau d'Audit Log */}
      {loadingAudit ? (
        <div className="loading-container">
          <RefreshCw size={28} className="spinner-icon" />
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Chargement de l'audit log...</p>
        </div>
      ) : filteredAuditLogs.length === 0 ? (
        <div className="empty-msg">Aucune entrée d'audit enregistrée correspondant à ces critères.</div>
      ) : (
        <div className="aeropub-table-wrapper">
          <table className="aeropub-table">
            <thead>
              <tr className="table-head-row-indigo">
                <th className="table-head-cell" style={{ width: '130px' }}>Date & Heure</th>
                <th className="table-head-cell" style={{ width: '120px' }}>Catégorie</th>
                <th className="table-head-cell">Entité / Réf</th>
                <th className="table-head-cell">Auteur</th>
                <th className="table-head-cell">Message d'audit</th>
                <th className="table-head-cell" style={{ textAlign: 'center', width: '90px' }}>Détails</th>
                <th className="table-head-cell" style={{ textAlign: 'center', width: '110px' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLogs.map((log) => {
                const badgeStyle = getAuditCategoryBadge(log.categorie_action);
                const isExpanded = expandedLogId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr className="table-body-row" style={{ opacity: log.lu_par_admin ? 0.85 : 1 }}>
                      <td className="cell-muted" style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {log.date_action ? new Date(log.date_action).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="table-body-cell">
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: badgeStyle.border,
                          fontWeight: 600,
                          fontSize: '0.78rem'
                        }}>
                          {log.categorie_action || 'ACTION'}
                        </span>
                      </td>
                      <td className="cell-bold-white">
                        <div>{log.entite_concernee || 'SYSTÈME'}</div>
                        {log.reference_entite && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Réf : {log.reference_entite}
                          </div>
                        )}
                      </td>
                      <td className="cell-muted" style={{ fontSize: '0.84rem' }}>
                        {log.nom_utilisateur || (log.id_utilisateur ? `Utilisateur #${log.id_utilisateur}` : 'Système')}
                      </td>
                      <td className="table-body-cell" style={{ fontSize: '0.85rem' }}>
                        {log.message_notification}
                      </td>
                      <td className="table-body-cell" style={{ textAlign: 'center' }}>
                        {log.valeur_apres ? (
                          <button
                            type="button"
                            className="pill-btn"
                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            title="Voir les données payload"
                          >
                            <Eye size={12} style={{ marginRight: '3px' }} />
                            <span>{isExpanded ? 'Masquer' : 'Voir'}</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>
                      <td className="table-body-cell" style={{ textAlign: 'center' }}>
                        {log.lu_par_admin ? (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Lu</span>
                        ) : (
                          <button
                            type="button"
                            className="pill-btn active"
                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                            onClick={() => handleMarkAsRead(log.id)}
                            title="Marquer comme lu"
                          >
                            Marquer lu
                          </button>
                        )}
                      </td>
                    </tr>

                    {isExpanded && log.valeur_apres && (
                      <tr style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                        <td colSpan={7} style={{ padding: '0.75rem 1.25rem' }}>
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                            color: '#a5f3fc',
                            overflowX: 'auto',
                            maxHeight: '180px'
                          }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                              {typeof log.valeur_apres === 'string'
                                ? JSON.stringify(JSON.parse(log.valeur_apres), null, 2)
                                : JSON.stringify(log.valeur_apres, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
