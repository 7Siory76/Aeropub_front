/**
 * Utilitaire de gestion des erreurs utilisateur et journalisation développeur
 * Traduit précisément les erreurs techniques et contraintes (doublons, références, conflits)
 * en messages explicites pour l'utilisateur sans masquer la cause réelle.
 */

/**
 * Traduit un message technique brut en message clair et précis pour l'utilisateur
 */
export function translateTechnicalMessage(rawMsg) {
  if (!rawMsg || typeof rawMsg !== 'string') return null;
  const lower = rawMsg.toLowerCase();

  // 1. Détection des doublons / clés uniques (ex: référence abonnement, support, email)
  const isDuplicate = 
    lower.includes('contrainte unique') || 
    lower.includes('unique constraint') || 
    lower.includes('clé dupliquée') || 
    lower.includes('cle dupliquee') || 
    lower.includes('duplicate key') ||
    lower.includes('already exists') ||
    lower.includes('23505');

  if (isDuplicate || lower.includes('existe déjà') || lower.includes('existe deja')) {
    if (lower.includes('abonnement') || lower.includes('abo') || lower.includes('contrat')) {
      return "La référence de ce contrat (abonnement) existe déjà. Veuillez utiliser ou générer une autre référence.";
    }
    if (lower.includes('support') || lower.includes('emplacement')) {
      return "La référence de ce support publicitaire existe déjà. Veuillez saisir une référence unique.";
    }
    if (lower.includes('email') || lower.includes('mail') || lower.includes('utilisateur')) {
      return "Cette adresse email est déjà utilisée par un autre compte utilisateur.";
    }
    if (lower.includes('client') || lower.includes('raison_sociale')) {
      return "Un client avec ce nom ou cette raison sociale existe déjà.";
    }
    return "Un enregistrement avec cet identifiant ou cette valeur existe déjà (doublon détecté).";
  }

  // 2. Détection des conflits de dates ou de réservation
  if (lower.includes('conflit') || lower.includes('déjà réservé') || lower.includes('deja reserve') || lower.includes("n'est pas disponible")) {
    return rawMsg; // Contient déjà les détails exacts du support et des dates
  }

  // 3. Détection des incohérences de dates
  if (lower.includes('date') && (lower.includes('antérieure') || lower.includes('postérieure') || lower.includes('échéance') || lower.includes('invalide'))) {
    return rawMsg;
  }

  // 4. Clés étrangères et éléments liés / impossibilité de suppression
  if (
    lower.includes('foreign key') || 
    lower.includes('clé étrangère') || 
    lower.includes('is still referenced') || 
    lower.includes('toujours référencé') ||
    lower.includes('23503')
  ) {
    if (lower.includes('client')) {
      return "Le client associé est introuvable ou ne peut pas être modifié car il possède des contrats actifs.";
    }
    if (lower.includes('commercial') || lower.includes('utilisateur')) {
      return "Le commercial ou l'utilisateur assigné est introuvable.";
    }
    if (lower.includes('support')) {
      return "Le support sélectionné est introuvable ou est encore lié à des contrats existants.";
    }
    return "Impossible d'effectuer cette opération : cet élément est actuellement lié à d'autres données du système.";
  }

  // 5. Champs obligatoires manquants
  if (lower.includes('obligatoire') || lower.includes('not-null') || lower.includes('null value in column') || lower.includes('23502')) {
    return rawMsg.includes('obligatoire') ? rawMsg : "Veuillez renseigner tous les champs obligatoires du formulaire.";
  }

  // 6. Droits et permissions
  if (lower.includes('déjà actif') || lower.includes('deja actif') || lower.includes('autorisation')) {
    return rawMsg;
  }

  // 7. Base de données inaccessible
  if (lower.includes('econnrefused') || lower.includes('connect refused')) {
    return "Connexion impossible au serveur de base de données PostgreSQL. Vérifiez que le service PostgreSQL est démarré.";
  }

  // Si c'est un message clair formulé par le backend (sans syntaxe SQL brute)
  if (
    !lower.includes('syntax error') &&
    !lower.includes('select ') &&
    !lower.includes('insert into') &&
    !lower.includes('update ') &&
    !lower.includes('delete from') &&
    !lower.includes('at ')
  ) {
    return rawMsg;
  }

  return null;
}

export function sanitizeUserError(err, fallback = "Une erreur est survenue lors de l'opération. Veuillez vérifier les données saisies.") {
  // 1. Journalisation technique complète dans les logs développeur (Console F12)
  console.error('[DEV LOG - Trace complète de l\'erreur technique] :', err);

  if (!err) return fallback;

  // Si c'est déjà une chaîne de caractères
  if (typeof err === 'string') {
    const translated = translateTechnicalMessage(err);
    return translated || err;
  }

  // 2. Erreur HTTP / Axios (réponse du serveur)
  if (err.response) {
    const status = err.response.status;
    const serverMsg = err.response.data?.message || err.response.data?.error;

    // Tentative de traduction précise du message renvoyé par le backend
    if (serverMsg) {
      const translated = translateTechnicalMessage(serverMsg);
      if (translated) {
        return translated;
      }
    }

    if (status === 401) {
      return "Identifiants invalides ou session expirée. Veuillez vous reconnecter.";
    }
    if (status === 403) {
      return "Action non autorisée pour votre profil utilisateur.";
    }
    if (status === 404) {
      return serverMsg || "La ressource demandée est introuvable ou a été supprimée.";
    }
    if (status === 409) {
      return serverMsg || "Un élément identique ou un doublon existe déjà.";
    }
    if (status >= 500) {
      // Si le serveur a fourni un message explicatif, on le priorise
      if (serverMsg && typeof serverMsg === 'string') {
        const translated = translateTechnicalMessage(serverMsg);
        if (translated) return translated;
      }
      return "Une difficulté technique est survenue sur le serveur. Veuillez vérifier les informations saisies ou réessayer.";
    }

    if (serverMsg && typeof serverMsg === 'string') {
      return serverMsg;
    }
  }

  // 3. Erreur réseau ou locale côté client
  if (err.message) {
    const lower = err.message.toLowerCase();
    if (lower.includes('network error') || lower.includes('failed to fetch')) {
      return "Connexion au serveur impossible. Vérifiez que le serveur back-end (port 5000) est bien démarré.";
    }
    if (lower.includes('timeout')) {
      return "Le délai de réponse du serveur a expiré.";
    }
    const translated = translateTechnicalMessage(err.message);
    if (translated) return translated;
  }

  return fallback;
}
