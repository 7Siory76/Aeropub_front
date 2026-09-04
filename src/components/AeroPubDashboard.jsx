import React, { useState, useEffect, useRef } from 'react';
import { emplacementsApi, abonnementsApi, clientsApi, zonesApi, localisationsApi, categoriesApi, formatsApi, typeSupportsApi, csvApi } from '../api/apiService';
import { Tv, Calendar, Users, MapPin, Monitor, Layers, Loader2, Upload } from 'lucide-react';
import EmplacementsTab from './dashboard/EmplacementsTab';
import AbonnementsTab from './dashboard/AbonnementsTab';
import ClientsTab from './dashboard/ClientsTab';
import ClientSubscriptionsModal from './dashboard/ClientSubscriptionsModal';
import TypeSupportsTab from './dashboard/TypeSupportsTab';
import ZonesTab from './dashboard/ZonesTab';
import FormatsTab from './dashboard/FormatsTab';
import EmplacementDetailsModal from './dashboard/EmplacementDetailsModal';
import AddEmplacementModal from './dashboard/AddEmplacementModal';
import './ClientModal.css';

export default function AeroPubDashboard({ searchQuery = '' }) {
  const [activeTab, setActiveTab] = useState('emplacements');
  const [emplacements, setEmplacements] = useState([]);
  const [abonnements, setAbonnements] = useState([]);
  const [clients, setClients] = useState([]);
  const [zones, setZones] = useState([]);
  const [localisations, setLocalisations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formats, setFormats] = useState([]);
  const [typeSupports, setTypeSupports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  const fileInputRef = useRef(null);
  const [selectedClientModal, setSelectedClientModal] = useState(null);
  const [selectedEmplacementModal, setSelectedEmplacementModal] = useState(null);
  const [showAddEmplacementModal, setShowAddEmplacementModal] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [emps, abos, cls, zns, locs, cats, fmts, ts] = await Promise.all([
        emplacementsApi.getAll().catch(() => []),
        abonnementsApi.getAll().catch(() => []),
        clientsApi.getAll().catch(() => []),
        zonesApi.getAll().catch(() => []),
        localisationsApi.getAll().catch(() => []),
        categoriesApi.getAll().catch(() => []),
        formatsApi.getAll().catch(() => []),
        typeSupportsApi.getAll().catch(() => [])
      ]);
      setEmplacements(emps || []);
      setAbonnements(abos || []);
      setClients(cls || []);
      setZones(zns || []);
      setLocalisations(locs || []);
      setCategories(cats || []);
      setFormats(fmts || []);
      setTypeSupports(ts || []);
    } catch (err) {
      console.error('Erreur de chargement des données AeroPub:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Déclenchement de l'importation CSV via l'API REST
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingCsv(true);
    try {
      const result = await csvApi.upload(file);
      alert(`✅ Importation réussie ! ${result.data.emplacementsImportes} emplacements et ${result.data.abonnementsCrees} abonnements créés.`);
      await loadAllData(); // Recharger les données en temps réel
    } catch (err) {
      console.error('Erreur lors de l\'importation CSV:', err);
      alert('❌ Erreur lors de l\'importation du fichier CSV.');
    } finally {
      setUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const q = searchQuery.toLowerCase();

  const filteredEmplacements = emplacements.filter(e =>
    e.reference?.toLowerCase().includes(q) ||
    e.ref_format?.toLowerCase().includes(q) ||
    e.nom_type_support?.toLowerCase().includes(q) ||
    e.nom_lieu?.toLowerCase().includes(q)
  );

  const filteredAbos = abonnements.filter(a =>
    a.reference_emplacement?.toLowerCase().includes(q) ||
    a.nom_client?.toLowerCase().includes(q)
  );

  const filteredClients = clients.filter(c =>
    c.nom_client?.toLowerCase().includes(q)
  );

  return (
    <section className="glass-panel dashboard-panel">
      <div className="dashboard-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="dashboard-title">
            📊 Gestionnaire API REST <span className="gradient-text">AeroPub</span>
          </h2>

        </div>

        {/* Bouton d'Importation CSV via API REST */}
        <div>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className="pill-btn active"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingCsv}
          >
            {uploadingCsv ? <Loader2 size={16} className="spinner-icon" /> : <Upload size={16} />}
            <span>{uploadingCsv ? 'Importation en cours...' : 'Importer CSV 📄'}</span>
          </button>
        </div>
      </div>

      {/* Barres d'Onglets */}
      <div className="category-pills" style={{ marginBottom: '1.25rem' }}>
        <button className={`pill-btn ${activeTab === 'emplacements' ? 'active' : ''}`} onClick={() => setActiveTab('emplacements')}>
          <Tv size={14} style={{ display: 'inline', marginRight: '6px' }} /> Emplacements ({filteredEmplacements.length})
        </button>
        <button className={`pill-btn ${activeTab === 'abonnements' ? 'active' : ''}`} onClick={() => setActiveTab('abonnements')}>
          <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} /> Abonnements ({filteredAbos.length})
        </button>
        <button className={`pill-btn ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
          <Users size={14} style={{ display: 'inline', marginRight: '6px' }} /> Clients ({filteredClients.length})
        </button>
        <button className={`pill-btn ${activeTab === 'typesupports' ? 'active' : ''}`} onClick={() => setActiveTab('typesupports')}>
          <Layers size={14} style={{ display: 'inline', marginRight: '6px' }} /> Types Support ({typeSupports.length})
        </button>
        <button className={`pill-btn ${activeTab === 'zones' ? 'active' : ''}`} onClick={() => setActiveTab('zones')}>
          <MapPin size={14} style={{ display: 'inline', marginRight: '6px' }} /> Zones & Lieux ({zones.length})
        </button>
        <button className={`pill-btn ${activeTab === 'formats' ? 'active' : ''}`} onClick={() => setActiveTab('formats')}>
          <Monitor size={14} style={{ display: 'inline', marginRight: '6px' }} /> Formats & Catégories
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <Loader2 size={32} className="spinner-icon" />
          <p className="dashboard-desc" style={{ marginTop: '0.75rem' }}>Chargement des données PostgreSQL...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'emplacements' && (
            <EmplacementsTab
              emplacements={filteredEmplacements}
              onSelectEmplacement={(emp) => setSelectedEmplacementModal(emp)}
              onAddEmplacementClick={() => setShowAddEmplacementModal(true)}
            />
          )}
          {activeTab === 'abonnements' && <AbonnementsTab abonnements={filteredAbos} />}
          {activeTab === 'clients' && <ClientsTab clients={filteredClients} abonnements={abonnements} onSelectClient={(cli) => setSelectedClientModal(cli)} />}
          {activeTab === 'typesupports' && <TypeSupportsTab typeSupports={typeSupports} emplacements={emplacements} abonnements={abonnements} clients={clients} zones={zones} />}
          {activeTab === 'zones' && <ZonesTab zones={zones} localisations={localisations} />}
          {activeTab === 'formats' && <FormatsTab formats={formats} categories={categories} />}
        </div>
      )}

      {selectedClientModal && (
        <ClientSubscriptionsModal
          selectedClient={selectedClientModal}
          onClose={() => setSelectedClientModal(null)}
          abonnements={abonnements}
        />
      )}
      {selectedEmplacementModal && (
        <EmplacementDetailsModal
          emplacement={selectedEmplacementModal}
          onClose={() => setSelectedEmplacementModal(null)}
          onRefresh={loadAllData}
        />
      )}
      {showAddEmplacementModal && (
        <AddEmplacementModal
          onClose={() => setShowAddEmplacementModal(false)}
          onRefresh={loadAllData}
          typeSupports={typeSupports}
          formats={formats}
          categories={categories}
          localisations={localisations}
        />
      )}
    </section>
  );
}
