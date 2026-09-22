import React, { useState, useEffect } from 'react';
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
  typeStatutAbonnementApi
} from '../../api';
import {
  Loader2
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
import { useAuth } from '../../context/AuthContext';
import '../../components/ClientModal.css';

export default function DashboardPage({
  searchQuery = '',
  setSearchQuery,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  onCountsLoaded
}) {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');
  const [internalActiveTab, setInternalActiveTab] = useState('emplacements');
  const activeTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setInternalActiveTab;
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

      if (onCountsLoaded) {
        onCountsLoaded({
          emplacements: emps?.length || 0,
          abonnements: abos?.length || 0,
          clients: cls?.length || 0,
          zones: zns?.length || 0,
          categories: cats?.length || 0,
          typeSupports: ts?.length || 0,
          utilisateurs: users?.length || 0,
          actionsCommerciales: acts?.length || 0
        });
      }
    } catch (err) {
      console.error('Erreur de chargement des données AeroPub base_v3:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);




  return (
    <>
      {setSearchQuery && (
        <HeroBanner
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      <section className="glass-panel dashboard-panel">


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
                emplacements={emplacements}
                typeStatut={typeStatutAbonnement}
                clients={clients}
                utilisateurs={utilisateurs}
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
                onRefresh={loadAllData}
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
              isAdmin ? (
                <UtilisateursTab
                  utilisateurs={utilisateurs}
                  initialSearchQuery={searchQuery}
                  onRefresh={loadAllData}
                />
              ) : (
                <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: '#f87171' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🛡️ Accès réservé aux Administrateurs</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Seuls les comptes avec le rôle Administrateur ont l'autorisation de consulter et gérer les utilisateurs, rôles et mots de passe.
                  </p>
                </div>
              )
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
