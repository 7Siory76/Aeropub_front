import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3, Trash2, MapPin, Layers, Monitor, Info, CheckCircle2, AlertCircle, History, Clock } from 'lucide-react';
import { emplacementsApi, typeSupportsApi, categoriesApi, zonesApi, typeEtatSupportApi } from '../../../api';

export default function EmplacementDetailsModal({
  emplacement,
  onClose,
  onRefresh,
  typeSupports = [],
  categories = [],
  zones = []
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Listes déroulantes avec chargement dynamique si non fournies
  const [typesList, setTypesList] = useState(typeSupports);
  const [catsList, setCatsList] = useState(categories);
  const [zonesList, setZonesList] = useState(zones);
  const [etatsList, setEtatsList] = useState([]);
  const [historiqueEtats, setHistoriqueEtats] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // État du formulaire d'édition
  const [formData, setFormData] = useState({
    id_type: emplacement?.id_type || emplacement?.id_type_support || '',
    id_categorie: emplacement?.id_categorie || '',
    id_zone: emplacement?.id_zone || '',
    etat: emplacement?.etat || emplacement?.statut || 'Disponible',
    caracteristiques: emplacement?.caracteristiques || '',
    observation: (emplacement?.observation || '').replace(/^\[Saisie le [^\]]+\]\s*/, '')
  });

  // Recharger le formulaire et l'historique quand l'emplacement change
  useEffect(() => {
    if (emplacement) {
      setFormData({
        id_type: emplacement.id_type || emplacement.id_type_support || '',
        id_categorie: emplacement.id_categorie || '',
        id_zone: emplacement.id_zone || '',
        etat: emplacement.etat || emplacement.statut || 'Disponible',
        caracteristiques: emplacement.caracteristiques || '',
        observation: (emplacement.observation || '').replace(/^\[Saisie le [^\]]+\]\s*/, '')
      });

      // Charger l'historique des états
      setLoadingHistorique(true);
      emplacementsApi.getHistoriqueEtats(emplacement.reference)
        .then(data => setHistoriqueEtats(data || []))
        .catch(err => console.error('Erreur chargement historique support:', err))
        .finally(() => setLoadingHistorique(false));
    }
  }, [emplacement]);

  // Charger les listes de référence si nécessaire
  useEffect(() => {
    if (typeSupports && typeSupports.length > 0) {
      setTypesList(typeSupports);
    } else {
      typeSupportsApi.getAll().then(data => setTypesList(data || [])).catch(() => {});
    }

    if (categories && categories.length > 0) {
      setCatsList(categories);
    } else {
      categoriesApi.getAll().then(data => setCatsList(data || [])).catch(() => {});
    }

    if (zones && zones.length > 0) {
      setZonesList(zones);
    } else {
      zonesApi.getAll().then(data => setZonesList(data || [])).catch(() => {});
    }

    typeEtatSupportApi.getAll().then(data => setEtatsList(data || [])).catch(() => {});
  }, [typeSupports, categories, zones]);

  if (!emplacement) return null;

  // Action : Supprimer le support via l'API REST
  const handleDelete = async () => {
    const confirmed = window.confirm(`Êtes-vous sûr de supprimer le support "${emplacement.reference}" ?`);
    if (!confirmed) return;
    setLoading(true);
    try {
      await emplacementsApi.delete(emplacement.reference);
      alert(`Support "${emplacement.reference}" supprimé avec succès.`);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur de suppression:', err);
      alert(`Impossible de supprimer le support "${emplacement.reference}".`);
    } finally {
      setLoading(false);
    }
  };

  // Action : Enregistrer les modifications via l'API REST
  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await emplacementsApi.update(emplacement.reference, {
        id_type: formData.id_type ? parseInt(formData.id_type, 10) : undefined,
        id_type_support: formData.id_type ? parseInt(formData.id_type, 10) : undefined,
        id_categorie: formData.id_categorie ? parseInt(formData.id_categorie, 10) : undefined,
        id_zone: formData.id_zone ? parseInt(formData.id_zone, 10) : undefined,
        etat: formData.etat,
        statut: formData.etat,
        caracteristiques: formData.caracteristiques,
        observation: formData.observation
      });
      alert(`Support "${emplacement.reference}" mis à jour avec succès !`);
      setIsEditing(false);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur de mise à jour:', err);
      alert('Erreur lors de la mise à jour du support.');
    } finally {
      setLoading(false);
    }
  };

  const currentEtatStr = (emplacement.etat || emplacement.statut || 'disponible').toLowerCase();
  const isOccupied = currentEtatStr.includes('occup');
  const isReserved = currentEtatStr.includes('r_serv') || currentEtatStr.includes('reserv');
  const isMaintenance = currentEtatStr.includes('maint');

  const getBadgeClass = () => {
    if (isOccupied) return 'badge-occupied';
    if (isReserved) return 'wireframe-badge';
    if (isMaintenance) return 'wireframe-badge';
    return 'badge-available';
  };

  return createPortal(
    <div className="modal-backdrop-portal" onClick={onClose}>
      <div
        className="glass-panel client-modal-box"
        style={{ maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto', animation: 'scaleUp 0.25s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la Modale */}
        <div className="client-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 className="client-modal-title" style={{ fontSize: '1.4rem' }}>
                📍 REF : {emplacement.reference}
              </h3>
              <span className={`wireframe-badge ${getBadgeClass()}`}>
                {emplacement.etat || emplacement.statut || 'Disponible'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Fiche technique complète et gestion du support publicitaire (base_v3.sql)
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Période d'état active si présente */}
        {(emplacement.date_debut_etat || emplacement.date_etat) && (
          <div style={{
            marginTop: '0.8rem',
            padding: '0.55rem 0.85rem',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.82rem',
            color: '#06b6d4'
          }}>
            <Clock size={15} />
            <span>
              <strong>Période de validité de l'état actuel :</strong> du{' '}
              {new Date(emplacement.date_debut_etat || emplacement.date_etat).toLocaleDateString('fr-FR')}{' '}
              {emplacement.date_fin_etat
                ? `au ${new Date(emplacement.date_fin_etat).toLocaleDateString('fr-FR')}`
                : '(en cours / indéterminé)'}
            </span>
          </div>
        )}

        {/* Mode Édition (Formulaire) */}
        {isEditing ? (
          <form onSubmit={handleSaveUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '1.25rem' }}>
            {/* Ligne 1 : État et Type de Support */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="modal-form-group">
                <label className="modal-label">État du Support :</label>
                <select
                  className="modal-select"
                  value={formData.etat}
                  onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                >
                  {etatsList && etatsList.length > 0 ? (
                    etatsList.map(et => (
                      <option key={et.id} value={et.nom_etat}>
                        {et.nom_etat.charAt(0).toUpperCase() + et.nom_etat.slice(1)}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Disponible">Disponible</option>
                      <option value="Occupé">Occupé</option>
                      <option value="En maintenance">En maintenance</option>
                      <option value="Réservé">Réservé</option>
                    </>
                  )}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Type de Support :</label>
                <select
                  className="modal-select"
                  value={formData.id_type}
                  onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                >
                  <option value="">-- Sélectionner un type --</option>
                  {typesList.map(ts => (
                    <option key={ts.id} value={ts.id}>
                      {ts.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ligne 2 : Catégorie et Zone Terminale */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="modal-form-group">
                <label className="modal-label">Catégorie :</label>
                <select
                  className="modal-select"
                  value={formData.id_categorie}
                  onChange={(e) => setFormData({ ...formData, id_categorie: e.target.value })}
                >
                  <option value="">-- Sélectionner une catégorie --</option>
                  {catsList.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Zone Terminale :</label>
                <select
                  className="modal-select"
                  value={formData.id_zone}
                  onChange={(e) => setFormData({ ...formData, id_zone: e.target.value })}
                >
                  <option value="">-- Sélectionner une zone --</option>
                  {zonesList.map(zn => (
                    <option key={zn.id} value={zn.id}>
                      {zn.nom_zone} {zn.nom_aeroport ? `(${zn.nom_aeroport})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ligne 3 : Caractéristiques / Dimensions */}
            <div className="modal-form-group">
              <label className="modal-label">Caractéristiques / Dimensions :</label>
              <input
                type="text"
                className="modal-input"
                value={formData.caracteristiques}
                onChange={(e) => setFormData({ ...formData, caracteristiques: e.target.value })}
                placeholder="ex: 1.60 x 2.40, Bâche 12m², Pack 8 écrans..."
              />
            </div>

            {/* Ligne 4 : Observation & Remarques */}
            <div className="modal-form-group">
              <label className="modal-label">Observation & Remarques :</label>
              <textarea
                className="modal-input"
                style={{ height: '80px', resize: 'vertical' }}
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                placeholder="Remarques techniques, travaux, attribution..."
              />
            </div>

            <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="pill-btn"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="pill-btn active"
                disabled={loading}
                style={{ padding: '0.65rem 1.4rem' }}
              >
                {loading ? 'Enregistrement...' : '💾 Sauvegarder'}
              </button>
            </div>
          </form>
        ) : (
          /* Mode Affichage Détails */
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div className="client-abo-card">
                <span className="client-abo-label">Type de Support :</span>
                <div className="client-abo-value" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {emplacement.nom_type_support || emplacement.nom_type || 'N/A'}
                </div>
              </div>
              <div className="client-abo-card">
                <span className="client-abo-label">Catégorie :</span>
                <div className="client-abo-value">
                  {emplacement.nom_categorie || 'Général'}
                </div>
              </div>
              <div className="client-abo-card">
                <span className="client-abo-label">Zone Terminale :</span>
                <div className="client-abo-value">
                  {emplacement.nom_zone || emplacement.nom_lieu || 'N/A'}
                </div>
              </div>
              <div className="client-abo-card">
                <span className="client-abo-label">Aéroport & Périmètre :</span>
                <div className="client-abo-value">
                  {emplacement.nom_aeroport || 'Ivato'} ({emplacement.nom_perimetre || emplacement.type_zone || 'National'})
                </div>
              </div>
              <div className="client-abo-card">
                <span className="client-abo-label">Caractéristiques / Format :</span>
                <div className="client-abo-value">
                  {emplacement.caracteristiques || emplacement.ref_format || 'Non spécifié'}
                </div>
              </div>
              <div className="client-abo-card">
                <span className="client-abo-label">Dernière Observation :</span>
                <div className="client-abo-value" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  {emplacement.observation || 'Aucune observation'}
                </div>
              </div>
            </div>

            {/* Section Historique des États du Support */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              border: '1px solid var(--border-glass)',
              padding: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)' }}>
                  <History size={16} /> Historique des états du support ({historiqueEtats.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}
                >
                  {showHistory ? 'Masquer ▲' : 'Afficher ▼'}
                </button>
              </div>

              {showHistory && (
                loadingHistorique ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Chargement de l'historique...</p>
                ) : historiqueEtats.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Aucun historique d'état enregistré pour ce support.
                  </p>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.35rem 0.5rem' }}>État</th>
                          <th style={{ padding: '0.35rem 0.5rem' }}>Période</th>
                          <th style={{ padding: '0.35rem 0.5rem' }}>Observation</th>
                          <th style={{ padding: '0.35rem 0.5rem' }}>Auteur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historiqueEtats.map((h) => {
                          const hEtat = (h.etat || '').toLowerCase();
                          const isHActive = !h.date_fin;
                          return (
                            <tr key={h.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: isHActive ? 'rgba(6, 182, 212, 0.05)' : 'transparent' }}>
                              <td style={{ padding: '0.4rem 0.5rem' }}>
                                <span style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: hEtat.includes('occup') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: hEtat.includes('occup') ? '#ef4444' : '#10b981'
                                }}>
                                  {h.etat || 'État'}
                                </span>
                              </td>
                              <td style={{ padding: '0.4rem 0.5rem', whiteSpace: 'nowrap' }}>
                                Du {h.date_debut ? new Date(h.date_debut).toLocaleDateString('fr-FR') : '-'}
                                {h.date_fin ? ` au ${new Date(h.date_fin).toLocaleDateString('fr-FR')}` : ' (en cours)'}
                              </td>
                              <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)' }}>
                                {h.observation || '-'}
                              </td>
                              <td style={{ padding: '0.4rem 0.5rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                {h.nom_utilisateur || 'Système'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Pied de Modale : Boutons Modifier, Supprimer, Fermer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
              <button
                type="button"
                className="pill-btn"
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 size={15} />
                <span>Supprimer</span>
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="pill-btn"
                  onClick={onClose}
                >
                  Fermer
                </button>
                <button
                  type="button"
                  className="pill-btn active"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 size={15} />
                  <span>Modifier</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
