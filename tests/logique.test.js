// ============================================================
// tests/logique.test.js — Mêmes tests que tests.html, mais pour
// Node.js. Lancement :  node --test tests/logique.test.js
// Les deux lanceurs testent le même module : js/logique.js.
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";
import {
  STATUTS,
  estEnRetard,
  filtrerAudits,
  validerAudit,
  estDateValide,
  calculerStatistiques,
  formaterDate,
  ligneCSV,
} from "../js/logique.js";

// ---------- Jeu d'audits de test partagé (date fixe 2026-06-15) ----------
const JOUR = "2026-06-15";

const audit = (surcharge) => ({
  id: "t1", site: "Usine A", datePrevue: null, statut: "planifié",
  auditeur: null, commentaire: "", ...surcharge,
});

const listeTest = [
  audit({ id: "1", site: "Usine A", datePrevue: "2026-06-10", statut: "planifié" }), // en retard
  audit({ id: "2", site: "Usine A", datePrevue: "2026-06-10", statut: "réalisé" }),  // réalisé
  audit({ id: "3", site: "Usine B", datePrevue: "2026-06-15", statut: "planifié" }), // aujourd'hui
  audit({ id: "4", site: "Usine B", datePrevue: "2026-07-01", statut: "planifié" }), // à venir
  audit({ id: "5", site: "Usine C", datePrevue: null, statut: "à planifier" }),      // sans date
];

// ---------- estEnRetard ----------
test("estEnRetard : date passée + non réalisé = retard", () => {
  assert.equal(estEnRetard(audit({ datePrevue: "2026-06-14", statut: "planifié" }), JOUR), true);
});

test("estEnRetard : date passée mais réalisé = pas de retard", () => {
  assert.equal(estEnRetard(audit({ datePrevue: "2026-06-14", statut: "réalisé" }), JOUR), false);
});

test("estEnRetard : date prévue aujourd'hui = pas de retard", () => {
  assert.equal(estEnRetard(audit({ datePrevue: JOUR, statut: "planifié" }), JOUR), false);
});

test("estEnRetard : sans date = pas de retard", () => {
  assert.equal(estEnRetard(audit({ datePrevue: null, statut: "à planifier" }), JOUR), false);
});

test("estEnRetard : date à venir = pas de retard", () => {
  assert.equal(estEnRetard(audit({ datePrevue: "2026-07-01", statut: "planifié" }), JOUR), false);
});

// ---------- filtrerAudits ----------
test("filtrerAudits : sans filtre, tout est renvoyé", () => {
  assert.equal(filtrerAudits(listeTest, { site: "", statut: "" }).length, 5);
});

test("filtrerAudits : filtre par site seul", () => {
  assert.deepEqual(
    filtrerAudits(listeTest, { site: "Usine A", statut: "" }).map((a) => a.id),
    ["1", "2"],
  );
});

test("filtrerAudits : filtre par statut seul", () => {
  assert.equal(filtrerAudits(listeTest, { site: "", statut: "planifié" }).length, 3);
});

test("filtrerAudits : filtres combinés (ET logique)", () => {
  assert.deepEqual(
    filtrerAudits(listeTest, { site: "Usine A", statut: "planifié" }).map((a) => a.id),
    ["1"],
  );
});

test("filtrerAudits : filtre sans résultat", () => {
  assert.equal(filtrerAudits(listeTest, { site: "Usine X", statut: "" }).length, 0);
});

test("filtrerAudits : la liste originale n'est pas modifiée", () => {
  filtrerAudits(listeTest, { site: "Usine A", statut: "planifié" });
  assert.equal(listeTest.length, 5);
});

// ---------- validerAudit ----------
test("validerAudit : saisie complète valide", () => {
  assert.equal(
    validerAudit({ site: "Usine A", statut: "planifié", datePrevue: "2026-07-01" }).valide,
    true,
  );
});

test("validerAudit : site manquant", () => {
  assert.equal(
    validerAudit({ site: "   ", statut: "planifié", datePrevue: "2026-07-01" }).valide,
    false,
  );
});

test("validerAudit : statut inconnu", () => {
  assert.equal(
    validerAudit({ site: "Usine A", statut: "fait", datePrevue: "2026-07-01" }).valide,
    false,
  );
});

test("validerAudit : date obligatoire sauf si à planifier", () => {
  assert.equal(
    validerAudit({ site: "Usine A", statut: "planifié", datePrevue: "" }).valide,
    false,
  );
});

test("validerAudit : à planifier sans date = valide", () => {
  assert.equal(
    validerAudit({ site: "Usine A", statut: "à planifier", datePrevue: "" }).valide,
    true,
  );
});

test("validerAudit : date invalide (31 février)", () => {
  assert.equal(
    validerAudit({ site: "Usine A", statut: "planifié", datePrevue: "2026-02-31" }).valide,
    false,
  );
});

test("validerAudit : format de date incorrect", () => {
  assert.equal(
    validerAudit({ site: "Usine A", statut: "planifié", datePrevue: "15/06/2026" }).valide,
    false,
  );
});

test("estDateValide : années bissextiles", () => {
  assert.equal(estDateValide("2026-02-29"), false); // 2026 n'est pas bissextile
  assert.equal(estDateValide("2024-02-29"), true);  // 2024 l'est
});

// ---------- calculerStatistiques ----------
test("calculerStatistiques : totaux et par statut", () => {
  const stats = calculerStatistiques(listeTest, JOUR);
  assert.equal(stats.total, 5);
  assert.equal(stats.parStatut["planifié"], 3);
  assert.equal(stats.parStatut["réalisé"], 1);
  assert.equal(stats.parStatut["à planifier"], 1);
});

test("calculerStatistiques : retards comptés et groupés par site", () => {
  const stats = calculerStatistiques(listeTest, JOUR);
  assert.equal(stats.nbRetards, 1);
  assert.deepEqual(stats.retardsParSite, [{ site: "Usine A", retards: 1 }]);
});

// ---------- Aides d'affichage ----------
test("formaterDate : JJ/MM/AAAA et tiret si absente", () => {
  assert.equal(formaterDate("2026-06-15"), "15/06/2026");
  assert.equal(formaterDate(null), "—");
});

test("ligneCSV : échappement des séparateurs et guillemets", () => {
  assert.equal(ligneCSV(["a", 'b;c"d']), 'a;"b;c""d"');
});

test("STATUTS : la liste des statuts est complète", () => {
  assert.deepEqual(STATUTS, ["à planifier", "planifié", "réalisé"]);
});
