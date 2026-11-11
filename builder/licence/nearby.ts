/*
 * Which shop a computer was downloaded for, when its connection has more
 * than one download waiting. No database here, so the rule can be tested
 * with plain values; activation-token.ts does the reading and the taking.
 *
 * One shop waiting is that shop, as always. Two shops used to be nobody's:
 * "two shops downloaded from one connection, a café's Wi-Fi for one, and
 * neither is guessed at". That stays true between two shops this computer
 * has never seen. But a shop the computer already runs is not a stranger's:
 * an owner who tries a wash, then builds a transport company and downloads
 * that, has two downloads on his connection and means the second. Before
 * this rule the software found the question ambiguous, said nothing, and
 * kept opening the wash (Adel's Mac, 2026-11-10).
 */

export type Here = {
  /* The shop open on this computer now, when it has one. */
  open: string | null;
  /* Shops this very computer is already a device of, whichever is open. */
  held: string[];
};

/**
 * The shop meant, from the shops with a download waiting on this connection,
 * newest download first.
 *
 * `newestWins` is for OUAQT's own test devices, which download shop after
 * shop on purpose: with several strangers left, the last one built is the
 * one being tried.
 */
export function shopDownloaded(waiting: string[], here: Here, newestWins: boolean): string | "none" | "ambiguous" {
  const shops = [...new Set(waiting)];
  if (shops.length === 0) return "none";
  if (shops.length === 1) return shops[0];

  const known = new Set([...(here.open ? [here.open] : []), ...here.held]);
  const others = shops.filter((shop) => !known.has(shop));
  if (others.length === 1) return others[0];
  if (others.length > 1) return newestWins ? others[0] : "ambiguous";

  /* Only shops already on this computer: the open one is brought up to date, as a single download of it would be. */
  if (here.open && shops.includes(here.open)) return here.open;
  return newestWins ? shops[0] : "ambiguous";
}
