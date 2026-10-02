import { notFound } from "next/navigation";

/*
 * Any address under a language that matches no page. Without this the
 * framework answers with its own bare English 404, outside the site's header
 * and footer; through here it is not-found.tsx, inside them.
 */
export default function UnknownPage() {
  notFound();
}
