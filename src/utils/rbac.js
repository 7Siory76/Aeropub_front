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
    summary: 'Accès intégral et gouvernance complète du système.',
    permissions: [
      { text: 'Contrats & Abonnements : Création, duplication, modification et suppression', allowed: true },
      { text: 'Validation des renouvellements avec remise exceptionnelle', allowed: true },
      { text: 'Clients & Contacts : Création, modification, suppression et réassignation commerciale', allowed: true },
      { text: 'Alertes & Relances (J-30) : Envoi manuel et modification du modèle type de courriel', allowed: true },
      { text: 'Vision globale : Consultation de tous les contrats et export Excel / CSV', allowed: true },
      { text: 'Zone Réservée : Administration des utilisateurs, des paramètres et du Journal d\'Audit', allowed: true }
    ]
  },
  {
    id: 4,
    code: 'Resp_Com',
    nom: 'Responsable Commercial',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    summary: 'Supervision de l\'équipe commerciale et validation contractuelle.',
    permissions: [
      { text: 'Contrats & Abonnements : Création, duplication, modification et suppression', allowed: true },
      { text: 'Validation des renouvellements avec remise exceptionnelle', allowed: true },
      { text: 'Clients : Création, modification, suppression et réattribution du commercial attitré', allowed: true },
      { text: 'Alertes (J-30) : Envoi et suivi des relances manuelles', allowed: true },
      { text: 'Vision globale : Consultation de tous les contrats de l\'entreprise et export Excel', allowed: true },
      { text: 'Restrictions : Pas d\'accès à la configuration système ni aux utilisateurs', allowed: false }
    ]
  },
  {
    id: 2,
    code: 'Commercial',
    nom: 'Commercial',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeBorder: 'rgba(59, 130, 246, 0.35)',
    summary: 'Gestion opérationnelle de son propre portefeuille clients.',
    permissions: [
      { text: 'Contrats : Création, duplication et modification des dates et montants', allowed: true },
      { text: 'Clients : Création et modification de ses fiches clients', allowed: true },
      { text: 'Alertes (J-30) : Envoi des courriels de relance manuelle pour ses clients', allowed: true },
      { text: 'Portefeuille : Vue strictement restreinte à ses propres contrats et clients', allowed: true },
      { text: 'Restrictions : Interdiction de suppression de contrats ou de clients', allowed: false },
      { text: 'Restrictions : Pas de validation de remise exceptionnelle ni de réassignation', allowed: false }
    ]
  },
  {
    id: 3,
    code: 'Direction',
    nom: 'Direction',
    badgeColor: '#c084fc',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    summary: 'Supervision stratégique et arbitrage financier.',
    permissions: [
      { text: 'Contrats : Validation des renouvellements avec remise exceptionnelle', allowed: true },
      { text: 'Vision globale : Consultation de tous les contrats et clients de l\'entreprise', allowed: true },
      { text: 'Export : Exportation complète des tableaux en Excel / CSV', allowed: true },
      { text: 'Restrictions : Pas de suppression de contrats/clients ni d\'administration système', allowed: false }
    ]
  },
  {
    id: 5,
    code: 'Lecture_Seule',
    nom: 'Lecture Seule',
    badgeColor: '#94a3b8',
    badgeBg: 'rgba(148, 163, 184, 0.15)',
    badgeBorder: 'rgba(148, 163, 184, 0.35)',
    summary: 'Consultation passive et audit sans pouvoir de modification.',
    permissions: [
      { text: 'Consultation : Lecture de tous les contrats, supports et clients', allowed: true },
      { text: 'Export : Exportation des données en Excel / CSV', allowed: true },
      { text: 'Restrictions : Aucune création, modification ou suppression possible', allowed: false }
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

