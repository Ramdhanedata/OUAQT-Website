"use client";

import {
  contentBounds,
  fitWithin,
  otsuThreshold,
  removeBackground,
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

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

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
  const full = draw(source.image, source.width, source.height);
  const original = full.getImageData(0, 0, source.width, source.height);

  /*
   * Where ink ends and paper begins, read from the picture as it came, page
   * and all: once the page is gone, a red stroke beside black ink would be
   * the lighter of the two and fall off the receipt.
   */
  const threshold = otsuThreshold(original.data);

  /* The page it was drawn or photographed on, taken away, then the margins. */
  const cut = removeBackground(original.data, source.width, source.height);
  full.putImageData(new ImageData(cut.pixels, source.width, source.height), 0, 0);
  const bounds = contentBounds(cut.pixels, source.width, source.height);

  const size = fitWithin(bounds.width, bounds.height, MAX_SIDE);
  const canvas = surface(size.width, size.height);
  const context = canvas.getContext("2d");
  if (!context) throw new LogoError("unreadable");

  context.imageSmoothingQuality = "high";
  context.drawImage(
    full.canvas,
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

  const monoPixels = toMonochrome(pixels.data, threshold);
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

type Decoded = { image: CanvasImageSource; width: number; height: number };

async function decode(file: File): Promise<Decoded> {
  if (file.type === "image/svg+xml") return decodeSvg(file);
  try {
    const bitmap = await createImageBitmap(file);
    return { image: bitmap, width: bitmap.width, height: bitmap.height };
  } catch {
    throw new LogoError("unreadable");
  }
}

/*
 * A drawing rather than a photograph: it has no pixels of its own, so it is
 * drawn at the largest size the app uses, keeping its proportions, and then
 * treated exactly like a PNG from there on.
 */
async function decodeSvg(file: File): Promise<Decoded> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    const ratio = image.naturalWidth > 0 && image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 1;
    const width = ratio >= 1 ? MAX_SIDE : Math.round(MAX_SIDE * ratio);
    const height = ratio >= 1 ? Math.round(MAX_SIDE / ratio) : MAX_SIDE;
    /* Drawn once onto a canvas, so every later step works in the same pixels. */
    const canvas = surface(width, height);
    const context = canvas.getContext("2d");
    if (!context) throw new LogoError("unreadable");
    context.drawImage(image, 0, 0, width, height);
    return { image: canvas, width, height };
  } catch {
    throw new LogoError("unreadable");
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function surface(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function draw(source: CanvasImageSource, width: number, height: number) {
  const canvas = surface(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new LogoError("unreadable");
  context.drawImage(source, 0, 0, width, height);
  return context;
}

/*
 * PNG keeps flat colour, sharp edges and the transparency where the page
 * was. Photographs need JPEG to fit; JPEG has no transparency, so the
 * picture is laid on white first rather than coming out on black.
 */
async function compress(canvas: HTMLCanvasElement): Promise<string> {
  const png = await toDataUrl(canvas, "image/png");
  if (png.length <= MAX_BYTES) return png;

  const flat = surface(canvas.width, canvas.height);
  const context = flat.getContext("2d");
  if (!context) throw new LogoError("unreadable");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, flat.width, flat.height);
  context.drawImage(canvas, 0, 0);
  for (const quality of JPEG_QUALITIES) {
    const jpeg = await toDataUrl(flat, "image/jpeg", quality);
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
