import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale } from "@/lib/i18n/config";

/*
 * not-found.tsx cannot read route params in Next 14, so this falls back to the
 * default locale. Everything else on the site is properly localised.
 */
export default function NotFound() {
  const dict = getDictionary(defaultLocale);

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium tracking-tight text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {dict.notFound.heading}
      </h1>
      <p className="mt-4 max-w-sm text-muted-foreground">{dict.notFound.body}</p>
      <div className="mt-8">
        <Button href={`/${defaultLocale}`} variant="accent">
          {dict.notFound.cta}
        </Button>
      </div>
    </Container>
  );
}
