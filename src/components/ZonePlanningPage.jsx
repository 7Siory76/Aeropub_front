import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { emplacementsApi, abonnementsApi, zonesApi, localisationsApi, clientsApi } from '../api/apiService';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, User, Clock, CheckCircle2, XCircle, X, RotateCw, Tag, Monitor, Layers, Search } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * Composant de sélection de client hybride :
 * - Si clients.length <= 20 : <select> classique
 * - Si clients.length > 20 : Select2 avec champ de recherche dynamique (nom, secteur, contact)
 */
function SearchableClientSelect({ clients = [], selectedClientId, onChange }) {
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
          value={isOpen ? searchTerm : (selectedClient ? `${selectedClient.nom_client} ${selectedClient.secteur_activite ? `(${selectedClient.secteur_activite})` : ''}` : '')}
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
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)' }}>{c.nom_client}</strong>
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

export default function ZonePlanningPage() {
  // 1. Date (Date du jour au format YYYY-MM-DD d'office)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 2. Navigation des Zones avec flèches ◀ Zone ▶
  const [zones, setZones] = useState([]);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);

  // 3. Navigation des Localisations avec flèches ◀ Localisation ▶
  const [localisations, setLocalisations] = useState([]);
  const [selectedLocIndex, setSelectedLocIndex] = useState(0);

  // Données Emplacements, Abonnements et Clients
  const [emplacements, setEmplacements] = useState([]);
  const [abonnements, setAbonnements] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // État de retournement des cartes (Flip 3D Recto / Verso)
  const [flippedCards, setFlippedCards] = useState({});

  // Modal d'association d'un nouvel abonnement
  const [showAboModal, setShowAboModal] = useState(false);
  const [targetEmp, setTargetEmp] = useState(null);
  const [newClientId, setNewClientId] = useState('');
  const [newStartDate, setNewStartDate] = useState(todayStr);
  const [newEndDate, setNewEndDate] = useState('');
  const [newDuree, setNewDuree] = useState('1 an');
  const [newFacture, setNewFacture] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [zns, locs, emps, abos, cls] = await Promise.all([
        zonesApi.getAll().catch(() => []),
        localisationsApi.getAll().catch(() => []),
        emplacementsApi.getAll().catch(() => []),
        abonnementsApi.getAll().catch(() => []),
        clientsApi.getAll().catch(() => [])
      ]);

      setZones(zns || []);
      setLocalisations(locs || []);
      setEmplacements(emps || []);
      setAbonnements(abos || []);
      setClients(cls || []);

      if (cls && cls.length > 0) {
        setNewClientId(cls[0].id);
      }
    } catch (err) {
      console.error('Erreur de chargement des données:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Basculer le recto / verso d'une carte
  const toggleFlip = (empRef) => {
    setFlippedCards(prev => ({
      ...prev,
      [empRef]: !prev[empRef]
    }));
  };

  // Réinitialiser la localisation à 0 quand la zone change
  const currentZone = zones[selectedZoneIndex] || null;

  useEffect(() => {
    setSelectedLocIndex(0);
  }, [selectedZoneIndex]);

  // Localisations de la zone sélectionnée
  const currentZoneLocalisations = localisations.filter(loc => {
    if (!currentZone) return true;
    return loc.id_zone === currentZone.id || loc.type_zone === currentZone.type_zone;
  });

  const currentLoc = currentZoneLocalisations[selectedLocIndex] || null;

  // Flèches de navigation Zone (◀ / ▶)
  const handlePrevZone = () => {
    if (zones.length === 0) return;
    setSelectedZoneIndex((prev) => (prev > 0 ? prev - 1 : zones.length - 1));
  };

  const handleNextZone = () => {
    if (zones.length === 0) return;
    setSelectedZoneIndex((prev) => (prev < zones.length - 1 ? prev + 1 : 0));
  };

  // Flèches de navigation Localisation (◀ / ▶)
  const handlePrevLoc = () => {
    if (currentZoneLocalisations.length === 0) return;
    setSelectedLocIndex((prev) => (prev > 0 ? prev - 1 : currentZoneLocalisations.length - 1));
  };

  const handleNextLoc = () => {
    if (currentZoneLocalisations.length === 0) return;
    setSelectedLocIndex((prev) => (prev < currentZoneLocalisations.length - 1 ? prev + 1 : 0));
  };

  // Emplacements associés à la localisation active
  const activeEmplacements = emplacements.filter(emp => {
    if (!currentLoc) return true;
    return emp.id_localisation === currentLoc.id || emp.nom_lieu === currentLoc.nom_lieu;
  });

  // Vérifier si un emplacement est occupé à la date sélectionnée
  const getActiveSubscription = (empRef) => {
    if (!selectedDate || !empRef) return null;
    const targetRef = String(empRef).trim().toUpperCase();

    // Normalisation de la date cible à 12:00:00 pour annuler les décalages de fuseau horaire
    const dateParts = selectedDate.split('-');
    if (dateParts.length !== 3) return null;
    const targetTime = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10), 12, 0, 0).getTime();

    return abonnements.find(abo => {
      const aboRef = String(abo.reference_emplacement || abo.reference || '').trim().toUpperCase();
      if (aboRef !== targetRef) return false;

      const startStr = String(abo.date_debut || '').trim().replace(' ', 'T');
      const endStr = String(abo.date_fin || '').trim().replace(' ', 'T');

      const startTime = new Date(startStr).getTime();
      const endTime = new Date(endStr).getTime();

      if (isNaN(startTime) || isNaN(endTime)) return false;

      return targetTime >= startTime && targetTime <= endTime;
    });
  };

  // Ouvrir le modal d'association d'abonnement
  const openAssociateModal = (emp) => {
    setTargetEmp(emp);
    setNewStartDate(selectedDate);
    // Date de fin par défaut: +1 an
    const defaultEnd = new Date(selectedDate);
    defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
    setNewEndDate(defaultEnd.toISOString().split('T')[0]);

    if (clients && clients.length > 0 && !newClientId) {
      setNewClientId(clients[0].id);
    }

    setShowAboModal(true);
  };

  // Soumettre un nouvel abonnement
  const handleCreateAbonnement = async (e) => {
    e.preventDefault();
    if (!targetEmp || !newClientId || !newStartDate || !newEndDate) {
      toast.error('❌ Veuillez remplir tous les champs du formulaire.');
      return;
    }

    try {
      await abonnementsApi.create({
        reference_emplacement: targetEmp.reference,
        reference: targetEmp.reference,
        id_client: parseInt(newClientId, 10),
        date_debut: newStartDate,
        date_fin: newEndDate,
        duree_contrat: newDuree,
        ref_facture: newFacture
      });

      toast.success(`🎉 Nouvel abonnement associé à ${targetEmp.reference} avec succès !`);
      setShowAboModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur association abonnement:', err);
      const backendErrorMsg = err.response?.data?.message || 'Erreur lors de la création de l\'abonnement.';
      toast.error(`❌ ${backendErrorMsg}`);
    }
  };

  const formatDateFr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(String(dateStr).replace(' ', 'T'));
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR');
  };

  return (
    <section className="glass-panel planning-container">
      {/* 1. DATE CENTRÉE AU SOMMET (DATE : DD/MM/YY 📅) */}
      <div className="planning-header-center">
        <div className="date-picker-box">
          <span className="date-label">DATE :</span>
          <input
            type="date"
            className="date-input-field"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <CalendarIcon size={20} className="calendar-icon-btn" />
        </div>
      </div>

      {/* 2. NAVIGATION ZONE : [ ◀ ] Zone: [Nom] [ ▶ ] */}
      <div className="nav-carousel-row">
        <button onClick={handlePrevZone} className="carousel-arrow-btn" title="Zone Précédente">
          <ChevronLeft size={22} />
        </button>

        <div className="carousel-title-box">
          <span className="carousel-prefix">Zone :</span>
          <span className="carousel-value-text">{currentZone?.type_zone || 'Aucune Zone'}</span>
        </div>

        <button onClick={handleNextZone} className="carousel-arrow-btn" title="Zone Suivante">
          <ChevronRight size={22} />
        </button>
      </div>

      {/* 3. NAVIGATION LOCALISATION : [ ◀ ] Localisation: [Nom] [ ▶ ] */}
      <div className="nav-carousel-row nav-carousel-sub">
        <button onClick={handlePrevLoc} className="carousel-arrow-btn" title="Localisation Précédente">
          <ChevronLeft size={20} />
        </button>

        <div className="carousel-title-box">
          <span className="carousel-prefix">Localisation :</span>
          <span className="carousel-value-text">{currentLoc?.nom_lieu || 'Aucune Localisation'}</span>
        </div>

        <button onClick={handleNextLoc} className="carousel-arrow-btn" title="Localisation Suivante">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 4. GRAND CADRE DE CONTENU AVEC CARTES D'EMPLACEMENT ROTATIVES (3D FLIP) */}
      <div className="planning-main-frame">
        {loading ? (
          <p className="empty-msg">Chargement des emplacements et abonnements...</p>
        ) : activeEmplacements.length === 0 ? (
          <div className="empty-msg">
            Aucun emplacement configuré à la localisation « {currentLoc?.nom_lieu || 'N/A'} ».
          </div>
        ) : (
          <div className="planning-cards-grid">
            {activeEmplacements.map((emp) => {
              const activeSub = getActiveSubscription(emp.reference);
              const isOccupied = !!activeSub;
              const isFlipped = !!flippedCards[emp.reference];

              return (
                <div key={emp.reference} className="flip-card-container">
                  <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                    {/* FACE AVANT (RECTO) - STATUT ET ABONNEMENT */}
                    <div className={`wireframe-card flip-card-front ${isOccupied ? 'card-status-occupied' : 'card-status-available'}`}>
                      <div className="wireframe-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>REF : {emp.reference}</span>
                        <button
                          onClick={() => toggleFlip(emp.reference)}
                          className="flip-icon-btn"
                          title="Retourner la carte pour voir le Type de Support, le Format et la Catégorie"
                        >
                          <RotateCw size={15} />
                        </button>
                      </div>

                      <div className="wireframe-status-badge-container">
                        {isOccupied ? (
                          <span className="wireframe-badge badge-occupied">
                            <XCircle size={14} /> (OCCUPÉ)
                          </span>
                        ) : (
                          <span className="wireframe-badge badge-available">
                            <CheckCircle2 size={14} /> (DISPONIBLE)
                          </span>
                        )}
                      </div>

                      {isOccupied ? (
                        <div className="wireframe-card-body">
                          <div className="wireframe-info-row">
                            <strong>Client :</strong> {activeSub.nom_client || `Client #${activeSub.id_client}`}
                          </div>

                          <div className="wireframe-info-row">
                            <strong>Du :</strong> {formatDateFr(activeSub.date_debut)} <strong>jusqu'au</strong> {formatDateFr(activeSub.date_fin)}
                          </div>

                          {activeSub.secteur_activite && (
                            <div className="wireframe-info-row" style={{ fontSize: '0.82rem', color: '#06b6d4' }}>
                              <strong>Secteur :</strong> {activeSub.secteur_activite}
                            </div>
                          )}
                          {activeSub.ref_facture && (
                            <div className="wireframe-info-row" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              <strong>Facture :</strong> {activeSub.ref_facture}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="wireframe-card-body">
                          <button
                            onClick={() => openAssociateModal(emp)}
                            className="wireframe-action-btn"
                          >
                            <PlusCircle size={16} />
                            <span>Associer un nouveau Abonnement</span>
                          </button>
                        </div>
                      )}

                      {/* Bouton de retournement en bas */}
                      <button
                        onClick={() => toggleFlip(emp.reference)}
                        className="flip-toggle-link"
                      >
                        <RotateCw size={13} />
                        <span>Voir détails (Type Support, Format, Catégorie)</span>
                      </button>
                    </div>

                    {/* FACE ARRIÈRE (VERSO) - TYPE SUPPORT, FORMAT ET CATÉGORIE */}
                    <div className="wireframe-card flip-card-back">
                      <div className="wireframe-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>REF : {emp.reference}</span>
                        <button
                          onClick={() => toggleFlip(emp.reference)}
                          className="flip-icon-btn"
                          title="Retourner au statut d'abonnement"
                        >
                          <RotateCw size={15} />
                        </button>
                      </div>

                      <div className="flip-back-body">
                        <div className="wireframe-info-row" style={{ marginBottom: '0.75rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Layers size={15} style={{ color: '#6366f1' }} />
                            <strong>Type de Support :</strong>
                          </span>
                          <div style={{ paddingLeft: '1.4rem', color: 'var(--text-main)', fontWeight: 700 }}>
                            {emp.nom_type_support || 'Support Standard'}
                          </div>
                        </div>

                        <div className="wireframe-info-row" style={{ marginBottom: '0.75rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Monitor size={15} style={{ color: '#06b6d4' }} />
                            <strong>Format :</strong>
                          </span>
                          <div style={{ paddingLeft: '1.4rem', color: 'var(--text-main)', fontWeight: 700 }}>
                            {emp.ref_format || 'Format standard'}
                          </div>
                        </div>

                        <div className="wireframe-info-row" style={{ marginBottom: '0.75rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Tag size={15} style={{ color: '#ec4899' }} />
                            <strong>Catégorie :</strong>
                          </span>
                          <div style={{ paddingLeft: '1.4rem', color: 'var(--text-main)', fontWeight: 700 }}>
                            {emp.nom_categorie || 'Général'}
                          </div>
                        </div>

                        {emp.quantite > 1 && (
                          <div className="wireframe-info-row">
                            <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                              📦 Quantité / Pack : {emp.quantite}
                            </span>
                          </div>
                        )}
                      </div>


                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL : Associer un nouveau Abonnement */}
      {showAboModal && targetEmp && createPortal(
        <div className="modal-overlay" onClick={() => setShowAboModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAboModal(false)}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              📝 Associer un Abonnement
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Emplacement sélectionné : <strong style={{ color: '#6366f1' }}>{targetEmp.reference}</strong> ({targetEmp.nom_type_support || 'Support Standard'} - {targetEmp.ref_format || 'Format N/A'})
            </p>

            <form onSubmit={handleCreateAbonnement}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                  Sélectionner un Client :
                </label>
                <SearchableClientSelect
                  clients={clients}
                  selectedClientId={newClientId}
                  onChange={(val) => setNewClientId(val)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    Durée du contrat :
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                    placeholder="ex: 1 an"
                    value={newDuree}
                    onChange={(e) => setNewDuree(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    Référence Facture / Cde :
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                    placeholder="ex: FA 240"
                    value={newFacture}
                    onChange={(e) => setNewFacture(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    Date de début :
                  </label>
                  <input
                    type="date"
                    className="search-input"
                    style={{ borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    Date de fin :
                  </label>
                  <input
                    type="date"
                    className="search-input"
                    style={{ borderRadius: '10px', padding: '0.65rem 0.85rem' }}
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAboModal(false)} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Valider l'Abonnement
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
