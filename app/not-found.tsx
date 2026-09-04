import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium tracking-tight text-accent">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        This page doesn&rsquo;t exist.
      </h1>
      <p className="mt-4 max-w-sm text-muted-foreground">
        The page you&rsquo;re looking for may have been moved or removed.
      </p>
      <div className="mt-8">
        <Button href="/" variant="accent">
          Back to home
        </Button>
      </div>
    </Container>
  );
}
