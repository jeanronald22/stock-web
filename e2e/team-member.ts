import type { Browser, Page, TestInfo } from "@playwright/test"
import { expect } from "@playwright/test"

import { waitForActionLink } from "./mailbox"
import { callApi, dismissTour, PASSWORD, redirectApi } from "./support"

type Invitation = { invitation: { id: string }; link: string }

/**
 * Un membre rejoint l'entreprise de [page] avec un rôle Stock : invitation par l'API, puis création
 * de compte depuis le lien, comme une vraie personne. Renvoie sa page, connectée, sur l'accueil.
 */
export async function joinTeam(
  page: Page,
  browser: Browser,
  testInfo: TestInfo,
  stockRole: string,
  warehouseIds: string[],
  name = { first: "Paul", last: "Etoga" }
): Promise<Page> {
  const email = `membre.${Date.now()}.${testInfo.project.name}@exemple.cm`
  const sent = await callApi<Invitation>(page, "POST", "/v1/team/invitations", {
    id: crypto.randomUUID(),
    email,
    role: "MEMBER",
  })
  await callApi(
    page,
    "PUT",
    `/v1/stock/access/invitations/${sent.invitation.id}`,
    {
      role: stockRole,
      warehouseIds,
    }
  )

  const context = await browser.newContext({
    viewport: page.viewportSize() ?? undefined,
  })
  await redirectApi(context)
  const member = await context.newPage()
  await member.goto(sent.link)
  await member.getByRole("button", { name: "Créer mon compte" }).click()
  await member.getByLabel("Adresse e-mail").fill(email)
  await member.getByRole("button", { name: "Continuer" }).click()
  await member.goto(await waitForActionLink(email))
  await member.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD)
  await member.getByLabel("Confirmez le mot de passe").fill(PASSWORD)
  await member.getByRole("button", { name: "Enregistrer et continuer" }).click()
  await member.getByLabel("Prénom").fill(name.first)
  await member.getByLabel("Nom", { exact: true }).fill(name.last)
  await member.getByRole("button", { name: /^Rejoindre / }).click()
  await expect(member.getByText(`Bonjour ${name.first},`)).toBeVisible()
  await dismissTour(member, "Tout est ici")
  return member
}
