// ============================================================
// js/donnees.js — Données fictives : sites et génération des audits.
// Les dates sont calculées RELATIVEMENT à la date du jour, pour que
// les retards restent visibles quel que soit le moment d'ouverture.
// ============================================================

// 10 sites fictifs (noms inventés mais plausibles en France ;
// aucune donnée réelle d'entreprise).
export const SITES = [
  "Usine de Roquefort",
  "Usine de Montbrison",
  "Usine de Châteauneuf",
  "Usine des Landes",
  "Usine de Valence",
  "Usine de Thiers",
  "Usine de Plabennec",
  "Usine de Montluçon",
  "Usine de Salins",
  "Usine de Vercors",
];

/**
 * Décale une date de N jours et renvoie le résultat en "AAAA-MM-JJ".
 * @param {string} dateDuJour Date de départ "AAAA-MM-JJ"
 * @param {number} nbJours    Décalage (négatif = dans le passé)
 */
export function decalerDate(dateDuJour, nbJours) {
  const date = new Date(dateDuJour + "T12:00:00"); // midi = évite les pièges d'heure d'été
  date.setDate(date.getDate() + nbJours);
  // toISOString() donne "AAAA-MM-JJT..." : on garde la partie date.
  return date.toISOString().slice(0, 10);
}

/**
 * Génère ~30 audits fictifs autour de la date du jour.
 * Composition volontaire :
 *  - des audits "réalisé" dans le passé (pas en retard),
 *  - des audits "planifié" à venir, dont UN prévu aujourd'hui,
 *  - des audits "planifié" déjà dépassés (en retard),
 *  - des audits "à planifier" sans date (cas limite).
 * La génération est déterministe (aucun hasard) : plus simple à
 * expliquer et à vérifier.
 * @param {string} dateDuJour "AAAA-MM-JJ"
 * @returns {Array<Object>} Liste d'audits
 */
export function genererAudits(dateDuJour) {
  // Description compacte de chaque audit fictif :
  // [indice du site, décalage en jours (null = sans date), statut, auditeur, commentaire]
  const descriptions = [
    // --- Réalisés (dates passées, jamais "en retard") ---
    [0, -52, "réalisé", "Karim B.", "Conforme, une remarque sur l'affichage des consignes."],
    [1, -47, "réalisé", "Sophie L.", "RAS."],
    [2, -41, "réalisé", "Marc D.", "Suivi du plan d'action à refaire en juin."],
    [3, -38, "réalisé", null, "Audit de mise en place, tout est en ordre."],
    [4, -33, "réalisé", "Karim B.", ""],
    [5, -27, "réalisé", "Sophie L.", "Deux écarts mineurs, refermés sur place."],
    [6, -19, "réalisé", "Marc D.", "RAS."],
    [7, -12, "réalisé", null, ""],

    // --- Planifiés à venir (pas de retard) ---
    [8, 0, "planifié", "Karim B.", "Audit prévu aujourd'hui."],        // cas limite : aujourd'hui
    [9, 3, "planifié", "Sophie L.", ""],
    [0, 7, "planifié", "Marc D.", "Préparer les registres 2026."],
    [1, 14, "planifié", null, ""],
    [2, 21, "planifié", "Karim B.", "Avec le responsable qualité."],
    [3, 30, "planifié", "Sophie L.", ""],
    [4, 45, "planifié", "Marc D.", "Audit annuel complet."],

    // --- Planifiés DÉJÀ DÉPASSÉS (en retard) ---
    [5, -21, "planifié", "Karim B.", "Reporté deux fois, à reprogrammer."],
    [6, -14, "planifié", null, ""],
    [7, -10, "planifié", "Sophie L.", "En attente de confirmation du site."],
    [8, -5, "planifié", "Marc D.", ""],
    [9, -2, "planifié", "Karim B.", "Retard lié au départ de l'auditeur."],

    // --- À planifier (sans date, jamais "en retard") ---
    [0, null, "à planifier", null, "Nouveau site, audit initial à organiser."], // cas limite
    [1, null, "à planifier", "Sophie L.", ""],
    [2, null, "à planifier", null, ""],
    [3, null, "à planifier", "Marc D.", "À planifier après l'inventaire."],
    [4, null, "à planifier", null, ""],
    [5, null, "à planifier", "Karim B.", ""],
    [6, null, "à planifier", null, "Demande du directeur de site."],
    [7, null, "à planifier", null, ""],
    [9, null, "à planifier", "Sophie L.", ""],
  ];

  let compteur = 0;
  return descriptions.map(function (desc) {
    compteur = compteur + 1;
    const [indiceSite, decalage, statut, auditeur, commentaire] = desc;
    return {
      id: "audit-" + compteur,
      site: SITES[indiceSite],
      // null = pas de date prévue (audit "à planifier")
      datePrevue: decalage === null ? null : decalerDate(dateDuJour, decalage),
      statut: statut,
      auditeur: auditeur,
      commentaire: commentaire,
    };
  });
}
