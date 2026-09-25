/*
 * What kind of machine is reading step 4, from the browser's own description
 * of itself. This decides which download to offer, not how anything is laid
 * out: an iPad calls itself a Mac, so a touch screen counts as a phone.
 */
export type Machine = "windows" | "mac" | "phone" | "other";

export function machineOf(): Machine {
  if (typeof navigator === "undefined") return "other";
  const agent = navigator.userAgent;
  if (/Android|iPhone|iPod/i.test(agent)) return "phone";
  if (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1) return "phone";
  if (/Windows/i.test(agent)) return "windows";
  if (/Macintosh|Mac OS X/i.test(agent)) return "mac";
  return "other";
}
