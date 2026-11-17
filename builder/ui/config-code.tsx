"use client";

import { formatAsTyped } from "@/builder/config-code/code";
import type { Pack } from "@/app-ui/packs";
import type { Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";

/*
 * The owner's own link to his software: the way to it on another computer or
 * phone, with nothing to type (Adel, 2026-11-17: "the user no need to copy
 * and paste any serial number").
 *
 * Every shop still has its numéro de série, for OUAQT's admin and for the
 * software itself. The owner never sees it: it travels after the # of his
 * link, which never reaches a server, and is taken off the address the
 * moment it is read.
 */

/*
 * What the box opened: the number, and what the download screen shows. A
 * shop made before its configuration was kept has no language of its own,
 * so the page stays in the one he is reading.
 */
export type Opened = {
  serial: string;
  /* Its shop exists already: a reinstall, or a shop past its trial. */
  made?: boolean;
  locale: Locale;
  pack: Pack | null;
  nameLatin: string;
  nameArabic: string;
};

/*
 * A number opened in this tab. Kept for the tab only: on a shop's shared
 * computer the next person to open the builder starts their own, and the
 * number can be typed again any time, since it is never used up.
 */
const OPENED_KEY = "ouaqt.builder.opened";
/* Set before moving to the builder in another language, read by it once. */
export const SWITCHED_FLAG = "ouaqt.builder.switched";

export function readOpened(): Opened | null {
  try {
    const raw = window.sessionStorage.getItem(OPENED_KEY);
    return raw ? (JSON.parse(raw) as Opened) : null;
  } catch {
    return null;
  }
}

export function forgetOpened(): void {
  try {
    window.sessionStorage.removeItem(OPENED_KEY);
  } catch {
    // Nothing kept.
  }
}

/*
 * Everything was answered on the phone: a number opened here goes straight to
 * the download, in the language the configuration was made in, with a note
 * when the page changed language for it.
 */
export function openInBuilder(opened: Opened, from: Locale): void {
  try {
    window.sessionStorage.setItem(OPENED_KEY, JSON.stringify(opened));
    if (opened.locale !== from) window.sessionStorage.setItem(SWITCHED_FLAG, from);
    else window.sessionStorage.removeItem(SWITCHED_FLAG);
  } catch {
    // Without session storage there is nowhere to carry the number to.
  }
  const target = localisedHref(opened.locale, "builder");
  if (window.location.pathname === target) window.location.reload();
  else window.location.href = target;
}

/* All eight characters: enough to look the number up. */
const COMPLETE = /^[A-Z0-9]{8}$/;

/* The mark after the # that carries the number in an owner's link. */
const LINK_MARK = "ouvrir";

/** The owner's link to his software, for another computer or phone: the builder opens on its download. */
export function shopLink(serial: string, language: Locale): string {
  return `${window.location.origin}${localisedHref(language, "builder")}#${LINK_MARK}=${encodeURIComponent(serial)}`;
}

/** The number an owner's link carries, taken off the address as it is read. Null when there is none. */
export function numberFromLink(): string | null {
  const match = new RegExp(`(?:^|[#&])${LINK_MARK}=([A-Za-z0-9-]{6,20})`).exec(window.location.hash);
  if (!match) return null;
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  const number = formatAsTyped(decodeURIComponent(match[1]));
  return COMPLETE.test(number) ? number : null;
}

/*
 * Opens the shop an owner's link carries: its download, in its own language.
 * Says what went wrong otherwise, so a link that no longer works is never a
 * blank page: "unknown" for a number that leads nowhere, "expired" for a
 * configuration left thirty days unopened, "failed" for the network.
 */
export async function openFromLink(number: string, from: Locale): Promise<"unknown" | "expired" | "failed" | "opened"> {
  try {
    const response = await fetch("/api/builder/configuration-code/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ number }),
    });
    const body = (await response.json().catch(() => null)) as (Omit<Opened, "locale"> & { locale: Locale | null }) | null;
    if (response.ok && body?.serial) {
      openInBuilder(
        { serial: body.serial, made: body.made, locale: body.locale ?? from, pack: body.pack, nameLatin: body.nameLatin, nameArabic: body.nameArabic },
        from
      );
      return "opened";
    }
    return response.status === 410 ? "expired" : response.status === 404 ? "unknown" : "failed";
  } catch {
    return "failed";
  }
}
