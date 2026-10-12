<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Projet

SaaS de gestion de stock pour PME (Afrique francophone, lancement au Cameroun). Gestion de stock uniquement : pas de facturation, de caisse ni de comptabilité. Premier produit d'une famille de logiciels partageant un compte unique (Keycloak + module Plateforme).

Dépôts : `stock-api` (Kotlin, Spring Boot) et `stock-web` (Next.js, shadcn/ui).

# Règles de qualité du code

- **Commentaires** : uniquement quand ils apportent ce que le code ne dit pas (règle métier, contrainte, raison d'un choix non évident). Aucun commentaire qui paraphrase le code, aucun commentaire décoratif.
- **SOLID strict** : une responsabilité par classe ou composant ; dépendre d'abstractions. Les fournisseurs externes (IA, OTP SMS/WhatsApp, paiement mobile money, stockage de fichiers) sont toujours derrière une interface.
- **Relecture systématique** : relire chaque changement avant de le commiter (lisibilité, cas limites, sécurité, isolation entre entreprises, tests).
- **Qualité production SaaS** : validation des entrées, erreurs explicites, idempotence, observabilité, tests automatisés, configuration par environnement, aucun secret dans le code.

# Invariants métier

- **Isolation entre entreprises** : toute donnée métier porte `organization_id`. L'entreprise active vient du jeton, jamais d'un paramètre envoyé par le client.
- **Le stock est un registre** : on ne modifie jamais `stock_movement`. Toute correction passe par un nouveau bon.
- **Quantités en unité de base** de l'article ; cartons, m², etc. sont des conversions.
- **Hors ligne d'abord** : identifiants UUID créés côté client, synchronisation idempotente.
- **L'IA propose, l'humain valide** : l'IA ne crée jamais de mouvement directement.
- **Bilingue** : français et anglais dès le départ.

# Spécifique au front

- Composants UI via shadcn/ui (`components.json`) ; ne pas dupliquer un composant existant.
- `npm run typecheck`, `npm run lint` et `npm run build` doivent passer avant chaque commit.
