# Journal des décisions

Projet : SaaS de gestion de stock pour PME (premier produit d'une famille de logiciels).
Dernière mise à jour : 2026-10-20

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
- **Nom de package** (2026-10-20) : `com.kreskala` (groupId Maven compris), la marque Kreskala étant retenue. Remplace le nom provisoire `com.monsaas`.

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
- **Révisé le 2026-10-20 : jusqu'à cinq photos par article** (de quoi le montrer sous plusieurs angles, sans en faire une galerie). La première est la principale : celle des listes et de l'aperçu. Chaque photo a son identifiant, choisi par l'application (renvoyer le même dépôt n'en ajoute pas une seconde) ; positions 0 à 4 sans trou, uniques par article (contrainte différée, pour réordonner dans une transaction) ; l'article est verrouillé pendant l'enregistrement. Ajout, choix de la principale et suppression depuis la fiche, sans ouvrir le formulaire ; le formulaire ne remplace que la principale.
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

Les articles, dépôts, fournisseurs et bons (D19 à D22) ont été construits sans repartir du modèle validé (`docs/modele-donnees.html`) ni du questionnaire terrain (gardé hors du dépôt : ses réponses sont confidentielles). Écarts constatés :

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
- **Lot D** (en cours : sorties à valider D33, codes-barres D34, nuance et calibre D35) : produit et variantes, table des unités, lot avec nuance et calibre ; rôles Stock par dépôt ; synchronisation hors ligne ; IA (D5).

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

- **Préférences** : l'e-mail se désactive type par type (« Paramètres › Notifications », D45) ; l'avis dans l'application reste toujours.
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

## D33. Sorties à valider (2026-10-14)

Modèle D10 : statuts DRAFT · PENDING · VALIDATED · CANCELLED, `validated_by`, `validated_at`. Questionnaire : le magasinier signe seul le bon de sortie (Q14) ; de la marchandise sort parfois sans être notée (Q15).

- **Registre intact** (D21) : un bon validé ne change jamais. Une sortie en attente n'est donc pas un bon : c'est une **demande** (`stock.voucher_request`, avec ses lignes), modifiable par personne, qui devient un bon à sa validation (même identifiant, idempotent). Écart assumé avec D10 : le statut vit sur la demande, pas sur le bon.
- **Règle de l'entreprise** : « Les sorties des magasiniers passent par une validation », désactivée par défaut, réglée dans « Équipe » par le propriétaire et les administrateurs. Elle vaut pour ce qui fait sortir du stock à la main : sortie, envoi de transfert, retour fournisseur. Casse et ajustement sont déjà réservés aux correcteurs.
- **Qui valide** : ceux qui corrigent le stock du dépôt (gérant, manager, contrôleur). Leurs propres sorties ne passent pas par une demande.
- **Validation** : la sortie part au moment de la validation (date et stock de cet instant ; un manque est signalé ligne par ligne). Le bon garde les deux signatures : préparé par le magasinier, validé par le responsable (écran et PDF).
- **Refus** avec un motif obligatoire ; **retrait** par la personne qui a préparé, tant que rien n'est décidé. Une demande refusée se reprend en un geste (« Refaire la demande »).
- **Avis (D26)** : « sortie à valider » aux valideurs du dépôt ; « sortie validée » ou « refusée » à la personne qui l'a préparée.
- **Écrans** : pas d'onglet : dans « Bons », un filtre « À valider » avec son nombre, une fiche de demande ; l'accueil annonce les demandes en attente. À la saisie, le bouton dit « Envoyer pour validation ».

## D34. Codes-barres et scan (2026-10-14)

Modèle D10 : `sku.barcode`. Questionnaire : peu de codes-barres aujourd'hui (Q26) mais le scan est demandé (Q42, Q44 « inventaire par scan »).

- **Code-barres de l'article** : facultatif, unique dans l'entreprise ; plusieurs formats (EAN-13, EAN-8, UPC, Code 128, QR).
- **Scan** par la caméra du téléphone (API du navigateur, avec repli pour ceux qui ne l'ont pas ; module chargé depuis l'application elle-même, pas d'un service tiers) ou par une douchette (elle tape le code puis Entrée).
- **Où** : fiche article (saisir le code en le scannant), saisie des bons (scanner ajoute l'article, ou augmente sa quantité s'il est déjà sur le bon), inventaire (scanner amène à la ligne de l'article). Un code inconnu le dit clairement et propose de l'associer à un article (si on gère le catalogue).

## D35. Lots : nuance et calibre (2026-10-14)

Modèle D10 : `lot` (code, nuance, calibre, date de réception). Questionnaire : une nuance ou un calibre différent livré au client est rapporté et échangé (Q18, Q22).

- **Le lot reste la clé du stock** (texte saisi à la réception, D21) ; nuance et calibre deviennent des **caractéristiques du lot** (`stock.batch_attributes` : article, lot, nuance, calibre, première réception), saisies à la réception pour les articles suivis par lot. Écart assumé avec D10 : pas de clé `lot_id`, pour ne pas réécrire le registre ; même information.
- **Affichage** partout où un lot apparaît : « L2409 · nuance B2 · cal. 9 ».
- **Garde-fou** : à la sortie, mélanger deux nuances ou deux calibres d'un même article sur un bon est signalé avant de valider (« 2 nuances différentes : le client risque de le voir »), sans l'interdire.
- **Stock** : le détail par lot montre nuance et calibre, pour choisir le bon lot.

## D36. Démarrage : conditionnement par défaut, import du catalogue, étiquettes (2026-10-15)

Modèle D10 : `sku_unit.is_default_receive` et `is_default_issue`, `sku.barcode`. Questionnaire : on compte et on sort en cartons (Q19, Q24) ; le suivi se fait aujourd'hui sur cahier, fiches et Excel (Q5, Q41) ; 1 000 à 5 000 références (Q3) ; très peu de codes-barres (Q26) alors que le scan est demandé (Q42, Q44).

- **Conditionnement par défaut** : un article peut désigner le conditionnement proposé d'office à la saisie des entrées (réception, retour client) et celui des sorties (sortie, transfert, retour fournisseur, casse, ajustement, inventaire). Deux réglages sous la liste des conditionnements, « Réceptions en » et « Sorties en » ; sans réglage, l'unité de base. La ligne garde un choix d'unité modifiable. Scanner un article déjà sur le bon ajoute une unité dans l'unité de la ligne : une étiquette de carton scannée ajoute un carton.
- **Import du catalogue** depuis un fichier Excel (.xlsx) ou CSV (séparateur et encodage d'Excel reconnus), sans entrée de menu : depuis « Articles » (et l'écran vide du catalogue). Étapes : fichier (modèle à télécharger), colonnes (reconnues d'après leurs titres, ajustables), dépôts où proposer les articles, aperçu ligne par ligne, import, bilan. Colonnes : nom (obligatoire), référence, code-barres, unité, catégorie (« Carrelage > Sol », créée si elle n'existe pas), un conditionnement et sa quantité (il devient le conditionnement par défaut en réception et en sortie), suivi par lot, seuil d'alerte, description, stock actuel et son lot.
- **Lignes en erreur** : signalées dans l'aperçu (nom manquant, unité inconnue, nombre illisible, doublon dans le fichier) et laissées de côté ; les refus du serveur (référence ou code-barres déjà pris) sont rapportés au bilan. Les lignes écartées se téléchargent en CSV avec leur motif, pour les corriger et les réimporter. Un article existant n'est pas mis à jour : sa référence est refusée comme doublon.
- **Stock de départ** : la colonne « stock actuel » s'applique à un dépôt choisi, par un ajustement au motif « stock de départ » (posé par l'application, comme « inventaire »), réservé au droit de correction du dépôt. Un article suivi par lot demande son lot.
- **Import par paquets** de 100 articles, chacun idempotent (identifiants choisis par l'application, ajustement compris) : une coupure réseau se reprend sans doublon.
- **Codes-barres internes** : un article sans code peut en recevoir un, attribué par l'application (EAN-13 de la plage réservée à l'usage interne, préfixe 2, unique dans l'entreprise).
- **Étiquettes** en PDF (comme les bons) : planche A4 de 24 (70 × 37 mm) ou 40 étiquettes (52,5 × 29,7 mm), ou rouleau 50 × 30 mm pour imprimante thermique. Nom, référence, code-barres et ses chiffres. Écran ouvert depuis « Articles », la fiche d'un article (avec ses copies) et une réception (une étiquette par conditionnement reçu). Les articles sans code le disent et proposent de leur en attribuer un.

## D37. Emplacements : retrouver un article dans le dépôt (2026-10-15)

Modèle D10 : `location` (dépôt, code, libellé), `sku_warehouse.default_location_id`, et `location_id` sur les lignes, les mouvements et le stock. Questionnaire : le rangement fait partie du travail du contrôleur (Q1) ; les produits ont un emplacement, gardé de mémoire (Q27) ; on cherche rarement un produit (Q28) ; « retrouver l'emplacement d'un produit » est proposé parmi les fonctions utiles (Q44).

- **Emplacements d'un dépôt** : un code court (« A-03-2 »), unique dans le dépôt, et un libellé facultatif (« Allée A, rayon 3, niveau 2 ») ; archivables. Ils se gèrent sur la fiche du dépôt, sans entrée de menu.
- **Emplacement habituel d'un article** dans chaque dépôt où il est proposé (D10 : `default_location_id`), choisi sur la fiche de l'article ; un emplacement manquant se crée sur place.
- **Écart assumé avec D10** : le stock reste compté par dépôt, sans `location_id` sur les lignes, les mouvements et le stock. On retrouve l'article sans demander l'emplacement à chaque saisie. Le stock par emplacement reste possible plus tard, sans reprise des données.
- **Où il apparaît** : fiche de l'article (par dépôt), lignes des bons qui font sortir du stock (sortie, transfert, retour fournisseur, casse) et leur PDF, pour préparer la commande ; feuille d'inventaire, triée par emplacement, pour compter allée par allée.
- **Droit** : nouveau droit « emplacements de ses dépôts » (créer, modifier, archiver, ranger un article) pour le gérant, le manager et le contrôleur ; tout le monde les voit.

## D38. Tableau de bord par rôle, rapports et exports (2026-10-15)

Questionnaire : rapports au gérant (Q1) ; produits à écarts (Q33) ; casse, quand, quoi (Q34, Q36) ; recours au fournisseur quand la livraison ne correspond pas (Q12) ; Excel déjà utilisé (Q41).

- **Accueil par rôle**, toujours limité aux dépôts de la personne :
  - gérant et manager : l'activité de la période (réceptions, sorties, casse, écarts à la réception, articles en alerte), la courbe des entrées et des sorties jour par jour, les articles les plus sortis, la casse par motif, puis ce qui attend une décision (sorties à valider, transferts à réceptionner, alertes) ;
  - contrôleur : ce qu'il doit vérifier (écarts à la réception, casse, inventaires en cours, alertes, sorties à valider) ;
  - magasinier : ses gestes du jour (réception, sortie, transfert à réceptionner), ses demandes en attente ou refusées, l'activité du jour dans ses dépôts, les alertes.
  Les premiers pas (dépôt, article, réception, équipe) ne s'affichent plus une fois faits.
- **Quantités** : un total qui mélange des pièces et des kilos ne veut rien dire. Les chiffres d'ensemble comptent des bons et des lignes ; les quantités restent par article, dans son unité.
- **Rapports**, sans entrée de menu : depuis l'accueil et « Stock » (depuis D43 : depuis les cartes du tableau de bord). Période (raccourcis 7 jours, ce mois, mois dernier, 3 mois, ou dates libres) et dépôts. Trois vues :
  - mouvements par article : entrées, sorties, transferts, retours, casse, ajustements, solde ;
  - casse par motif et par article ;
  - écarts : réceptions qui ne correspondent pas au bon de livraison, par fournisseur et ligne par ligne (pour le recours), et écarts d'inventaire par article.
- **Exports Excel** de chaque rapport et du stock (filtres en cours, toutes les pages), à ouvrir tels quels.
- **Calcul** : en SQL sur le registre des mouvements et les bons, dans le fuseau des dépôts ; rien n'est stocké en plus.

## D39. Mode hors ligne (2026-10-15)

Questionnaire : réseau moyen ou coupé souvent au dépôt, coupures d'électricité fréquentes (Q39, Q40) ; les mouvements sont enregistrés tout de suite ou en fin de journée (Q8). D3 et D10 : identifiants créés sur le téléphone, numéro attribué par le serveur, envoi idempotent.

- **Ce qui marche sans réseau** : consulter ce qui a déjà été vu (accueil, stock, articles, dépôts, bons) et la fiche de tout article actif, même jamais ouverte sur ce téléphone (elle vient de la copie du catalogue, avec son stock), et saisir tous les bons (réception, sortie, transfert, casse, ajustement, retours), les demandes de sortie à valider et la réception d'un transfert. Rouvrir l'application sans réseau fonctionne aussi, une fois qu'elle a été ouverte avec du réseau sur ce téléphone.
- **Ce qui demande le réseau** : créer ou modifier une fiche (article, dépôt, contact, emplacement), les photos de casse, l'inventaire, les rapports, l'équipe. L'écran le dit au lieu d'échouer.
- **File d'envoi** sur le téléphone (IndexedDB), propre à l'entreprise et à la personne : chaque bon y garde son identifiant, l'heure de la saisie (la date du bon est celle du terrain, pas celle de l'envoi) et de quoi reprendre la saisie. Envoi dans l'ordre de saisie, dès que le réseau revient, puis toutes les 30 secondes tant qu'il en reste ; renvoyer ne crée jamais de doublon (D21, D33).
- **Refus à l'envoi** (stock insuffisant à ce moment, article archivé, validation désormais exigée…) : le bon reste sur le téléphone, marqué « à corriger » avec le motif ; on le reprend dans l'écran de saisie, ou on le supprime. Rien n'est perdu sans geste explicite.
- **Visibilité** : un bandeau « hors ligne » dans l'en-tête, le nombre de bons en attente, et dans « Bons » une liste « À envoyer » (en attente, à corriger). Le stock affiché hors ligne est celui du dernier passage en ligne ; une sortie hors ligne ne peut pas vérifier le disponible, l'envoi le fera.
- **Données** : les lectures sont gardées sur le téléphone (7 jours), écrites au plus une fois par seconde et tout de suite quand l'application passe en arrière-plan. Le catalogue actif est copié en entier avec le stock de chaque article dans les dépôts de la personne, pour chercher, scanner et consulter un article sans réseau : à l'ouverture, au retour du réseau, après chaque changement fait sur le téléphone (bon, article), au retour dans l'application et toutes les cinq minutes.
- **Fiches** : une page par section, l'identifiant dans l'adresse (`/articles/fiche?id=…`, de même pour dépôts, bons, réception d'un transfert, fournisseurs, clients, demandes), gardée dès l'installation : une fiche s'ouvre sans réseau même jamais visitée. Sans rien sur le téléphone pour l'afficher, l'écran dit « Pas encore sur ce téléphone » et la montre de lui-même au retour du réseau ; de même pour l'espace de travail entier (« Pas encore prêt sans réseau »), au lieu d'un chargement sans fin. Les anciennes adresses (`/bons/<id>`, e-mails et notifications déjà envoyés) renvoient vers les nouvelles.
- **Session** : hors ligne, la session gardée sur le téléphone suffit, même si le jeton d'accès a expiré, y compris sur un réseau qui ne répond pas (wifi sans internet : le renouvellement qui échoue faute de réseau fait passer hors ligne) ; il est renouvelé (jeton de rafraîchissement, `offline_access`) avant le premier envoi au retour du réseau. Se déconnecter vide la file : l'écran prévient s'il reste des bons à envoyer.
- **Application installable** (manifeste) et **service worker** (Serwist) : les fichiers de l'application et les écrans du terrain sont gardés à l'installation ; les pages visitées le sont aussi ; la racine du site ouvre l'accueil ; une page jamais ouverte affiche un écran « hors ligne » qui renvoie à l'accueil. Au retour de la connexion, l'API est vérifiée tout de suite (sinon toutes les 15 s tant qu'elle ne répond pas). Les appels à l'API ne passent jamais par le cache du service worker.

## D40. Interface : la charte appliquée, des écrans plus directs (2026-10-20)

Constat après les lots précédents : l'application ressemblait à des composants shadcn par défaut, sans la charte (D12) ; sur téléphone, cinq ou six rangées de boutons et de filtres avant la liste.

- **Listes** : une seule barre (`FilterBar`), compacte à partir de la tablette (contrôles de 36 px ; 44 px sur téléphone, cibles tactiles). Recherche et affichage toujours visibles. Deux filtres au plus : sur la même ligne ; au-delà, dans le menu « Filtres », comme les outils SaaS courants. Sur téléphone, toujours dans un panneau du bas. Le bouton « Filtres » dit combien sont posés. « Effacer les filtres » remet aussi les fiches actives. Sous une grille, la pagination est une simple ligne, sans cadre.
- **Actions** : sur un écran, l'action fréquente en bouton, le reste dans « … » (Stock : inventaire, inventaires passés, rapports, export ; bon : PDF, retour). Sur téléphone, « Réception » et « Sortie » tiennent sur une ligne, les autres opérations derrière « + ».
- **En-tête** : les états (type de bon, en cours, archivé) suivent le titre (`PageHeader.badges`) ; ce ne sont pas des actions.
- **Fiches** (article, dépôt, fournisseur, client) : même bandeau (`RecordSummary`) : de quoi la reconnaître, le chiffre qui la résume, ce qui demande d'agir.
- **Typographie de la charte** : chiffres, quantités, références et numéros en Geist Mono à chasse fixe (`num`) ; libellés de faits, de chiffres et en-têtes de tableaux en étiquette mono capitales (`label-caps`).
- **Jauge de stock** de la charte (`StockGauge`) : articles à commander de l'accueil. Sur la fiche article, un graphique Recharts la remplace.
- **Chiffres** de l'accueil et des rapports en un seul bloc à filets (`StatGrid`) ; l'accueil montre ce qui demande un geste (articles à commander) avant l'activité.
- **Premier tri en onglets, avec leur nombre** (`StatusTabs`) : Stock par niveau (tous, à commander, stock bas, rupture), Articles par statut (actifs, archivés), Bons par sorte. Pour les bons, seuls « en route » et « avec écart » sont comptés : ce sont ceux qu'il reste à traiter. Les nombres suivent les autres filtres. Ils viennent de l'API existante (une page d'une ligne par onglet), sans point d'accès dédié tant que le coût reste faible.
- **Période** : un sélecteur unique (`DateRangePicker`, calendrier shadcn sur react-day-picker). Raccourcis à gauche, appliqués aussitôt ; deux mois sur ordinateur, un sur téléphone ; « Appliquer » pour des dates libres. Pas de jour futur. Le même sert aux bons (toujours visible dans la barre), aux rapports, à l'activité de l'accueil et à la courbe de la fiche article. Plus d'un an : l'API refuse, le graphique affiche son message.
- **Tableaux** : une colonne par information, chiffres en mono alignés à droite. Un état toujours écrit sur chaque ligne de stock (« En stock », « Stock bas », « Rupture », « Épuisé »). Pagination numérotée.
- **Cartes** : l'essentiel seulement (photo, nom, catégorie, quantité, état). La référence reste au tableau, où elle se cherche.
- **Articles et Stock en grille par défaut** : on reconnaît un article à sa photo. La liste reste au choix (`vue=liste` dans l'adresse). Cartes de taille fixe (environ 11 rem) : un grand écran en montre davantage, sans les agrandir.
- **Fiche article** : en tête, la photo principale (un clic ouvre toutes les photos en grand ; sans photo, « Ajouter » pour qui gère le catalogue), le nom, la référence et la catégorie ; dessous, l'essentiel en une ligne (état, stock et conditionnements, dépôts en alerte, dernier mouvement, unité). Le détail en onglets, à gauche sur ordinateur, en ligne sur téléphone, gardés dans l'adresse (`onglet`) : informations générales (fiche technique sans cadres, « Non renseigné » pour ce qui manque, code-barres et référence copiables ; un aperçu par dépôt ; les photos, cinq au plus), stock par dépôt (colonnes stock et seuil, couleur de l'état, légende des états présents ; puis où le trouver : emplacement et lots, sans répéter les quantités), mouvements (courbe des entrées et sorties sur la période choisie au calendrier, 30 jours d'abord, puis les derniers bons). Graphiques par la bibliothèque (Recharts via `components/ui/chart`), pas de SVG fait main. La courbe vient de l'API (`/v1/reports/items/{id}/history`) : la liste des bons, paginée, ne suffit pas à la reconstituer.
- **Aperçu d'un article partout** (`ItemLink`, hover card shadcn) : survoler le nom d'un article (tableaux, bons, rapports, accueil, fiches dépôt et fournisseur) montre sa photo, son état, son stock, ses dépôts, son code-barres et « Ouvrir la fiche ». Chargé à l'ouverture seulement. Au toucher, le lien ouvre la fiche. Sur une ligne cliquable, seule la ligne ouvre la fiche et seul le nom ouvre l'aperçu.
- **Colonnes** vides sur toute la page (lot, saisie) : non affichées.
- **Notifications** (toasts) : gardées en haut, sous la barre. Essayées en bas : elles couvraient les panneaux du bas et les barres d'action, plus gênant que le titre caché quelques secondes.

## D41. Références d'articles automatiques (2026-10-20)

- **ART-0001, ART-0002…** : attribuées par l'API à la création, par entreprise, dans l'ordre, sans trou ni doublon (compteur `item_sequence` verrouillé jusqu'à la fin de la transaction, comme les numéros de bons). Elles ne suivent plus le nom (« CAR-6060 ») : un catalogue garde des références homogènes, qui se suivent.
- **Ne se saisissent ni ne se modifient** : le formulaire les montre en lecture seule ; une référence envoyée par une ancienne version de l'application est ignorée. L'import Excel ne lit plus de colonne « Référence » (le code-barres reste importé). Le code-barres reste le moyen d'identifier un article à la caisse ou chez le fournisseur.
- **Reprise** : les articles sans référence en reçoivent une dans l'ordre de création ; celles déjà saisies restent, leur numéro est sauté s'il a la forme ART-n.

## D42. Fiche article en PDF (2026-10-20)

- **Une page A4 par article**, générée dans l'application (@react-pdf/renderer, chargé au premier export), aux couleurs de Kreskala : bandeau vert de la charte avec le logo, l'entreprise et sa ville ; photo principale, nom, référence, état, stock total et conditionnements, code-barres dessiné ; identification (référence, code-barres, unité, lots, conditionnements, date d'ajout), description ; disponibilité par dépôt (stock, seuil, état, emplacement), total ; jusqu'à quatre autres photos. Pied de page : date d'édition, numéro de page, kreskala.
- **Depuis la fiche** : « Exporter en PDF », à côté de « Modifier ». **Depuis le catalogue** : « Sélectionner », des cases sur les cartes et les lignes (toute la carte coche, elle n'ouvre plus la fiche), « Toute la page », puis un seul PDF. Le choix survit au changement de page, de filtre et de vue. Cinquante articles au plus par export (temps de génération sur un téléphone).
- **Photos** redessinées en JPEG avant la mise en page (react-pdf ne lit pas le WebP), réduites à 1 200 px ; une photo qui ne se charge pas est laissée de côté plutôt que de faire échouer l'export. Seuls les dépôts de la personne apparaissent, comme sur la fiche.

## D43. Tableau de bord du gérant (2026-10-20)

Questionnaire : rapports au gérant (Q1) ; produits à écarts (Q33) ; casse (Q34, Q36). Prolonge D38. L'accueil et une analyse à part disaient presque la même chose : ils ne font plus qu'un écran.

- **L'accueil devient le « Tableau de bord »**, sans entrée de menu en plus, pour le gérant, le manager et le contrôleur. Le magasinier garde ses gestes du jour. « Stock » perd son accès aux rapports et garde l'inventaire et l'export.
- **En tête, ce qui attend un geste**, en pastilles qui ouvrent la liste concernée, seulement s'il y a quelque chose : sorties à valider, transferts à réceptionner, articles en rupture, articles à commander, inventaires en cours, réceptions avec écart. Sinon : « Rien n'attend de décision ».
- **Domaines** (Activité, Stock, Sorties, Qualité, Équipe) en puces : « Tout » par défaut. Choisir un domaine ne garde que ses cartes, et les suivants s'ajoutent.
- **Filtres** : dépôts, un article (par nom, référence ou code-barres) et la période (raccourcis ou calendrier, 30 derniers jours par défaut, un an au plus). Domaines et filtres sont gardés dans l'adresse.
- **Cartes**, chacune à la hauteur de son contenu (aucune n'impose sa taille à sa voisine), en colonnes équilibrées par le navigateur :
  - activité : quatre chiffres comparés à la période précédente de même durée (bons d'entrée, de sortie, de casse, réceptions avec écart), la courbe des bons (par jour jusqu'à 31 jours, par semaine jusqu'à 4 mois, puis par mois) et les bons par type ;
  - stock : l'état du stock en anneau (suffisant, à commander, en rupture, chacun vers « Stock » filtré), ceux qui vont manquer (stock d'aujourd'hui divisé par le rythme des sorties de la période, sous 30 jours), le stock qui dort (en stock, sans sortie sur la période), et dépôt par dépôt ;
  - sorties : les articles les plus sortis (en nombre de sorties) et les clients qui en reçoivent le plus ;
  - qualité : casse par motif, conformité des réceptions en jauge, fournisseurs avec écarts ;
  - équipe : les bons saisis par personne.
- **Un article choisi** : sa fiche en tête, avec ses quantités dans son unité (en stock, entré, sorti, ce que le stock tient encore) et sa courbe jour par jour, qui remplace celle des bons. Les classements d'articles disparaissent, et le reste ne compte que les bons qui le portent.
- **Détail** : chaque carte ouvre l'un des trois rapports de D38 (« Rapports », `/rapports` : mouvements, casse, écarts), qui reprend les mêmes filtres et s'exporte en Excel. Son fil d'Ariane ramène au tableau de bord.
- **Calcul** : en SQL sur le registre et les bons, comme D38, dans les dépôts de la personne, en un seul appel. Les états de stock reprennent la règle des alertes (D24).

## D44. Alertes paramétrables, par e-mail et dans l'application (2026-10-20)

Questionnaire : « alerte avant rupture » (Q44), fins de série (Q21), casse et pertes anormales (Q34 à Q37), recours auprès du fournisseur (Q11, Q12). Prolonge D24 (seuils) et D26 (notifications).

- **Six règles en plus du seuil d'alerte** (D24), réglées pour toute l'entreprise par le propriétaire, les administrateurs et le gérant. Chacune peut être coupée :

| Règle | Réglage (par défaut) | Se déclenche quand |
|---|---|---|
| Rupture prévue | N jours (15) | au rythme des sorties des 30 derniers jours, le stock d'un article dans un dépôt tient moins de N jours |
| Stock qui dort | N jours (90) | un article a du stock dans un dépôt et n'en est pas sorti depuis N jours (ni depuis son arrivée, s'il n'est jamais sorti) |
| Surstock | stock maximum par article et par dépôt, sur la fiche (vide : pas d'alerte) | le stock dépasse ce maximum |
| Casse anormale | N % (5) | sur 30 jours, la casse d'un article dans un dépôt dépasse N % de ce qui en est parti (sorties et casse) |
| Fournisseur peu fiable | N % (20) | sur 90 jours, un fournisseur a livré au moins 3 réceptions, dont N % avec un écart au bon de livraison |
| Péremption | N jours (30) | un lot en stock atteint sa date limite dans N jours, ou l'a dépassée |

- **Écarts au modèle D10** : `item_warehouse.max_quantity` (stock maximum) et `batch_attributes.expires_on` (date limite du lot) n'y figuraient pas. La date limite se saisit à la première réception du lot, comme la nuance et le calibre (D35).
- **Veille** : une tâche de fond passe chaque heure sur chaque entreprise active. Une alerte reste enregistrée (`stock.alert_state`) tant que sa condition dure. On n'est prévenu qu'à son apparition, et de nouveau seulement si elle disparaît puis revient. Couper une règle oublie ses alertes. Plusieurs instances de l'API peuvent tourner : seule celle qui enregistre l'alerte prévient.
- **Qui est prévenu** : le propriétaire et les gérants, dans l'application et par e-mail. Un avis par règle et par passage liste les articles, lots ou fournisseurs concernés. L'e-mail se coupe type par type dans « Paramètres › Notifications » (D26, D45).
- **Où se règle** : l'onglet « Alertes » de « Paramètres » (D45). Un premier bouton sur le tableau de bord a été jugé incohérent : le tableau montre les alertes, il ne les règle pas. Le maximum se saisit à côté du seuil, sur la fiche article.

## D45. Paramètres de l'entreprise et KYB déclaratif (2026-10-20)

Prolonge D6 (KYB), D26 (notifications), D33 (règles de travail) et D44 (alertes). Un réglage posé sur l'écran qui en montre l'effet s'est révélé incohérent : les réglages ont leur entrée de menu.

- **« Paramètres »** (`/parametres`), dans le compartiment Administration, ouvert à tous. Ses onglets suivent les mêmes droits que l'API, et un onglet hors des droits n'est ni proposé ni affiché :
  - **Entreprise** : la fiche et le KYB, au propriétaire et aux administrateurs (le module Plateforme ne connaît pas les rôles Stock) ;
  - **Alertes** (D44) : au propriétaire, aux administrateurs et aux gérants ;
  - **Règles de travail** (D33), sorties de l'écran « Équipe » : au propriétaire et aux administrateurs ;
  - **Notifications** (D26), anciennement `/notifications` : à chacun, pour soi.
- **Navigation** : les onglets en colonne à gauche sur grand écran (1280 px et plus). Plus étroit, ils passent au-dessus du contenu, sur une ligne, ou deux par ligne sur téléphone, sans qu'aucun ne soit coupé.
- **La fiche** : nom, secteur, ville, nom du responsable, téléphone (normalisé au format international, l'indicatif du pays est ajouté s'il manque), adresse, et les identifiants du pays. Les types d'identifiants viennent du référentiel des pays (`platform.country.business_id_types` : RCCM et NIU au Cameroun) et sont rangés dans `platform.organization_business_id`, pas en colonnes. La fiche porte une version : une modification faite ailleurs entre-temps est refusée.
- **Le logo**, dans la fiche, enregistré dès le dépôt : une image (JPEG, PNG, WebP, 5 Mo au plus) qui remplace les initiales de l'entreprise dans le sélecteur d'entreprise. Ce n'est pas une pièce du KYB : il se montre aux membres par lien signé, comme les photos d'articles, sans chiffrement ni journal (`platform.organization.logo_key`).
- **Les pièces**, une par sorte : pièce d'identité du gérant, photo du local, et un justificatif par identifiant. Photo (JPEG, PNG, WebP) ou PDF, reconnus à leur contenu, 5 Mo au plus. Déposée, une pièce remplace la précédente, qui est effacée du stockage.
- **Niveaux, calculés par l'API** : 0 à l'inscription ; 1 (« Déclarée ») avec le nom du responsable, la pièce du gérant, et l'adresse ou la photo du local ; 2 (« Vérifiée ») quand Kreskala approuve. La demande de vérification s'envoie quand chaque identifiant et son justificatif sont là ; elle passe « En attente de vérification ». Changer un identifiant ou un justificatif remet la vérification à zéro : la décision portait sur ce qui avait été déposé.
- **Sécurité des pièces** (D6) : chiffrées par l'API (AES-GCM, clé `KYB_ENCRYPTION_KEY`) avant le stockage, qui ne voit que des octets ; jamais de lien signé : elles ne se lisent que par l'API, sans cache, et chaque dépôt, lecture ou retrait est inscrit dans `platform.kyb_document_access`, qui survit à la pièce.
- **Pas encore de back-office** : la demande se repère dans les journaux et en base ; l'approbation (statut `APPROVED`, niveau 2) et le refus viendront avec lui.
- **Écart au modèle D10** : la fiche (`responsible_name`, `kyb_requested_at`, `version`, `logo_key`), les identifiants et les pièces n'y figuraient pas.

## D46. « Mon profil » de la personne connectée (2026-10-20)

Prolonge D17 (comptes Keycloak) et D45 (paramètres). Les réglages de l'entreprise sont dans « Paramètres » ; ceux de la personne, valables dans toutes ses entreprises, ont leur page.

- **« Mon profil »** (`/profil`), ouvert depuis le menu du compte (en bas de la barre latérale), à chacun et quel que soit son rôle.
- **Photo de profil** : enregistrée dès le dépôt, une image (JPEG, PNG, WebP, 5 Mo au plus) reconnue à son contenu. Elle remplace les initiales dans le menu du compte et dans l'écran « Équipe », et accompagne le nom de qui a validé ou préparé un bon (liste et bon). Le bon garde le nom du moment ; la photo, elle, est celle d'aujourd'hui, lue par la Plateforme (`UserDirectory.photoLinks`). Elle se montre aux membres par lien signé, comme le logo (`platform.user_account.photo_key`). Remplacée ou retirée, l'ancienne est effacée du stockage.
- **Prénom et nom** : modifiables, ils signent les bons et les inventaires.
- **L'adresse e-mail** ne se modifie pas : c'est l'identifiant de connexion, et la changer demande une vérification que Keycloak gère seul. Elle se lit sur la page.
- **Langue** : enregistrée par l'API (`PUT /v1/me/locale`, français ou anglais), parce que les e-mails et les avis partent dans la langue de la personne ; le cookie change aussi la langue de l'écran tout de suite. Le menu du compte fait de même.
- **Mot de passe** : jamais envoyé à l'API Kreskala. Le bouton lance l'action Keycloak `UPDATE_PASSWORD` (« application-initiated action ») sur les pages de connexion de Kreskala. Keycloak demande d'abord le mot de passe actuel, l'adresse étant pré-remplie (`login_hint`) : avec le jeton hors ligne (`offline_access`), il ne garde pas de session de connexion, et c'est aussi la preuve que la personne connaît l'actuel. Le retour sur « Mon profil » et le résultat (`kc_action_status`) passent par la session du navigateur.
- **Écart au modèle D10** : `photo_key` n'y figurait pas.

## D47. Documents PDF au nom de l'entreprise (2026-10-20)

Prolonge D36 (étiquettes), D45 (fiche et logo) et les bons et fiches d'articles en PDF. Un document imprimé est celui de l'entreprise : c'est elle qui le remet à un fournisseur, un client ou un chauffeur.

- **En-tête commun** aux documents A4 (bons, fiches d'articles) : le logo de l'entreprise en premier (proportions gardées, PNG net et transparent), son nom, puis ses coordonnées et identifiants (adresse et ville, téléphone, RCCM et NIU renseignés) ; à droite, la nature du document et son numéro. Sans logo, le nom prend sa place.
- **Charte sobre** : encre, gris et filets, sans les couleurs de Kreskala ; seuls les états du stock gardent leur couleur, parce qu'elle a un sens.
- **Kreskala en mention** : « Édité avec Kreskala », discret, en bas à droite de chaque page.
- **En-tête lisible par chaque membre** (`GET /v1/company/letterhead`) : un magasinier imprime aussi des bons. Il ne porte que ce qui s'imprime ; la fiche complète et les pièces restent aux gérants (D45). Hors connexion, le document part avec le nom et la ville connus.
- **Étiquettes** : inchangées dans leur principe (code, nom, référence), plus aérées.

## D48. Recette sur un VPS, déployée par la CI (2026-10-21)

La branche `develop` est essayée sur un environnement de recette avant de passer sur `main`.

- **Un seul point d'entrée** : le Caddy du serveur, partagé avec d'autres projets (ports 80 et 443, certificats Let's Encrypt) ; les conteneurs n'écoutent que sur 127.0.0.1. Adresses en sous-domaines de `mboumgni.dev` pour la recette. Trois adresses publiques, une par service que le navigateur appelle : l'application web, l'API et Keycloak (une quatrième pour la boîte Mailpit de la recette, protégée par mot de passe). L'application web s'exécute dans le navigateur : c'est lui, et non le serveur Next.js, qui appelle l'API et Keycloak ; les garder sur le réseau privé couperait l'application. PostgreSQL n'est jamais exposé.
- **L'API lit les clés de Keycloak par le réseau privé** ; l'émetteur des jetons reste l'adresse publique de Keycloak (`KC_HOSTNAME`).
- **Images Docker sur ghcr.io** (`stock-web`, `stock-api`, `stock-keycloak`), étiquetées `develop` et SHA du commit, pour revenir à une version. Configuration lue au démarrage : la même image servira la production.
- **Déploiement** : à chaque push sur `develop` (fusion de pull request comprise), après les vérifications, par une clé SSH qui ne peut lancer que `deploy.sh`. Chaque dépôt met à jour son composant (web ; API avec Keycloak), vérifie qu'il répond et revient sinon à la version précédente. Inactif tant que la variable `RECETTE_SSH_HOST` n'est pas définie. La pile est décrite dans `stock-api/deploy/recette` ; les secrets restent dans le `.env` du serveur.
- **Pas de sauvegarde automatique** de la recette pour l'instant.
- **Fichiers dans Cloudflare R2** dès la recette (D20) : compartiment privé `kreskala-recette`, servi par l'API sur liens signés ; la production aura le sien.
- **E-mails envoyés par Resend** (API et Keycloak), expéditeur `no-reply@mboumgni.dev` ; Mailpit reste en secours. Codes de connexion par téléphone dans les journaux de Keycloak, faute de fournisseur.

## Questions ouvertes
- [ ] Protection serveur de `main` : passer à GitHub Pro, ou utiliser une organisation GitHub (plan Team).
- [ ] Nom de la marque et nom du produit de stock (voir D7). Pistes : Kreskala, Kreskio, Tissero, NarvalWorks, FourmiLabs.
- [ ] Texte exact de la loi camerounaise sur les données personnelles et obligations associées.
- [ ] Agrégateur de paiement mobile money.
- [ ] Fournisseur d'envoi d'e-mails en production (D17).

## D49. Journal des mouvements pour le propriétaire (2026-10-28)

Constat en recette : le propriétaire ne savait rien des bons validés par son équipe (seules les alertes de seuil, d'écart et de transfert le prévenaient). Complète D26.

- **Quoi** : chaque bon validé par un autre membre prévient le propriétaire, dans l'application et par e-mail : un avis par bon, avec qui l'a validé, le tiers ou le motif, puis, article par article, la variation (« − 40 m ») et le stock qui reste dans le dépôt, marqué « stock bas » ou « rupture » s'il y a lieu. Au-delà de 20 articles (import, inventaire), l'avis compte les autres.
- **Trois types**, pour régler l'e-mail séparément (« Paramètres › Notifications ») : entrées (réception, retour client), sorties (sortie, retour fournisseur), corrections (casse, ajustement, clôture d'inventaire, stock de départ). E-mail activé par défaut, comme les autres types ; l'avis dans l'application reste toujours.
- **Pas d'avis** pour ses propres bons, ni pour les transferts, qui le préviennent déjà (D27). Les alertes (seuil, écart, alertes paramétrables) restent des avis distincts : le journal dit ce qui s'est passé, l'alerte ce qu'il faut faire.
- **Qui** : le propriétaire seulement ; l'ouvrir aux gérants demandera de pouvoir couper aussi l'avis dans l'application.


## D50. Corrections après l'audit de recette (2026-11-03)

L'audit de recette (`kreskala-audit.md`, bugs 1 à 19) relève des bons qui faussent le stock et des écrans qui égarent. Complète D21, D27, D31, D33 et D43.

- **Réception d'un transfert** : jamais plus que l'envoi, ligne par ligne ; l'API refuse (`transfer-received-exceeds-sent`) et l'écran le dit sous la ligne. Seul ce qui manque est signalé.
- **Date des bons** : au plus 7 jours en arrière par défaut, réglable de 0 à 365 jours par le propriétaire et les administrateurs (« Paramètres › Règles de travail ») ; un gérant peut aller au-delà. Jamais avant le jour, dans le fuseau des dépôts, où le dépôt ou l'article est entré dans l'application. La clôture de période n'est pas faite.
- **Retours sans bon d'origine** : le client ou le fournisseur est exigé, avec une raison dans la note. Un retour client libre est réservé à qui peut corriger le stock du dépôt ; les autres partent de la sortie d'origine, proposée à l'écran.
- **Articles du même nom** : les noms se comparent sans la casse ni les espaces en trop, parmi les articles actifs. Créer un deuxième article du même nom demande une confirmation (`allowSameName`) ; la saisie prévient dès que le nom est tapé. L'import repère les doublons dans le fichier et au catalogue (nom ou code-barres) et propose « ignorer » ou « créer quand même » ; « mettre à jour l'article existant » n'est pas fait.
- **Écart** : sur l'historique d'un article, le badge ne vaut que pour sa ligne du bon.
- **Téléphones** des fournisseurs et clients : vérifiés selon le pays de l'entreprise (au Cameroun, +237 et 9 chiffres ; un numéro étranger, sous sa forme internationale), et gardés tels que saisis. Un numéro saisi avant la règle ne bloque pas la modification du reste de la fiche.
- **Validation d'un bon** : un écart avec le bon de livraison, une perte en route sur un transfert ou une date antérieure à aujourd'hui demandent une confirmation, le bon ne se modifiant plus. Après validation, un rappel reste à l'écran avec le lien vers le bon, jusqu'au suivant.
- **Réception dans un dépôt où l'article n'est pas proposé** : permise (D21), mais la ligne le dit avant validation.
- **Rapports** : toujours sans entrée de menu (D43) ; un bouton « Rapports » en tête du tableau de bord, avec les filtres en cours.
- **« À commander »** compte les articles au seuil, sans les ruptures, partout sur le tableau de bord ; les cartes le précisent.
- **Démarrage** : l'application part de la dernière configuration reçue et la relit en arrière-plan, au lieu de l'attendre à chaque rechargement.
