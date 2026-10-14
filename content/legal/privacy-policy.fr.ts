import type { PrivacyPolicyContent } from "@/lib/legal/privacy-policy"

/**
 * Politique de confidentialité, fondée sur la loi n° 2024/017 du 23 décembre 2024 relative à la
 * protection des données à caractère personnel au Cameroun. Elle ne décrit que ce que Kreskala
 * fait réellement aujourd'hui ; chaque nouvelle fonctionnalité la complète (DECISIONS.md, D18).
 */
export const privacyPolicyFr: PrivacyPolicyContent = {
  title: "Politique de confidentialité",
  summary:
    "Votre stock et vos données restent les vôtres. Cette page explique, sans jargon, quelles données Kreskala utilise, pourquoi, et comment vous gardez la main sur elles.",
  updatedOnLabel: "Mise à jour le",
  versionLabel: "Version",
  contentsLabel: "Sommaire",
  sections: [
    {
      id: "responsable",
      title: "Qui est responsable de vos données",
      blocks: [
        {
          kind: "paragraph",
          text: "Kreskala édite le logiciel de gestion de stock Kreskala. Pour les données de votre compte, Kreskala est responsable du traitement au sens de la loi n° 2024/017 du 23 décembre 2024 relative à la protection des données à caractère personnel au Cameroun.",
        },
        {
          kind: "paragraph",
          text: "Pour les données que votre entreprise enregistre dans Kreskala (articles, dépôts, bons, membres de l’équipe), votre entreprise est responsable du traitement. Kreskala agit alors pour son compte, uniquement selon ses instructions, et n’utilise jamais ces données à ses propres fins.",
        },
        {
          kind: "paragraph",
          text: "Pour toute question sur vos données, écrivez-nous à {contact}.",
        },
      ],
    },
    {
      id: "donnees",
      title: "Les données que nous utilisons",
      blocks: [
        {
          kind: "paragraph",
          text: "Nous ne collectons que ce qui est nécessaire au service :",
        },
        {
          kind: "list",
          items: [
            "Votre compte : adresse e-mail, mot de passe, prénom, nom et langue préférée. Votre mot de passe n’est jamais conservé en clair : nous n’en gardons qu’une empreinte irréversible.",
            "Votre entreprise : nom, ville, pays, activité, et votre rôle dans l’entreprise (propriétaire, administrateur ou membre).",
            "Les bons de réception et de sortie : votre nom y figure quand vous les validez, avec le fournisseur ou le client que vous indiquez. Un bon validé n’est jamais modifié : c’est le registre de votre stock.",
            "Les coordonnées de vos fournisseurs (nom, téléphone, e-mail, adresse) : votre entreprise en est responsable, Kreskala les conserve pour elle.",
            "Les photos d’articles que vous déposez. Choisissez des photos de produits : évitez qu’on y reconnaisse une personne.",
            "Les données techniques de connexion : date et heure, adresse IP, type de navigateur, et un code de suivi associé à chaque erreur pour pouvoir la corriger.",
          ],
        },
        {
          kind: "paragraph",
          text: "Nous ne collectons ni votre position, ni vos contacts, ni vos données de paiement, et nous n’affichons aucune publicité.",
        },
      ],
    },
    {
      id: "finalites",
      title: "Pourquoi nous les utilisons",
      blocks: [
        {
          kind: "list",
          items: [
            "Créer votre compte, vous connecter et protéger votre accès : c’est nécessaire pour vous fournir le service.",
            "Préparer l’espace de votre entreprise et vérifier, à chaque action, que vous en êtes bien membre : c’est nécessaire pour vous fournir le service et pour isoler les données de chaque entreprise.",
            "Vous envoyer les e-mails du service (confirmation de votre adresse, nouveau mot de passe) : c’est nécessaire pour vous fournir le service.",
            "Détecter les abus et les tentatives d’intrusion, corriger les erreurs : c’est notre intérêt légitime à offrir un service sûr et fiable.",
          ],
        },
        {
          kind: "paragraph",
          text: "Nous ne vous enverrons aucun message commercial sans votre accord préalable, et vous pourrez le retirer à tout moment.",
        },
      ],
    },
    {
      id: "appareil",
      title: "Ce que Kreskala garde sur votre appareil",
      blocks: [
        {
          kind: "paragraph",
          text: "Pour fonctionner, y compris sans réseau, Kreskala enregistre sur votre téléphone ou votre ordinateur :",
        },
        {
          kind: "list",
          items: [
            "vos jetons de connexion, qui vous évitent de vous reconnecter à chaque ouverture ;",
            "l’entreprise que vous avez choisie, propre à chaque compte ;",
            "la langue de l’application.",
          ],
        },
        {
          kind: "paragraph",
          text: "Ce sont des éléments strictement nécessaires au service. Kreskala n’utilise aucun cookie publicitaire ni outil de mesure d’audience. Se déconnecter efface vos jetons de connexion de l’appareil.",
        },
      ],
    },
    {
      id: "destinataires",
      title: "Qui peut y accéder",
      blocks: [
        {
          kind: "list",
          items: [
            "Les membres de votre entreprise voient les données de cette entreprise, selon leur rôle. Ils ne voient jamais celles d’une autre entreprise.",
            "Les équipes de Kreskala n’y accèdent que lorsque c’est nécessaire : assistance que vous avez demandée, correction d’une erreur, sécurité.",
            "Nos prestataires techniques n’agissent que sur nos instructions et sont tenus à la confidentialité. Les photos d’articles sont conservées chez Cloudflare (service R2), dans un espace privé : elles ne s’affichent que par des liens temporaires, donnés aux seuls membres de votre entreprise. La liste complète (hébergement, envoi des e-mails) sera publiée ici avant l’ouverture du service.",
          ],
        },
        {
          kind: "paragraph",
          text: "Nous ne vendons ni ne louons vos données, à personne. Nous ne les communiquons à une autorité que lorsque la loi nous y oblige.",
        },
      ],
    },
    {
      id: "hebergement",
      title: "Où sont vos données",
      blocks: [
        {
          kind: "paragraph",
          text: "Le pays d’hébergement de vos données sera indiqué ici avant l’ouverture du service. Si des données devaient être transférées hors du Cameroun, ce transfert respecterait les conditions fixées par la loi n° 2024/017, y compris l’autorisation de l’autorité de protection des données lorsqu’elle est requise.",
        },
      ],
    },
    {
      id: "conservation",
      title: "Combien de temps nous les gardons",
      blocks: [
        {
          kind: "list",
          items: [
            "Les données de votre compte et de votre entreprise : tant que votre compte est ouvert. À sa fermeture, elles sont supprimées, sauf ce que la loi nous oblige à conserver.",
            "Votre session : elle se ferme après une journée sans activité, et au plus tard après sept jours.",
            "L’accès sans réseau : il reste valable trente jours sans connexion, et au plus quatre-vingt-dix jours. Il faut ensuite se reconnecter.",
            "Les liens envoyés par e-mail : trente minutes.",
            "Les photos d’articles : tant que l’article a cette photo. Remplacée ou retirée, l’ancienne photo est effacée aussitôt.",
          ],
        },
      ],
    },
    {
      id: "securite",
      title: "Comment nous les protégeons",
      blocks: [
        {
          kind: "list",
          items: [
            "Les échanges entre votre appareil et nos serveurs sont chiffrés.",
            "Chaque entreprise est isolée : à chaque requête, nous vérifions que vous en êtes membre, et la base de données elle-même refuse de mélanger les données de deux entreprises.",
            "Les mots de passe sont protégés par une empreinte irréversible, et les tentatives de connexion répétées sont freinées.",
            "Les accès de connexion expirent vite : un jeton volé ne sert que quelques minutes.",
          ],
        },
        {
          kind: "paragraph",
          text: "Si une violation de données présentait un risque pour vous, nous vous préviendrions, ainsi que l’autorité de protection des données, comme la loi l’exige.",
        },
      ],
    },
    {
      id: "droits",
      title: "Vos droits",
      blocks: [
        { kind: "paragraph", text: "La loi n° 2024/017 vous donne le droit :" },
        {
          kind: "list",
          items: [
            "de savoir quelles données nous avons sur vous et d’en obtenir une copie ;",
            "de les faire corriger ou compléter ;",
            "de les faire effacer ;",
            "de vous opposer à leur utilisation ou d’en demander la limitation ;",
            "de les récupérer dans un format courant, pour les transmettre à un autre service ;",
            "de retirer à tout moment un accord que vous nous avez donné.",
          ],
        },
        {
          kind: "paragraph",
          text: "Pour exercer ces droits, écrivez-nous à {contact} depuis l’adresse de votre compte. Nous vous répondons au plus tard dans un délai d’un mois.",
        },
        {
          kind: "paragraph",
          text: "Si notre réponse ne vous satisfait pas, vous pouvez saisir l’autorité de protection des données à caractère personnel instituée par la loi n° 2024/017.",
        },
      ],
    },
    {
      id: "mineurs",
      title: "Un service pour les professionnels",
      blocks: [
        {
          kind: "paragraph",
          text: "Kreskala s’adresse aux entreprises et à leurs équipes. Il n’est pas destiné aux personnes de moins de 18 ans.",
        },
      ],
    },
    {
      id: "modifications",
      title: "Les évolutions de cette politique",
      blocks: [
        {
          kind: "paragraph",
          text: "Kreskala grandit, et cette politique avec lui : chaque nouvelle fonctionnalité qui utilise des données y est décrite avant sa mise en service. La date et la version en haut de page indiquent la dernière mise à jour. En cas de changement important, nous vous prévenons par e-mail ou dans l’application.",
        },
      ],
    },
  ],
}
