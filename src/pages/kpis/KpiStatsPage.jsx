import React, { useState, useEffect, useMemo } from 'react';
import {
  abonnementsApi, emplacementsApi, actionsCommercialesApi, clientsApi
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { normalizeRole } from '../../utils/rbac';
import AbonnementDetailsModal from '../dashboard/modals/AbonnementDetailsModal';

// Widgets modulaires existants
import KpiHeroHeader from './components/KpiHeroHeader';
import MontantsFinanciersWidget from './components/MontantsFinanciersWidget';
import EcheancesContratsWidget from './components/EcheancesContratsWidget';
import AlertesCritiquesWidget from './components/AlertesCritiquesWidget';
import TauxOccupationWidget from './components/TauxOccupationWidget';
import ActionsPrioritairesWidget from './components/ActionsPrioritairesWidget';

// Nouveaux Widgets graphiques
import RepartitionCategoriesWidget from './components/RepartitionCategoriesWidget';
import TopClientsWidget from './components/TopClientsWidget';
import OccupationParZoneWidget from './components/OccupationParZoneWidget';

export default function KpiStatsPage({ onNavigateToAbonnements }) {
  const { user } = useAuth();
  const { showError } = useFeedback();
  const roleName = normalizeRole(user?.role);
  const isCommercialSimple = roleName === 'Commercial';

  const [loading, setLoading] = useState(true);
  const [abonnements, setAbonnements] = useState([]);
  const [emplacements, setEmplacements] = useState([]);
  const [actionsCommerciales, setActionsCommerciales] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedAbonnement, setSelectedAbonnement] = useState(null);

  const now = new Date();

  // Chargement des données fraîches
  const loadKpiData = async () => {
    setLoading(true);
    try {
      const [abos, emps, acts, cls] = await Promise.all([
        abonnementsApi.getAll().catch(() => []),
        emplacementsApi.getAll().catch(() => []),
        actionsCommercialesApi.getAll().catch(() => []),
        clientsApi.getAll().catch(() => [])
      ]);
      setAbonnements(abos || []);
      setEmplacements(emps || []);
      setActionsCommerciales(acts || []);
      setClients(cls || []);
    } catch (err) {
      showError(err, 'Impossible de charger certaines statistiques.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKpiData();
  }, []);

  // Restriction portefeuille pour les commerciaux
  const userContracts = useMemo(() => {
    if (!isCommercialSimple) return abonnements;
    const userNom = (user?.nom || '').trim().toLowerCase();
    return abonnements.filter((abo) => {
      const aboCom = (abo.nom_commercial || '').trim().toLowerCase();
      return (userNom && (aboCom.includes(userNom) || userNom.includes(aboCom))) ||
        (abo.id_commercial && user?.id && String(abo.id_commercial) === String(user.id));
    });
  }, [abonnements, isCommercialSimple, user]);

  // Traçabilité des contrats renouvelés via id_abonnement_precedent
  const renewedParentRefs = useMemo(() => {
    const set = new Set();
    userContracts.forEach(c => {
      if (c.id_abonnement_precedent) {
        set.add(String(c.id_abonnement_precedent).trim());
      }
    });
    return set;
  }, [userContracts]);

  const getDiffJours = (dateStr) => {
    if (!dateStr) return -9999;
    return Math.ceil((new Date(dateStr) - now) / 86400000);
  };

  // Calcul partagé pour les alertes et actions prioritaires
  const alertesCritiques = useMemo(() => {
    const echusNonRenouveles = userContracts.filter(c => {
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      const statut = (c.nom_statut || c.statut || '').toLowerCase();
      const estEchu = diff < 0;
      const aEteRenouvele = renewedParentRefs.has(String(c.reference || '').trim());
      const estResilie = statut === 'résilié' || statut === 'resilie';
      return estEchu && !aEteRenouvele && !estResilie;
    });

    const sansAction = userContracts.filter(c => {
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      const statut = (c.nom_statut || c.statut || '').toLowerCase();
      if (statut === 'résilié' || statut === 'resilie') return false;
      if (renewedParentRefs.has(String(c.reference || '').trim())) return false;
      if (diff < -15 || diff > 90) return false;

      const aUneAction = actionsCommerciales.some(a => {
        return String(a.id_abonnement || '').trim() === String(c.reference || '').trim();
      });
      return !aUneAction;
    });

    return { echusNonRenouveles, sansAction };
  }, [userContracts, renewedParentRefs, actionsCommerciales]);

  const echeances = useMemo(() => {
    const actifs = userContracts.filter(c => {
      const statut = (c.nom_statut || c.statut || '').toLowerCase();
      if (statut === 'résilié' || statut === 'resilie') return false;
      if (renewedParentRefs.has(String(c.reference || '').trim())) return false;
      const diff = getDiffJours(c.date_echeance || c.date_fin);
      return diff >= 0 && diff <= 90;
    });

    return {
      j7: actifs.filter(c => getDiffJours(c.date_echeance || c.date_fin) <= 7),
      j30: actifs.filter(c => {
        const d = getDiffJours(c.date_echeance || c.date_fin);
        return d > 7 && d <= 30;
      }),
      j60: actifs.filter(c => {
        const d = getDiffJours(c.date_echeance || c.date_fin);
        return d > 30 && d <= 60;
      }),
      j90: actifs.filter(c => {
        const d = getDiffJours(c.date_echeance || c.date_fin);
        return d > 60 && d <= 90;
      })
    };
  }, [userContracts, renewedParentRefs]);

  const handleFilterClick = (filterKey) => {
    if (onNavigateToAbonnements) {
      onNavigateToAbonnements(filterKey);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 1. En-tête Dynamique avec Adaptabilité de Rôle */}
      <KpiHeroHeader
        user={user}
        roleName={roleName}
        isCommercialSimple={isCommercialSimple}
        onRefresh={loadKpiData}
        loading={loading}
      />

      {/* 2. Module Montants Financiers (Actifs, Renouvelés, À Renouveler, Perdus) */}
      <MontantsFinanciersWidget
        userContracts={userContracts}
        renewedParentRefs={renewedParentRefs}
        onFilterClick={handleFilterClick}
      />

      {/* 3. Grille des Indicateurs Opérationnels (Échéances, Alertes, Taux d'occupation global) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <EcheancesContratsWidget
          userContracts={userContracts}
          renewedParentRefs={renewedParentRefs}
          onFilterClick={handleFilterClick}
        />

        <AlertesCritiquesWidget
          userContracts={userContracts}
          actionsCommerciales={actionsCommerciales}
          renewedParentRefs={renewedParentRefs}
          onFilterClick={handleFilterClick}
        />

        <TauxOccupationWidget
          emplacements={emplacements}
          userContracts={userContracts}
        />
      </div>

      {/* 4. NOUVELLE GRILLE ANALYTIQUE : Graphiques & Diagrammes en Bâtons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Graphique Donut : Répartition par Catégorie de Support */}
        <RepartitionCategoriesWidget
          emplacements={emplacements}
        />

        {/* Diagramme en bâton : Taux d'Occupation par Zone & Popularité */}
        <OccupationParZoneWidget
          emplacements={emplacements}
          userContracts={userContracts}
        />
      </div>

      {/* 5. Diagramme en Bâton Complet : Top 10 Clients (Mois sélectionné / Général) */}
      <div style={{ marginBottom: '2rem' }}>
        <TopClientsWidget
          userContracts={userContracts}
        />
      </div>

      {/* 6. Module des Dossiers Prioritaires (Échus non renouvelés & J-7 / J-30) */}
      <ActionsPrioritairesWidget
        alertesCritiques={alertesCritiques}
        echeances={echeances}
        onSelectAbonnement={(abo) => setSelectedAbonnement(abo)}
        onViewAll={() => handleFilterClick('echus_non_renouveles')}
      />

      {/* 7. Modale Détails Abonnement */}
      {selectedAbonnement && (
        <AbonnementDetailsModal
          abonnement={selectedAbonnement}
          onClose={() => setSelectedAbonnement(null)}
          onRefresh={loadKpiData}
          allAbonnements={abonnements}
          emplacements={emplacements}
          clients={clients}
        />
      )}
    </div>
  );
}
