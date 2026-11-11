import "server-only";

import { unstable_cache } from "next/cache";

/*
 * Whether the installers the site hands out are really there.
 *
 * The settings hold an address per trade and per system, and an address can
 * be typed right and still lead nowhere: a release published without its
 * Mac file answers "not found" to every owner who presses Download, and
 * nothing on our side says so. So each different address is asked, without
 * downloading anything, whether it has a file behind it.
 *
 * The releases answer with a redirect that names the version in its path
 * (…/download/v0.1.76/…), which is how the board knows what is published.
 *
 * Asked once every ten minutes at most, whoever has the overview open: the
 * page re-reads itself every fifteen seconds and the files do not change
 * that fast.
 */

const WAIT_MS = 4_000;
const RECHECK_SECONDS = 600; // not-a-rule: how long an answer is kept before asking again

export type FileCheck = { name: string; ok: boolean | null };
export type DownloadCheck = { version: string | null; files: FileCheck[] };

async function ask(url: string): Promise<{ ok: boolean | null; version: string | null }> {
  if (!/^https:\/\//i.test(url)) return { ok: false, version: null };
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(WAIT_MS) });
    const version = /\/download\/(v?\d[^/]*)\//.exec(response.headers.get("location") ?? "")?.[1] ?? null;
    /* A redirect is the file's real address, which is what a present file answers with. */
    return { ok: response.status < 400, version };
  } catch {
    /* No answer in time is not "missing": it is not knowing. */
    return { ok: null, version: null };
  }
}

const read = unstable_cache(
  async (urls: string[]): Promise<DownloadCheck> => {
    const answers = await Promise.all(urls.map(ask));
    return {
      version: answers.find((one) => one.version)?.version ?? null,
      files: urls.map((url, index) => ({ name: url.split("/").pop() || url, ok: answers[index].ok })),
    };
  },
  ["admin-download-check"],
  { revalidate: RECHECK_SECONDS }
);

/** Every different address once, in a steady order so the same set is the same question. */
export function checkDownloads(urls: string[]): Promise<DownloadCheck> {
  return read([...new Set(urls.filter(Boolean))].sort());
}
