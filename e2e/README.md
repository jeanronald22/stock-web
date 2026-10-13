# Tests de bout en bout

Ils s'exécutent contre une pile réelle :

1. `stock-api` : `docker compose up -d` (PostgreSQL, Keycloak avec le fournisseur de codes `console`),
   puis `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`.
2. `stock-web` : `npm run build && npm start`.
3. `npx playwright test`.

Variables utiles : `E2E_BASE_URL` (par défaut `http://localhost:3000`) et
`E2E_KEYCLOAK_COMPOSE_DIR` (par défaut `../stock-api`, pour lire les codes dans les journaux de Keycloak).
Les captures de chaque étape sont dans `test-results/`.
