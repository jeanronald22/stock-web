# Tests de bout en bout

Ils s'exécutent contre une pile réelle :

1. `stock-api` : `docker compose up -d` (PostgreSQL, Keycloak, Mailpit), puis l'API
   (`./mvnw spring-boot:run` ou StockApiApplication dans l'IDE).
2. `stock-web` : `npm run dev` (ou `npm run build && npm start`).
3. `npx playwright test`.

Variables utiles : `E2E_BASE_URL` (par défaut `http://localhost:3100`), `E2E_API_URL` (API à tester à la place de celle qu'appelle l'application, `E2E_APP_API_URL`, par défaut `http://localhost:8081` : utile pour vérifier une branche de l'API sans arrêter la sienne) et `E2E_MAILPIT_URL`
(par défaut `http://localhost:8025`, pour lire les e-mails de confirmation envoyés par Keycloak).
Les captures de chaque étape sont dans `test-results/`.
