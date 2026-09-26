/*
 * A limit per caller, kept in this server instance's memory.
 *
 * Serverless instances are not shared, so this slows a casual flood from one
 * address rather than stopping a determined one. What must hold whatever
 * happens (wrong serials, the AI's daily budget) is counted in the database
 * instead; this is the cheap first line in front of it.
 */
export function limitPerCaller(windowMs: number, most: number) {
  const seen = new Map<string, number[]>();
  return (request: Request): boolean => {
    const who = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const recent = (seen.get(who) ?? []).filter((at) => now - at < windowMs);
    recent.push(now);
    seen.set(who, recent);
    /* Old callers are let go, so the map does not grow for the life of the instance. */
    if (seen.size > 5_000) for (const [key, times] of seen) if (times.every((at) => now - at >= windowMs)) seen.delete(key); // not-a-rule: memory housekeeping
    return recent.length > most;
  };
}
