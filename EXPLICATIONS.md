# EXPLICATIONS.md — visite guidée du code

Ce document explique chaque fichier et chaque fonction importante, en langage
simple, pour que tu puisses présenter le code à l'oral. Lis-le dans l'ordre :
le sens de lecture suit les dépendances entre fichiers.

```
index.html            → ce que voit l'utilisateur
css/style.css         → l'habillage
js/donnees.js         → d'où viennent les données
js/stockage.js        → comment elles sont conservées
js/logique.js         → les règles (pur, testable)
js/app.js             → la colle : affichage + interactions
```

---

## Le principe général (à dire en premier à l'oral)

L'application n'a **pas de serveur**. Au premier chargement, un jeu de données
fictif est **généré à partir de la date du jour**, puis stocké dans le
`localStorage` du navigateur. Ensuite, chaque modification (ajout, édition) est
enregistrée dans ce stockage. À chaque rechargement, l'app relit le stockage ;
s'il est vide ou corrompu, elle repart du jeu généré et l'affiche.

L'important pour la qualité du code : **la logique (les règles) est séparée de
l'affichage**. Le fichier `logique.js` ne touche ni à la page ni au stockage,
c'est pourquoi il est testable dans `tests.html` et avec Node.

---

## index.html

Structure de la page, sans logique :

- `<header class="entete">` : logo SEAC (fichier local `assets/logo-seac.svg`)
  et titre.
- `#compteur-retards` : bandeau texte mis à jour par JS, avec `role="status"`
  pour que les lecteurs d'écran le annoncent quand il change.
- `.filtres` : deux `<select>` (site, statut) + bouton « Réinitialiser » +
  bouton « + Ajouter un audit ».
- `#tableau-audits > tbody#corps-tableau` : le tableau ; ses lignes sont
  construites par JS.
- `#tableau-de-bord` et `#btn-export` : le bonus, cachés (`hidden`) au départ,
  affichés par JS.
- `<dialog id="dialogue-audit">` : la fenêtre du formulaire. C'est un élément
  standard du navigateur : `showModal()` l'ouvre au-dessus de la page (fond
  assombri), la touche Échap la ferme, le focus y est piégé — sans écrire de
  code pour ça.
- `<script type="module" src="js/app.js">` : point d'entrée. `type="module"`
  active les `import`/`export` entre fichiers.

---

## css/style.css

Tout ce qui définit l'identité visuelle est **en haut du fichier, dans
`:root`**, sous forme de variables. Pour changer la charte (couleurs, police,
rayons, espacements), on ne modifie **que ces variables**.

- `--couleur-primaire: #009640` et `--couleur-primaire-texte: #00713A` :
  deux verts. Le premier est le vert « logo » (bordures), le second est
  **plus foncé pour que le texte et les boutons restent lisibles** (un vert
  vif avec du texte blanc passerait mal en contraste WCAG).
- `--couleur-accent: #FFE600` : le jaune du bouton « NOS PRODUITS » du site.
- Couleurs de statut : chacune est un **fond très clair + un texte foncé de la
  même teinte** (ex. fond `#E3EEFB`, texte `#1A4F8B` pour « planifié »). Ce
  choix garantit le contraste WCAG AA sans calcul compliqué.
- Retard : `--couleur-retard-*` (fond, texte, bordure) + `--couleur-retard-ligne`
  pour le fond léger de la ligne du tableau.
- Police : **pile système** (`system-ui, "Segoe UI", …`) — hypothèse assumée,
  aucune police externe n'est chargée.
- `.badge` : les badges affichent **toujours un texte** (« Planifié », « ⚠ En
  retard ») : l'information ne repose jamais sur la couleur seule.
- `tr.ligne-retard` : fond rouge très pâle + barre rouge à gauche.
- `.tableau-scroll { overflow-x: auto }` : sur téléphone, le tableau défile
  horizontalement au lieu de casser la mise en page.

---

## js/donnees.js — les données fictives

- `SITES` : tableau des **10 sites fictifs** (noms inventés, aucune donnée réelle).
- `decalerDate(dateDuJour, nbJours)` : renvoie la date décalée de N jours au
  format `AAAA-MM-JJ`. Astuce à pouvoir expliquer : on construit
  `new Date(dateDuJour + "T12:00:00")` — **midi** pour éviter les décalages
  dus aux changements d'heure été/hiver ; puis `toISOString().slice(0, 10)`
  pour récupérer la partie date.
- `genererAudits(dateDuJour)` : construit 29 audits à partir d'une liste
  **figée** de descriptions `[indice site, décalage, statut, auditeur,
  commentaire]`. La composition couvre tous les cas du sujet :
  - 8 « réalisé » dans le passé (jamais en retard),
  - 7 « planifié » à venir, **dont un prévu aujourd'hui**,
  - 5 « planifié » déjà dépassés → **en retard**,
  - 9 « à planifier » sans date (cas limite : pas de date du tout).
  La génération est **déterministe** (pas de hasard) : plus facile à
  expliquer et à vérifier.

---

## js/stockage.js — la persistance

- `CLE_STOCKAGE = "suivi-audits-seac-v1"` : clé **versionnée** — si le format
  des données changeait, on changerait de clé au lieu de casser l'ancienne.
- `chargerAudits(genererDefaut)` : lit la clé ; renvoie
  `{ audits, reinitialise }` où `reinitialise` vaut `true` si l'app a dû
  repartir des données par défaut. Trois cas gérés :
  1. clé absente → génère le jeu par défaut et le sauvegarde ;
  2. contenu illisible (`JSON.parse` échoue) → jeu par défaut ;
  3. contenu lisible mais structure fausse → jeu par défaut.
  `localStorage.getItem` lui-même est aussi dans un `try/catch` (le stockage
  peut être désactivé, ex. navigation privée stricte).
- `sauvegarderAudits(audits)` : `JSON.stringify` + `setItem`, renvoie
  `true/false` pour que l'interface puisse prévenir si l'écriture échoue.
- `auditsValides(donnees)` : contrôle léger de chaque audit
  (id/site non vides, statut dans la liste, date nulle ou `AAAA-MM-JJ`).

---

## js/logique.js — le cœur testable (à connaître par cœur)

Aucun `document.` ni `localStorage` ici. C'est ce qui permet les **deux
lanceurs de tests** (tests.html et Node) sur le même fichier.

- `STATUTS` : la liste officielle des 3 statuts. **Si on ajoute un statut,
  c'est ici qu'on commence** (voir la section « modifier une petite chose »).
- `estEnRetard(audit, dateDuJour)` : **la règle du sujet**. Retourne `true`
  si `datePrevue` existe, est **strictement avant** la date du jour
  (comparaison directe de chaînes `AAAA-MM-JJ`, pas besoin de `new Date`)
  et que le statut n'est pas « réalisé ». Aujourd'hui = pas encore retard.
- `filtrerAudits(audits, filtres)` : `audits.filter(...)` avec deux critères
  combinés en **ET** (`site` et `statut`). Une valeur `""` = pas de filtre.
  `.filter` renvoie une **nouvelle** liste : l'originale n'est jamais modifiée.
- `validerAudit(saisie)` : renvoie `{ valide, erreurs[] }`. Règles : site
  obligatoire (après `trim()`), statut dans `STATUTS`, date obligatoire sauf
  si « à planifier », date valide si fournie. Les erreurs sont des **messages
  en français** affichés tels quels dans la modale.
- `estDateValide(chaine)` : regex `^(\d{4})-(\d{2})-(\d{2})$` puis vérification
  que la date **existe vraiment** : `new Date(2026, 1, 31)` ne plante pas, il
  donne le 3 mars — donc on compare l'année/mois/jour de l'objet créé aux
  valeurs saisies, ce qui refuse le 31/02. (Et 2024 = bissextile accepté,
  2026 = refusé.)
- `calculerStatistiques(audits, dateDuJour)` : compte le total, chaque statut,
  les retards, et groupe les retards par site dans un objet puis un tableau
  trié (décroissant). Utilisé par le tableau de bord.
- `formaterDate(iso)` : `2026-06-15` → `15/06/2026` ; `—` si pas de date.
  (Le **stockage** reste en `AAAA-MM-JJ` : c'est le format des `<input
  type="date">` et il se trie tout seul.)
- `ligneCSV(valeurs)` : construit une ligne CSV avec `;` (usage Excel FR) et
  échappe les guillemets (doublés) quand une valeur en contient.

---

## js/app.js — l'affichage et les interactions

Le « collant » entre tout. Structure de haut en bas :

- **État** : `audits` (liste complète, jamais filtrée) et `filtres` (site,
  statut). L'affichage est toujours recalculé à partir de ces deux sources.
- `dateDuJourISO()` : date du jour **locale** en `AAAA-MM-JJ`. À expliquer :
  `toISOString()` donne la date UTC, qui peut être en avance/décalée d'un jour
  le soir en France — d'où la construction à la main avec `getMonth()`/`getDate()`.
- `creerBadgeStatut(statut)` : crée le badge `<span>` avec la classe CSS
  `badge--a-planifier` (on retire les accents et on remplace les espaces par
  des tirets : « à planifier » → `a-planifier`).
- `afficherCompteurRetards(dateDuJour)` : compte les retards, met le texte du
  bandeau et bascule les classes `bandeau-retards--ok` / `--alerte`.
- `afficherListe(dateDuJour)` : **le rendu du tableau**. Vide le `tbody` avec
  `replaceChildren()`, puis pour chaque audit **filtré** crée une `<tr>` et ses
  `<td>` avec `createElement`/`textContent`. Pourquoi pas de `innerHTML` :
  le texte est échappé automatiquement, donc un commentaire contenant `<b>`
  ou un `<script>` s'affiche tel quel — pas d'injection HTML. Si l'audit est
  en retard : classe `ligne-retard` + badge « ⚠ En retard » dans la cellule
  date. Enfin, `#message-vide` est affiché si la liste filtrée est vide.
- `remplirSelecteurSites()` : reconstruit le `<select>` des sites à partir des
  sites **réellement présents** dans les audits (`new Set(...)` pour
  dédoublonner) : si l'utilisateur saisit un nouveau site dans le formulaire,
  il apparaît dans les filtres.
- `rafraichirAffichage()` : appelle compteur + liste + tableau de bord.
  **Tout l'écran est redessiné après chaque modification** : simple et sans
  état résiduel.
- **Formulaire** : `auditEnCours` vaut `null` (mode ajout) ou l'id de l'audit
  modifié. `ouvrirFormulaireAjout()` vide le formulaire et appelle
  `showModal()` ; `ouvrirFormulaireModification(id)` pré-remplit les champs
  (`?? ""` pour les valeurs facultatives) ; `majChampDateObligatoire()` met
  l'attribut `required` du champ date à `true/false` selon le statut choisi
  (aide clavier, la vraie validation reste côté `validerAudit`).
  `enregistrerFormulaire(evenement)` :
  1. `preventDefault()` (on ne veut pas la soumission native),
  2. lit les champs, appelle `validerAudit()` — en cas d'erreur, affiche les
     messages dans `#erreur-formulaire` et **s'arrête**,
  3. crée un audit (`nouvelId()` : `Date.now` + aléa, pas de dépendance) ou
     modifie celui trouvé par id,
  4. `sauvegarderAudits()` — si échec, message dans la modale qui reste ouverte,
  5. sinon ferme la modale, reconstruit le sélecteur de sites et rafraîchit.
- **Délégation d'événement** : les boutons « Modifier » sont créés
  dynamiquement à chaque rendu. Plutôt que d'attacher un écouteur à chaque
  bouton, on écoute **le tableau** (`corps-tableau`) et on remonte au bouton
  cliqué avec `event.target.closest("button")`. Un seul écouteur, jamais
  recréé. Chaque bouton porte `dataset.id` (l'`id` de l'audit).
- **Tableau de bord** (`afficherTableauDeBord`) : appelle
  `calculerStatistiques`, crée les cartes et la liste « Retards par site ».
- **Export CSV** (`exporterCSV`) : liste **filtrée** → lignes via `ligneCSV`,
  préfixe `\uFEFF` (BOM) pour qu'Excel ouvre l'UTF-8 sans casser les accents,
  `Blob` + `URL.createObjectURL` + clic programmatique sur un `<a download>`,
  puis `revokeObjectURL` (libère la mémoire).
- `demarrer()` : charge les données, remplit les filtres, attache tous les
  écouteurs, dessine. Appelée une fois en bas du fichier.

---

## tests.html et tests/logique.test.js

Deux lanceurs, **un seul module testé** (`js/logique.js`), mêmes cas :

- `tests.html` : importe la logique en module, exécute une liste de tests
  `[nom, fonction]`, affiche ✔/✘ et un résumé. Les helpers maison
  (`affirmerEgal`, `compareProfond`) évitent toute dépendance.
- `tests/logique.test.js` : version Node avec `node:test` et `node:assert/strict`.
  Lancement : `node --test tests/logique.test.js` (24 tests).

---

## Si on me demande de modifier une petite chose

### 1. « Ajoute un statut "en cours" »

Trois endroits, dans cet ordre :

1. `js/logique.js` → `STATUTS` : ajouter `"en cours"` à la liste.
2. `css/style.css` → ajouter les variables `--statut-en-cours-fond/-texte`
   (fond clair + texte foncé) et la classe `.badge--en-cours`.
3. `index.html` → ajouter `<option value="en cours">En cours</option>` dans
   `#filtre-statut`.

Le formulaire (`#champ-statut`) et les filtres marcheront alors tout seuls,
car ils s'appuient sur la même liste. Penser aussi à `js/donnees.js` si l'on
veut des exemples du nouveau statut dans les données.

### 2. « Change la règle du retard (ex. retard si dépassé de plus de 7 jours) »

**Un seul endroit** : `js/logique.js`, fonction `estEnRetard`. Par exemple :

```js
const datePassee = audit.datePrevue < decalerISO(dateDuJour, -7);
```

Puis relancer les tests : `node --test tests/logique.test.js` — les tests 1 à 5
d'`estEnRetard` sont là pour vérifier qu'on n'a rien cassé (certains devront
être adaptés à la nouvelle règle, c'est voulu : les tests documentent la règle).

### 3. « Ajoute une colonne "Tél. du site" »

1. Données : ajouter le champ dans `js/donnees.js` (chaque audit de
   `descriptions` ne porte pas le champ : le plus simple est un tableau
   `TELEPHONES` indexé par site, ajouté dans `genererAudits`).
2. Affichage : dans `js/app.js` → `afficherListe()`, ajouter un
   `createElement("td")` dans la boucle (après le site) et son `<th>` dans
   `index.html` (les deux, dans le même ordre).
3. Export : dans `exporterCSV()`, ajouter l'en-tête et la valeur dans les
   deux tableaux `ligneCSV([...])`.
4. (Facultatif) Formulaire : si la valeur doit être saisie, ajouter le champ
   dans `index.html` + lecture/enregistrement dans `enregistrerFormulaire()`.

### 4. « Le compteur de retards doit aussi compter les audits sans date »

C'est une **décision produit**, pas juste du code : aujourd'hui, un audit sans
date ne peut pas être « en retard » (choix documenté). Si on le veut :
`js/logique.js` → `estEnRetard()`, traiter `datePrevue === null` comme
`true` (au lieu de `false`), et **adapter les tests 4** des deux lanceurs qui
documentent le comportement actuel. Le libellé du bandeau dans
`afficherCompteurRetards()` devra préciser la règle pour rester honnête.
