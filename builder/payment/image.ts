"use client";

/*
 * A screenshot of a Bankily confirmation, made small enough to send from a
 * phone on a bad connection.
 *
 * A modern phone takes a 4 megabyte screenshot. Uploading that over a weak
 * signal is a minute of waiting and a reason to give up half way, and none of
 * those pixels help anybody read an amount. It is resized and compressed
 * here, in his browser, before anything leaves the device.
 *
 * not-a-rule-file: sizes and qualities, not anything anybody administers.
 */

const MAX_SIDE = 1600;
const TARGET_BYTES = 600_000;
const CEILING_BYTES = 5_000_000;
const QUALITIES = [0.85, 0.7, 0.55, 0.4];

export const ACCEPTED_IMAGES = ["image/png", "image/jpeg", "image/webp"];

export class ScreenshotError extends Error {
  constructor(public reason: "type" | "unreadable" | "too_big") {
    super(reason);
  }
}

export async function prepareScreenshot(file: File): Promise<Blob> {
  if (!ACCEPTED_IMAGES.includes(file.type)) throw new ScreenshotError("type");
  if (file.size > CEILING_BYTES) throw new ScreenshotError("too_big");

  let source: ImageBitmap;
  try {
    source = await createImageBitmap(file);
  } catch {
    throw new ScreenshotError("unreadable");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new ScreenshotError("unreadable");
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  for (const quality of QUALITIES) {
    const blob = await toBlob(canvas, quality);
    if (blob && blob.size <= TARGET_BYTES) return blob;
  }

  const last = await toBlob(canvas, QUALITIES[QUALITIES.length - 1]);
  if (!last) throw new ScreenshotError("unreadable");
  return last;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality)
  );
}
