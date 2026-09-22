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
