import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { isAppLocale, LOCALE_COOKIE, negotiateLocale } from "./locales"

export default getRequestConfig(async () => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isAppLocale(chosen)
    ? chosen
    : negotiateLocale((await headers()).get("accept-language"))

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
