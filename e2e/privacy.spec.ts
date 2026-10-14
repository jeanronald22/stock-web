import { expect, test } from "@playwright/test"

test("la politique de confidentialité s'ouvre depuis les écrans de connexion, dans leur langue", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/connexion")
  await expect(
    page.getByRole("heading", { name: "Ravis de vous revoir" })
  ).toBeVisible()

  const opened = context.waitForEvent("page")
  await page.getByRole("link", { name: "politique de confidentialité" }).click()
  const policy = await opened
  await expect(
    policy.getByRole("heading", {
      level: 1,
      name: "Politique de confidentialité",
    })
  ).toBeVisible()
  await expect(
    policy.getByRole("link", { name: "confidentialite@kreskala.com" }).first()
  ).toBeVisible()
  await policy.screenshot({
    path: testInfo.outputPath("politique-fr.png"),
    fullPage: true,
  })

  // La mention figure aussi à l'inscription ; en anglais, le lien ouvre la version anglaise.
  await page.getByRole("link", { name: "Créer un compte" }).click()
  await page.getByRole("link", { name: "EN", exact: true }).click()
  const openedEn = context.waitForEvent("page")
  await page.getByRole("link", { name: "privacy policy" }).click()
  await expect(
    (await openedEn).getByRole("heading", { level: 1, name: "Privacy policy" })
  ).toBeVisible()
})
