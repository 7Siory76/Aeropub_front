import React, { useState, useEffect } from 'react';
import { emplacementsApi, abonnementsApi, zonesApi, aeroportsApi, clientsApi } from '../../api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, User, Clock, CheckCircle2, XCircle, X, RotateCw, Tag, Monitor, Layers, Plane, MapPin, ArrowLeftRight } from 'lucide-react';
import { toast } from 'react-toastify';
import SearchableClientSelect from './components/SearchableClientSelect';
import AssociateAbonnementModal from './modals/AssociateAbonnementModal';
import ChangeEmplacementModal from './modals/ChangeEmplacementModal';


export default function PlanningPage() {
  // 1. Date (Date du jour au format YYYY-MM-DD d'office)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 2. Navigation des Aéroports avec flèches ◀ Aéroport ▶
  const [aeroports, setAeroports] = useState([]);
  const [selectedAeroIndex, setSelectedAeroIndex] = useState(0);

  // 3. Navigation des Zones avec flèches ◀ Zone ▶
  const [zones, setZones] = useState([]);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);

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

  // Modal de changement d'emplacement (Transfert Kanban)
  const [showChangeModal, setShowChangeModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aeros, zns, emps, abos, cls] = await Promise.all([
        aeroportsApi.getAll().catch(() => []),
        zonesApi.getAll().catch(() => []),
        emplacementsApi.getAll().catch(() => []),
        abonnementsApi.getAll().catch(() => []),
        clientsApi.getAll().catch(() => [])
      ]);

      setAeroports(aeros || []);
      setZones(zns || []);
      setEmplacements(emps || []);
      setAbonnements(abos || []);
      setClients(cls || []);
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

  // Aéroport sélectionné
  const currentAero = aeroports[selectedAeroIndex] || null;

  // Réinitialiser la zone à 0 quand l'aéroport change
  useEffect(() => {
    setSelectedZoneIndex(0);
  }, [selectedAeroIndex]);

  // Zones de l'aéroport sélectionné
  const currentAeroZones = zones.filter(zone => {
    if (!currentAero) return true;
    return (
      (zone.id_aeroport && currentAero.id && Number(zone.id_aeroport) === Number(currentAero.id)) ||
      (zone.nom_aeroport && currentAero.nom && zone.nom_aeroport.toLowerCase() === currentAero.nom.toLowerCase())
    );
  });

  const currentZone = currentAeroZones[selectedZoneIndex] || null;

  // Flèches de navigation Aéroport (◀ / ▶)
  const handlePrevAero = () => {
    if (aeroports.length === 0) return;
    setSelectedAeroIndex((prev) => (prev > 0 ? prev - 1 : aeroports.length - 1));
  };

  const handleNextAero = () => {
    if (aeroports.length === 0) return;
    setSelectedAeroIndex((prev) => (prev < aeroports.length - 1 ? prev + 1 : 0));
  };

  // Flèches de navigation Zone (◀ / ▶)
  const handlePrevZone = () => {
    if (currentAeroZones.length === 0) return;
    setSelectedZoneIndex((prev) => (prev > 0 ? prev - 1 : currentAeroZones.length - 1));
  };

  const handleNextZone = () => {
    if (currentAeroZones.length === 0) return;
    setSelectedZoneIndex((prev) => (prev < currentAeroZones.length - 1 ? prev + 1 : 0));
  };

  // Emplacements associés à la zone active
  const activeEmplacements = emplacements.filter(emp => {
    if (!currentZone) {
      if (!currentAero) return true;
      return (
        (emp.id_aeroport && currentAero.id && Number(emp.id_aeroport) === Number(currentAero.id)) ||
        (emp.nom_aeroport && currentAero.nom && emp.nom_aeroport.toLowerCase() === currentAero.nom.toLowerCase())
      );
    }
    return (
      (emp.id_zone && currentZone.id && Number(emp.id_zone) === Number(currentZone.id)) ||
      (emp.nom_zone && currentZone.nom_zone && emp.nom_zone.toLowerCase() === currentZone.nom_zone.toLowerCase()) ||
      (emp.id_localisation && currentZone.id && Number(emp.id_localisation) === Number(currentZone.id))
    );
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
      const endStr = String(abo.date_fin || abo.date_echeance || '').trim().replace(' ', 'T');

      const startTime = new Date(startStr).getTime();
      const endTime = new Date(endStr).getTime();

      if (isNaN(startTime) || isNaN(endTime)) return false;

      return targetTime >= startTime && targetTime <= endTime;
    });
  };

  // Ouvrir le modal d'association d'abonnement
  const openAssociateModal = (emp) => {
    setTargetEmp(emp);
    setShowAboModal(true);
  };

  const formatDateFr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(String(dateStr).replace(' ', 'T'));
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('fr-FR');
  };

  return (
    <section className="glass-panel planning-container">
      {/* 1. BARRE SUPÉRIEURE : DATE ET BOUTON GLOBAL CHANGER LES EMPLACEMENTS */}
      <div className="planning-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="planning-header-center" style={{ margin: 0 }}>
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

        <button
          type="button"
          onClick={() => setShowChangeModal(true)}
          className="pill-btn active"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', padding: '0.65rem 1.25rem', fontSize: '0.92rem', fontWeight: 700 }}
          title="Changer l'affectation des supports entre aéroports et zones"
        >
          <ArrowLeftRight size={18} />
          <span>Changer les emplacements</span>
        </button>
      </div>

      {/* 2. NAVIGATION AÉROPORT : [ ◀ ] Aéroport : [Nom] [ ▶ ] */}
      <div className="nav-carousel-row">
        <button onClick={handlePrevAero} className="carousel-arrow-btn" title="Aéroport Précédent">
          <ChevronLeft size={22} />
        </button>

        <div className="carousel-title-box">
          <span className="carousel-prefix">Aéroport :</span>
          <span className="carousel-value-text">{currentAero?.nom || 'Aucun Aéroport'}</span>
        </div>

        <button onClick={handleNextAero} className="carousel-arrow-btn" title="Aéroport Suivant">
          <ChevronRight size={22} />
        </button>
      </div>

      {/* 3. NAVIGATION ZONE : [ ◀ ] Zone : [Nom] [ ▶ ] */}
      <div className="nav-carousel-row nav-carousel-sub">
        <button onClick={handlePrevZone} className="carousel-arrow-btn" title="Zone Précédente">
          <ChevronLeft size={20} />
        </button>

        <div className="carousel-title-box">
          <span className="carousel-prefix">Zone :</span>
          <span className="carousel-value-text">
            {currentZone ? (
              currentZone.nom_perimetre
                ? `${currentZone.nom_zone} (${currentZone.nom_perimetre})`
                : (currentZone.nom_zone || currentZone.nom_lieu || 'Zone')
            ) : 'Aucune Zone'}
          </span>
        </div>

        <button onClick={handleNextZone} className="carousel-arrow-btn" title="Zone Suivante">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 4. GRAND CADRE DE CONTENU AVEC CARTES D'EMPLACEMENT ROTATIVES (3D FLIP) */}
      <div className="planning-main-frame">
        {loading ? (
          <p className="empty-msg">Chargement des emplacements et abonnements...</p>
        ) : activeEmplacements.length === 0 ? (
          <div className="empty-msg">
            Aucun emplacement configuré dans la zone « {currentZone?.nom_zone || 'N/A'} » ({currentAero?.nom || 'Aéroport N/A'}).
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
                            <strong>Client :</strong> {activeSub.raison_sociale || activeSub.nom_client || `Client #${activeSub.id_client}`}
                          </div>

                          <div className="wireframe-info-row">
                            <strong>Du :</strong> {formatDateFr(activeSub.date_debut)} <strong>jusqu'au</strong> {formatDateFr(activeSub.date_fin || activeSub.date_echeance)}
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
                            {emp.ref_format || emp.caracteristiques || 'Format standard'}
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
      {showAboModal && targetEmp && (
        <AssociateAbonnementModal
          targetEmp={targetEmp}
          clients={clients}
          abonnements={abonnements}
          selectedDate={selectedDate}
          onClose={() => setShowAboModal(false)}
          onSuccess={loadData}
        />
      )}

      {/* MODAL : Changer les Emplacements (Kanban Drag & Drop 2 Colonnes) */}
      {showChangeModal && (
        <ChangeEmplacementModal
          aeroports={aeroports}
          zones={zones}
          emplacements={emplacements}
          onClose={() => setShowChangeModal(false)}
          onSuccess={loadData}
        />
      )}
    </section>
  );
}
