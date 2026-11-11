import { redirect } from "next/navigation";

/*
 * Contrôle is now the clients page: one list of every shop, each with the
 * actions its state allows. This address stays for the links and bookmarks
 * that point at it, and sends them on with their filter and their search.
 */

type Props = { searchParams: Promise<{ f?: string; q?: string }> };

export default async function ControlPage(props: Props) {
  const params = await props.searchParams;
  const query = new URLSearchParams();
  if (params.f) query.set("f", params.f);
  if (params.q) query.set("q", params.q);
  const text = query.toString();
  redirect(`/admin/clients${text ? `?${text}` : ""}`);
}
