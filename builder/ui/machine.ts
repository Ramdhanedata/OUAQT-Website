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

/*
 * Which chip a Mac has, as far as its browser will say. Chrome and Edge say
 * it outright. Safari hides it, but a Mac with an Apple chip draws with a GPU
 * that decodes ASTC textures and an Intel one does not. Null when neither
 * answer is clear: the Intel build is then offered first, because it also
 * runs on an Apple chip, while the Apple one does not run on Intel at all.
 */
export async function macChip(): Promise<"apple" | "intel" | null> {
  try {
    const hints = (navigator as Navigator & { userAgentData?: { getHighEntropyValues?: (keys: string[]) => Promise<{ architecture?: string }> } }).userAgentData;
    if (hints?.getHighEntropyValues) {
      const { architecture } = await hints.getHighEntropyValues(["architecture"]);
      if (architecture === "arm") return "apple";
      if (architecture === "x86") return "intel";
    }
  } catch {
    /* Asked and refused: try the other way. */
  }
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return null;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    if (/Apple M\d/i.test(renderer)) return "apple";
    if (/Intel|AMD|Radeon|NVIDIA/i.test(renderer)) return "intel";
    if (/Apple/i.test(renderer)) return gl.getSupportedExtensions()?.includes("WEBGL_compressed_texture_astc") ? "apple" : "intel";
  } catch {
    /* No drawing context: nothing more to learn. */
  }
  return null;
}
