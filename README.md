# stock-web

Application web (PWA) de Kreskala Stock : Next.js 16, React 19, shadcn/ui (Base UI), Tailwind 4.

## Démarrer en local

Prérequis : la pile de `stock-api` (PostgreSQL, Keycloak, API), voir son README.

```bash
cp .env.example .env.local   # adresses de Keycloak et de l'API
npm install
npm run dev                  # http://localhost:3100
```

Connexion : ouvrir http://localhost:3100/connexion, saisir un numéro ; le code s'affiche dans
`docker compose logs -f keycloak` (dossier `stock-api`).

Ports dédiés au projet : application web 3100, API 8081, Keycloak 8180, PostgreSQL 5436. Si la page se
recharge en boucle en développement (« HMR hash mismatch »), un autre processus Next.js utilise le
même dossier `.next` : l'arrêter, puis `rm -rf .next/dev` et relancer `npm run dev`.

## Configuration

Lue par le serveur à l'exécution (`/runtime-config`), jamais figée au build : une même image sert
tous les environnements.

| Variable | Rôle |
|---|---|
| `KEYCLOAK_URL` | adresse de Keycloak |
| `KEYCLOAK_REALM` | realm (`kreskala`) |
| `KEYCLOAK_CLIENT_ID` | client public (`stock-web`) |
| `API_URL` | adresse de `stock-api` |

## Vérifications

```bash
npm run typecheck && npm run lint && npm run build
npm run test:e2e   # parcours complet contre la pile réelle, voir e2e/README.md
```

## Organisation

| Dossier | Contenu |
|---|---|
| `app/(app)` | espace connecté : connexion, inscription (`/bienvenue`), choix d'entreprise, accueil |
| `lib/api` | client HTTP (jeton, langue, entreprise active, erreurs RFC 9457), requêtes TanStack Query |
| `lib/auth` | connexion OIDC (Keycloak, PKCE) |
| `messages` | textes FR et EN ; le français est la référence typée |
| `components/ui` | composants shadcn alignés sur la charte (rayon 0,45 rem, cibles tactiles de 44 px) |
