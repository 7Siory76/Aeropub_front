import React, { useState, useEffect } from 'react';
import { emplacementsApi, abonnementsApi, clientsApi, zonesApi, localisationsApi, categoriesApi, formatsApi, typeSupportsApi } from '../api/apiService';
import { Tv, Calendar, Users, MapPin, Monitor, Layers, Loader2 } from 'lucide-react';
import EmplacementsTab from './dashboard/EmplacementsTab';
import AbonnementsTab from './dashboard/AbonnementsTab';
import ClientsTab from './dashboard/ClientsTab';
import ClientSubscriptionsModal from './dashboard/ClientSubscriptionsModal';
import TypeSupportsTab from './dashboard/TypeSupportsTab';
import ZonesTab from './dashboard/ZonesTab';
import FormatsTab from './dashboard/FormatsTab';
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

  // Modal client
  const [selectedClientModal, setSelectedClientModal] = useState(null);

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

  const q = searchQuery.toLowerCase();

  const filteredEmplacements = emplacements.filter(e =>
    e.reference?.toLowerCase().includes(q) ||
    e.ref_format?.toLowerCase().includes(q) ||
    e.nom_type_support?.toLowerCase().includes(q) ||
    e.nom_categorie?.toLowerCase().includes(q) ||
    e.nom_lieu?.toLowerCase().includes(q) ||
    e.statut?.toLowerCase().includes(q) ||
    e.type_zone?.toLowerCase().includes(q)
  );

  const filteredAbos = abonnements.filter(a =>
    a.reference?.toLowerCase().includes(q) ||
    a.reference_emplacement?.toLowerCase().includes(q) ||
    a.nom_client?.toLowerCase().includes(q) ||
    a.secteur_activite?.toLowerCase().includes(q) ||
    a.ref_facture?.toLowerCase().includes(q)
  );

  const filteredClients = clients.filter(c =>
    c.nom_client?.toLowerCase().includes(q) ||
    c.contact?.toLowerCase().includes(q) ||
    c.secteur_activite?.toLowerCase().includes(q)
  );

  return (
    <section className="glass-panel dashboard-panel">
      <div className="dashboard-header-box">
        <div>
          <h2 className="dashboard-title">
            📊 Gestionnaire API REST <span className="gradient-text">AeroPub</span>
          </h2>
          <p className="dashboard-desc">
            Données en temps réel synchronisées avec PostgreSQL (`BACK_OFFICE`).
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="category-pills">
          <button
            className={`pill-btn ${activeTab === 'emplacements' ? 'active' : ''}`}
            onClick={() => setActiveTab('emplacements')}
          >
            <Tv size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Emplacements ({filteredEmplacements.length})
          </button>

          <button
            className={`pill-btn ${activeTab === 'abonnements' ? 'active' : ''}`}
            onClick={() => setActiveTab('abonnements')}
          >
            <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Abonnements ({filteredAbos.length})
          </button>

          <button
            className={`pill-btn ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <Users size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Clients ({filteredClients.length})
          </button>

          <button
            className={`pill-btn ${activeTab === 'typesupports' ? 'active' : ''}`}
            onClick={() => setActiveTab('typesupports')}
          >
            <Layers size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Types Support ({typeSupports.length})
          </button>

          <button
            className={`pill-btn ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => setActiveTab('zones')}
          >
            <MapPin size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Zones & Lieux ({zones.length})
          </button>

          <button
            className={`pill-btn ${activeTab === 'formats' ? 'active' : ''}`}
            onClick={() => setActiveTab('formats')}
          >
            <Monitor size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Formats & Catégories
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <Loader2 size={32} className="spinner-icon" />
          <p className="dashboard-desc" style={{ marginTop: '0.75rem' }}>Chargement des données depuis PostgreSQL (`http://localhost:5000/api/...`)...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'emplacements' && <EmplacementsTab emplacements={filteredEmplacements} />}
          {activeTab === 'abonnements' && <AbonnementsTab abonnements={filteredAbos} />}
          {activeTab === 'clients' && (
            <ClientsTab
              clients={filteredClients}
              abonnements={abonnements}
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
            />
          )}
          {activeTab === 'zones' && <ZonesTab zones={zones} localisations={localisations} />}
          {activeTab === 'formats' && <FormatsTab formats={formats} categories={categories} />}
        </div>
      )}

      {/* Modal Abonnements Client */}
      {selectedClientModal && (
        <ClientSubscriptionsModal
          selectedClient={selectedClientModal}
          onClose={() => setSelectedClientModal(null)}
          abonnements={abonnements}
        />
      )}
    </section>
  );
}
