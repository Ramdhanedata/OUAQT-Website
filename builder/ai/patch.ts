import { configurationSchema, type Configuration } from "@/app-ui/config";

/*
 * What the AI is allowed to do, and the wall around it.
 *
 * The model never writes to the configuration. It proposes a patch, and this
 * file decides whether the patch is allowed anywhere near it. Three gates, in
 * order:
 *
 *   1. every path it touches has to be one the current question could have
 *      set by itself, so an answer about expiry dates cannot rename the shop
 *   2. the result has to validate against the schema
 *   3. anything else, and the answer falls back to the question's default
 *
 * A rejected patch is not an error the owner sees. It is a question answered
 * the ordinary way, plus a note for us that the wording needs work.
 */

export type Patch = Record<string, unknown>;

export type PatchResult =
  | { ok: true; configuration: Configuration }
  | { ok: false; reason: "forbidden_path" | "invalid_configuration"; detail: string };

function write(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let node = target;
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] !== "object" || node[part] === null) node[part] = {};
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

/**
 * Applies a proposed patch to a copy of the configuration, or says why not.
 * The configuration passed in is never modified.
 */
export function applyPatch(
  configuration: Configuration,
  patch: Patch,
  allowedPaths: string[]
): PatchResult {
  const allowed = new Set(allowedPaths);

  for (const path of Object.keys(patch)) {
    if (!allowed.has(path)) {
      return {
        ok: false,
        reason: "forbidden_path",
        detail: `${path} is not one of: ${allowedPaths.join(", ")}`,
      };
    }
  }

  const candidate = structuredClone(configuration) as Record<string, unknown>;
  for (const [path, value] of Object.entries(patch)) write(candidate, path, value);

  const parsed = configurationSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_configuration",
      detail: parsed.error.issues.map((i) => i.path.join(".")).join(", "),
    };
  }
  return { ok: true, configuration: parsed.data };
}
