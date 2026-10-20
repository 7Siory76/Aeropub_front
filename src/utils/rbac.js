/**
 * Utilitaire de gestion des permissions et rôles (RBAC) AeroPub
 */

/**
 * Normalise les dénominations de rôles issues de la base de données :
 * - 'Administrateur', 'admin', 'ADMIN' -> 'Admin'
 * - 'Resp_Com', 'Responsable Commercial', 'resp_com' -> 'Resp_Com'
 * - 'Direction', 'Directrice', 'Directeur' -> 'Direction'
 * - 'Commercial', 'commercial' -> 'Commercial'
 * - 'Lecture_Seule', 'Lecture Seule', 'lecture_seule' -> 'Lecture_Seule'
 */
export function normalizeRole(role) {
  if (!role) return '';
  const r = String(role).trim().toLowerCase();
  if (r.startsWith('admin')) return 'Admin';
  if (r.includes('resp') && r.includes('com')) return 'Resp_Com';
  if (r.includes('direct')) return 'Direction';
  if (r.includes('com')) return 'Commercial';
  if (r.includes('lecture') || r.includes('read') || r.includes('seule')) return 'Lecture_Seule';
  return role;
}

/**
 * Vérifie si l'utilisateur possède l'un des rôles autorisés.
 * Exemple: hasRole(user, ['Admin', 'Resp_Com', 'Commercial'])
 * 
 * @param {Object} user - Objet utilisateur contenant la propriété role (ex: user.role)
 * @param {Array<string>} allowedRoles - Liste des rôles autorisés (ex: ['Admin', 'Resp_Com'])
 * @returns {boolean}
 */
export function hasRole(user, allowedRoles = []) {
  if (!user || !user.role) return false;
  const userNorm = normalizeRole(user.role);
  return allowedRoles.some((r) => {
    return normalizeRole(r) === userNorm || r.toLowerCase() === String(user.role).toLowerCase();
  });
}

/**
 * Référentiel des rôles et matrice d'aide des permissions (RBAC)
 */
export const ROLES_GUIDE = [
  {
    id: 1,
    code: 'Admin',
    nom: 'Administrateur',
    badgeColor: '#f87171',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeBorder: 'rgba(239, 68, 68, 0.35)',
    summary: 'Paramétrage global, utilisateurs, référentiels, modèles d’e-mails, accès à toutes les données et au journal.',
    permissions: [
      { text: 'Paramétrage global du système & gestion des comptes utilisateurs et rôles', allowed: true },
      { text: 'Gestion de tous les référentiels : Aéroports, Zones, Catégories, Types et Supports', allowed: true },
      { text: 'Gestion des modèles d’e-mails et suivi des automatisations (CRON)', allowed: true },
      { text: 'Importation de données multi-fichiers (Infrastructure, Inventaire, Contrats)', allowed: true },
      { text: 'Accès intégral à toutes les données de l\'entreprise et au Journal d\'Audit', allowed: true },
      { text: 'Contrats & Clients : Création, modification, affectation, validation, activation et suppression', allowed: true }
    ]
  },
  {
    id: 3,
    code: 'Direction',
    nom: 'Direction',
    badgeColor: '#c084fc',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    summary: 'Consultation globale, indicateurs, exports, validation éventuelle des remises ou renouvellements.',
    permissions: [
      { text: 'Consultation globale de tous les contrats, clients, supports et plannings', allowed: true },
      { text: 'Pilotage par les indicateurs clés et statistiques globales (KPIs d\'occupation et CA)', allowed: true },
      { text: 'Validation éventuelle des remises exceptionnelles ou des renouvellements stratégiques', allowed: true },
      { text: 'Importation de données et exports exhaustifs des tableaux (Excel / CSV)', allowed: true },
      { text: 'Restrictions : Pas de modification opérationnelle directe ni de suppression', allowed: false },
      { text: 'Restrictions : Pas d\'accès à l\'administration technique ni aux modèles de courriels', allowed: false }
    ]
  },
  {
    id: 4,
    code: 'Resp_Com',
    nom: 'Responsable Commercial',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    summary: 'Création et modification des clients et contrats, affectation, suivi d’équipe, exports.',
    permissions: [
      { text: 'Création, modification et activation des fiches clients et contrats d’abonnement', allowed: true },
      { text: 'Affectation et réattribution des dossiers aux commerciaux de l\'équipe', allowed: true },
      { text: 'Suivi d’équipe, pilotage des portefeuilles commerciaux et indicateurs d\'activité', allowed: true },
      { text: 'Validation des renouvellements et remises commerciales', allowed: true },
      { text: 'Importation de données et exports complets des tableaux (Excel / CSV)', allowed: true },
      { text: 'Restrictions : Pas d\'accès au paramétrage global, aux utilisateurs ni aux modèles d\'e-mails', allowed: false }
    ]
  },
  {
    id: 2,
    code: 'Commercial',
    nom: 'Commercial',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeBorder: 'rgba(59, 130, 246, 0.35)',
    summary: 'Gestion des dossiers qui lui sont attribués, recherche, relances et comptes rendus.',
    permissions: [
      { text: 'Gestion opérationnelle et activation de ses contrats attribués (passage direct au statut Actif)', allowed: true },
      { text: 'Recherche et consultation des supports disponibles dans le planning', allowed: true },
      { text: 'Importation de données : Accès à l\'outil d\'importation de fichiers CSV', allowed: true },
      { text: 'Envoi des relances préventives (J-30, préavis de reconduction tacite)', allowed: true },
      { text: 'Saisie des comptes rendus et suivi de l\'historique des actions commerciales', allowed: true },
      { text: 'Restrictions : Vue restreinte à son portefeuille (pas d\'affectation d\'équipe)', allowed: false },
      { text: 'Restrictions : Interdiction de suppression de contrats ou clients et pas d\'accès aux paramètres', allowed: false }
    ]
  },
  {
    id: 5,
    code: 'Lecture_Seule',
    nom: 'Lecture Seule',
    badgeColor: '#94a3b8',
    badgeBg: 'rgba(148, 163, 184, 0.15)',
    badgeBorder: 'rgba(148, 163, 184, 0.35)',
    summary: 'Consultation et export selon périmètre autorisé, sans modification.',
    permissions: [
      { text: 'Consultation passive des contrats, clients et inventaires selon le périmètre autorisé', allowed: true },
      { text: 'Importation de données : Accès à l\'outil d\'importation de fichiers CSV', allowed: true },
      { text: 'Exportations des données autorisées (Excel / CSV)', allowed: true },
      { text: 'Restrictions : Aucune création, modification, suppression ou relance possible', allowed: false },
      { text: 'Restrictions : Pas d\'accès aux paramètres globaux ni aux journaux confidentiels', allowed: false }
    ]
  }
];

/**
 * Récupère les métadonnées et la liste des droits d'un rôle donné
 */
export function getRoleGuide(roleOrId) {
  if (roleOrId === undefined || roleOrId === null) return ROLES_GUIDE[2]; // Default Commercial
  const norm = normalizeRole(roleOrId);
  const byCode = ROLES_GUIDE.find(r => r.code === norm);
  if (byCode) return byCode;
  const byId = ROLES_GUIDE.find(r => String(r.id) === String(roleOrId));
  if (byId) return byId;
  const byNom = ROLES_GUIDE.find(r => r.nom.toLowerCase() === String(roleOrId).toLowerCase());
  return byNom || ROLES_GUIDE[2];
}

