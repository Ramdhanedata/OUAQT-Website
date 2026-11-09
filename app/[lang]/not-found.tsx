import { NotFoundMessage } from "@/components/not-found-message";
import { getDictionary } from "@/lib/i18n";
import { locales, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";

/*
 * An address under a language that matches no page. The header and footer
 * around it follow the address, and so does the message (see
 * components/not-found-message.tsx); the button opens the home page in the
 * visitor's own language.
 *
 * Nothing here may read cookies or headers: this file is rendered with every
 * page under /[lang], as the fallback of its not-found boundary, so reading
 * one makes the whole site render per request instead of being served from
 * the cache.
 */
export default function NotFound() {
  const copy = Object.fromEntries(
    locales.map((lang) => [lang, getDictionary(lang).notFound])
  ) as Record<Locale, Dictionary["notFound"]>;
  return <NotFoundMessage copy={copy} />;
}
