/**
 * Boîte de réception factice Mailpit (compose.yaml de stock-api) : lit le lien envoyé par Keycloak
 * (confirmation d'adresse, mot de passe oublié).
 */
const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? "http://localhost:8025"
const KEYCLOAK_ACTION_LINK =
  /https?:\/\/[^\s"<>]+\/login-actions\/action-token\?[^\s"<>]+/

type MailpitList = { messages: { ID: string; To: { Address: string }[] }[] }
type MailpitMessage = { Text: string }

export async function waitForActionLink(
  recipient: string,
  timeoutMs = 15_000
): Promise<string> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const list = (await (
      await fetch(`${MAILPIT_URL}/api/v1/messages`)
    ).json()) as MailpitList
    const message = list.messages.find((candidate) =>
      candidate.To.some((to) => to.Address === recipient)
    )
    if (message) {
      const detail = (await (
        await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)
      ).json()) as MailpitMessage
      const link = detail.Text.match(KEYCLOAK_ACTION_LINK)?.[0]
      if (link) return link.replaceAll("&amp;", "&")
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Aucun e-mail de Keycloak reçu pour ${recipient}`)
}
