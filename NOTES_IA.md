# NOTES_IA.md — notes brutes sur le travail fait avec l'IA

> Notes honnêtes, prises au fil des étapes. Le journal d'usage de l'IA demandé
> par SEAC (format : outil / ce que j'ai demandé / ce que ça a apporté / ce que
> j'ai vérifié / ce que je n'ai pas délégué) est à rédiger à la main à partir
> de ces notes.

## Étape 1 — Lecture du sujet, squelette, charte

- L'IA a extrait le texte du PDF (l'outil ne lisait pas le PDF directement ;
  extraction avec pypdf déjà présent sur la machine, en lecture seule) et a
  proposé un plan + modèle de données validés avant de coder.
- Squelette HTML/CSS généré : charte complète en variables `:root`.
- Hypothèses posées par l'IA (et signalées comme telles) : couleurs
  approximées depuis les captures du site SEAC (vert #009640, jaune #FFE600),
  police = pile système. À vérifier : contraste exact des badges avec un
  outil WCAG une fois les couleurs validées à l'œil.
- Ce que je n'ai pas laissé faire : aucune fonctionnalité hors sujet, aucune
  dépendance.

## Étape 2 — Logique pure, données fictives, tests

- L'IA a écrit logique.js / donnees.js / stockage.js et les deux lanceurs de
  tests (24 cas).
- Correction faite après relecture : dans tests.html, un test sur la
  bissextile était faux (2026 annoncé bissextile) ; corrigé en 2024/2026
  avant le commit — preuve qu'il faut relire, y compris les tests.
- Vérifications réellement exécutées : `node --test tests/logique.test.js`
  → 24/24 pass ; script ponctuel (fichier temporaire en dehors du projet)
  sur genererAudits → 29 audits, 10 sites, 5 retards, 9 sans date, 1 prévu
  aujourd'hui, répartition des statuts cohérente.
- Incertain : tests.html n'a PAS pu être ouvert par l'IA (pas de navigateur
  sous la main) — les 24 cas y sont identiques à ceux de Node, mais l'écran
  est à vérifier manuellement.

## Étape 3 — Liste, filtres, compteur de retards

- L'IA a écrit le rendu du tableau (createElement, pas innerHTML — anti-XSS
  par construction) et les filtres branchés sur la fonction pure.
- Choix à pouvoir justifier : le sélecteur de sites est reconstruit depuis
  les audits réels (`new Set`) plutôt que depuis la liste SITES, pour qu'un
  site saisi dans le formulaire apparaisse dans les filtres.
- Vérifications réellement exécutées : `node --check` sur les 4 modules JS
  (syntaxe). Non vérifiable par l'IA : le rendu visuel dans le navigateur.

## Étape 4 — Formulaire d'ajout / modification

- L'IA a écrit la modale partagée ajout/modification (un seul formulaire,
  pré-rempli en modification), la validation via la fonction pure, et la
  délégation d'événement pour les boutons « Modifier ».
- Petite erreur de manipulation pendant l'édition (ancrage de remplacement
  ambigu dans app.js) : relue et corrigée immédiatement — rien de cassé.
- Décisions à pouvoir expliquer : id généré par Date.now + aléa (pas de
  dépendance) ; `required` du champ date piloté par le statut (aide clavier),
  la vraie validation restant dans validerAudit ; échec d'écriture du
  stockage → la modale reste ouverte avec un message.
- Vérifications : node --check OK, tests Node 24/24 relancés.

## Étape 5 — Bonus : tableau de bord + export CSV

- L'IA a réutilisé calculerStatistiques (déjà testée à l'étape 2) pour le
  tableau de bord, et ligneCSV pour l'export. Rien de nouveau à tester côté
  logique pure.
- Points à pouvoir expliquer : BOM U+FEFF pour Excel/UTF-8 ; séparateur « ; »
  (Excel FR) ; l'export suit les filtres actifs ; revokeObjectURL pour
  libérer le blob.
- Non vérifié (pas de navigateur) : l'affichage du tableau de bord et le
  téléchargement réel du CSV.

## Après livraison — vérification réelle dans le navigateur

- Premier test réel de l'app (navigateur intégré + `python -m http.server`) :
  zéro erreur console, compteur « ⚠ 5 audits en retard », filtres peuplés,
  tableau de bord correct (29/9/12/8, 5 retards, liste par site), bouton
  d'export visible. Capture d'écran faite.
- Découverte importante : l'app NE fonctionne PAS en double-clic sur
  index.html — les modules ES sont bloqués par CORS en `file://`
  (restriction standard des navigateurs, pas un bug). Le README disait à tort
  que le double-clic suffit : corrigé (lancement = serveur statique, GitHub
  Pages, ou Live Server). Choix conservé : on garde les modules ES.
- Testé par moi : rendu visuel et console sur serveur. À tester par le
  candidat : interactions (filtres, formulaire, export CSV), responsive,
  contrastes.

## Étape 6 — Finitions et documentation- Retraits : import SITES devenu inutile dans app.js ; ajout de
  aria-labelledby sur la modale.
- Documentation finale : EXPLICATIONS.md (visite guidée + 4 scénarios de
  petite modification), TESTS.md (24 cas + 12 vérifications manuelles),
  README, NOTES_IA.
- Vérification finale réellement exécutée : tests Node 24/24, node --check
  sur tous les modules, historique Git propre (1 commit par étape).
- Ce qui reste à vérifier à la main (par toi, dans un navigateur) : rendu
  visuel, responsive, navigation clavier, export CSV, contraste des couleurs
  à l'œil, et l'affichage de tests.html.
