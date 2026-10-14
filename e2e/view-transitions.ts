import type { Page } from "@playwright/test"

/**
 * Enregistre les types des transitions de vue lancées par la page (API View Transitions du
 * navigateur), pour vérifier que les changements d'écran sont bien animés. La fonction renvoyée
 * lit la liste complète depuis le début de l'enregistrement, sans la vider (utilisable avec expect.poll).
 */
export async function recordViewTransitions(page: Page): Promise<() => Promise<string[]>> {
  await page.evaluate(() => {
    const recorded: string[] = []
    Object.assign(window, { __viewTransitions: recorded })
    const original = document.startViewTransition.bind(document)
    document.startViewTransition = ((options: StartViewTransitionOptions) => {
      recorded.push(...(options?.types ?? []))
      return original(options)
    }) as typeof document.startViewTransition
  })
  return () => page.evaluate(() => [...(window as unknown as { __viewTransitions: string[] }).__viewTransitions])
}
