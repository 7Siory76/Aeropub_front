import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calculator,
  X,
  Filter,
  RotateCcw,
  DollarSign,
  Calendar,
  Plane,
  Tag,
  Tv,
  Users,
  BarChart3,
  TrendingUp,
  Layers,
  Download,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import CalculateurRepartitionCaViews from './CalculateurRepartitionCaViews';
import './CalculateurRepartitionCaModal.css';

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const PALETTE = [
  '#06b6d4', '#2563eb', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#3b82f6'
];

const sanitizeText = (txt) => {
  if (!txt) return '';
  return String(txt).replace(/‚/g, 'é').replace(/Ext‚rieur/g, 'Extérieur').trim();
};

const formatMGA = (montantNumerique) => {
  return new Intl.NumberFormat('fr-MG').format(Math.round(montantNumerique || 0)) + ' MGA';
};

export default function CalculateurRepartitionCaModal({
  isOpen,
  onClose,
  userContracts = [],
  emplacements = [],
  onSelectAbonnement
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Filtres combinables
  const [selectedAeroport, setSelectedAeroport] = useState('all');
  const [selectedCategorie, setSelectedCategorie] = useState('all');
  const [selectedTypeSupport, setSelectedTypeSupport] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedAnnee, setSelectedAnnee] = useState(String(currentYear));
  const [selectedMois, setSelectedMois] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Onglet actif
  const [activeTab, setActiveTab] = useState('aeroport');

  // Indexation des supports physiques
  const supportMap = useMemo(() => {
    const map = new Map();
    emplacements.forEach((emp) => {
      if (emp.reference) {
        map.set(emp.reference.toUpperCase().trim(), {
          reference: emp.reference,
          nom_aeroport: sanitizeText(emp.nom_aeroport || 'Non spécifié'),
          nom_categorie: sanitizeText(emp.nom_categorie || 'Non catégorisé'),
          nom_type_support: sanitizeText(emp.nom_type_support || emp.nom_type || 'Standard'),
          nom_zone: sanitizeText(emp.nom_zone || emp.nom_lieu || ''),
          statut: (emp.statut || emp.etat || 'disponible').toLowerCase()
        });
      }
    });
    return map;
  }, [emplacements]);

  // Contrats Actifs uniquement
  const activeContracts = useMemo(() => {
    return userContracts.filter((c) => {
      const st = (c.nom_statut || c.statut || c.statut_abonnement || '').trim().toLowerCase();
      if (st.includes('archiv') || st.includes('resili') || st.includes('annul') || st.includes('brouillon')) {
        return false;
      }
      return st === 'actif' || st.includes('actif') || st.includes('renouv');
    });
  }, [userContracts]);

  // Années disponibles
  const availableYears = useMemo(() => {
    const years = new Set([currentYear]);
    activeContracts.forEach((c) => {
      if (c.date_debut) {
        const anneeDebut = new Date(c.date_debut).getFullYear();
        if (!isNaN(anneeDebut)) years.add(anneeDebut);
      }
      if (c.date_echeance || c.date_fin) {
        const anneeFin = new Date(c.date_echeance || c.date_fin).getFullYear();
        if (!isNaN(anneeFin)) years.add(anneeFin);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [activeContracts, currentYear]);

  // Valeurs uniques pour les filtres
  const filterOptions = useMemo(() => {
    const aeroports = new Set();
    const categories = new Set();
    const types = new Set();
    const clients = new Map();

    activeContracts.forEach((c) => {
      const clientName = sanitizeText(c.raison_sociale || c.nom_client || 'Client Inconnu');
      if (clientName) clients.set(clientName, (clients.get(clientName) || 0) + 1);

      const rawRefs = (c.supports_associes || c.reference_emplacement || '')
        .split(/[,;\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      rawRefs.forEach((ref) => {
        const emp = supportMap.get(ref);
        if (emp) {
          if (emp.nom_aeroport) aeroports.add(emp.nom_aeroport);
          if (emp.nom_categorie) categories.add(emp.nom_categorie);
          if (emp.nom_type_support) types.add(emp.nom_type_support);
        }
      });
    });

    return {
      aeroports: Array.from(aeroports).sort(),
      categories: Array.from(categories).sort(),
      types: Array.from(types).sort(),
      clients: Array.from(clients.keys()).sort()
    };
  }, [activeContracts, supportMap]);

  // CA total global actif
  const globalTotalCa = useMemo(() => {
    return activeContracts.reduce((sum, c) => sum + (parseFloat(c.tarif) || 0), 0);
  }, [activeContracts]);

  // Moteur de calcul & ventilation multicritères
  const calculationResults = useMemo(() => {
    let pStart = null;
    let pEnd = null;

    if (selectedAnnee !== 'all' && selectedMois !== 'all') {
      const anneeFiltre = parseInt(selectedAnnee, 10);
      const moisFiltre = parseInt(selectedMois, 10);
      pStart = new Date(anneeFiltre, moisFiltre, 1, 0, 0, 0);
      pEnd = new Date(anneeFiltre, moisFiltre + 1, 0, 23, 59, 59);
    } else if (selectedAnnee !== 'all' && selectedMois === 'all') {
      const anneeFiltre = parseInt(selectedAnnee, 10);
      pStart = new Date(anneeFiltre, 0, 1, 0, 0, 0);
      pEnd = new Date(anneeFiltre, 11, 31, 23, 59, 59);
    } else if (selectedAnnee === 'all' && selectedMois !== 'all') {
      const moisFiltre = parseInt(selectedMois, 10);
      pStart = new Date(currentYear, moisFiltre, 1, 0, 0, 0);
      pEnd = new Date(currentYear, moisFiltre + 1, 0, 23, 59, 59);
    }

    const filteredContrats = [];
    const mobilisedSupports = new Set();
    const mobilisedClients = new Set();
    let totalCaContractuel = 0;
    let totalCaProrata = 0;

    const parAeroport = {};
    const parCategorie = {};
    const parTypeSupport = {};
    const parClient = {};

    const addMetric = (map, key, partCa, partCaP, supRef, aboRef) => {
      if (!map[key]) map[key] = { ca: 0, caProrata: 0, supports: new Set(), contrats: new Set() };
      map[key].ca += partCa;
      map[key].caProrata += partCaP;
      if (supRef && supRef !== 'NON_ASSIGNE') map[key].supports.add(supRef);
      if (aboRef) map[key].contrats.add(aboRef);
    };

    activeContracts.forEach((c) => {
      const tarif = parseFloat(c.tarif) || 0;
      const clientName = sanitizeText(c.raison_sociale || c.nom_client || 'Client Inconnu');
      const cDebut = c.date_debut ? new Date(c.date_debut) : null;
      const cFin = (c.date_echeance || c.date_fin) ? new Date(c.date_echeance || c.date_fin) : null;

      if (pStart && pEnd) {
        if (!cDebut || !cFin || isNaN(cDebut.getTime()) || isNaN(cFin.getTime())) return;
        if (cDebut > pEnd || cFin < pStart) return;
      }

      if (selectedClient !== 'all' && clientName.toLowerCase() !== selectedClient.toLowerCase()) {
        return;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const refMatch = (c.reference || '').toLowerCase().includes(q);
        const clMatch = clientName.toLowerCase().includes(q);
        const campMatch = (c.annonceur_campagne || '').toLowerCase().includes(q);
        const supMatch = (c.supports_associes || '').toLowerCase().includes(q);
        if (!refMatch && !clMatch && !campMatch && !supMatch) return;
      }

      const rawRefs = (c.supports_associes || c.reference_emplacement || '')
        .split(/[,;\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const contractSupports = [];
      rawRefs.forEach((ref) => {
        const emp = supportMap.get(ref);
        if (emp) {
          contractSupports.push(emp);
        } else {
          contractSupports.push({
            reference: ref,
            nom_aeroport: 'Non spécifié',
            nom_categorie: 'Non catégorisé',
            nom_type_support: 'Standard',
            nom_zone: ''
          });
        }
      });

      if (contractSupports.length === 0) {
        contractSupports.push({
          reference: 'NON_ASSIGNE',
          nom_aeroport: 'Non assigné',
          nom_categorie: 'Non assignée',
          nom_type_support: 'Non assigné',
          nom_zone: ''
        });
      }

      const matchAero = selectedAeroport === 'all' || contractSupports.some((s) => s.nom_aeroport.toLowerCase() === selectedAeroport.toLowerCase());
      const matchCat = selectedCategorie === 'all' || contractSupports.some((s) => s.nom_categorie.toLowerCase() === selectedCategorie.toLowerCase());
      const matchType = selectedTypeSupport === 'all' || contractSupports.some((s) => s.nom_type_support.toLowerCase() === selectedTypeSupport.toLowerCase());

      if (!matchAero || !matchCat || !matchType) return;

      let prorataCa = tarif;
      let activeDaysInPeriod = 0;
      let totalDays = 1;

      if (pStart && pEnd && cDebut && cFin) {
        const s = Math.max(cDebut.getTime(), pStart.getTime());
        const e = Math.min(cFin.getTime(), pEnd.getTime());
        activeDaysInPeriod = Math.max(0, Math.round((e - s) / 86400000) + 1);
        totalDays = Math.max(1, Math.round((cFin.getTime() - cDebut.getTime()) / 86400000) + 1);
        prorataCa = (tarif * activeDaysInPeriod) / totalDays;
      }

      const eligibleSupports = contractSupports.filter((s) => {
        if (selectedAeroport !== 'all' && s.nom_aeroport.toLowerCase() !== selectedAeroport.toLowerCase()) return false;
        if (selectedCategorie !== 'all' && s.nom_categorie.toLowerCase() !== selectedCategorie.toLowerCase()) return false;
        if (selectedTypeSupport !== 'all' && s.nom_type_support.toLowerCase() !== selectedTypeSupport.toLowerCase()) return false;
        return true;
      });

      const effectiveSupports = eligibleSupports.length > 0 ? eligibleSupports : contractSupports;
      const sharePerSupport = 1 / effectiveSupports.length;

      totalCaContractuel += tarif;
      totalCaProrata += prorataCa;
      mobilisedClients.add(clientName);

      effectiveSupports.forEach((s) => {
        if (s.reference !== 'NON_ASSIGNE') mobilisedSupports.add(s.reference);
        const partTarif = tarif * sharePerSupport;
        const partProrata = prorataCa * sharePerSupport;

        addMetric(parAeroport, s.nom_aeroport, partTarif, partProrata, s.reference, c.reference);
        addMetric(parCategorie, s.nom_categorie, partTarif, partProrata, s.reference, c.reference);
        addMetric(parTypeSupport, s.nom_type_support, partTarif, partProrata, s.reference, c.reference);
      });

      addMetric(parClient, clientName, tarif, prorataCa, null, c.reference);
      effectiveSupports.forEach((s) => {
        if (s.reference !== 'NON_ASSIGNE') parClient[clientName].supports.add(s.reference);
      });

      filteredContrats.push({
        ...c,
        clientName,
        tarifNum: tarif,
        prorataCa,
        activeDaysInPeriod,
        totalDays,
        supportsList: effectiveSupports
      });
    });

    const toSortedList = (mapObj) => {
      const total = Object.values(mapObj).reduce((s, item) => s + item.ca, 0);
      return Object.entries(mapObj)
        .map(([nom, data], idx) => ({
          nom,
          ca: data.ca,
          caProrata: data.caProrata,
          nbSupports: data.supports.size,
          nbContrats: data.contrats.size,
          pct: total > 0 ? (data.ca / total) * 100 : 0,
          color: PALETTE[idx % PALETTE.length]
        }))
        .sort((a, b) => b.ca - a.ca);
    };

    const ratioGlobal = globalTotalCa > 0 ? (totalCaContractuel / globalTotalCa) * 100 : 0;

    return {
      totalCaContractuel,
      totalCaProrata,
      totalContrats: filteredContrats.length,
      totalSupports: mobilisedSupports.size,
      totalClients: mobilisedClients.size,
      ratioGlobal,
      hasPeriodFilter: Boolean(pStart && pEnd),
      listAeroport: toSortedList(parAeroport),
      listCategorie: toSortedList(parCategorie),
      listTypeSupport: toSortedList(parTypeSupport),
      listClient: toSortedList(parClient),
      filteredContrats
    };
  }, [
    activeContracts,
    supportMap,
    selectedAeroport,
    selectedCategorie,
    selectedTypeSupport,
    selectedClient,
    selectedAnnee,
    selectedMois,
    searchQuery,
    currentYear,
    globalTotalCa
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedAeroport !== 'all') count++;
    if (selectedCategorie !== 'all') count++;
    if (selectedTypeSupport !== 'all') count++;
    if (selectedClient !== 'all') count++;
    if (selectedAnnee !== 'all') count++;
    if (selectedMois !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedAeroport, selectedCategorie, selectedTypeSupport, selectedClient, selectedAnnee, selectedMois, searchQuery]);

  const handleResetFilters = () => {
    setSelectedAeroport('all');
    setSelectedCategorie('all');
    setSelectedTypeSupport('all');
    setSelectedClient('all');
    setSelectedAnnee('all');
    setSelectedMois('all');
    setSearchQuery('');
  };

  const handleExportCsv = () => {
    let rows = [];
    let filename = `repartition_ca_${activeTab}_${selectedAnnee}.csv`;

    if (activeTab === 'aeroport') {
      rows.push(['Aeroport', 'Nb_Contrats', 'Nb_Supports', 'CA_Contractuel_MGA', 'CA_Prorata_MGA', 'Part_Pourcentage']);
      calculationResults.listAeroport.forEach((r) => rows.push([r.nom, r.nbContrats, r.nbSupports, Math.round(r.ca), Math.round(r.caProrata), r.pct.toFixed(2) + '%']));
    } else if (activeTab === 'categorie') {
      rows.push(['Categorie', 'Nb_Contrats', 'Nb_Supports', 'CA_Contractuel_MGA', 'CA_Prorata_MGA', 'Part_Pourcentage']);
      calculationResults.listCategorie.forEach((r) => rows.push([r.nom, r.nbContrats, r.nbSupports, Math.round(r.ca), Math.round(r.caProrata), r.pct.toFixed(2) + '%']));
    } else if (activeTab === 'type') {
      rows.push(['Type_Support', 'Nb_Contrats', 'Nb_Supports', 'CA_Contractuel_MGA', 'CA_Prorata_MGA', 'Part_Pourcentage']);
      calculationResults.listTypeSupport.forEach((r) => rows.push([r.nom, r.nbContrats, r.nbSupports, Math.round(r.ca), Math.round(r.caProrata), r.pct.toFixed(2) + '%']));
    } else if (activeTab === 'client') {
      rows.push(['Client', 'Nb_Contrats', 'Nb_Supports', 'CA_Contractuel_MGA', 'CA_Prorata_MGA', 'Part_Pourcentage']);
      calculationResults.listClient.forEach((r) => rows.push([r.nom, r.nbContrats, r.nbSupports, Math.round(r.ca), Math.round(r.caProrata), r.pct.toFixed(2) + '%']));
    } else {
      rows.push(['Reference', 'Client', 'Tarif_Total_MGA', 'CA_Prorata_MGA', 'Periodicite', 'Date_Debut', 'Date_Fin', 'Supports']);
      calculationResults.filteredContrats.forEach((c) => {
        const sups = c.supportsList.map((s) => s.reference).join(', ');
        rows.push([c.reference, c.clientName, Math.round(c.tarifNum), Math.round(c.prorataCa), c.periodicite || 'Annuel', c.date_debut, c.date_echeance || c.date_fin, sups]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  // Définition des sélecteurs de filtre
  const filterInputs = [
    { label: 'Aéroport', icon: Plane, val: selectedAeroport, set: setSelectedAeroport, allTxt: `Tous les aéroports (${filterOptions.aeroports.length})`, list: filterOptions.aeroports },
    { label: 'Catégorie', icon: Tag, val: selectedCategorie, set: setSelectedCategorie, allTxt: `Toutes les catégories (${filterOptions.categories.length})`, list: filterOptions.categories },
    { label: 'Type de Support', icon: Tv, val: selectedTypeSupport, set: setSelectedTypeSupport, allTxt: `Tous les types (${filterOptions.types.length})`, list: filterOptions.types },
    { label: 'Client / Annonceur', icon: Users, val: selectedClient, set: setSelectedClient, allTxt: `Tous les clients (${filterOptions.clients.length})`, list: filterOptions.clients },
    { label: 'Année', icon: Calendar, val: selectedAnnee, set: setSelectedAnnee, allTxt: 'Toutes les années', list: availableYears.map(String) },
    { label: 'Mois', icon: Calendar, val: selectedMois, set: setSelectedMois, allTxt: 'Tous les mois (Annuel complet)', list: MOIS_NOMS.map((_, i) => String(i)), labels: MOIS_NOMS }
  ];

  const tabButtons = [
    { id: 'aeroport', label: 'Par Aéroport', icon: Plane, count: calculationResults.listAeroport.length },
    { id: 'categorie', label: 'Par Catégorie', icon: Tag, count: calculationResults.listCategorie.length },
    { id: 'type', label: 'Par Type de Support', icon: Tv, count: calculationResults.listTypeSupport.length },
    { id: 'client', label: 'Par Client', icon: Users, count: calculationResults.listClient.length },
    { id: 'contrats', label: 'Détail Contrats', icon: FileSpreadsheet, count: calculationResults.filteredContrats.length }
  ];

  return createPortal(
    <div className="ca-modal-backdrop" onClick={onClose}>
      <div className="ca-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* EN-TÊTE DE LA MODAL */}
        <div className="ca-modal-header">
          <div className="ca-modal-header-left">
            <div className="ca-modal-icon-badge">
              <Calculator size={26} />
            </div>
            <div>
              <h2 className="ca-modal-title">
                <span>Moniteur &amp; Répartition du Chiffre d'Affaires</span>
                <span className="ca-badge-actif">
                  <Sparkles size={13} />
                  Contrats Actifs
                </span>
              </h2>
              <p className="ca-modal-subtitle">
                Simulateur et ventilation multidimensionnelle : par aéroport, catégorie, type de support et client
              </p>
            </div>
          </div>

          <div className="ca-modal-header-actions">
            <button
              type="button"
              className="ca-btn-close"
              onClick={onClose}
              title="Fermer la fenêtre (Échap)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CORPS DE LA MODAL */}
        <div className="ca-modal-body">
          {/* 1. PANNEAU DE FILTRES COMBINABLES (MONITEUR DE CONTRÔLE) */}
          <section className="ca-filters-card">
            <div className="ca-filters-header">
              <h3 className="ca-filters-title">
                <Filter size={18} />
                <span>Critères de calcul &amp; filtres combinés</span>
                {activeFiltersCount > 0 && (
                  <span style={{
                    background: '#0284c7',
                    color: '#fff',
                    borderRadius: '9999px',
                    padding: '0.15rem 0.55rem',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}>
                    {activeFiltersCount} actif(s)
                  </span>
                )}
              </h3>

              <div className="ca-filters-actions">
                <button
                  type="button"
                  className={`ca-btn-preset ${selectedAnnee === String(currentYear) && selectedMois === 'all' ? 'active' : ''}`}
                  onClick={() => { setSelectedAnnee(String(currentYear)); setSelectedMois('all'); }}
                >
                  Cette année ({currentYear})
                </button>
                <button
                  type="button"
                  className={`ca-btn-preset ${selectedAnnee === String(currentYear) && selectedMois === String(currentMonth) ? 'active' : ''}`}
                  onClick={() => { setSelectedAnnee(String(currentYear)); setSelectedMois(String(currentMonth)); }}
                >
                  Ce mois ({MOIS_NOMS[currentMonth]})
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    className="ca-btn-reset"
                    onClick={handleResetFilters}
                    title="Réinitialiser tous les critères à leur valeur par défaut"
                  >
                    <RotateCcw size={13} />
                    <span>Réinitialiser</span>
                  </button>
                )}
              </div>
            </div>

            <div className="ca-filters-grid">
              {filterInputs.map((f, idx) => {
                const IconComp = f.icon;
                return (
                  <div key={idx} className="ca-filter-item">
                    <label className="ca-filter-label">
                      <IconComp size={13} />
                      <span>{f.label}</span>
                    </label>
                    <select
                      className="ca-filter-select"
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                    >
                      <option value="all">{f.allTxt}</option>
                      {f.list.map((item, i) => (
                        <option key={item} value={item}>
                          {f.labels ? f.labels[i] : item}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. LE MONITEUR DE CALCUL (KPIs LIVE DU CHIFFRE D'AFFAIRES) */}
          <section className="ca-monitor-grid">
            <div className="ca-monitor-card primary">
              <div className="ca-monitor-card-header">
                <span className="ca-monitor-card-label">CA Contractuel Total</span>
                <div className="ca-monitor-card-icon">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="ca-monitor-card-value">
                {formatMGA(calculationResults.totalCaContractuel)}
              </div>
              <div className="ca-monitor-card-sub">
                <TrendingUp size={14} style={{ color: '#06b6d4' }} />
                <span>
                  {calculationResults.ratioGlobal >= 99.9
                    ? '100% du portefeuille actif total'
                    : `${calculationResults.ratioGlobal.toFixed(1)}% du CA global actif`}
                </span>
              </div>
            </div>

            <div className="ca-monitor-card secondary">
              <div className="ca-monitor-card-header">
                <span className="ca-monitor-card-label">
                  {calculationResults.hasPeriodFilter ? 'CA Imputable Période' : 'CA Période (Plein)'}
                </span>
                <div className="ca-monitor-card-icon">
                  <Calendar size={20} />
                </div>
              </div>
              <div className="ca-monitor-card-value">
                {formatMGA(calculationResults.totalCaProrata)}
              </div>
              <div className="ca-monitor-card-sub">
                <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                <span>
                  {selectedMois !== 'all' && selectedAnnee !== 'all'
                    ? `${MOIS_NOMS[parseInt(selectedMois, 10)]} ${selectedAnnee} (prorata temporis)`
                    : selectedAnnee !== 'all'
                      ? `Exercice ${selectedAnnee}`
                      : 'Base contractuelle globale'}
                </span>
              </div>
            </div>

            <div className="ca-monitor-card">
              <div className="ca-monitor-card-header">
                <span className="ca-monitor-card-label">Contrats Actifs</span>
                <div className="ca-monitor-card-icon">
                  <BarChart3 size={20} />
                </div>
              </div>
              <div className="ca-monitor-card-value">
                {calculationResults.totalContrats}
              </div>
              <div className="ca-monitor-card-sub">
                <span>
                  Ticket moyen : {calculationResults.totalContrats > 0
                    ? formatMGA(calculationResults.totalCaContractuel / calculationResults.totalContrats)
                    : '0 MGA'}
                </span>
              </div>
            </div>

            <div className="ca-monitor-card">
              <div className="ca-monitor-card-header">
                <span className="ca-monitor-card-label">Supports Mobilisés</span>
                <div className="ca-monitor-card-icon">
                  <Layers size={20} />
                </div>
              </div>
              <div className="ca-monitor-card-value">
                {calculationResults.totalSupports}
              </div>
              <div className="ca-monitor-card-sub">
                <span>
                  Sur {calculationResults.totalClients} client(s) actif(s)
                </span>
              </div>
            </div>
          </section>

          {/* 3. NAVIGATION PAR ONGLETS DE RÉPARTITION */}
          <div className="ca-tabs-nav-container">
            <div className="ca-tabs-header-info">
              <span className="ca-tabs-section-sub">
                Cliquez sur un onglet pour basculer la dimension d'analyse
              </span>
            </div>
            <div className="ca-tabs-nav">
              {tabButtons.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`ca-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <TabIcon size={18} className="ca-tab-icon" />
                    <span className="ca-tab-label">{tab.label}</span>
                    <span className="ca-tab-badge">{tab.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. CONTENU DES RÉPARTITIONS DÉLÉGUÉ AU SECOND FICHIER */}
          <CalculateurRepartitionCaViews
            activeTab={activeTab}
            calculationResults={calculationResults}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectAeroport={(aero) => setSelectedAeroport(aero)}
            onSelectCategorie={(cat) => setSelectedCategorie(cat)}
            onSelectTypeSupport={(tp) => setSelectedTypeSupport(tp)}
            onSelectClient={(cl) => setSelectedClient(cl)}
            onSelectAbonnement={onSelectAbonnement}
            formatMGA={formatMGA}
          />
        </div>

        {/* PIED DE LA MODAL */}
        <div className="ca-modal-footer">
          <div className="ca-footer-info">
            <Sparkles size={15} style={{ color: '#06b6d4' }} />
            <span>
              Calcul dynamique en temps réel • {calculationResults.totalContrats} contrat(s) actif(s) sur {activeContracts.length} au total
            </span>
          </div>

          <div className="ca-footer-actions">
            <button
              type="button"
              className="ca-btn-export"
              onClick={handleExportCsv}
              title="Exporter les données du tableau actif au format CSV"
            >
              <Download size={15} />
              <span>Exporter en CSV</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '0.55rem 1.25rem', borderRadius: '10px' }}
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
