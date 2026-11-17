# Suivi des audits — SEAC (mini-projet de candidature, stage 2027)

Application web simple de suivi des audits dans une dizaine d'usines (outil
interne fictif pour SEAC, béton précontraint). Réalisée dans le cadre de la
candidature à un stage de développement web au service informatique de Toulouse.

> **Données 100 % fictives.** Les sites, auditeurs et audits sont inventés ;
> aucune donnée réelle n'est utilisée.

## Fonctionnalités

- Liste des audits : site, date prévue, statut (à planifier / planifié / réalisé), auditeur, commentaire.
- Filtres par site et par statut, combinables, avec bouton de réinitialisation.
- Audits en retard mis en évidence (badge + ligne rouge) avec compteur.
  Règle : date prévue dépassée **et** statut différent de « réalisé ».
- Ajouter un audit (formulaire validé : site obligatoire, date obligatoire sauf si « à planifier »).
- Modifier un audit existant (même formulaire pré-rempli).
- Bonus : tableau de bord (totaux, retards par site) et export CSV de la liste filtrée.

## Lancer le projet

Aucune installation, aucun build, aucune dépendance.

- **Option 1 (recommandée) — serveur statique local** :
  ```bash
  python -m http.server 8000
  ```
  dans le dossier du projet, puis ouvrir http://localhost:8000
- **Option 2 — GitHub Pages** : fonctionne telle quelle (voir plus bas).
- **Option 3 — VS Code + Live Server** : clic droit sur `index.html` >
  « Open with Live Server ».

> **Pourquoi pas le double-clic sur `index.html` ?** L'app utilise des modules
> ES (`<script type="module">`). Depuis une page ouverte en `file://`, les
> navigateurs bloquent le chargement des modules (contrôle CORS, origine
> « null ») : la page resterait vide avec une erreur console. C'est une
> restriction standard des navigateurs, pas un bug de l'application — d'où
> l'usage d'un serveur statique, même minimal.

Les modifications sont enregistrées dans le `localStorage` du navigateur
(au premier chargement, un jeu de données fictif est généré avec des dates
relatives à la date du jour, pour que les retards restent visibles).

Pour repartir de zéro : vider le stockage du site dans les outils de
développement du navigateur (onglet Application > Stockage local).

## Lancer les tests

Les tests portent sur la **logique pure** (retard, filtres, validation), qui ne
dépend ni du DOM ni du localStorage.

- **Dans le navigateur** : ouvrir `tests.html` → les résultats s'affichent à l'écran.
- **Avec Node.js** (si installé) :
  ```bash
  node --test tests/logique.test.js
  ```

## Structure du projet

```
├── index.html            Page de l'application
├── tests.html            Page de tests (logique pure)
├── css/style.css         Toute la charte graphique (variables CSS dans :root)
├── js/
│   ├── donnees.js        Sites fictifs + génération des audits (dates relatives à aujourd'hui)
│   ├── stockage.js       Lecture/écriture localStorage + gestion des erreurs
│   ├── logique.js        Logique pure : retard, filtres, validation, statistiques
│   └── app.js            Affichage : tableau, filtres, formulaire, export CSV
├── tests/
│   └── logique.test.js   Tests Node (node:test), même logique que tests.html
├── assets/logo-seac.svg  Logo fourni
├── README.md / EXPLICATIONS.md / NOTES_IA.md / TESTS.md
```

## Identité visuelle (hypothèses)

Les couleurs sont approximées d'après des captures d'écran du site seac-guiraud.fr
(vert SEAC, jaune d'accent) : ce ne sont **pas** des valeurs officielles. Toute la
charte est définie dans `:root` en haut de `css/style.css` — la changer ne demande
que de modifier ces variables. La police est une pile système (aucune ressource
externe n'est chargée).

## Limites connues

- Pas de back-end : les données sont locales au navigateur (localStorage).
- Si le localStorage est vide ou corrompu, l'application repart du jeu de données
  fictif généré à la date du jour.
