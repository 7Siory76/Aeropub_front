import React from 'react';
import { Plane } from 'lucide-react';

const TAB_METADATA = {
  emplacements: {
    title: 'Gestion des Emplacements & Supports Publicitaires',
    subtitle: 'Inventaire temps réel des panneaux 4x3, totems numériques, bâches géantes et caissons lumineux aéroportuaires.'
  },
  abonnements: {
    title: 'Gestion des Abonnements & Contrats Publicitaires',
    subtitle: 'Suivi des contrats d\'affichage, réservations, périodicités de facturation et reconductions annonceurs.'
  },
  clients: {
    title: 'Portefeuille Clients & Annonceurs Partenaires',
    subtitle: 'Répertoire centralisé des annonceurs, entreprises partenaires et contacts commerciaux.'
  },
  typesupports: {
    title: 'Nomenclature des Types de Support Publicitaire',
    subtitle: 'Catalogue technique des typologies d\'affichage physique et numérique déployées dans les aéroports.'
  },
  zones: {
    title: 'Aéroports & Zones d\'Affichage Publicitaire',
    subtitle: 'Cartographie des terminaux, halls départs/arrivées, salles d\'embarquement et zones sous douane.'
  },
  formats: {
    title: 'Catégories & Formats d\'Affichage',
    subtitle: 'Classification des espaces et gabarits dimensionnels normés pour la pose publicitaire.'
  },
  utilisateurs: {
    title: 'Gestion des Utilisateurs & Attribution des Rôles',
    subtitle: 'Contrôle d\'accès RBAC, habilitations de sécurité (Administrateur, Direction, Commercial) et comptes.'
  },
  actions: {
    title: 'Actions Commerciales & Suivi des Alertes J-30',
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
        <span>Plateforme d'Affichage &amp; Publicités Aéroportuaires</span>
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
