# TESTS.md — tests de la logique pure et cas manuels

## Tests automatisés

La logique pure (js/logique.js) ne dépend ni du DOM ni du localStorage, donc
elle est testable de deux façons, avec **le même module** et **les mêmes cas** :

- **Navigateur** : ouvrir `tests.html` → résumé en haut de page (tous réussis / échecs), détail ligne par ligne.
- **Node.js** : `node --test tests/logique.test.js`

### Liste des cas testés (24)

**Règle du retard (estEnRetard)** — date du jour de test fixée au 15/06/2026 :
1. date passée + statut non « réalisé » → en retard.
2. date passée + statut « réalisé » → PAS en retard.
3. date prévue = aujourd'hui → PAS en retard (la date n'est pas encore dépassée).
4. sans date (audit « à planifier ») → PAS en retard.
5. date à venir → PAS en retard.

**Filtres (filtrerAudits)** :
6. aucun filtre → les 5 audits de la liste de test sont renvoyés.
7. filtre par site seul → seuls les audits de ce site.
8. filtre par statut seul → seuls les audits de ce statut.
9. filtres site + statut combinés → ET logique (1 seul résultat).
10. filtre sans aucun résultat → liste vide.
11. la liste originale n'est jamais modifiée (pas d'effet de bord).

**Validation du formulaire (validerAudit, estDateValide)** :
12. saisie complète → valide.
13. site vide ou espaces uniquement → refusé.
14. statut hors liste → refusé.
15. statut « planifié » sans date → refusé.
16. statut « à planifier » sans date → accepté (cas limite du sujet).
17. date au 31/02 → refusée (le jour n'existe pas).
18. date au format « 15/06/2026 » → refusée (le stockage est en AAAA-MM-JJ).
19. 29/02/2024 accepté (bissextile), 29/02/2026 refusé.

**Statistiques (calculerStatistiques)** :
20. total et comptage par statut.
21. retards comptés et regroupés par site, triés par nombre décroissant.

**Aides d'affichage** :
22. formaterDate : « 2026-06-15 » → « 15/06/2026 », et « — » si pas de date.
23. ligneCSV : échappement des « ; » et guillemets selon le format CSV FR.
24. la liste STATUTS contient bien les 3 statuts du sujet.

## Cas à tester manuellement dans le navigateur

À compléter au fil des fonctionnalités. Pour l'instant :

1. **tests.html** : le résumé doit afficher « tous réussis ✔ ».
2. **Premier chargement d'index.html** : la liste d'audits fictifs apparaît ;
   vider le localStorage (Outils de développement > Application > Stockage local)
   puis recharger doit régénérer un jeu cohérent avec la date du jour.
3. **localStorage corrompu** : mettre la valeur de la clé
   `suivi-audits-seac-v1` à « {pas du json » puis recharger → l'app repart du
   jeu de données sans erreur bloquante.

### Formulaire (étape 4)

4. **Ajouter un audit** : bouton « + Ajouter un audit » → la modale s'ouvre
   vide. Enregistrer sans rien saisir → messages d'erreur affichés dans la
   modale (site obligatoire, date obligatoire).
5. **Ajouter un audit « planifié » sans date** → refusé avec message ; le
   même audit avec statut « à planifier » et sans date → accepté.
6. **Modifier un audit existant** : bouton « Modifier » d'une ligne → la
   modale s'ouvre pré-remplie ; modifier le statut en « réalisé » puis
   enregistrer → la ligne n'est plus en retard, le compteur baisse.
7. **Ajouter un audit sur un nouveau site** → après enregistrement, le
   nouveau site apparaît dans le filtre « Site ».
8. **Touche Échap dans la modale** → fermeture sans enregistrement.
