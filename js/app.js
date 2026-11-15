// ============================================================
// js/app.js — AFFICHAGE et interactions.
// Ce fichier relie la logique pure (logique.js), les données
// (donnees.js) et le stockage (stockage.js) à la page HTML.
// ============================================================

import { SITES, genererAudits } from "./donnees.js";
import { chargerAudits, sauvegarderAudits } from "./stockage.js";
import {
  estEnRetard,
  filtrerAudits,
  formaterDate,
  validerAudit,
} from "./logique.js";

// ------------------------------------------------------------
// État de l'application
// ------------------------------------------------------------
let audits = [];               // liste complète, jamais filtrée
const filtres = { site: "", statut: "" };

// ------------------------------------------------------------
// Aides
// ------------------------------------------------------------

/** Date du jour locale au format "AAAA-MM-JJ".
    (Attention : toISOString() donne la date UTC, qui peut être décalée
    d'un jour en France le soir — on construit la date à la main.) */
function dateDuJourISO() {
  const aujourdHui = new Date();
  const mois = String(aujourdHui.getMonth() + 1).padStart(2, "0");
  const jour = String(aujourdHui.getDate()).padStart(2, "0");
  return aujourdHui.getFullYear() + "-" + mois + "-" + jour;
}

/** Raccourci pour récupérer un élément par son id. */
const el = (id) => document.getElementById(id);

/** Crée un badge de statut (la couleur ne porte jamais l'info seule :
    le libellé texte est toujours présent). */
function creerBadgeStatut(statut) {
  const badge = document.createElement("span");
  // La classe CSS ne doit pas contenir d'accent ni d'espace :
  // "à planifier" → "a-planifier".
  const sansAccents = statut.normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "");
  badge.className = "badge badge--" + sansAccents.replaceAll(" ", "-");
  badge.textContent = statut.charAt(0).toUpperCase() + statut.slice(1);
  return badge;
}

// ------------------------------------------------------------
// Rendu
// ------------------------------------------------------------

/** Affiche le compteur d'audits en retard sous l'en-tête. */
function afficherCompteurRetards(dateDuJour) {
  const nbRetards = audits.filter((a) => estEnRetard(a, dateDuJour)).length;
  const bandeau = el("compteur-retards");

  if (nbRetards === 0) {
    bandeau.textContent = "✔ Aucun audit en retard";
    bandeau.classList.add("bandeau-retards--ok");
    bandeau.classList.remove("bandeau-retards--alerte");
  } else {
    bandeau.textContent = "⚠ " + nbRetards + " audit" + (nbRetards > 1 ? "s" : "") +
      " en retard — date prévue dépassée et pas encore réalisé" + (nbRetards > 1 ? "s" : "");
    bandeau.classList.add("bandeau-retards--alerte");
    bandeau.classList.remove("bandeau-retards--ok");
  }
}

/** Construit et affiche la liste des audits selon les filtres courants. */
function afficherListe(dateDuJour) {
  const corps = el("corps-tableau");
  const auditsFiltres = filtrerAudits(audits, filtres);

  corps.replaceChildren(); // vide le tableau avant de le reconstruire

  for (const audit of auditsFiltres) {
    const retard = estEnRetard(audit, dateDuJour);

    const ligne = document.createElement("tr");
    if (retard) {
      ligne.className = "ligne-retard";
    }

    // Cellule site
    const celluleSite = document.createElement("td");
    celluleSite.textContent = audit.site;
    ligne.appendChild(celluleSite);

    // Cellule date (format JJ/MM/AAAA, "—" si absente)
    const celluleDate = document.createElement("td");
    if (retard) {
      celluleDate.appendChild(document.createTextNode(formaterDate(audit.datePrevue) + " "));
      celluleDate.appendChild(creerBadgeRetard());
    } else {
      celluleDate.textContent = formaterDate(audit.datePrevue);
      if (audit.datePrevue === null) {
        celluleDate.classList.add("date-vide");
      }
    }
    ligne.appendChild(celluleDate);

    // Cellule statut (badge avec libellé texte)
    const celluleStatut = document.createElement("td");
    celluleStatut.appendChild(creerBadgeStatut(audit.statut));
    ligne.appendChild(celluleStatut);

    // Cellule auditeur
    const celluleAuditeur = document.createElement("td");
    celluleAuditeur.textContent = audit.auditeur ?? "—";
    ligne.appendChild(celluleAuditeur);

    // Cellule commentaire
    const celluleCommentaire = document.createElement("td");
    celluleCommentaire.textContent = audit.commentaire ?? "";
    ligne.appendChild(celluleCommentaire);

    // Cellule actions : bouton "Modifier" (le formulaire est pré-rempli à l'étape 4)
    const celluleActions = document.createElement("td");
    const boutonModifier = document.createElement("button");
    boutonModifier.type = "button";
    boutonModifier.className = "bouton";
    boutonModifier.textContent = "Modifier";
    boutonModifier.dataset.id = audit.id; // lien bouton ↔ audit
    celluleActions.appendChild(boutonModifier);
    ligne.appendChild(celluleActions);

    corps.appendChild(ligne);
  }

  // Message affiché si les filtres ne renvoient rien
  el("message-vide").hidden = auditsFiltres.length > 0;
}

/** Badge "⚠ En retard" (texte + couleur). */
function creerBadgeRetard() {
  const badge = document.createElement("span");
  badge.className = "badge badge--retard";
  badge.textContent = "⚠ En retard";
  return badge;
}

/** Remplit le menu "Site" des filtres avec les sites réellement
    présents dans les audits (gère un site ajouté par l'utilisateur). */
function remplirSelecteurSites() {
  const select = el("filtre-site");
  const sites = [...new Set(audits.map((a) => a.site))].sort();

  select.replaceChildren();
  select.appendChild(new Option("Tous les sites", ""));
  for (const site of sites) {
    select.appendChild(new Option(site, site));
  }
}

/** Recalcule tout ce qui est affiché. */
function rafraichirAffichage() {
  const dateDuJour = dateDuJourISO();
  afficherCompteurRetards(dateDuJour);
  afficherListe(dateDuJour);
}

// ------------------------------------------------------------
// Formulaire d'ajout / modification
// ------------------------------------------------------------
// auditEnCours = id de l'audit en modification, null en mode ajout.
let auditEnCours = null;

/** Id unique simple pour un nouvel audit (sans dépendance). */
function nouvelId() {
  return "audit-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000);
}

/** La date n'est obligatoire que si le statut n'est pas "à planifier" :
    on met à jour l'attribut required pour aider aussi la saisie clavier. */
function majChampDateObligatoire() {
  el("champ-date").required = el("champ-statut").value !== "à planifier";
}

/** Ouvre le formulaire vide (mode "Ajouter"). */
function ouvrirFormulaireAjout() {
  auditEnCours = null;
  el("titre-dialogue").textContent = "Ajouter un audit";
  el("formulaire-audit").reset();
  majChampDateObligatoire();
  el("erreur-formulaire").hidden = true;
  el("dialogue-audit").showModal();
}

/** Ouvre le formulaire pré-rempli avec l'audit à modifier. */
function ouvrirFormulaireModification(id) {
  const audit = audits.find((a) => a.id === id);
  if (!audit) {
    return;
  }
  auditEnCours = audit.id;
  el("titre-dialogue").textContent = "Modifier l'audit — " + audit.site;
  el("champ-site").value = audit.site;
  el("champ-statut").value = audit.statut;
  el("champ-date").value = audit.datePrevue ?? "";
  el("champ-auditeur").value = audit.auditeur ?? "";
  el("champ-commentaire").value = audit.commentaire ?? "";
  majChampDateObligatoire();
  el("erreur-formulaire").hidden = true;
  el("dialogue-audit").showModal();
}

/** Soumission du formulaire : valider, puis créer ou mettre à jour. */
function enregistrerFormulaire(evenement) {
  evenement.preventDefault(); // on gère nous-mêmes l'enregistrement

  const saisie = {
    site: el("champ-site").value,
    statut: el("champ-statut").value,
    datePrevue: el("champ-date").value,
    auditeur: el("champ-auditeur").value.trim(),
    commentaire: el("champ-commentaire").value.trim(),
  };

  // 1) Validation (fonction pure, testée dans tests.html / Node)
  const verdict = validerAudit(saisie);
  const zoneErreur = el("erreur-formulaire");
  if (!verdict.valide) {
    zoneErreur.textContent = verdict.erreurs.join(" ");
    zoneErreur.hidden = false;
    return;
  }

  // 2) Création ou mise à jour
  if (auditEnCours === null) {
    audits.push({
      id: nouvelId(),
      site: saisie.site.trim(),
      datePrevue: saisie.datePrevue === "" ? null : saisie.datePrevue,
      statut: saisie.statut,
      auditeur: saisie.auditeur === "" ? null : saisie.auditeur,
      commentaire: saisie.commentaire === "" ? null : saisie.commentaire,
    });
  } else {
    const audit = audits.find((a) => a.id === auditEnCours);
    audit.site = saisie.site.trim();
    audit.datePrevue = saisie.datePrevue === "" ? null : saisie.datePrevue;
    audit.statut = saisie.statut;
    audit.auditeur = saisie.auditeur === "" ? null : saisie.auditeur;
    audit.commentaire = saisie.commentaire === "" ? null : saisie.commentaire;
  }

  // 3) Sauvegarde : si le stockage refuse, on reste dans le formulaire
  if (!sauvegarderAudits(audits)) {
    zoneErreur.textContent = "Enregistrement impossible (stockage du navigateur indisponible).";
    zoneErreur.hidden = false;
    return;
  }

  // 4) Fermeture et rafraîchissement de tout l'affichage
  el("dialogue-audit").close();
  remplirSelecteurSites(); // un nouveau site peut avoir été saisi
  rafraichirAffichage();
}

// ------------------------------------------------------------
// Démarrage
// ------------------------------------------------------------
function demarrer() {
  const chargement = chargerAudits(() => genererAudits(dateDuJourISO()));
  audits = chargement.audits;

  // Si le localStorage était corrompu, on repart des données par défaut
  // et on le dit, pour ne pas perdre l'utilisateur.
  if (chargement.reinitialise) {
    const bandeau = el("compteur-retards");
    bandeau.textContent = "Données locales illisibles : jeu de démonstration rechargé.";
  }

  remplirSelecteurSites();

  // Filtres : un changement → on met à jour l'état puis l'affichage
  el("filtre-site").addEventListener("change", (evenement) => {
    filtres.site = evenement.target.value;
    afficherListe(dateDuJourISO());
  });
  el("filtre-statut").addEventListener("change", (evenement) => {
    filtres.statut = evenement.target.value;
    afficherListe(dateDuJourISO());
  });
  el("btn-reinitialiser").addEventListener("click", () => {
    filtres.site = "";
    filtres.statut = "";
    el("filtre-site").value = "";
    el("filtre-statut").value = "";
    afficherListe(dateDuJourISO());
  });

  // ----- Formulaire d'ajout / modification -----
  el("btn-ajouter").addEventListener("click", ouvrirFormulaireAjout);
  el("btn-annuler").addEventListener("click", () => el("dialogue-audit").close());
  el("formulaire-audit").addEventListener("submit", enregistrerFormulaire);
  el("champ-statut").addEventListener("change", majChampDateObligatoire);

  // Les boutons "Modifier" sont créés dynamiquement : on écoute le
  // tableau lui-même (délégation d'événement) plutôt que chaque bouton.
  el("corps-tableau").addEventListener("click", (evenement) => {
    const bouton = evenement.target.closest("button");
    if (bouton && bouton.dataset.id) {
      ouvrirFormulaireModification(bouton.dataset.id);
    }
  });

  rafraichirAffichage();
}

demarrer();
