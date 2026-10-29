import React from 'react';
import { Plane } from 'lucide-react';

const TAB_METADATA = {
  emplacements: {
    title: 'Gestion des emplacements et supports publicitaires',
    subtitle: 'Inventaire temps réel des panneaux 4x3, totems numériques, bâches géantes et caissons lumineux aéroportuaires.'
  },
  abonnements: {
    title: 'Gestion des abonnements et contrats publicitaires',
    subtitle: 'Suivi des contrats d\'affichage, réservations, périodicités de facturation et reconductions annonceurs.'
  },
  clients: {
    title: 'Portefeuille clients et annonceurs partenaires',
    subtitle: 'Répertoire centralisé des annonceurs, entreprises partenaires et contacts commerciaux.'
  },
  typesupports: {
    title: 'Nomenclature des types de support publicitaire',
    subtitle: 'Catalogue technique des typologies d\'affichage physique et numérique déployées dans les aéroports.'
  },
  zones: {
    title: 'Aéroports et zones d\'affichage publicitaire',
    subtitle: 'Cartographie des terminaux, halls départs/arrivées, salles d\'embarquement et zones sous douane.'
  },
  formats: {
    title: 'Catégories et formats d\'affichage',
    subtitle: 'Classification des espaces et gabarits dimensionnels normés pour la pose publicitaire.'
  },
  utilisateurs: {
    title: 'Gestion des utilisateurs et attribution des rôles',
    subtitle: 'Contrôle d\'accès RBAC, habilitations de sécurité (Administrateur, Direction, Commercial) et comptes.'
  },
  actions: {
    title: 'Actions commerciales et suivi des alertes',
    subtitle: 'Gestion proactive des renouvellements, alertes automatiques et relances d\'échéance à 30 jours.'
  }
};

export default function HeroBanner({
  activeTab = 'emplacements'
}) {
  const currentTab = TAB_METADATA[activeTab] || TAB_METADATA.emplacements;

  return (
    <section className="hero-container">
      {/* 1. Badge Super-Titre Plateforme Officielle */}
      <div className="hero-badge-platform">
        <Plane size={14} className="hero-badge-icon" />
        <span>Plateforme d'affichage et de publicités aéroportuaires</span>
      </div>

      {/* 2. Titre Principal H1 Spécifique à la Vue Active */}
      <h1 className="hero-title">
        <span className="hero-title-main">{currentTab.title}</span>
      </h1>

      {/* 3. Description Contextuelle */}
      <p className="hero-subtitle">
        {currentTab.subtitle}
      </p>
    </section>
  );
}
