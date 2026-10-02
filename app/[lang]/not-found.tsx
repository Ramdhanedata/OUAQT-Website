import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale, isLocale, languageCookie } from "@/lib/i18n/config";

/*
 * not-found.tsx cannot read route params, so it speaks the language the
 * visitor last read the site in, which the middleware remembers, and the
 * default one on a first visit. The header and footer around it follow the
 * address, and the button opens the home page in the visitor's own language.
 */
export default async function NotFound() {
  const remembered = (await cookies()).get(languageCookie)?.value ?? "";
  const dict = getDictionary(isLocale(remembered) ? remembered : defaultLocale);

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium tracking-tight text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {dict.notFound.heading}
      </h1>
      <p className="mt-4 max-w-sm text-muted-foreground">{dict.notFound.body}</p>
      <div className="mt-8">
        <Button href="/" variant="accent">
          {dict.notFound.cta}
        </Button>
      </div>
    </Container>
  );
}
