import React, { useState, useEffect, useRef } from 'react';
import {
  emplacementsApi,
  abonnementsApi,
  clientsApi,
  zonesApi,
  aeroportsApi,
  perimetresApi,
  categoriesApi,
  formatsApi,
  typeSupportsApi,
  utilisateursApi,
  actionsCommercialesApi,
  typeStatutAbonnementApi,
  csvApi
} from '../../api';
import {
  Tv,
  Calendar,
  Users,
  MapPin,
  Layers,
  Loader2,
  Upload,
  ShieldCheck,
  Bell,
  FolderKanban
} from 'lucide-react';
import HeroBanner from '../../components/HeroBanner';
import EmplacementsTab from './tabs/EmplacementsTab';
import AbonnementsTab from './tabs/AbonnementsTab';
import ClientsTab from './tabs/ClientsTab';
import ClientSubscriptionsModal from './modals/ClientSubscriptionsModal';
import TypeSupportsTab from './tabs/TypeSupportsTab';
import ZonesTab from './tabs/ZonesTab';
import CategoriesTab from './tabs/CategoriesTab';
import FormatsTab from './tabs/FormatsTab';
import UtilisateursTab from './tabs/UtilisateursTab';
import ActionsCommercialesTab from './tabs/ActionsCommercialesTab';
import EmplacementDetailsModal from './modals/EmplacementDetailsModal';
import AddEmplacementModal from './modals/AddEmplacementModal';
import '../../components/ClientModal.css';

export default function DashboardPage({ searchQuery = '', setSearchQuery }) {
  const [activeTab, setActiveTab] = useState('emplacements');
  const [emplacements, setEmplacements] = useState([]);
  const [abonnements, setAbonnements] = useState([]);
  const [typeStatutAbonnement, setTypeStatutAbonnement] = useState([]);
  const [clients, setClients] = useState([]);
  const [zones, setZones] = useState([]);
  const [aeroports, setAeroports] = useState([]);
  const [perimetres, setPerimetres] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formats, setFormats] = useState([]);
  const [typeSupports, setTypeSupports] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [actionsCommerciales, setActionsCommerciales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  const fileInputRef = useRef(null);
  const [selectedClientModal, setSelectedClientModal] = useState(null);
  const [selectedEmplacementModal, setSelectedEmplacementModal] = useState(null);
  const [showAddEmplacementModal, setShowAddEmplacementModal] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        emps,
        abos,
        sts,
        cls,
        zns,
        aeros,
        peris,
        cats,
        fmts,
        ts,
        users,
        acts
      ] = await Promise.all([
        emplacementsApi.getAll().catch(() => []),
        abonnementsApi.getAll().catch(() => []),
        typeStatutAbonnementApi.getAll().catch(() => []),
        clientsApi.getAll().catch(() => []),
        zonesApi.getAll().catch(() => []),
        aeroportsApi.getAll().catch(() => []),
        perimetresApi.getAll().catch(() => []),
        categoriesApi.getAll().catch(() => []),
        formatsApi.getAll().catch(() => []),
        typeSupportsApi.getAll().catch(() => []),
        utilisateursApi.getAll().catch(() => []),
        actionsCommercialesApi.getAll().catch(() => [])
      ]);

      setEmplacements(emps || []);
      setAbonnements(abos || []);
      setTypeStatutAbonnement(sts || []);
      setClients(cls || []);
      setZones(zns || []);
      setAeroports(aeros || []);
      setPerimetres(peris || []);
      setCategories(cats || []);
      setFormats(fmts || []);
      setTypeSupports(ts || []);
      setUtilisateurs(users || []);
      setActionsCommerciales(acts || []);
    } catch (err) {
      console.error('Erreur de chargement des données AeroPub base_v3:', err);
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
      alert(`✅ Importation réussie ! ${result.data?.emplacementsImportes || 0} supports et ${result.data?.abonnementsCrees || 0} abonnements synchronisés.`);
      await loadAllData();
    } catch (err) {
      console.error('Erreur lors de l\'importation CSV:', err);
      alert('❌ Erreur lors de l\'importation du fichier CSV.');
    } finally {
      setUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const q = (searchQuery || '').toLowerCase();

  const filteredEmplacements = emplacements.filter(e =>
    e.reference?.toLowerCase().includes(q) ||
    e.nom_type_support?.toLowerCase().includes(q) ||
    e.nom_categorie?.toLowerCase().includes(q) ||
    e.nom_zone?.toLowerCase().includes(q) ||
    e.nom_aeroport?.toLowerCase().includes(q) ||
    e.caracteristiques?.toLowerCase().includes(q)
  );

  const filteredAbos = abonnements.filter(a =>
    a.reference?.toLowerCase().includes(q) ||
    a.nom_client?.toLowerCase().includes(q) ||
    a.raison_sociale?.toLowerCase().includes(q) ||
    a.nom_commercial?.toLowerCase().includes(q) ||
    a.supports_associes?.toLowerCase().includes(q)
  );

  const filteredClients = clients.filter(c =>
    (c.raison_sociale || c.nom_client || '').toLowerCase().includes(q) ||
    (c.contact || '').toLowerCase().includes(q)
  );

  return (
    <>
      {setSearchQuery && (
        <HeroBanner
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      <section className="glass-panel dashboard-panel">
        <div className="dashboard-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="dashboard-title">
              📊 Gestionnaire Référentiel <span className="gradient-text">AeroPub</span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Base relationnelle PostgreSQL normalisée (schéma base_v3.sql)
            </p>
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

        {/* Barres d'Onglets avec toutes les tables de base_v3 */}
        <div className="category-pills" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button className={`pill-btn ${activeTab === 'emplacements' ? 'active' : ''}`} onClick={() => setActiveTab('emplacements')}>
            <Tv size={14} style={{ display: 'inline', marginRight: '6px' }} /> Supports ({filteredEmplacements.length})
          </button>
          <button className={`pill-btn ${activeTab === 'abonnements' ? 'active' : ''}`} onClick={() => setActiveTab('abonnements')}>
            <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} /> Abonnements ({filteredAbos.length})
          </button>
          <button className={`pill-btn ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
            <Users size={14} style={{ display: 'inline', marginRight: '6px' }} /> Clients & Contacts ({filteredClients.length})
          </button>
          <button className={`pill-btn ${activeTab === 'typesupports' ? 'active' : ''}`} onClick={() => setActiveTab('typesupports')}>
            <Layers size={14} style={{ display: 'inline', marginRight: '6px' }} /> Types de Support ({typeSupports.length})
          </button>
          <button className={`pill-btn ${activeTab === 'zones' ? 'active' : ''}`} onClick={() => setActiveTab('zones')}>
            <MapPin size={14} style={{ display: 'inline', marginRight: '6px' }} /> Aéroports & Zones ({zones.length})
          </button>
          <button className={`pill-btn ${activeTab === 'formats' ? 'active' : ''}`} onClick={() => setActiveTab('formats')}>
            <FolderKanban size={14} style={{ display: 'inline', marginRight: '6px' }} /> Catégories ({categories.length})
          </button>
          <button className={`pill-btn ${activeTab === 'utilisateurs' ? 'active' : ''}`} onClick={() => setActiveTab('utilisateurs')}>
            <ShieldCheck size={14} style={{ display: 'inline', marginRight: '6px' }} /> Équipe & Rôles ({utilisateurs.length})
          </button>
          <button className={`pill-btn ${activeTab === 'actions' ? 'active' : ''}`} onClick={() => setActiveTab('actions')}>
            <Bell size={14} style={{ display: 'inline', marginRight: '6px' }} /> Suivi & Alertes J-30 ({actionsCommerciales.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <Loader2 size={32} className="spinner-icon" />
            <p className="dashboard-desc" style={{ marginTop: '0.75rem' }}>Chargement des données PostgreSQL base_v3...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'emplacements' && (
              <EmplacementsTab
                emplacements={emplacements}
                typeSupports={typeSupports}
                categories={categories}
                zones={zones}
                aeroports={aeroports}
                initialSearchQuery={searchQuery}
                onSelectEmplacement={(emp) => setSelectedEmplacementModal(emp)}
                onAddEmplacementClick={() => setShowAddEmplacementModal(true)}
              />
            )}
            {activeTab === 'abonnements' && (
              <AbonnementsTab
                abonnements={abonnements}
                typeStatut={typeStatutAbonnement}
                initialSearchQuery={searchQuery}
                onRefresh={loadAllData}
              />
            )}
            {activeTab === 'clients' && (
              <ClientsTab
                clients={clients}
                abonnements={abonnements}
                initialSearchQuery={searchQuery}
                onSelectClient={(cli) => setSelectedClientModal(cli)}
              />
            )}
            {activeTab === 'typesupports' && (
              <TypeSupportsTab
                typeSupports={typeSupports}
                emplacements={emplacements}
                abonnements={abonnements}
                clients={clients}
                zones={zones}
                initialSearchQuery={searchQuery}
              />
            )}
            {activeTab === 'zones' && (
              <ZonesTab
                zones={zones}
                aeroports={aeroports}
                perimetres={perimetres}
                initialSearchQuery={searchQuery}
              />
            )}
            {activeTab === 'formats' && (
              <CategoriesTab
                categories={categories}
                emplacements={emplacements}
                abonnements={abonnements}
                clients={clients}
                zones={zones}
                formats={formats}
                initialSearchQuery={searchQuery}
              />
            )}
            {activeTab === 'utilisateurs' && (
              <UtilisateursTab
                utilisateurs={utilisateurs}
                initialSearchQuery={searchQuery}
              />
            )}
            {activeTab === 'actions' && (
              <ActionsCommercialesTab
                actions={actionsCommerciales}
                abonnements={abonnements}
                initialSearchQuery={searchQuery}
              />
            )}
          </div>
        )}

        {/* Modale de consultation des abonnements d'un client */}
        {selectedClientModal && (
          <ClientSubscriptionsModal
            selectedClient={selectedClientModal}
            onClose={() => setSelectedClientModal(null)}
            abonnements={abonnements}
          />
        )}

        {/* Modale de consultation et modification d'un emplacement / support */}
        {selectedEmplacementModal && (
          <EmplacementDetailsModal
            emplacement={selectedEmplacementModal}
            onClose={() => setSelectedEmplacementModal(null)}
            onRefresh={loadAllData}
            typeSupports={typeSupports}
            categories={categories}
            zones={zones}
          />
        )}

        {/* Modale d'ajout d'un nouvel emplacement / support */}
        {showAddEmplacementModal && (
          <AddEmplacementModal
            onClose={() => setShowAddEmplacementModal(false)}
            onRefresh={loadAllData}
            typeSupports={typeSupports}
            categories={categories}
            zones={zones}
          />
        )}
      </section>
    </>
  );
}
