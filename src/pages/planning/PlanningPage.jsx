import React, { useState, useEffect, useRef } from 'react';
import { emplacementsApi, abonnementsApi, zonesApi, aeroportsApi, clientsApi } from '../../api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, CheckCircle2, XCircle, RotateCw, Tag, Monitor, Layers, Plane, ArrowLeftRight, X } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import AssociateAbonnementModal from './modals/AssociateAbonnementModal';
import ChangeEmplacementModal from './modals/ChangeEmplacementModal';
import AssociateExistingAbonnementModal from './modals/AssociateExistingAbonnementModal';

export default function PlanningPage() {
  // 1. Date (Date du jour au format YYYY-MM-DD d'office)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // État pour la recherche par référence de support
  const [searchRef, setSearchRef] = useState('');

  // 2. Navigation des Aéroports avec flèches ◀ Aéroport ▶
  const [aeroports, setAeroports] = useState([]);
  const [selectedAeroIndex, setSelectedAeroIndex] = useState(0);

  // 3. Navigation des Zones avec flèches ◀ Zone ▶
  const [zones, setZones] = useState([]);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const pendingZoneIndexRef = useRef(null);

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

  // Modal d'association d'un abonnement pas encore actif
  const [showExistingAboModal, setShowExistingAboModal] = useState(false);

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
      if (import.meta.env?.DEV) {
        console.error('Erreur chargement données planning:', err);
      }
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

  // Réinitialiser la zone ou naviguer vers la zone cible quand l'aéroport change
  useEffect(() => {
    if (pendingZoneIndexRef.current !== null) {
      setSelectedZoneIndex(pendingZoneIndexRef.current);
      pendingZoneIndexRef.current = null;
    } else {
      setSelectedZoneIndex(0);
    }
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

    // Normalisation de la date cible (YYYY-MM-DD)
    const targetDateStr = String(selectedDate).trim().slice(0, 10);
    if (!targetDateStr) return null;

    return abonnements.find(abo => {
      const rawSt = String(abo.statut_abonnement || abo.statut || '').trim().toLowerCase();
      const cleanSt = rawSt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (
        cleanSt.includes('archiv') ||
        cleanSt.includes('resili') ||
        cleanSt.includes('annul') ||
        cleanSt.includes('expir') ||
        rawSt.includes('résili') ||
        rawSt.includes('archiv') ||
        rawSt.includes('expir')
      ) {
        return false; // L'abonnement résilié ou expiré est ignoré -> l'emplacement redevient disponible !
      }

      // Supports associés (liste séparée par des virgules ou tableau)
      const supportsRaw = Array.isArray(abo.supports_associes)
        ? abo.supports_associes
        : String(abo.supports_associes || '').split(',');
      const supportsList = supportsRaw.map(s => String(s).trim().toUpperCase());

      // Vérifier si cet emplacement fait partie des supports de l'abonnement
      const isSupportMatch =
        supportsList.includes(targetRef) ||
        String(abo.reference_emplacement || '').trim().toUpperCase() === targetRef ||
        String(abo.reference_support || '').trim().toUpperCase() === targetRef ||
        String(abo.reference || '').trim().toUpperCase() === targetRef;

      if (!isSupportMatch) return false;

      // Comparaison inclusive des dates de début et de fin
      const startStr = String(abo.date_debut || '').trim().slice(0, 10);
      const endStr = String(abo.date_fin || abo.date_echeance || '').trim().slice(0, 10);

      if (!startStr || !endStr) return false;

      return targetDateStr >= startStr && targetDateStr <= endStr;
    });
  };

  // Support recherché dans le référentiel
  const searchedSupport = searchRef.trim()
    ? emplacements.find(emp =>
      String(emp.reference || '').trim().toUpperCase() === searchRef.trim().toUpperCase() ||
      String(emp.code_support || '').trim().toUpperCase() === searchRef.trim().toUpperCase()
    )
    : null;

  // Disponibilité du support trouvé à la date choisie
  const searchedSupportActiveSub = searchedSupport
    ? getActiveSubscription(searchedSupport.reference)
    : null;
  const isSearchedAvailable = searchedSupport ? !searchedSupportActiveSub : null;

  // Téléportation vers l'aéroport et la zone du support
  const navigateToSupportZone = (support) => {
    if (!support) return;

    const aeroIndex = aeroports.findIndex(a =>
      (support.id_aeroport && a.id && Number(a.id) === Number(support.id_aeroport)) ||
      (support.nom_aeroport && a.nom && a.nom.toLowerCase() === support.nom_aeroport.toLowerCase())
    );

    if (aeroIndex !== -1) {
      const targetAero = aeroports[aeroIndex];
      const targetAeroZones = zones.filter(zone =>
        (zone.id_aeroport && targetAero.id && Number(zone.id_aeroport) === Number(targetAero.id)) ||
        (zone.nom_aeroport && targetAero.nom && zone.nom_aeroport.toLowerCase() === targetAero.nom.toLowerCase())
      );

      const zoneIndex = targetAeroZones.findIndex(z =>
        (support.id_zone && z.id && Number(z.id) === Number(support.id_zone)) ||
        (support.nom_zone && z.nom_zone && z.nom_zone.toLowerCase() === support.nom_zone.toLowerCase()) ||
        (support.id_localisation && z.id && Number(support.id_localisation) === Number(z.id))
      );

      if (aeroIndex === selectedAeroIndex) {
        if (zoneIndex !== -1) {
          setSelectedZoneIndex(zoneIndex);
        }
      } else {
        if (zoneIndex !== -1) {
          pendingZoneIndexRef.current = zoneIndex;
        }
        setSelectedAeroIndex(aeroIndex);
      }
    }
  };


  // Ouvrir le modal d'association d'abonnement
  const openAssociateModal = (emp) => {
    setTargetEmp(emp);
    setShowAboModal(true);
  };

  const formatDateFr = (dateStr) => {
    if (!dateStr) return '';
    const dateObjet = new Date(String(dateStr).replace(' ', 'T'));
    return isNaN(dateObjet.getTime()) ? dateStr : dateObjet.toLocaleDateString('fr-FR');
  };

  // Association d'un support à un abonnement en attente
  // 1. Normalisation de la date cible sélectionnée à midi (évite les décalages de fuseau horaire)
  const targetTime = new Date(selectedDate + 'T12:00:00').getTime();

  // 2. Filtrage des abonnements éligibles
  const eligibleAbonnements = abonnements.filter((abo) => {
    // Statut : exclure les abonnements actifs, archivés, résiliés ou annulés
    const rawSt = String(abo.statut_abonnement || abo.statut || '').trim().toLowerCase();
    const cleanSt = rawSt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (
      cleanSt.includes('actif') ||
      cleanSt.includes('archiv') ||
      cleanSt.includes('resili') ||
      cleanSt.includes('annul')
    ) {
      return false;
    }
    // Date : la date doit être comprise entre date_debut et date_fin / date_echeance
    const startStr = String(abo.date_debut || '').trim().replace(' ', 'T');
    const endStr = String(abo.date_fin || abo.date_echeance || '').trim().replace(' ', 'T');
    const startTime = new Date(startStr).getTime();
    const endTime = new Date(endStr).getTime();
    if (isNaN(startTime) || isNaN(endTime)) return false;
    return targetTime >= startTime && targetTime <= endTime;
  });

  return (
    <>
      {/* En-tête */}
      <section className="hero-container planning-hero-banner">
        <div className="hero-badge-platform">
          <Plane size={14} className="hero-badge-icon" />
          <span>Plateforme d'affichage publicitaire aéroportuaire</span>
        </div>

        <h1 className="hero-title">
          <span className="hero-title-main">Planning d'occupation et disponibilité des supports</span>
        </h1>

        <p className="hero-subtitle">
          Visualisez l'état d'occupation des espaces d'affichage, réservez des contrats et réaffectez les supports entre zones aéroportuaires.
        </p>
      </section>

      <section className="glass-panel planning-container">
        {/* Sélecteur de date et action globale */}
        <div className="planning-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="planning-header-center" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: '1 1 auto' }}>
            <div className="date-picker-box">
              <span className="date-label">Date :</span>
              <input
                type="date"
                className="date-input-field"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <CalendarIcon size={20} className="calendar-icon-btn" />
            </div>

            <div style={{ minWidth: '270px', maxWidth: '380px', flex: '1 1 270px' }}>
              <SearchableSelect
                options={emplacements}
                value={searchRef}
                onChange={(val) => {
                  const newRef = val || '';
                  setSearchRef(newRef);
                  if (newRef) {
                    const target = emplacements.find(
                      e => String(e.reference || '').trim().toUpperCase() === String(newRef).trim().toUpperCase()
                    );
                    if (target) {
                      navigateToSupportZone(target);
                    }
                  }
                }}
                placeholder="🔍 Rechercher réf. support..."
                searchPlaceholder="Taper une réf. (ex: SUP-001, zone, type)..."
                clearable={true}
                getOptionValue={(emp) => emp.reference}
                getOptionLabel={(emp) => `${emp.reference} ${emp.nom_type_support ? `(${emp.nom_type_support})` : ''}`}
                getOptionSublabel={(emp) => `${emp.nom_aeroport || 'Aéroport'} • ${emp.nom_zone || 'Zone'}`}
                getOptionBadge={(emp) => {
                  const sub = getActiveSubscription(emp.reference);
                  return sub ? '🔴 Occupé' : '🟢 Libre';
                }}
              />
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

        {/* Bannière de disponibilité et résultat du support recherché */}
        {searchedSupport && (
          <div
            className="searched-support-banner"
            style={{
              marginBottom: '1.5rem',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: isSearchedAvailable
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
              border: `1.5px solid ${isSearchedAvailable ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)'}`,
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {isSearchedAvailable ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '20px',
                    background: '#10b981',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}>
                    <CheckCircle2 size={16} /> DISPONIBLE AU {formatDateFr(selectedDate)}
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '20px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}>
                    <XCircle size={16} /> OCCUPÉ (RÉSERVÉ) AU {formatDateFr(selectedDate)}
                  </span>
                )}

                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                  Support {searchedSupport.reference}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => navigateToSupportZone(searchedSupport)}
                  className="pill-btn"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  title="Aller à la zone de ce support"
                >
                  <Plane size={15} />
                  <span>Localiser dans le planning</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchRef('')}
                  className="pill-btn"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', opacity: 0.8 }}
                  title="Fermer la recherche"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--text-main)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Localisation : </span>
                <strong>{searchedSupport.nom_aeroport || 'Aéroport'}</strong> — {searchedSupport.nom_zone || 'Zone'}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Type : </span>
                <strong>{searchedSupport.nom_type_support || searchedSupport.nom_type || 'Standard'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Format : </span>
                <strong>{searchedSupport.ref_format || searchedSupport.caracteristiques || 'Standard'}</strong>
              </div>

              {isSearchedAvailable ? (
                <div>
                  <button
                    type="button"
                    onClick={() => openAssociateModal(searchedSupport)}
                    className="wireframe-action-btn"
                    style={{ margin: 0, padding: '0.35rem 0.75rem', fontSize: '0.82rem', width: 'auto' }}
                  >
                    <PlusCircle size={14} /> Associer un contrat
                  </button>
                </div>
              ) : searchedSupportActiveSub && (
                <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
                  <strong>Contrat en cours : </strong>
                  <span>Client : <strong>{searchedSupportActiveSub.raison_sociale || searchedSupportActiveSub.nom_client || `Client #${searchedSupportActiveSub.id_client}`}</strong></span>
                  <span style={{ margin: '0 0.5rem' }}>•</span>
                  <span>Période : <strong>du {formatDateFr(searchedSupportActiveSub.date_debut)} au {formatDateFr(searchedSupportActiveSub.date_fin || searchedSupportActiveSub.date_echeance)}</strong></span>
                  {searchedSupportActiveSub.statut_abonnement && (
                    <>
                      <span style={{ margin: '0 0.5rem' }}>•</span>
                      <span>Statut : <strong style={{ textTransform: 'capitalize' }}>{searchedSupportActiveSub.statut_abonnement}</strong></span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation aéroport : [ ◀ ] Aéroport : [Nom] [ ▶ ] */}
        <div className="nav-carousel-row">
          <button onClick={handlePrevAero} className="carousel-arrow-btn" title="Aéroport précédent">
            <ChevronLeft size={22} />
          </button>

          <div className="carousel-title-box">
            <span className="carousel-prefix">Aéroport :</span>
            <span className="carousel-value-text">{currentAero?.nom || 'Aucun aéroport'}</span>
          </div>

          <button onClick={handleNextAero} className="carousel-arrow-btn" title="Aéroport suivant">
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Navigation zone : [ ◀ ] Zone : [Nom] [ ▶ ] */}
        <div className="nav-carousel-row nav-carousel-sub">
          <button onClick={handlePrevZone} className="carousel-arrow-btn" title="Zone précédente">
            <ChevronLeft size={20} />
          </button>

          <div className="carousel-title-box">
            <span className="carousel-prefix">Zone :</span>
            <span className="carousel-value-text">
              {currentZone ? (
                currentZone.nom_perimetre
                  ? `${currentZone.nom_zone} (${currentZone.nom_perimetre})`
                  : (currentZone.nom_zone || currentZone.nom_lieu || 'Zone')
              ) : 'Aucune zone'}
            </span>
          </div>

          <button onClick={handleNextZone} className="carousel-arrow-btn" title="Zone suivante">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Grille des supports avec cartes rotatives (3D) */}
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
                const isSearched = searchedSupport && emp.reference === searchedSupport.reference;

                return (
                  <div
                    key={emp.reference}
                    className="flip-card-container"
                    style={isSearched ? {
                      outline: '3px solid #3b82f6',
                      borderRadius: '14px',
                      boxShadow: '0 0 22px rgba(59, 130, 246, 0.55)',
                      transform: 'scale(1.02)',
                      transition: 'all 0.3s ease'
                    } : {}}
                  >
                    <div className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                      {/* Recto : Statut et contrat */}
                      <div className={`wireframe-card flip-card-front ${isOccupied ? 'card-status-occupied' : 'card-status-available'}`}>
                        <div className="wireframe-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            Réf. : {emp.reference}
                            {isSearched && (
                              <span style={{ fontSize: '0.72rem', background: '#3b82f6', color: '#fff', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                                CIBLÉ
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => toggleFlip(emp.reference)}
                            className="flip-icon-btn"
                            title="Retourner la carte pour voir les caractéristiques techniques"
                          >
                            <RotateCw size={15} />
                          </button>
                        </div>

                        <div className="wireframe-status-badge-container">
                          {isOccupied ? (
                            <span className="wireframe-badge badge-occupied">
                              <XCircle size={14} /> (RÉSERVÉ)
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
                              <strong>Du :</strong> {formatDateFr(activeSub.date_debut)} <strong>au</strong> {formatDateFr(activeSub.date_fin || activeSub.date_echeance)}
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
                              onClick={() => {
                                setTargetEmp(emp);
                                setShowExistingAboModal(true);
                              }}
                              className="wireframe-action-btn"
                            >
                              <PlusCircle size={16} />
                              <span>Associer à un contrat en attente</span>
                            </button>
                            <button
                              onClick={() => openAssociateModal(emp)}
                              className="wireframe-action-btn"
                            >
                              <PlusCircle size={16} />
                              <span>Associer un nouveau contrat</span>
                            </button>
                          </div>
                        )}

                        {/* Bouton de retournement en bas */}
                        <button
                          onClick={() => toggleFlip(emp.reference)}
                          className="flip-toggle-link"
                        >
                          <RotateCw size={13} />
                          <span>Voir les détails (type, format, catégorie)</span>
                        </button>
                      </div>

                      {/* Verso : Caractéristiques techniques */}
                      <div className="wireframe-card flip-card-back">
                        <div className="wireframe-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Réf. : {emp.reference}</span>
                          <button
                            onClick={() => toggleFlip(emp.reference)}
                            className="flip-icon-btn"
                            title="Retourner au statut du contrat"
                          >
                            <RotateCw size={15} />
                          </button>
                        </div>

                        <div className="flip-back-body">
                          <div className="wireframe-info-row" style={{ marginBottom: '0.75rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Layers size={15} style={{ color: '#6366f1' }} />
                              <strong>Type de support :</strong>
                            </span>
                            <div style={{ paddingLeft: '1.4rem', color: 'var(--text-main)', fontWeight: 700 }}>
                              {emp.nom_type_support || 'Support standard'}
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

        {/* Modale : associer un nouveau contrat */}
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

        {/* Modale : réaffectation des emplacements */}
        {showChangeModal && (
          <ChangeEmplacementModal
            aeroports={aeroports}
            zones={zones}
            emplacements={emplacements}
            onClose={() => setShowChangeModal(false)}
            onSuccess={loadData}
          />
        )}

        {/* Modale : associer à un contrat en attente */}
        {showExistingAboModal && targetEmp && (
          <AssociateExistingAbonnementModal
            targetEmp={targetEmp}
            abonnements={abonnements}
            selectedDate={selectedDate}
            onClose={() => setShowExistingAboModal(false)}
            onSuccess={loadData}
          />
        )}
      </section>
    </>
  );
}
