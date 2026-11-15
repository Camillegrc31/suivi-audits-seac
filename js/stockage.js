// ============================================================
// js/stockage.js — Lecture / écriture des audits dans localStorage.
// L'application n'a pas de back-end : le jeu de départ est généré
// au premier chargement, puis les modifications sont enregistrées
// dans le navigateur.
// ============================================================

import { STATUTS } from "./logique.js";

// Clé versionnée : si le format des données évolue un jour,
// on changera de clé plutôt que de casser l'ancienne.
export const CLE_STOCKAGE = "suivi-audits-seac-v1";

/**
 * Charge les audits depuis le localStorage.
 * @param {Function} genererDefaut Fonction qui renvoie le jeu de données
 *        par défaut (appelée si le stockage est vide ou corrompu).
 * @returns {Object} { audits: Array, reinitialise: boolean }
 *        reinitialise = true si on a dû repartir des données par défaut
 *        (pour que l'interface puisse afficher un petit message).
 */
export function chargerAudits(genererDefaut) {
  let brut = null;
  try {
    brut = localStorage.getItem(CLE_STOCKAGE);
  } catch (erreur) {
    // localStorage peut être indisponible (navigation privée stricte…) :
    // on continue avec les données par défaut, sans planter.
    return { audits: genererDefaut(), reinitialise: true };
  }

  if (brut === null) {
    // Premier chargement : on génère et on sauvegarde.
    const audits = genererDefaut();
    sauvegarderAudits(audits);
    return { audits: audits, reinitialise: false };
  }

  let donnees = null;
  try {
    donnees = JSON.parse(brut);
  } catch (erreur) {
    // JSON corrompu : on repart du jeu par défaut.
    return { audits: genererDefaut(), reinitialise: true };
  }

  if (auditsValides(donnees)) {
    return { audits: donnees, reinitialise: false };
  }
  // Structure inattendue (données modifiées à la main…) : données par défaut.
  return { audits: genererDefaut(), reinitialise: true };
}

/**
 * Enregistre la liste des audits.
 * @returns {boolean} true si l'enregistrement a réussi.
 */
export function sauvegarderAudits(audits) {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(audits));
    return true;
  } catch (erreur) {
    // Stockage plein ou indisponible : on prévient sans planter l'app.
    return false;
  }
}

/**
 * Vérifie que les données ressemblent à une liste d'audits correcte.
 * Contrôle volontairement léger : id/site/statut valides, date correcte.
 */
export function auditsValides(donnees) {
  if (!Array.isArray(donnees)) {
    return false;
  }
  return donnees.every(function (audit) {
    if (typeof audit !== "object" || audit === null) {
      return false;
    }
    const idOk = typeof audit.id === "string" && audit.id !== "";
    const siteOk = typeof audit.site === "string" && audit.site !== "";
    const statutOk = STATUTS.includes(audit.statut);
    const dateOk = audit.datePrevue === null ||
                   (typeof audit.datePrevue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(audit.datePrevue));
    return idOk && siteOk && statutOk && dateOk;
  });
}
