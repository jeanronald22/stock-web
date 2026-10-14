import type { PrivacyPolicyContent } from "@/lib/legal/privacy-policy"

/** English version of the privacy policy: kept in step with privacy-policy.fr.ts (DECISIONS.md, D18). */
export const privacyPolicyEn: PrivacyPolicyContent = {
  title: "Privacy policy",
  summary:
    "Your stock and your data remain yours. This page explains, without jargon, which data Kreskala uses, why, and how you stay in control of it.",
  updatedOnLabel: "Updated on",
  versionLabel: "Version",
  contentsLabel: "Contents",
  sections: [
    {
      id: "responsable",
      title: "Who is responsible for your data",
      blocks: [
        {
          kind: "paragraph",
          text: "Kreskala publishes the Kreskala stock management software. For your account data, Kreskala is the data controller within the meaning of Cameroon’s Law No. 2024/017 of 23 December 2024 on the protection of personal data.",
        },
        {
          kind: "paragraph",
          text: "For the data your business records in Kreskala (items, depots, vouchers, team members), your business is the data controller. Kreskala then acts on its behalf, only on its instructions, and never uses this data for its own purposes.",
        },
        {
          kind: "paragraph",
          text: "For any question about your data, write to us at {contact}.",
        },
      ],
    },
    {
      id: "donnees",
      title: "The data we use",
      blocks: [
        { kind: "paragraph", text: "We only collect what the service needs:" },
        {
          kind: "list",
          items: [
            "Your account: email address, password, first name, last name and preferred language. Your password is never stored in clear text: we only keep an irreversible fingerprint of it.",
            "Your business: name, city, country, line of business, and your role in it (owner, administrator or member).",
            "Receipt and issue vouchers: your name appears on them when you approve them, with the supplier or customer you enter. An approved voucher is never changed: it is your stock’s record.",
            "The item photos you upload. Choose photos of products: avoid photos in which a person can be recognised.",
            "Technical sign-in data: date and time, IP address, browser type, and a trace code attached to each error so we can fix it.",
          ],
        },
        {
          kind: "paragraph",
          text: "We do not collect your location, your contacts or your payment details, and we show no advertising.",
        },
      ],
    },
    {
      id: "finalites",
      title: "Why we use it",
      blocks: [
        {
          kind: "list",
          items: [
            "Creating your account, signing you in and protecting your access: this is necessary to provide the service.",
            "Setting up your business’s workspace and checking, on every action, that you are a member: this is necessary to provide the service and to keep each business’s data separate.",
            "Sending you service emails (address confirmation, new password): this is necessary to provide the service.",
            "Detecting abuse and intrusion attempts, fixing errors: this is our legitimate interest in offering a safe and reliable service.",
          ],
        },
        {
          kind: "paragraph",
          text: "We will not send you any marketing message without your prior agreement, which you can withdraw at any time.",
        },
      ],
    },
    {
      id: "appareil",
      title: "What Kreskala keeps on your device",
      blocks: [
        {
          kind: "paragraph",
          text: "To work, including offline, Kreskala stores on your phone or computer:",
        },
        {
          kind: "list",
          items: [
            "your sign-in tokens, so you do not have to sign in every time you open it;",
            "the business you chose, kept separately for each account;",
            "the app’s language.",
          ],
        },
        {
          kind: "paragraph",
          text: "These are strictly necessary for the service. Kreskala uses no advertising cookies and no audience measurement tools. Signing out erases your sign-in tokens from the device.",
        },
      ],
    },
    {
      id: "destinataires",
      title: "Who can access it",
      blocks: [
        {
          kind: "list",
          items: [
            "Members of your business see that business’s data, according to their role. They never see another business’s data.",
            "Kreskala’s teams only access it when needed: support you asked for, fixing an error, security.",
            "Our technical providers act only on our instructions and are bound by confidentiality. Item photos are kept at Cloudflare (R2 service), in a private space: they are only shown through temporary links, given only to members of your business. The full list (hosting, email delivery) will be published here before the service opens.",
          ],
        },
        {
          kind: "paragraph",
          text: "We do not sell or rent your data to anyone. We only disclose it to an authority when the law requires us to.",
        },
      ],
    },
    {
      id: "hebergement",
      title: "Where your data is",
      blocks: [
        {
          kind: "paragraph",
          text: "The country where your data is hosted will be stated here before the service opens. Should any data be transferred outside Cameroon, the transfer would meet the conditions set by Law No. 2024/017, including authorisation from the data protection authority where required.",
        },
      ],
    },
    {
      id: "conservation",
      title: "How long we keep it",
      blocks: [
        {
          kind: "list",
          items: [
            "Your account and business data: as long as your account is open. When it is closed, the data is deleted, except what the law requires us to keep.",
            "Your session: it closes after one day of inactivity, and after seven days at most.",
            "Offline access: it stays valid for thirty days without a connection, and ninety days at most. You then need to sign in again.",
            "Links sent by email: thirty minutes.",
            "Item photos: as long as the item has that photo. Once replaced or removed, the previous photo is erased straight away.",
          ],
        },
      ],
    },
    {
      id: "securite",
      title: "How we protect it",
      blocks: [
        {
          kind: "list",
          items: [
            "Exchanges between your device and our servers are encrypted.",
            "Each business is isolated: on every request we check that you are a member, and the database itself refuses to mix two businesses’ data.",
            "Passwords are protected by an irreversible fingerprint, and repeated sign-in attempts are slowed down.",
            "Sign-in access expires quickly: a stolen token only works for a few minutes.",
          ],
        },
        {
          kind: "paragraph",
          text: "If a data breach put you at risk, we would inform you and the data protection authority, as the law requires.",
        },
      ],
    },
    {
      id: "droits",
      title: "Your rights",
      blocks: [
        { kind: "paragraph", text: "Law No. 2024/017 gives you the right:" },
        {
          kind: "list",
          items: [
            "to know which data we hold about you and to get a copy;",
            "to have it corrected or completed;",
            "to have it erased;",
            "to object to its use or ask for it to be restricted;",
            "to receive it in a common format, to pass it on to another service;",
            "to withdraw at any time an agreement you gave us.",
          ],
        },
        {
          kind: "paragraph",
          text: "To exercise these rights, write to us at {contact} from your account’s address. We reply within one month at the latest.",
        },
        {
          kind: "paragraph",
          text: "If our answer does not satisfy you, you can refer the matter to the personal data protection authority established by Law No. 2024/017.",
        },
      ],
    },
    {
      id: "mineurs",
      title: "A service for professionals",
      blocks: [
        {
          kind: "paragraph",
          text: "Kreskala is meant for businesses and their teams. It is not intended for people under 18.",
        },
      ],
    },
    {
      id: "modifications",
      title: "Changes to this policy",
      blocks: [
        {
          kind: "paragraph",
          text: "Kreskala is growing, and this policy grows with it: every new feature that uses data is described here before it goes live. The date and version at the top of the page show the latest update. For any significant change, we will let you know by email or in the app.",
        },
      ],
    },
  ],
}
