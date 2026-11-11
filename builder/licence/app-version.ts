import { z } from "zod";

/*
 * The version a device says it runs (0041): "0.1.77" from a computer, the
 * number Electron was stamped with when the installer was built, or
 * "0.1.77-phone" from the phone app.
 *
 * The licence routes accept it as an optional field, so an app older than
 * this, which sends none, keeps working. Only something shaped like a
 * version number is ever stored: anything else is dropped, never refused,
 * because an odd build must not cost a shop its licence check.
 */

export const appVersionField = z.string().max(40).optional(); // not-a-rule: longer than any version number

const SHAPE = /^v?(\d{1,6}(?:\.\d{1,6}){0,3})(-[0-9A-Za-z.]{1,20})?$/;

/** The version to store, without a leading "v", or null when it is not one. */
export function cleanAppVersion(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const match = SHAPE.exec(raw.trim());
  return match ? `${match[1]}${match[2] ?? ""}` : null;
}

/*
 * Which of two versions is newer, by their numbers only ("0.1.9" before
 * "0.1.10"); a suffix such as "-phone" is ignored. Null when either is not
 * a version, so a caller never ranks what it cannot read.
 */
export function compareAppVersions(a: string | null, b: string | null): -1 | 0 | 1 | null {
  const left = numbersOf(a);
  const right = numbersOf(b);
  if (!left || !right) return null;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference < 0 ? -1 : 1;
  }
  return 0;
}

/*
 * A write to a device's row that carries the version, done again without it
 * when the database has no such column yet: the site deployed before 0041
 * was applied. Without this, the row would keep its old device token and the
 * app's next licence check would be refused, for a number nobody needed.
 */
type Written = { error: { message?: string } | null };
export async function withAppVersion<T extends Written>(
  version: string | null,
  write: (extra: { app_version?: string }) => PromiseLike<T>
): Promise<T> {
  if (!version) return write({});
  const first = await write({ app_version: version });
  if (first.error && /app_version/.test(first.error.message ?? "")) return write({});
  return first;
}

/*
 * A read of devices that names the version column, done again without it
 * while the database does not have that column yet: an admin page must not
 * go empty because 0041 is still to be applied.
 */
type Read<T> = { data: T[] | null; error: { message: string } | null };
export async function readWithAppVersion<T extends { app_version?: string | null }>(
  columns: string,
  read: (columns: string) => PromiseLike<Read<T>>
): Promise<Read<T>> {
  const first = await read(`${columns}, app_version`);
  return first.error && /app_version/.test(first.error.message) ? read(columns) : first;
}

function numbersOf(version: string | null): number[] | null {
  const clean = cleanAppVersion(version);
  return clean ? clean.split("-")[0].split(".").map(Number) : null;
}
