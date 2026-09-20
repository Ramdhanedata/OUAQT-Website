"use client";

import {
  contentBounds,
  fitWithin,
  otsuThreshold,
  toMonochrome,
} from "./pixels";

/*
 * Turning whatever the owner sends into something a receipt can print.
 *
 * All of it happens in his browser. The photograph never leaves the phone;
 * only the two small processed pictures are uploaded, which is faster on a
 * weak connection and means we never hold the original.
 */

const MAX_SIDE = 512; // not-a-rule: the largest logo the app needs
const MAX_BYTES = 1_000_000; // not-a-rule: 1 MB, the upload ceiling in the brief
const JPEG_QUALITIES = [0.9, 0.75, 0.6, 0.45]; // not-a-rule: compression steps

export const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

export type ProcessedLogo = {
  /** The colour version, for the screen. */
  colour: string;
  /** Black and white, for the thermal printer. */
  mono: string;
  width: number;
  height: number;
};

export class LogoError extends Error {
  constructor(public reason: "type" | "unreadable" | "too_big") {
    super(reason);
  }
}

export async function processLogo(file: File): Promise<ProcessedLogo> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new LogoError("type");

  const source = await decode(file);
  const full = draw(source, source.width, source.height);
  const bounds = contentBounds(
    full.getImageData(0, 0, source.width, source.height).data,
    source.width,
    source.height
  );

  const size = fitWithin(bounds.width, bounds.height, MAX_SIDE);
  const canvas = surface(size.width, size.height);
  const context = canvas.getContext("2d");
  if (!context) throw new LogoError("unreadable");

  context.imageSmoothingQuality = "high";
  context.drawImage(
    source,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    size.width,
    size.height
  );

  const pixels = context.getImageData(0, 0, size.width, size.height);
  const colour = await compress(canvas);

  const monoPixels = toMonochrome(pixels.data, otsuThreshold(pixels.data));
  const monoCanvas = surface(size.width, size.height);
  const monoContext = monoCanvas.getContext("2d");
  if (!monoContext) throw new LogoError("unreadable");
  monoContext.putImageData(
    new ImageData(monoPixels, size.width, size.height),
    0,
    0
  );
  const mono = await toDataUrl(monoCanvas, "image/png");

  if (colour.length > MAX_BYTES || mono.length > MAX_BYTES) {
    throw new LogoError("too_big");
  }

  return { colour, mono, width: size.width, height: size.height };
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new LogoError("unreadable");
  }
}

function surface(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function draw(source: ImageBitmap, width: number, height: number) {
  const canvas = surface(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new LogoError("unreadable");
  context.drawImage(source, 0, 0);
  return context;
}

/* PNG keeps flat colour and sharp edges. Photographs need JPEG to fit. */
async function compress(canvas: HTMLCanvasElement): Promise<string> {
  const png = await toDataUrl(canvas, "image/png");
  if (png.length <= MAX_BYTES) return png;

  for (const quality of JPEG_QUALITIES) {
    const jpeg = await toDataUrl(canvas, "image/jpeg", quality);
    if (jpeg.length <= MAX_BYTES) return jpeg;
  }
  throw new LogoError("too_big");
}

function toDataUrl(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<string> {
  return Promise.resolve(canvas.toDataURL(type, quality));
}
