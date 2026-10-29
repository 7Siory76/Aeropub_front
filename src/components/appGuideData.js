// Guide d'utilisation par page d'AeroPub
export const APP_PAGES_GUIDE = [
  {
    id: 'planning',
    pageKey: 'planning',
    tabKey: null,
    name: 'Planning & Zones',
    icon: 'MapPin',
    badge: 'Disponibilités en direct',
    badgeColor: '#10b981',
    description: 'Carte visuelle et calendrier des disponibilités de tous les panneaux publicitaires de chaque aéroport.',
    actions: [
      {
        title: 'Choisir un aéroport & une date',
        desc: 'Sélectionnez un aéroport (Ivato TNR, Nosy Be NOS...) et choisissez n’importe quelle date pour voir qui occupe quel panneau à ce moment.'
      },
      {
        title: 'Repérer l’état des panneaux en un coup d’œil',
        desc: 'Vert = Libre, Rouge = Occupé par un contrat, Orange = Réservé prochainement, Gris = En maintenance.'
      },
      {
        title: 'Consulter la fiche détaillée d’un support',
        desc: 'Cliquez sur n’importe quel panneau sur la carte pour voir sa photo/visuel, ses dimensions, son type et le contrat client en cours.'
      },
      {
        title: 'Filtrer par zone d’affichage',
        desc: 'Isolez une zone précise (Hall Départs Internationaux, Salle d’embarquement, Arrivées) pour présenter une offre ciblée à un client.'
      }
    ]
  },
  {
    id: 'kpis',
    pageKey: 'kpis',
    tabKey: null,
    name: 'KPI & Statistiques',
    icon: 'BarChart3',
    badge: 'Pilotage & Finance',
    badgeColor: '#06b6d4',
    description: 'Tableau de bord financier, suivi des taux d’occupation et calculateur de répartition du chiffre d’affaires.',
    actions: [
      {
        title: 'Suivre les indicateurs clés',
        desc: 'Consultez le nombre total de supports, le taux d’occupation global, le CA total généré et le volume de contrats actifs.'
      },
      {
        title: 'Utiliser le Calculateur de Répartition du CA (Bouton dédié)',
        desc: 'Analysez le chiffre d’affaires croisé selon l’Aéroport, la Catégorie, le Type de support et le Client avec filtres combinables par Année et Mois.'
      },
      {
        title: 'Comprendre CA Contractuel vs CA Prorata',
        desc: 'CA Contractuel = Montant total signé sur le contrat. CA Période (Prorata) = Part réelle consommée sur le mois ou l’année sélectionné.'
      },
      {
        title: 'Exporter ou Imprimer les statistiques',
        desc: 'Générez en un clic un export Excel/CSV de la répartition financière ou une version imprimable / PDF pour vos réunions de direction.'
      }
    ]
  },
  {
    id: 'dashboard',
    pageKey: 'dashboard',
    tabKey: 'abonnements',
    name: 'Tableau de bord (Gestion des données)',
    icon: 'LayoutDashboard',
    badge: '8 Tables de gestion',
    badgeColor: '#3b82f6',
    description: 'Le centre névralgique pour créer, modifier, rechercher et gérer toutes les données opérationnelles.',
    subTabs: [
      {
        key: 'abonnements',
        name: 'Abonnements & Contrats',
        icon: 'Calendar',
        desc: 'Gestion des campagnes publicitaires et conventions signées.',
        actions: [
          'Créer un nouveau contrat d’affichage (Bouton "+ Nouveau Contrat").',
          'Associer un ou plusieurs supports à une campagne avec répartition du montant.',
          'Définir les dates (début, échéance) et la périodicité de facturation (Mensuelle, Trimestrielle...).',
          'Modifier un contrat existant ou le prolonger lors d’un renouvellement.',
          'Résilier ou clôturer un contrat pour libérer immédiatement les panneaux dans le planning.'
        ]
      },
      {
        key: 'emplacements',
        name: 'Supports & Emplacements',
        icon: 'Tv',
        desc: 'Catalogue technique des panneaux, écrans et bâches publicitaires.',
        actions: [
          'Ajouter un nouveau support publicitaire avec sa référence unique (ex. TNR-DEP-01).',
          'Renseigner l’aéroport, la zone, la catégorie, le type et le tarif de base mensuel.',
          'Indiquer les dimensions physiques (Largeur × Hauteur en mètres).',
          'Mettre un support en état "Maintenance" s’il est en panne ou en révision technique.'
        ]
      },
      {
        key: 'clients',
        name: 'Clients & Contacts (CRM)',
        icon: 'Users',
        desc: 'Fiches entreprises des annonceurs et de leurs interlocuteurs.',
        actions: [
          'Créer un nouveau client partenaire (Bouton "+ Nouveau Client").',
          'Renseigner la Raison Sociale, le contact référent, téléphone et email.',
          'Ajouter les identifiants fiscaux légaux (NIF et STAT).',
          'Consulter l’historique de tous les contrats passés et actifs d’un client.'
        ]
      },
      {
        key: 'actions',
        name: 'Suivi & Alertes (Actions)',
        icon: 'Bell',
        desc: 'Anticipation des fins de contrat et relances commerciales.',
        actions: [
          'Consulter la liste automatique des contrats arrivant à échéance sous 30 jours (Alertes J-30).',
          'Enregistrer une démarche commerciale : Appel téléphonique, Envoi de devis de renouvellement, Réunion.',
          'Définir des dates de rappel pour relancer le client au bon moment.'
        ]
      },
      {
        key: 'typesupports',
        name: 'Types de supports',
        icon: 'Layers',
        desc: 'Typologies techniques d’affichage publicitaire.',
        actions: [
          'Créer un nouveau type de support (Bouton "+ Ajouter").',
          'Modifier le libellé d’un type existant (Bouton "Modifier").',
          'Supprimer un type de support sécurisé avec vérification des supports rattachés.',
          'Gérer les typologies d’écrans (Écran digital LED, Caisson lumineux, Totem, Bâche géante...).'
        ]
      },
      {
        key: 'zones',
        name: 'Aéroports & Zones',
        icon: 'MapPin',
        desc: 'Découpage géographique des terminaux aéroportuaires.',
        actions: [
          'Ajouter ou modifier des aéroports (Ivato TNR, Nosy Be Fascene, Majunga...).',
          'Découper un aéroport en zones stratégiques (Hall public, Départs, Arrivées, Salons VIP).'
        ]
      },
      {
        key: 'formats',
        name: 'Catégories',
        icon: 'FolderKanban',
        desc: 'Structuration des gammes et niveaux de visibilité.',
        actions: [
          'Créer une nouvelle catégorie d’affichage (Bouton "+ Ajouter").',
          'Modifier le nom d’une catégorie existante (Bouton "Modifier").',
          'Supprimer une catégorie sécurisée avec vérification des supports associés.',
          'Définir les gammes tarifaires : Prestige, Standard, Dynamique indoor, Événementiel.'
        ]
      },
      {
        key: 'utilisateurs',
        name: 'Équipe & Rôles (Admin)',
        icon: 'ShieldCheck',
        desc: 'Comptes collaborateurs et attribution des droits d’accès.',
        actions: [
          'Créer les comptes de l’équipe avec email et mot de passe.',
          'Attribuer les rôles : Administrateur, Commercial, Technique, Direction.',
          'Modifier les accès ou réinitialiser les identifiants (réservé aux Administrateurs).'
        ]
      }
    ]
  },
  {
    id: 'import',
    pageKey: 'import',
    tabKey: null,
    name: 'Importation CSV',
    icon: 'FileSpreadsheet',
    badge: 'Injection massive',
    badgeColor: '#8b5cf6',
    description: 'Téléversement rapide de classeurs Excel / CSV pour synchroniser plusieurs contrats ou supports d’un coup.',
    actions: [
      {
        title: 'Importer des contrats ou supports en masse',
        desc: 'Glissez-déposez un fichier CSV (séparateur virgule ou point-virgule) pour créer ou mettre à jour des dizaines de lignes en un clic.'
      },
      {
        title: 'Validation automatique de structure',
        desc: 'Le système contrôle la présence des colonnes obligatoires (reference, tarif, dates, periodicite, raison_sociale) avant injection.'
      },
      {
        title: 'Tester avec des modèles existants',
        desc: 'Utilisez les fichiers d’exemple du dossier CSV_TEST pour vérifier le format attendu.'
      }
    ]
  },
  {
    id: 'settings',
    pageKey: 'settings',
    tabKey: null,
    name: 'Paramètres & Journal d’Audit (Admin)',
    icon: 'Settings',
    badge: 'Sécurité & Traçabilité',
    badgeColor: '#ef4444',
    description: 'Surveillance des opérations sensibles et traçabilité complète de l’application.',
    actions: [
      {
        title: 'Consulter le Journal d’Audit',
        desc: 'Retrouvez l’historique chronologique de chaque création, modification, suppression ou import avec l’auteur et l’heure exacte.'
      },
      {
        title: 'Filtrer les événements de sécurité',
        desc: 'Recherchez une opération spécifique par utilisateur ou par table pour vérifier une action critique.'
      },
      {
        title: 'Paramétrage système',
        desc: 'Ajustez les seuils d’alertes d’échéance et les préférences générales d’AeroPub.'
      }
    ]
  },
  {
    id: 'outils',
    pageKey: null,
    tabKey: null,
    name: 'Outils généraux (Bandeau supérieur)',
    icon: 'Compass',
    badge: 'Accessible partout',
    badgeColor: '#f59e0b',
    description: 'Actions rapides disponibles en permanence dans l’en-tête, quel que soit l’écran où vous vous trouvez.',
    actions: [
      {
        title: 'Mode sombre / clair',
        desc: 'Cliquez sur le bouton Jour/Nuit en haut à droite pour adapter l’affichage à votre confort visuel.'
      },
      {
        title: 'Actualisation',
        desc: 'Rechargez instantanément toutes les données fraîches depuis les serveurs sans recharger la page.'
      },
      {
        title: 'Notifications',
        desc: 'Consultez les dernières alertes temps réel (nouvelles créations, modifications de contrats, alertes J-30).'
      },
      {
        title: 'Guide des rôles',
        desc: 'Consultez le récapitulatif détaillé des droits et permissions selon votre profil (Admin, Commercial, etc.).'
      }
    ]
  }
];
