import React from 'react';
import {
  Plane,
  Tag,
  Tv,
  Users,
  FileSpreadsheet,
  Search,
  ExternalLink
} from 'lucide-react';

export default function CalculateurRepartitionCaViews({
  activeTab,
  calculationResults,
  searchQuery,
  setSearchQuery,
  onSelectAeroport,
  onSelectCategorie,
  onSelectTypeSupport,
  onSelectClient,
  onSelectAbonnement,
  formatMGA
}) {
  return (
    <section className="ca-tab-content">
      {/* En-tête de section avec champ de recherche rapide */}
      <div className="ca-tab-content-header">
        <h4 className="ca-tab-content-title">
          {activeTab === 'aeroport' && <Plane size={18} style={{ color: '#06b6d4' }} />}
          {activeTab === 'categorie' && <Tag size={18} style={{ color: '#10b981' }} />}
          {activeTab === 'type' && <Tv size={18} style={{ color: '#8b5cf6' }} />}
          {activeTab === 'client' && <Users size={18} style={{ color: '#f59e0b' }} />}
          {activeTab === 'contrats' && <FileSpreadsheet size={18} style={{ color: '#38bdf8' }} />}
          <span>
            {activeTab === 'aeroport' && "Répartition du Chiffre d'Affaires par Aéroport"}
            {activeTab === 'categorie' && "Répartition du Chiffre d'Affaires par Catégorie de Support"}
            {activeTab === 'type' && "Répartition du Chiffre d'Affaires par Type de Support Physique"}
            {activeTab === 'client' && "Classement du Chiffre d'Affaires par Client & Annonceur"}
            {activeTab === 'contrats' && "Inventaire Détaillé des Contrats Actifs Filtrés"}
          </span>
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="ca-filter-select"
              style={{ paddingLeft: '2rem', fontSize: '0.82rem' }}
              placeholder="Filtrer dans la liste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* VUE 1 : PAR AÉROPORT */}
      {activeTab === 'aeroport' && (
        <div>
          {calculationResults.listAeroport.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Aucun aéroport ne correspond aux filtres appliqués.
            </p>
          ) : (
            <>
              <div className="ca-breakdown-bars">
                {calculationResults.listAeroport.map((row) => (
                  <div
                    key={row.nom}
                    className="ca-breakdown-row"
                    onClick={() => onSelectAeroport && onSelectAeroport(row.nom)}
                    title={`Filtrer uniquement sur ${row.nom}`}
                  >
                    <div className="ca-breakdown-row-top">
                      <span className="ca-breakdown-name">
                        <Plane size={15} style={{ color: row.color }} />
                        <strong>{row.nom}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ({row.nbContrats} contrat{row.nbContrats > 1 ? 's' : ''} • {row.nbSupports} support{row.nbSupports > 1 ? 's' : ''})
                        </span>
                      </span>
                      <div className="ca-breakdown-values">
                        <span className="ca-breakdown-amount">{formatMGA(row.ca)}</span>
                        <span className="ca-breakdown-pct">{row.pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="ca-progress-track">
                      <div
                        className="ca-progress-fill"
                        style={{ width: `${Math.max(2, row.pct)}%`, background: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="ca-table-wrapper" style={{ marginTop: '1.25rem' }}>
                <table className="ca-table">
                  <thead>
                    <tr>
                      <th>Aéroport</th>
                      <th style={{ textAlign: 'center' }}>Contrats Actifs</th>
                      <th style={{ textAlign: 'center' }}>Supports Mobilisés</th>
                      <th style={{ textAlign: 'right' }}>CA Contractuel</th>
                      <th style={{ textAlign: 'right' }}>CA Période (Prorata)</th>
                      <th style={{ textAlign: 'right' }}>Part (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationResults.listAeroport.map((r) => (
                      <tr key={r.nom}>
                        <td style={{ fontWeight: 600 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color }} />
                            {r.nom}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{r.nbContrats}</td>
                        <td style={{ textAlign: 'center' }}>{r.nbSupports}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>{formatMGA(r.ca)}</td>
                        <td style={{ textAlign: 'right', color: '#10b981' }}>{formatMGA(r.caProrata)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>TOTAL AÉROPORTS</td>
                      <td style={{ textAlign: 'center' }}>{calculationResults.totalContrats}</td>
                      <td style={{ textAlign: 'center' }}>{calculationResults.totalSupports}</td>
                      <td style={{ textAlign: 'right' }}>{formatMGA(calculationResults.totalCaContractuel)}</td>
                      <td style={{ textAlign: 'right' }}>{formatMGA(calculationResults.totalCaProrata)}</td>
                      <td style={{ textAlign: 'right' }}>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* VUE 2 : PAR CATÉGORIE */}
      {activeTab === 'categorie' && (
        <div>
          {calculationResults.listCategorie.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Aucune catégorie ne correspond aux filtres appliqués.
            </p>
          ) : (
            <>
              <div className="ca-breakdown-bars">
                {calculationResults.listCategorie.map((row) => (
                  <div
                    key={row.nom}
                    className="ca-breakdown-row"
                    onClick={() => onSelectCategorie && onSelectCategorie(row.nom)}
                    title={`Filtrer uniquement sur ${row.nom}`}
                  >
                    <div className="ca-breakdown-row-top">
                      <span className="ca-breakdown-name">
                        <Tag size={15} style={{ color: row.color }} />
                        <strong>{row.nom}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ({row.nbContrats} contrat{row.nbContrats > 1 ? 's' : ''} • {row.nbSupports} support{row.nbSupports > 1 ? 's' : ''})
                        </span>
                      </span>
                      <div className="ca-breakdown-values">
                        <span className="ca-breakdown-amount">{formatMGA(row.ca)}</span>
                        <span className="ca-breakdown-pct">{row.pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="ca-progress-track">
                      <div
                        className="ca-progress-fill"
                        style={{ width: `${Math.max(2, row.pct)}%`, background: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="ca-table-wrapper" style={{ marginTop: '1.25rem' }}>
                <table className="ca-table">
                  <thead>
                    <tr>
                      <th>Catégorie</th>
                      <th style={{ textAlign: 'center' }}>Contrats</th>
                      <th style={{ textAlign: 'center' }}>Supports</th>
                      <th style={{ textAlign: 'right' }}>CA Contractuel</th>
                      <th style={{ textAlign: 'right' }}>CA Période (Prorata)</th>
                      <th style={{ textAlign: 'right' }}>Part (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationResults.listCategorie.map((r) => (
                      <tr key={r.nom}>
                        <td style={{ fontWeight: 600 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color }} />
                            {r.nom}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{r.nbContrats}</td>
                        <td style={{ textAlign: 'center' }}>{r.nbSupports}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>{formatMGA(r.ca)}</td>
                        <td style={{ textAlign: 'right', color: '#10b981' }}>{formatMGA(r.caProrata)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>TOTAL CATÉGORIES</td>
                      <td style={{ textAlign: 'center' }}>{calculationResults.totalContrats}</td>
                      <td style={{ textAlign: 'center' }}>{calculationResults.totalSupports}</td>
                      <td style={{ textAlign: 'right' }}>{formatMGA(calculationResults.totalCaContractuel)}</td>
                      <td style={{ textAlign: 'right' }}>{formatMGA(calculationResults.totalCaProrata)}</td>
                      <td style={{ textAlign: 'right' }}>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* VUE 3 : PAR TYPE DE SUPPORT */}
      {activeTab === 'type' && (
        <div>
          {calculationResults.listTypeSupport.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Aucun type de support ne correspond aux filtres appliqués.
            </p>
          ) : (
            <>
              <div className="ca-breakdown-bars">
                {calculationResults.listTypeSupport.map((row) => (
                  <div
                    key={row.nom}
                    className="ca-breakdown-row"
                    onClick={() => onSelectTypeSupport && onSelectTypeSupport(row.nom)}
                    title={`Filtrer uniquement sur ${row.nom}`}
                  >
                    <div className="ca-breakdown-row-top">
                      <span className="ca-breakdown-name">
                        <Tv size={15} style={{ color: row.color }} />
                        <strong>{row.nom}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ({row.nbContrats} contrat{row.nbContrats > 1 ? 's' : ''} • {row.nbSupports} support{row.nbSupports > 1 ? 's' : ''})
                        </span>
                      </span>
                      <div className="ca-breakdown-values">
                        <span className="ca-breakdown-amount">{formatMGA(row.ca)}</span>
                        <span className="ca-breakdown-pct">{row.pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="ca-progress-track">
                      <div
                        className="ca-progress-fill"
                        style={{ width: `${Math.max(2, row.pct)}%`, background: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="ca-table-wrapper" style={{ marginTop: '1.25rem' }}>
                <table className="ca-table">
                  <thead>
                    <tr>
                      <th>Type de Support</th>
                      <th style={{ textAlign: 'center' }}>Contrats</th>
                      <th style={{ textAlign: 'center' }}>Supports</th>
                      <th style={{ textAlign: 'right' }}>CA Contractuel</th>
                      <th style={{ textAlign: 'right' }}>CA Période (Prorata)</th>
                      <th style={{ textAlign: 'right' }}>Part (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationResults.listTypeSupport.map((r) => (
                      <tr key={r.nom}>
                        <td style={{ fontWeight: 600 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color }} />
                            {r.nom}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{r.nbContrats}</td>
                        <td style={{ textAlign: 'center' }}>{r.nbSupports}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>{formatMGA(r.ca)}</td>
                        <td style={{ textAlign: 'right', color: '#10b981' }}>{formatMGA(r.caProrata)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>TOTAL TYPES DE SUPPORT</td>
                      <td style={{ textAlign: 'center' }}>{calculationResults.totalContrats}</td>
                      <td style={{ textAlign: 'center' }}>{calculationResults.totalSupports}</td>
                      <td style={{ textAlign: 'right' }}>{formatMGA(calculationResults.totalCaContractuel)}</td>
                      <td style={{ textAlign: 'right' }}>{formatMGA(calculationResults.totalCaProrata)}</td>
                      <td style={{ textAlign: 'right' }}>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* VUE 4 : PAR CLIENT */}
      {activeTab === 'client' && (
        <div>
          {calculationResults.listClient.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Aucun client ne correspond aux filtres appliqués.
            </p>
          ) : (
            <>
              <div className="ca-breakdown-bars">
                {calculationResults.listClient.slice(0, 10).map((row) => (
                  <div
                    key={row.nom}
                    className="ca-breakdown-row"
                    onClick={() => onSelectClient && onSelectClient(row.nom)}
                    title={`Filtrer uniquement sur ${row.nom}`}
                  >
                    <div className="ca-breakdown-row-top">
                      <span className="ca-breakdown-name">
                        <Users size={15} style={{ color: row.color }} />
                        <strong>{row.nom}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ({row.nbContrats} contrat{row.nbContrats > 1 ? 's' : ''} • {row.nbSupports} support{row.nbSupports > 1 ? 's' : ''})
                        </span>
                      </span>
                      <div className="ca-breakdown-values">
                        <span className="ca-breakdown-amount">{formatMGA(row.ca)}</span>
                        <span className="ca-breakdown-pct">{row.pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="ca-progress-track">
                      <div
                        className="ca-progress-fill"
                        style={{ width: `${Math.max(2, row.pct)}%`, background: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="ca-table-wrapper" style={{ marginTop: '1.25rem' }}>
                <table className="ca-table">
                  <thead>
                    <tr>
                      <th>Client / Entreprise</th>
                      <th style={{ textAlign: 'center' }}>Contrats</th>
                      <th style={{ textAlign: 'center' }}>Supports</th>
                      <th style={{ textAlign: 'right' }}>CA Contractuel</th>
                      <th style={{ textAlign: 'right' }}>CA Période (Prorata)</th>
                      <th style={{ textAlign: 'right' }}>Part (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationResults.listClient.map((r) => (
                      <tr key={r.nom}>
                        <td style={{ fontWeight: 600 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color }} />
                            {r.nom}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{r.nbContrats}</td>
                        <td style={{ textAlign: 'center' }}>{r.nbSupports}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>{formatMGA(r.ca)}</td>
                        <td style={{ textAlign: 'right', color: '#10b981' }}>{formatMGA(r.caProrata)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>TOTAL CLIENTS</td>
                      <td style={{ textAlign: 'center' }}>{calculationResults.totalContrats}</td>
                      <td style={{ textAlign: 'center' }}>{calculationResults.totalSupports}</td>
                      <td style={{ textAlign: 'right' }}>{formatMGA(calculationResults.totalCaContractuel)}</td>
                      <td style={{ textAlign: 'right' }}>{formatMGA(calculationResults.totalCaProrata)}</td>
                      <td style={{ textAlign: 'right' }}>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* VUE 5 : DÉTAIL DES CONTRATS */}
      {activeTab === 'contrats' && (
        <div className="ca-table-wrapper">
          {calculationResults.filteredContrats.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Aucun contrat actif ne correspond aux filtres appliqués.
            </p>
          ) : (
            <table className="ca-table">
              <thead>
                <tr>
                  <th>Réf. Contrat</th>
                  <th>Client</th>
                  <th>Campagne</th>
                  <th style={{ textAlign: 'center' }}>Périodicité</th>
                  <th>Période d'activité</th>
                  <th>Supports rattachés</th>
                  <th style={{ textAlign: 'right' }}>Tarif Contrat</th>
                  <th style={{ textAlign: 'right' }}>CA Période</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {calculationResults.filteredContrats.map((c) => (
                  <tr key={c.reference}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{c.reference}</td>
                    <td style={{ fontWeight: 600 }}>{c.clientName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.annonceur_campagne || 'Campagne Standard'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        background: 'rgba(6, 182, 212, 0.15)',
                        color: '#38bdf8',
                        fontWeight: 600
                      }}>
                        {c.periodicite || 'Annuel'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {c.date_debut ? new Date(c.date_debut).toLocaleDateString('fr-FR') : '—'} au {c.date_echeance || c.date_fin ? new Date(c.date_echeance || c.date_fin).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                      {c.supportsList.map((s) => s.reference).join(', ')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                      {formatMGA(c.tarifNum)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                      {formatMGA(c.prorataCa)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {onSelectAbonnement && (
                        <button
                          type="button"
                          className="ca-btn-preset"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem' }}
                          onClick={() => onSelectAbonnement(c)}
                          title="Ouvrir la fiche complète du contrat"
                        >
                          <ExternalLink size={12} />
                          <span>Voir</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
