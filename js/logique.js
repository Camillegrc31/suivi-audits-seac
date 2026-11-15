// ============================================================
// js/logique.js — LOGIQUE PURE de l'application.
// Aucune dépendance au DOM ni au localStorage : ce fichier peut
// être testé dans le navigateur (tests.html) et avec Node (node --test).
// ============================================================

// Liste officielle des statuts possibles (utilisée pour la validation
// et pour construire les listes déroulantes).
export const STATUTS = ["à planifier", "planifié", "réalisé"];

// ------------------------------------------------------------
// Retard
// ------------------------------------------------------------
/**
 * Un audit est en retard si sa date prévue est dépassée ET que son
 * statut n'est pas "réalisé".
 * @param {Object} audit      Objet audit { site, datePrevue, statut, ... }
 * @param {string} dateDuJour Date du jour au format "AAAA-MM-JJ"
 * @returns {boolean}
 */
export function estEnRetard(audit, dateDuJour) {
  // Sans date prévue, pas de retard possible (cas "à planifier").
  if (audit.datePrevue === null || audit.datePrevue === undefined) {
    return false;
  }
  // Les chaînes "AAAA-MM-JJ" se comparent directement, sans conversion.
  const datePassee = audit.datePrevue < dateDuJour;
  const nonRealise = audit.statut !== "réalisé";
  return datePassee && nonRealise;
}

// ------------------------------------------------------------
// Filtres
// ------------------------------------------------------------
/**
 * Filtre la liste d'audits selon un site et un statut.
 * Une valeur "" (ou null) signifie "pas de filtre sur ce critère".
 * Les deux filtres se COMBINENT (ET logique).
 * @param {Array}  audits  Liste d'audits
 * @param {Object} filtres { site: string, statut: string }
 * @returns {Array} Nouvelle liste filtrée (l'originale n'est pas modifiée)
 */
export function filtrerAudits(audits, filtres) {
  return audits.filter(function (audit) {
    const siteOk = !filtres.site || audit.site === filtres.site;
    const statutOk = !filtres.statut || audit.statut === filtres.statut;
    return siteOk && statutOk;
  });
}

// ------------------------------------------------------------
// Validation du formulaire (ajout / modification)
// ------------------------------------------------------------
/**
 * Valide une saisie de formulaire avant enregistrement.
 * @param {Object} saisie { site, statut, datePrevue, auditeur, commentaire }
 *   (valeurs telles que lues dans le formulaire, donc des chaînes,
 *   la date pouvant être "" si non renseignée)
 * @returns {Object} { valide: boolean, erreurs: string[] }
 */
export function validerAudit(saisie) {
  const erreurs = [];

  // Le site est obligatoire.
  if (!saisie.site || saisie.site.trim() === "") {
    erreurs.push("Le site est obligatoire.");
  }

  // Le statut doit faire partie de la liste officielle.
  if (!STATUTS.includes(saisie.statut)) {
    erreurs.push("Le statut est invalide.");
  }

  // La date est obligatoire SAUF si le statut est "à planifier".
  if (saisie.statut !== "à planifier" && !saisie.datePrevue) {
    erreurs.push("La date prévue est obligatoire sauf pour un audit « à planifier ».");
  }

  // Si une date est fournie, elle doit être une vraie date "AAAA-MM-JJ".
  if (saisie.datePrevue && !estDateValide(saisie.datePrevue)) {
    erreurs.push("La date prévue est invalide.");
  }

  return { valide: erreurs.length === 0, erreurs: erreurs };
}

/**
 * Vérifie qu'une chaîne est une date valide au format "AAAA-MM-JJ".
 * (On vérifie aussi que le jour/mois existent : le 31/02 doit être refusé.)
 */
export function estDateValide(chaine) {
  const motif = /^(\d{4})-(\d{2})-(\d{2})$/;
  const resultat = motif.exec(chaine);
  if (!resultat) {
    return false;
  }
  const annee = Number(resultat[1]);
  const mois = Number(resultat[2]);
  const jour = Number(resultat[3]);
  if (mois < 1 || mois > 12) {
    return false;
  }
  const dateTest = new Date(annee, mois - 1, jour);
  // Date() normalise les jours inexistants (31/02 → 03/03) : on compare.
  return dateTest.getFullYear() === annee &&
         dateTest.getMonth() === mois - 1 &&
         dateTest.getDate() === jour;
}

// ------------------------------------------------------------
// Statistiques (bonus : tableau de bord)
// ------------------------------------------------------------
/**
 * Calcule les chiffres du tableau de bord.
 * @returns {Object} { total, parStatut: {…}, nbRetards, retardsParSite: [{site, retards}] }
 */
export function calculerStatistiques(audits, dateDuJour) {
  const parStatut = {};
  for (const statut of STATUTS) {
    parStatut[statut] = 0;
  }

  const retardsParSite = {}; // clé = site, valeur = nombre de retards

  for (const audit of audits) {
    parStatut[audit.statut] = parStatut[audit.statut] + 1;
    if (estEnRetard(audit, dateDuJour)) {
      retardsParSite[audit.site] = (retardsParSite[audit.site] || 0) + 1;
    }
  }

  // Conversion en tableau trié par nombre de retards décroissant.
  const retardsTries = Object.entries(retardsParSite)
    .map(function ([site, nb]) {
      return { site: site, retards: nb };
    })
    .sort(function (a, b) {
      return b.retards - a.retards;
    });

  return {
    total: audits.length,
    parStatut: parStatut,
    nbRetards: retardsTries.reduce(function (somme, r) { return somme + r.retards; }, 0),
    retardsParSite: retardsTries,
  };
}

// ------------------------------------------------------------
// Aides d'affichage (fonctions pures, testables)
// ------------------------------------------------------------
/**
 * Formate une date "AAAA-MM-JJ" en "JJ/MM/AAAA" (usage français).
 * Retourne "—" si la date est absente (audit "à planifier").
 */
export function formaterDate(iso) {
  if (!iso) {
    return "—";
  }
  const morceaux = iso.split("-");
  if (morceaux.length !== 3) {
    return iso; // format inattendu : on affiche la valeur brute
  }
  return morceaux[2] + "/" + morceaux[1] + "/" + morceaux[0];
}

/**
 * Construit une ligne CSV à partir de valeurs (séparateur ";", usage FR).
 * Les guillemets dans une valeur sont doublés, la valeur est entourée
 * de guillemets si elle contient un séparateur ou un guillemet.
 */
export function ligneCSV(valeurs) {
  return valeurs.map(function (valeur) {
    const texte = String(valeur ?? "");
    if (texte.includes(";") || texte.includes('"') || texte.includes("\n")) {
      return '"' + texte.replaceAll('"', '""') + '"';
    }
    return texte;
  }).join(";");
}
