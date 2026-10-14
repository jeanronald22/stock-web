# Journal des décisions

Projet : SaaS de gestion de stock pour PME (premier produit d'une famille de logiciels).
Dernière mise à jour : 2026-10-14

---

## D1. Périmètre : gestion de stock pure
- **Décision** : le produit gère uniquement le stock. Pas de facturation, de caisse ni de comptabilité.
- **Pourquoi** : les clients ont déjà un outil de facturation (constaté sur le terrain). Un périmètre réduit permet d'aller plus vite.
- **Conséquence** : les mouvements peuvent porter une `référence externe` (numéro de facture d'un autre outil). Une intégration par API viendra plus tard.

## D2. Marché : Afrique francophone, lancement au Cameroun
- **Décision** : lancement au **Cameroun**, puis extension à d'autres pays.
- **Conséquences** :
  - Langues : **français et anglais dès le départ** (le Cameroun est bilingue).
  - Monnaie : XAF au départ. La monnaie est configurable par pays (XOF, etc.).
  - Identifiants d'entreprise au Cameroun : **RCCM** et **NIU** (DGI). Ils sont paramétrables par pays.
  - Paiement : mobile money (MTN MoMo, Orange Money), via un agrégateur.
  - Données personnelles : se conformer à la loi camerounaise sur la protection des données personnelles. **À vérifier** : texte exact et obligations de déclaration.
  - Contexte terrain : réseau instable, coupures de courant, usage fort de WhatsApp et du vocal.

## D3. Conçu pour une grande échelle
- **Décision** : l'architecture doit permettre un déploiement multi-pays à grande échelle, sans réécriture.
- **Conséquences** :
  - Multi-entreprise dès le départ (`tenant_id` sur toutes les données métier).
  - API sans état de session (stateless), passage à l'échelle horizontal.
  - Tout ce qui varie selon le pays (langue, monnaie, identifiants, taxes, fuseau horaire) est dans un **référentiel pays**, pas dans le code.
  - Base de données PostgreSQL, migrations versionnées (Flyway).
  - Fichiers (photos, pièces KYB) dans un stockage objet compatible S3.
  - Observabilité : logs structurés, métriques, traces.

## D4. Stack technique
- **Backend** (dépôt `stock-api`) : **Kotlin**, Spring Boot 4.1, Java 25, Maven, Spring Modulith, Flyway, PostgreSQL 17.
- **Identité** : Keycloak 26 (voir D8). Un seul realm `kreskala` pour toute la famille, versionné dans `stock-api/docker/keycloak`. Les jetons destinés à l'API portent l'audience `stock-api`.
- **Frontend** (dépôt `stock-web`) : **Next.js 16** (React 19), shadcn/ui (preset `b2D0xPGXT`, style base-luma), Tailwind 4. Application installable (PWA), **hors ligne d'abord**, avec synchronisation (identifiants créés côté client, envoi sans doublon).
- **Threads virtuels** (2026-10-13) : activés dans l'API (Java 25). Le pool de connexions PostgreSQL borne la charge ; un pool saturé répond 503 réessayable plutôt que de faire patienter les requêtes.
- **Nom de package provisoire** : `com.monsaas`, à renommer quand la marque sera choisie.

## D5. Module d'IA dans le MVP
- **MVP** : saisie de mouvements en langage naturel ou vocal → mouvement pré-rempli → **validation humaine obligatoire**.
- **Extension rapide** : photo du bon de livraison → réception pré-remplie.
- **Plus tard** : analyse des écarts d'inventaire et des anomalies, puis prévision des ruptures.
- **Règles** :
  - L'IA propose, l'humain valide.
  - Le mode manuel reste toujours disponible, y compris hors ligne.
  - Quotas d'appels IA par formule d'abonnement.
  - Fournisseur d'IA isolé derrière une interface.

## D6. KYB léger, progressif et non bloquant
- **Niveau 0, à l'inscription** : téléphone vérifié par code (SMS ou WhatsApp), nom de la structure, ville, secteur. Donne accès à un essai limité.
- **Niveau 1, avant le premier paiement** : nom du responsable, pièce d'identité du gérant, adresse ou photo du local. RCCM et NIU facultatifs.
- **Niveau 2, volontaire** : RCCM et NIU validés. Donne un badge « vérifié » et, plus tard, l'accès aux offres de partenaires financiers.
- **Mise en œuvre au MVP** : validation manuelle depuis un back-office. Documents chiffrés, stockage privé, accès journalisés, durée de conservation limitée.
- **Les entreprises informelles restent acceptées.**

## D7. Famille de logiciels : un seul compte pour toute la marque
- **Décision** : le logiciel de stock est le premier d'une famille. Un client a **un seul compte** pour tous les logiciels de la marque.
- **Conséquences d'architecture** :
  - **Un service d'identité central** (SSO, OpenID Connect), indépendant du logiciel de stock.
  - **L'organisation (entreprise) et son KYB appartiennent à la plateforme**, pas au logiciel de stock. Une entreprise vérifiée l'est pour toute la famille.
  - Les droits fonctionnent ainsi : utilisateur → membre d'une organisation → rôle **par produit** (exemple : gérant dans Stock, aucun accès dans un futur produit RH).
  - **Abonnements par produit**, rattachés à l'organisation, avec une facturation de plateforme commune.
  - Chaque produit est une application séparée qui fait confiance au service d'identité.

## D8. Architecture du MVP : 2 applications à coder, 1 à installer
- **Décision** :
  1. **Une API Spring Boot**, en monolithe modulaire, avec deux modules strictement séparés : `plateforme` et `stock`.
  2. **Une application web PWA** (React) qui regroupe « Mon compte », les écrans Stock et les pages admin (visibles par l'équipe interne uniquement).
  3. **Keycloak**, installé et configuré, avec une seule extension Java pour la connexion par code WhatsApp ou SMS. Le canal d'envoi est une interface (`OtpSender`, SPI `otp-sender`) : on change de fournisseur par configuration, sans recompiler (2026-10-13).
  4. PostgreSQL comme base de données.
- **Pourquoi** : c'est beaucoup plus simple à construire et à déployer pour une petite équipe. Les modules étant séparés dès le départ, chacun pourra devenir un service indépendant quand l'échelle l'exigera (voir D3).
- **Règle** : le module `stock` ne lit jamais directement les tables de `plateforme`. Il passe par une interface (API interne), comme s'il s'agissait déjà d'un service distant.
- **Schéma** : https://claude.ai/artifact/ETYPmShUPfhFpqkmbSRJN5

## D9. Rôle de chaque brique
Chaque brique répond à une seule question :

| Brique | Question | Exemple |
|---|---|---|
| **Keycloak** | **Qui êtes-vous ?** | « C'est bien Jean, il a validé le code envoyé au +237 6XX… » |
| **Plateforme** | **Pour quelle entreprise travaillez-vous, avec quel rôle, et à quoi cette entreprise a-t-elle droit ?** | « Jean est propriétaire de Quincaillerie Ngono, qui a Stock en formule Pro et un KYB de niveau 1. » |
| **Stock** (et chaque future app) | **Que fait-on dans le métier ?** | « 120 cartons de carreau 60x60 gris, lot B, au dépôt Bonabéri. » |

**La Plateforme est le fichier clients de la marque.** Elle contient :
- les **entreprises** (pays, ville, secteur) ;
- leurs **membres**, avec un rôle global (propriétaire, administrateur, membre), et les **invitations** ;
- le **KYB** (niveau, documents, décisions) ;
- les **abonnements** par application (formule, échéance, paiements mobile money).

Côté utilisateur, ce sont les écrans de « Mon compte » : créer son entreprise, inviter un employé, envoyer ses documents KYB, payer son abonnement, changer d'entreprise.

**Exemple : Awa, magasinière, enregistre une sortie**
1. Keycloak : « C'est bien Awa. » Elle reçoit son badge (jeton).
2. Plateforme : « Awa est membre de Quincaillerie Ngono, qui a un abonnement Stock actif. » Si l'abonnement a expiré, le blocage se fait ici.
3. Stock : « Awa est magasinière au dépôt Bonabéri et peut enregistrer cette sortie. »

**Pourquoi elle est séparée de Stock** : la future application RH aura besoin des mêmes informations (entreprise, équipe, KYB, paiement). Elles sont créées une seule fois dans la Plateforme, et chaque nouvelle application s'y branche. Le client ne recrée jamais son entreprise et ne réinvite jamais son équipe.

## D10. Modèle de données (validé le 2026-10-12, base de départ)
- **Détail complet** : https://claude.ai/artifact/J4E8RAduGxf3QMSR1jTUgW
- Deux schémas PostgreSQL, `platform` (16 tables) et `stock` (20 tables), sans clé étrangère entre eux.
- Toutes les tables de Stock portent `organization_id`, avec en plus une protection par ligne (RLS) dans PostgreSQL.
- **Le stock est un registre** : les bons génèrent des mouvements (`stock_movement`) qu'on ne modifie jamais. `stock_level` est un total recalculé. Une erreur se corrige par un nouveau bon.
- **Les quantités sont stockées en unité de base** (ex. la pièce). Cartons et m² sont des conversions (`sku_unit`), ce qui permet de suivre les cartons ouverts.
- Produit → article (variante avec sa référence) → lot (nuance, calibre), activable par article.
- **Hors ligne** : identifiants UUID créés sur le téléphone, numéro de bon attribué par le serveur, `row_version` pour la synchronisation.
- Chaque proposition de l'IA est gardée dans `ai_suggestion` et liée au bon qu'elle a pré-rempli.

## D11. Règles de qualité du code
- **Commentaires** : seulement quand ils apportent une information que le code ne donne pas (une règle métier, une contrainte, la raison d'un choix non évident). Pas de commentaire qui répète le code, pas de commentaire décoratif ou excessif. Chaque commentaire est précis.
- **SOLID strictement respecté** : une responsabilité par classe, extension sans modification, sous-types substituables, interfaces ciblées, dépendance envers des abstractions (ex. le fournisseur d'IA, le fournisseur d'OTP et le paiement mobile money sont derrière des interfaces).
- **Aucune chaîne magique** : toute valeur réutilisée ou porteuse de sens (code d'erreur, en-tête, nom de table ou de colonne, statut, clé de configuration) est définie une seule fois, dans une énumération ou une constante.
- **Relecture systématique** : chaque changement est relu avant d'être commité (lisibilité, cas limites, sécurité, isolation entre entreprises, tests).
- **Qualité production SaaS dès le départ** : sécurité et isolation entre entreprises, validation des entrées, gestion d'erreurs explicite, idempotence, observabilité (logs structurés, métriques), migrations versionnées, tests automatisés, configuration par environnement, aucun secret dans le code.

## D12. Identité de marque (proposition v0.1, à valider)
- **Nom de travail** : Kreskala. Disponibilités et marques antérieures (OAPI) encore à vérifier.
- **Personnalité** : solide et rassurante.
- **Symbole** : un K fait de trois formes : un pilier (solidité), une flèche à 45° (croissance) et un carton (le stock).
- **Signature** : « Votre stock, au carton près. » / « Your stock, down to the last box. »
- **Couleurs et polices** : celles déjà en place dans `stock-web`. Vert Kreskala #007A55 (emerald-700), gamme émeraude, neutres purs, Inter et Geist Mono, rayon 0,45 rem.
- **Icônes** : Lucide, complétées par des icônes métier dans le même style.
- **Charte (v0.4)** : https://claude.ai/artifact/HVMGXxfGk69zSTzhpEGb9r, source dans `brand/charte-kreskala.html`

## D13. Stratégie de branches (2026-10-12)
- `main` : production. Aucun push direct ; uniquement des pull requests depuis `develop`.
- `develop` : branche d'intégration et branche par défaut sur GitHub.
- `feature/<sujet>` et `fix/<sujet>` : partent de `develop` et y reviennent par pull request. Branche supprimée après fusion.
- **Limite actuelle** : la protection de branche côté GitHub n'est pas disponible pour un dépôt privé sur un compte gratuit. `main` est protégée localement par un hook `pre-push` versionné (`.githooks/`), qui ne peut pas être imposé côté serveur.

## D14. Socle multi-entreprise de l'API (2026-10-13)
- **Isolation fermée par défaut** : PostgreSQL applique la sécurité par ligne (RLS, `FORCE`) sur toutes les tables du schéma `stock`. L'entreprise active est transmise au début de chaque transaction (`set_config(..., true)`) ; sans entreprise, aucune ligne n'est visible.
- **Entreprise active (validé le 2026-10-13)** : le jeton Keycloak ne porte que l'identité. Le client indique l'entreprise dans l'en-tête `X-Organization-Id`, et l'API vérifie à chaque requête, dans la Plateforme, que la personne en est membre active. Le retrait d'un membre prend effet immédiatement, chaque appareil travaille dans sa propre entreprise, et Keycloak ne duplique pas les entreprises (D9).
- **Deux rôles PostgreSQL** : le propriétaire pour les migrations, `stock_app` pour l'application (ni superutilisateur, ni BYPASSRLS). L'API refuse de démarrer sinon.
- **Erreurs** : format RFC 9457 (`application/problem+json`), avec un `code` stable pour le front, un `traceId` pour le support, et des messages en français et en anglais selon `Accept-Language`.
- **Idempotence** : en-tête `Idempotency-Key` sur les requêtes qui modifient des données (réponse rejouée pendant 24 h), en complément des identifiants UUID créés sur le téléphone.
- **Observabilité** : traces OpenTelemetry (export activé en configurant un collecteur), journaux JSON ECS avec `traceId`, `userId` et `organizationId`.
- **Tables enfants (validé le 2026-10-13)** : `sku_unit`, `sku_warehouse`, `stock_document_line`, `inventory_count_line` et `stock_role_warehouse` reçoivent aussi `organization_id`, ajouté à leur création, pour être protégées par la RLS comme les autres. Cela complète le modèle D10.

## D15. Inscription : connexion d'abord, puis création de la structure (2026-10-13)
- **Parcours** : numéro → code (Keycloak), puis écran « Bienvenue » : prénom, nom, nom de la structure, ville, secteur (Plateforme). La personne devient propriétaire (KYB niveau 0, D6).
- **Pourquoi** : pas d'entreprise créée sans numéro vérifié ; Keycloak ne gère que l'identité (D9) ; un seul parcours pour les nouveaux clients et les invités.
- **API** : `GET /v1/me` crée le profil à la première requête et liste les entreprises accessibles (aucune → création, une → entrée directe, plusieurs → choix). `PUT /v1/me/profile` (prénom et nom, exigés avant de créer une entreprise). `POST /v1/organizations` avec un identifiant créé par l'application : renvoyer la même création ne crée pas de doublon. Au plus 5 entreprises créées par personne (réglable).
- **À venir** : invitations (un invité rejoint l'entreprise sans passer par la création), abonnement d'essai à la création.

## D16. Application web : premiers écrans (2026-10-13)
- **Connexion** : OIDC avec PKCE (`oidc-client-ts`), écrans de numéro et de code servis par Keycloak avec le thème `kreskala` (même charte que l'application). Jetons conservés sur l'appareil (stockage local) pour le travail hors ligne ; contrepartie : une politique de sécurité du contenu (CSP) stricte sera nécessaire.
- **Configuration à l'exécution** (`/runtime-config`) plutôt que des variables figées au build : une même image pour tous les environnements.
- **Données** : TanStack Query ; seules les erreurs passagères (réseau, 503) sont relancées, en respectant `Retry-After`. Une réponse 401 renvoie vers la connexion.
- **Langues** : next-intl, sans préfixe d'URL ; langue choisie (cookie) sinon celle du navigateur ; transmise à Keycloak et à l'API.
- **Parcours** : connexion → inscription en deux écrans (nom, puis structure) → accueil ; choix d'entreprise si plusieurs ; entreprise active retenue sur l'appareil.
- **Tests de bout en bout** : Playwright contre la pile réelle, sur téléphone et ordinateur.

## D17. Connexion par e-mail et mot de passe au lancement (2026-10-14)
- **Décision** : au lancement, connexion par adresse e-mail et mot de passe. La connexion par code SMS/WhatsApp (D8, extension Keycloak) coûte trop cher à ce stade ; elle reste dans le code et se réactive en liant le flux « kreskala browser » au realm.
- **Adresse confirmée obligatoire** (lien reçu par e-mail) : évite les faux comptes et rend sûr le mot de passe oublié. Le KYB de niveau 0 (D6) repose donc sur un e-mail vérifié au lieu d'un téléphone vérifié.
- **Mot de passe** : 10 caractères au moins, sans règles de composition (recommandation NIST 800-63B) ; protection contre la force brute conservée.
- **E-mails** : SMTP configurable (variables `SMTP_*`), Mailpit en local. Le fournisseur de production reste à choisir.
- **Téléphone** : facultatif sur le profil ; il servira aux invitations WhatsApp et au retour de la connexion par code.

## D18. Politique de confidentialité tenue à jour au fil du produit (2026-10-14)

- Fondée sur la loi n° 2024/017 du 23 décembre 2024 relative à la protection des données à caractère personnel au Cameroun. Page publique `/confidentialite` (FR/EN, `?lang=` imposé par les écrans de connexion).
- Elle ne décrit que ce que Kreskala fait réellement. **Toute fonctionnalité qui collecte, partage ou conserve de nouvelles données complète la politique dans le même changement** (`content/legal/privacy-policy.{fr,en}.ts`), puis avance `PrivacyPolicyRelease` (version, date).
- Kreskala est responsable du traitement pour les comptes ; l'entreprise cliente l'est pour ses données de stock, Kreskala agissant alors pour son compte.
- Mention sous les formulaires de connexion et d'inscription : « En continuant, vous confirmez avoir lu notre politique de confidentialité ». Pas « vous acceptez » : la loi exige un consentement spécifique ; un accord global à une politique n'en est pas un. Les données du compte reposent sur l'exécution du service, pas sur ce clic.
- À compléter avant l'ouverture : identité juridique de l'éditeur (forme, siège, RCCM), adresse `confidentialite@kreskala.com` à créer et relever, pays d'hébergement et liste des prestataires (hébergeur, envoi d'e-mails), durée de conservation des journaux, fermeture de compte dans l'application, conditions d'utilisation (même composant `LegalDocument`).

## D19. Articles et dépôts (2026-10-14)

- **Dépôt** : boutique, dépôt ou chantier, chacun avec son propre stock. **Article** : nom, référence facultative (unique dans l'entreprise), unité de base (pièce, kg, L, m, m², m³), suivi par lot (lot, nuance, calibre), conditionnements exprimés en unité de base (carton de 12 pièces, carton de 1,44 m² ; nombre entier pour un article compté à la pièce).
- **Référencement** : un article est proposé dans les dépôts cochés, et seulement ceux-là. La liste des articles se filtre par dépôt ; la fiche d'un dépôt montre ses articles.
- Archiver remplace supprimer : la fiche disparaît des listes sans perdre son historique. Un dépôt archivé garde ses articles mais n'en reçoit plus.
- L'unité de base reste modifiable tant qu'aucun mouvement n'existe ; elle sera verrouillée avec l'arrivée des bons.
- Création idempotente (identifiant créé par l'application) ; verrou optimiste (version) : une fiche modifiée entre-temps n'est pas écrasée (409 `edit-conflict`, bouton « Recharger »).
- Tous les membres peuvent gérer le catalogue pour l'instant ; les droits par rôle arrivent avec l'invitation de l'équipe.
- Interface : barre latérale (panneau sur téléphone), illustrations animées pour les écrans vides, visite guidée driver.js à la première visite de chaque écran (relançable par « Guide »), textes limités à l'essentiel.

## D20. Photos d'articles et stockage de fichiers (2026-10-14)

- Une photo par article (JPEG, PNG ou WebP, 5 Mo au plus, format reconnu au contenu), ajoutée dans l'assistant de création ou depuis la fiche.
- **Stockage derrière une interface** (`FileStorage`) : Cloudflare R2 en production (API compatible S3, compartiment privé), disque en local. Choix par configuration (`STORAGE_PROVIDER`) ; démarrage refusé si R2 est incomplet.
- **Accès** : les photos sont servies par l'API sur un lien signé (HMAC, `STORAGE_SIGNING_SECRET`), stable pendant une heure pour le cache du navigateur, valable deux heures au plus. Même comportement quel que soit le stockage ; un CDN pourra être ajouté plus tard sans changer l'application.
- Clé de fichier unique à chaque dépôt (jamais réécrite) ; ancienne photo effacée après validation ; table `item_image` séparée de l'article, pour qu'une photo ne crée pas de conflit de version avec une modification en cours.
- Politique de confidentialité passée en version 0.2 (photos, Cloudflare R2).
- Listes : filtre « Actifs / Archivés » à côté des autres filtres, conservé dans l'adresse (`statut=archives`).

## D21. Bons de réception et de sortie, registre du stock (2026-10-14)

- Un bon est validé dès son enregistrement (pas de brouillon pour l'instant) et signé du nom de la personne. Numéro par type et par année : REC-2026-0001, SOR-2026-0001, sans trou (un bon refusé rend son numéro).
- **Registre immuable** : bons, lignes et mouvements ne se modifient ni ne se suppriment ; la base l'impose (droits retirés au rôle applicatif, déclencheur pour tous). Une erreur se corrige par un nouveau bon.
- **Pas de stock négatif** : une sortie est tout ou rien ; le décompte est atomique (deux sorties simultanées ne consomment pas le même stock) ; le refus détaille le disponible, affiché sous chaque ligne en cause.
- Saisie en unité de base ou en conditionnement (converti) ; lot obligatoire pour un article suivi par lot (choisi parmi les lots en stock pour une sortie) ; pièces entières.
- Une réception référence l'article dans le dépôt. L'unité de base d'un article se verrouille à son premier mouvement.
- **Saisie rapide sur un seul écran**, sans assistant : la réception et la sortie se font plusieurs fois par jour, l'écran doit faire gagner du temps. Dernier dépôt déjà choisi ; recherche d'article au clavier, curseur sur la quantité à l'ajout, Entrée pour revenir à la recherche ; détails facultatifs à côté ; après validation, l'écran se vide pour le bon suivant (même dépôt, même date). Les assistants restent pour les créations occasionnelles (article, dépôt).
- Autres écrans : liste des bons paginée et filtrée, fiche de bon en lecture seule, stock par dépôt avec lots et ruptures, stock sur la fiche de l'article.
- Politique de confidentialité passée en version 0.3 (nom sur les bons, fournisseurs et clients).

## D22. Fournisseurs, photos partout, bons imprimables (2026-10-14)

- **Annuaire des fournisseurs** (nom unique, coordonnées facultatives) et **catalogue** de chacun : les articles qu'il livre. Le catalogue se remplit de lui-même à chaque réception, et peut aussi se modifier sur la fiche.
- **Réception** : le fournisseur se choisit à côté du dépôt, ou se crée à la volée en tapant son nom ; ses articles sont proposés d'abord (« Tout le catalogue » d'un clic). Son nom du jour est recopié sur le bon. Une sortie garde un champ libre (client, chantier).
- **Photo de l'article** partout où il est listé : tableaux des articles et du stock, recherche, lignes de saisie, fiche de bon, aperçu du dépôt, catalogue fournisseur, bon imprimé.
- **Bon en PDF** (A4), généré dans l'application (@react-pdf/renderer, chargé au premier usage) : entreprise, numéro, dépôt, fournisseur ou client, lignes, cases de signature, pied de page en bas de chaque page avec sa numérotation. « Télécharger le PDF » l'enregistre (REC-2026-0001.pdf) ; « Imprimer » ouvre la boîte d'impression sur ce même PDF. Depuis la fiche du bon et depuis le menu de chaque ligne de la liste. Pas de photo sur le document.
- Politique de confidentialité passée en version 0.4 (coordonnées des fournisseurs).

## D23. Revue : écarts au modèle validé (D10) et plan de réalignement (2026-10-14)

Les articles, dépôts, fournisseurs et bons (D19 à D22) ont été construits sans repartir du modèle validé (`docs/modele-donnees.html`) ni du questionnaire terrain (`docs/questionnaire-controleur-stock.pdf`). Écarts constatés :

| Modèle D10 | Construit | Écart |
|---|---|---|
| `category` (arborescence) | rien | **manquant** : pas de catégories |
| `sku_warehouse.min_qty_base` (seuil par dépôt), « alerte avant rupture » (questionnaire, Q44) | référencement sans seuil | **manquant** : ni seuil ni alerte |
| `product` → `sku` (variantes : format, diamètre ; `attributes`, `barcode`, `supplier_ref`) | un seul niveau « article » | **simplifié** : pas de variantes, ni code-barres, ni référence fournisseur |
| `unit` + `sku_unit` (facteur, conditionnement par défaut en réception et en sortie) | unité fixe + conditionnements sans défaut | **simplifié** |
| `lot` (code, nuance, calibre, date) | texte libre « lot » | **simplifié** : nuance et calibre non distingués |
| `partner` SUPPLIER · CUSTOMER · SITE | fournisseurs seulement | **partiel** : clients et chantiers en texte libre |
| `stock_document` RECEIPT · ISSUE · RETURN · TRANSFER · DAMAGE · ADJUSTMENT | réception et sortie | **manquant** : retours, transferts (dépôt « En transit »), casse (motif, photo), ajustements |
| Statuts DRAFT · PENDING · VALIDATED · IN_TRANSIT · RECEIVED · CANCELLED | validé à l'enregistrement (D21) | **écart assumé**, à revoir avec les transferts |
| `qty_expected_base` (quantité annoncée sur le BL) | rien | **manquant** : l'écart à la réception (Q11, Q12) n'est pas tracé |
| `location` (emplacements, Q27-Q28) | rien | **manquant** |
| `inventory_count` + lignes, double comptage | rien | **prévu**, pas fait |
| `stock_role` + accès par dépôt | tout membre peut tout faire | **manquant** |
| Hors ligne : `row_version`, `device_id`, `synced_at`, `source` | identifiants créés par le client seulement | **partiel** |
| `attachment` (pièces jointes génériques) | `item_image` (photo d'article) | **spécialisé** |
| `ai_suggestion` (D5, MVP) | rien | **prévu**, pas fait |

Écrans demandés le 2026-10-14 : filtres combinables sur les articles (catégorie, plusieurs dépôts, fournisseur, état du stock), filtre des bons par période et par type, tri par date croissante ou décroissante.

**Plan de réalignement**, par lots livrables :
- **Lot A** (livré, voir D24) : catégories ; seuils par dépôt et alertes (stock bas, rupture) ; filtres combinables des articles et du stock ; filtres des bons (période, type, dépôt, fournisseur) et tri par date.
- **Lot B** (transferts D27 ; casse, ajustements, écarts à la réception D28 ; clients et chantiers D30 ; retours D31) : tiers clients et chantiers ; bons de retour, de casse (motif, photo) et d'ajustement ; quantité annoncée sur le BL et écart à la réception ; transferts entre dépôts (en transit, quantité reçue à l'arrivée).
- **Lot C** (en cours : inventaire D32) : inventaires (complet, tournant, double comptage, ajustement à la clôture) ; emplacements.
- **Lot D** : produit et variantes, table des unités, lot avec nuance et calibre ; rôles Stock par dépôt ; synchronisation hors ligne ; IA (D5).

**Règle** : toute nouvelle fonctionnalité part des tables de D10 ; un écart volontaire est noté ici avant le code.

## D24. Lot A : catégories, seuils d'alerte, filtres combinables (2026-10-14)

Réalignement sur D10 (tables `category`, `sku_warehouse.min_qty_base`) :
- **Catégories** (`stock.category`, V11) : arborescence libre, nom unique parmi les catégories de même parent, déplacement sans boucle, suppression d'une catégorie vide seulement. Gérées depuis la liste des articles (bouton « Catégories »), choisies dans la fiche. Filtrer une catégorie inclut ses sous-catégories.
- **Seuil d'alerte par dépôt** (`item_warehouse.min_quantity`, en unité de base) saisi sous chaque dépôt coché de la fiche article. Écart de nom assumé : `item_warehouse` tient le rôle de `sku_warehouse` tant que les variantes (lot D) n'existent pas.
- **États** : seul un article dont le seuil est renseigné est surveillé. Rupture : stock nul dans le dépôt ; stock bas : positif et au seuil ou en dessous. Seuil 0 : alerte seulement en rupture ; vide : jamais d'alerte (un article proposé partout mais stocké à un seul endroit ne crie pas en permanence). Calcul par la vue `stock.item_stock_state` (`security_invoker`, la sécurité par ligne s'applique).
- **Filtres combinables** dans l'adresse : plusieurs dépôts (OU entre eux), catégorie, fournisseur, niveau de stock (« à commander », « stock bas », « en rupture »), statut ; ET entre filtres. Dépôt et alerte portent sur la même ligne : « Akwa + à commander » ne montre que ce qui manque à Akwa. « Effacer les filtres » quand un filtre est posé.
- **Stock et accueil** : badge et détail par dépôt (« Boutique Akwa : 3 pièces, seuil 5 ») ; l'accueil annonce les articles à commander quand il y en a.
- **Bons** : période du/au (jours inclus, fuseau des dépôts, Africa/Douala), plusieurs dépôts, fournisseur, type ; tri par date de l'opération, plus récents ou plus anciens d'abord.
- Limite connue : le filtre fournisseur liste 100 fournisseurs actifs (une page de l'API) ; au-delà, passer par la fiche du fournisseur.

## D25. Équipe : invitations et rôles (2026-10-14)

Réalise `invitation` (Plateforme) et `stock_role` + `stock_role_warehouse` (Stock) de D10, selon D7 et D9 : un rôle global dans la Plateforme, un rôle par application.

- **Rôle Plateforme** (gestion de l'équipe) : propriétaire, administrateur, membre. Le propriétaire et les administrateurs invitent, changent les rôles, désactivent ou réactivent un membre. Seul le propriétaire nomme ou retire un administrateur. Personne ne modifie ni ne désactive le propriétaire, ni ne se désactive soi-même.
- **Rôle Stock** (le métier), avec les dépôts auxquels il donne accès :

| | Gérant | Manager | Contrôleur | Magasinier |
|---|---|---|---|---|
| Dépôts | tous | les siens | les siens | les siens |
| Voir stock et bons | oui | oui | oui | oui |
| Réceptions, sorties | oui | oui | oui | oui |
| Casse, ajustements, inventaires (lots B et C) | oui | oui | oui | non |
| Seuils d'alerte | oui | oui | oui | non |
| Articles, catégories, fournisseurs | oui | oui | non | non |
| Créer, modifier, archiver un dépôt | oui | non | non | non |

  Le propriétaire est gérant d'office. Un membre sans rôle Stock n'a pas accès à Stock. Le catalogue (articles, catégories, fournisseurs) se consulte par tous ; le stock, les bons et les dépôts se limitent aux dépôts du rôle. Un manager qui modifie un article ne touche qu'aux dépôts qui sont les siens.
- **Invitation** : liée à une adresse e-mail, valable 7 jours, annulable, renvoyable (nouveau lien, l'ancien ne vaut plus). Un e-mail part avec le lien ; le lien peut aussi être copié (WhatsApp). Pour accepter, il faut être connecté avec cette adresse, confirmée ; une personne sans compte le crée depuis le lien. Seule l'empreinte (SHA-256) du jeton est conservée.
- **Personne déjà inscrite** : l'invitation lui parvient par e-mail comme aux autres, et apparaît aussi dans l'application (accueil, choix d'entreprise) : elle la rejoint d'un geste, son adresse confirmée suffisant à prouver qu'elle lui est destinée. Sans entreprise, elle arrive sur ce choix plutôt que sur la création d'une entreprise. Une personne déjà membre active ne peut pas être réinvitée ; un membre désactivé peut l'être (il revient avec le rôle de la nouvelle invitation).
- **Séparation des modules (D8)** : la Plateforme ne connaît pas les rôles Stock. L'application enregistre l'invitation (Plateforme), puis l'accès Stock prévu pour elle (Stock). À l'acceptation, la Plateforme publie un événement ; Stock transforme l'accès prévu en rôle du nouveau membre. Stock lit le rôle Plateforme par une interface (`TeamDirectory`), jamais par ses tables.
- **E-mails** : envoyés par l'API derrière une interface (`InvitationMailer`), SMTP configurable (Mailpit en local), en français ou en anglais selon la langue de la personne qui invite.
- **Précisions** : un magasinier peut créer le fournisseur d'une réception pendant sa saisie (nom et coordonnées), sans pouvoir le modifier ensuite ni toucher à son catalogue. Le propriétaire et les administrateurs voient tous les dépôts pour les attribuer, même sans rôle Stock. L'écran affiche en consultation seule ce que le rôle ne permet pas de modifier ; l'API refuse de toute façon.

## D26. Notifications dans l'application et par e-mail (2026-10-14)

Ajout au modèle D10, qui n'en prévoyait pas. Répond à « alerte avant rupture » (questionnaire, Q44) et au suivi de l'équipe (D25).

- **Où** : dans la Plateforme (`platform.notification`, `platform.notification_preference`) : une notification s'adresse à une personne, quelle que soit l'application qui la déclenche. Stock ne lit pas ces tables (D8) : il publie un événement (« ces articles viennent de passer en alerte, prévenir ces personnes ») ; la Plateforme enregistre la notification et envoie l'e-mail.
- **Texte** : enregistré comme un type et des paramètres, traduit à l'affichage (FR/EN) ; l'e-mail part dans la langue de la personne notifiée.
- **Notifications de base** :

| Type | Quand | Qui | In-app | E-mail (par défaut) |
|---|---|---|---|---|
| Stock en alerte | une sortie fait passer des articles au seuil ou en rupture dans un dépôt (un avis par bon) | propriétaire, gérants, managers et contrôleurs de ce dépôt | oui | oui |
| Membre arrivé | une invitation est acceptée | la personne qui a invité et le propriétaire | oui | oui |
| Invitation reçue | une personne déjà inscrite est invitée | elle (l'e-mail d'invitation part déjà) | oui | non |
| Accès Stock modifié | rôle ou dépôts changés | la personne concernée | oui | oui |

- **Préférences** : l'e-mail se désactive type par type (« Mon compte › Notifications ») ; l'avis dans l'application reste toujours.
- **Lecture** : cloche dans l'en-tête avec le nombre de non lues, liste des dernières, « tout marquer comme lu » ; seules les notifications de l'entreprise active, et celles qui ne dépendent d'aucune entreprise (invitation reçue). Relues toutes les minutes.
- **Envoi** : après l'enregistrement de l'opération, hors de la requête : un e-mail lent ou refusé ne retarde ni n'annule un bon. Conservation : 90 jours.

## D27. Lot B : transferts entre dépôts (2026-10-14)

Modèle D10 : `stock_document` de type TRANSFER, `dest_warehouse_id`, statuts IN_TRANSIT puis RECEIVED, `qty_expected_base` et `qty_received_base` par ligne. Questionnaire : les transferts sont notés dans un cahier, le magasinier réceptionne à l'arrivée (Q29).

- **Deux bons, jamais modifiés** (registre, D21) : l'envoi (TRS-2026-0001) sort le stock du dépôt de départ ; la réception (TRE-2026-0001), enregistrée au dépôt d'arrivée, y entre les quantités réellement reçues et renvoie à l'envoi. Écart assumé avec D10 : le statut n'est pas stocké sur l'envoi (le registre ne se modifie pas), il se déduit (en transit tant qu'aucune réception ne le référence). Pas de dépôt virtuel « En transit » : la marchandise en route est celle des envois non réceptionnés.
- **Écart à l'arrivée** : chaque ligne de la réception garde la quantité attendue (celle de l'envoi) et la quantité reçue, qui peut être nulle (rien n'est arrivé) ou différente. L'écart est visible sur les deux bons. Une seule réception par envoi.
- **Droits (D25)** : envoyer exige le droit de mouvement sur le dépôt de départ ; réceptionner, sur le dépôt d'arrivée. Chacun voit les transferts qui partent de ses dépôts ou y arrivent.
- **Notifications (D26)** : « transfert en route » pour ceux qui travaillent au dépôt d'arrivée (magasiniers compris) et le propriétaire ; « transfert reçu », avec l'écart s'il y en a un, pour la personne qui l'a envoyé et le propriétaire. Une sortie par transfert peut déclencher l'alerte de stock du dépôt de départ.
- **Écran** : pas de nouvel onglet ; les transferts vivent dans « Bons » (nouveau bouton, type « Transferts » dans le filtre, « à réceptionner »), et l'accueil signale les transferts à réceptionner.

## D28. Lot B : casse, ajustement de stock, écart à la réception (2026-10-14)

Modèle D10 : `stock_document` DAMAGE et ADJUSTMENT, `stock_document_line.reason`, `photo`, `qty_expected_base`. Questionnaire : « enregistrer la casse avec photo » (Q44), réception selon le reçu puis recours auprès du fournisseur (Q11-Q12).

- **Casse** (CAS-2026-0001) : sortie de stock avec un motif (cassé, abîmé, périmé, perdu ou volé, autre) et jusqu'à 5 photos. Les photos s'ajoutent au bon après son enregistrement (le bon reste valable si l'envoi d'une photo échoue) et ne se retirent pas : ce sont des preuves. Écart avec D10 : motif et photos portés par le bon, pas par chaque ligne (un sinistre a une cause et des photos d'ensemble).
- **Ajustement** (AJU-2026-0001) : on saisit la quantité comptée ; le stock théorique est relu au moment de valider, et l'écart (en plus ou en moins) est inscrit au registre. Chaque ligne garde le théorique (`expected_quantity`) et le compté. Motif : comptage, erreur de saisie, autre. Une ligne sans écart confirme le stock sans le bouger.
- **Droits (D25)** : casse et ajustement exigent le droit de correction (gérant, manager, contrôleur) sur le dépôt ; le magasinier ne peut pas.
- **Écart à la réception** : sur une réception, chaque ligne peut porter la quantité annoncée par le bon de livraison du fournisseur. L'écart s'affiche sur le bon et dans son PDF ; la liste des bons se filtre « avec écart » pour préparer le recours ; le propriétaire et les responsables du dépôt sont prévenus (notification « écart à la réception »).
- **Alertes (D26)** : casse et ajustement à la baisse peuvent déclencher l'alerte de stock, comme une sortie.
- **Motif « autre »** : une note est alors obligatoire.

## D29. Menu latéral par compartiments (2026-10-14)

- Jusqu'à 5 entrées, le menu reste à plat. Au-delà, il se range par compartiments : l'accueil en tête (sans titre), puis Opérations (stock, bons), Catalogue (articles, fournisseurs, dépôts), Administration (équipe). Une entrée nouvelle va dans un compartiment existant ; un compartiment nouveau seulement pour un domaine nouveau (voir aussi : pas d'onglet inutile).

## D30. Lot B : clients et chantiers (2026-10-14)

Modèle D10 : `partner` de type CUSTOMER ou SITE (nom, téléphone). Questionnaire : les livraisons sur chantier se contrôlent avec la facture (Q17).

- **Annuaire** (`stock.customer`) : nom (unique dans l'entreprise), genre (client ou chantier), téléphone, adresse (où livrer), note ; archivable comme un fournisseur. Écart assumé avec D10 : une table à part plutôt qu'un `partner` commun, puisque les fournisseurs ont déjà la leur avec un catalogue ; le rapprochement se fera si un même tiers doit un jour être les deux.
- **Sortie** : le client ou chantier se choisit dans l'annuaire, ou se crée sans quitter la saisie (magasinier compris, comme un fournisseur, D25) ; le nom est recopié sur le bon (le bon garde le nom du jour). Le texte libre reste possible pour un passage sans fiche.
- **Fiche** : coordonnées et dernières sorties et retours, pour répondre à « qu'a-t-on livré à ce chantier ? ». Liste des bons filtrable par client.
- **Écran** : pas d'entrée de menu en plus (D29) : « Fournisseurs » devient « Contacts », avec deux onglets, fournisseurs et clients.
- **Droits** : comme les fournisseurs : tous consultent, le gérant et les managers modifient et archivent.

## D31. Lot B : retours client et fournisseur (2026-10-14)

Modèle D10 : `stock_document` RETURN. Questionnaire : un retour client est aujourd'hui saisi comme une réception, « contre le numéro de facture » (Q16) ; une mauvaise nuance livrée est rapportée puis échangée (Q22).

- **Deux types**, car le sens du stock diffère : retour client (RCL-2026-0001, le stock remonte) et retour fournisseur (RFO-2026-0001, le stock part). Écart assumé avec D10 (un seul RETURN).
- **Bon d'origine, facultatif** : un retour client peut partir d'une sortie, un retour fournisseur d'une réception (« Enregistrer un retour » sur la fiche du bon). Les lignes sont alors proposées avec ce qui reste à retourner ; on ne retourne pas plus que ce qui est sorti ou entré (tous retours du même bon cumulés), ni un article qui n'y figurait pas. Le tiers et la référence sont repris du bon d'origine. Sans bon d'origine (vieux papier, facture d'un autre outil), le retour se saisit librement avec la référence de la facture.
- **Droits** : droit de mouvement sur le dépôt (le magasinier les saisit, Q16). Un retour fournisseur peut déclencher l'alerte de stock, comme une sortie.
- **Écran** : dans « Bons » (« Autre opération »), sur la fiche du bon d'origine, qui liste aussi ses retours.

## D32. Lot C : inventaire d'un dépôt (2026-10-14)

Modèle D10 : `inventory_count` (complet ou tournant, périmètre par catégorie, clôture qui crée un bon d'ajustement) et `inventory_count_line` (théorique, compté, second comptage). Questionnaire : inventaires « parfois », sur papier (Q30-Q32).

- **Ouverture** : un dépôt, tout le dépôt (complet) ou une catégorie et ses sous-catégories (tournant). Un seul inventaire ouvert par dépôt. Droit de correction (gérant, manager, contrôleur).
- **Feuille de comptage** : les articles proposés dans le dépôt (dans le périmètre), lot par lot ; on saisit le compté, à l'unité ou au conditionnement. Comptage à l'aveugle : le stock théorique ne s'affiche qu'une fois la ligne comptée, pour ne pas influencer la personne qui compte. Entrée enregistre et passe à la ligne suivante. Recherche et filtres « à compter », « comptés », « écarts ». Un article trouvé hors feuille s'ajoute. Le magasinier peut compter (le comptage ne change pas le stock) ; seule la clôture demande le droit de correction. Écart assumé avec D25, qui réservait les inventaires aux correcteurs.
- **Stock vivant** : le magasin n'est pas fermé pendant l'inventaire. Chaque comptage retient le stock théorique de l'instant ; à la clôture, l'écart (compté − théorique de l'instant) s'applique au stock du moment, ce qui garde juste tout ce qui est entré ou sorti entre-temps. Si un écart ferait passer le stock sous zéro, la clôture est refusée et la ligne est à recompter.
- **Double comptage** : une ligne en écart peut être recomptée (idéalement par une autre personne) ; le second comptage est retenu, le premier reste visible.
- **Clôture** : un bon d'ajustement (motif « inventaire ») porte tous les écarts ; les articles non comptés ne bougent pas (l'écran le dit avant de clôturer). Sans écart, l'inventaire se clôt sans bon. Un inventaire peut aussi être annulé : rien ne bouge.
- **Écran** : pas d'onglet en plus : on lance et reprend un inventaire depuis « Stock », qui signale les inventaires en cours ; l'historique s'y consulte aussi ; le bon d'ajustement renvoie à son inventaire.

## Questions ouvertes
- [ ] Protection serveur de `main` : passer à GitHub Pro, ou utiliser une organisation GitHub (plan Team).
- [ ] Nom de la marque et nom du produit de stock (voir D7). Pistes : Kreskala, Kreskio, Tissero, NarvalWorks, FourmiLabs.
- [ ] Texte exact de la loi camerounaise sur les données personnelles et obligations associées.
- [ ] Agrégateur de paiement mobile money.
- [ ] Fournisseur d'envoi d'e-mails en production (D17).
