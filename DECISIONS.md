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

## Questions ouvertes
- [ ] Protection serveur de `main` : passer à GitHub Pro, ou utiliser une organisation GitHub (plan Team).
- [ ] Nom de la marque et nom du produit de stock (voir D7). Pistes : Kreskala, Kreskio, Tissero, NarvalWorks, FourmiLabs.
- [ ] Texte exact de la loi camerounaise sur les données personnelles et obligations associées.
- [ ] Agrégateur de paiement mobile money.
- [ ] Fournisseur d'envoi d'e-mails en production (D17).
