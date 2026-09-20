import { describe, expect, it } from "vitest";
import {
  contentBounds,
  fitWithin,
  luminance,
  otsuThreshold,
  toMonochrome,
} from "./pixels";

/* A white canvas with one dark rectangle painted on it. */
function image(
  width: number,
  height: number,
  rect?: { x: number; y: number; w: number; h: number; value?: number }
) {
  const pixels = new Uint8ClampedArray(width * height * 4).fill(255);
  if (!rect) return pixels;
  for (let y = rect.y; y < rect.y + rect.h; y += 1) {
    for (let x = rect.x; x < rect.x + rect.w; x += 1) {
      const i = (y * width + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = rect.value ?? 0;
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

describe("contentBounds", () => {
  it("finds the picture inside its white margins", () => {
    const pixels = image(20, 20, { x: 4, y: 6, w: 5, h: 3 });
    expect(contentBounds(pixels, 20, 20)).toEqual({
      x: 4,
      y: 6,
      width: 5,
      height: 3,
    });
  });

  it("keeps the whole frame when there is nothing to crop to", () => {
    expect(contentBounds(image(8, 5), 8, 5)).toEqual({
      x: 0,
      y: 0,
      width: 8,
      height: 5,
    });
  });

  it("ignores transparent pixels", () => {
    const pixels = image(10, 10, { x: 2, y: 2, w: 3, h: 3 });
    for (let i = 3; i < pixels.length; i += 4) pixels[i] = 0;
    expect(contentBounds(pixels, 10, 10).width).toBe(10);
  });
});

describe("fitWithin", () => {
  it("leaves a small picture alone", () => {
    expect(fitWithin(100, 80, 512)).toEqual({ width: 100, height: 80 });
  });

  it("caps the long side and keeps the proportions", () => {
    expect(fitWithin(2048, 1024, 512)).toEqual({ width: 512, height: 256 });
  });

  it("never rounds a side down to nothing", () => {
    expect(fitWithin(4000, 3, 512).height).toBeGreaterThanOrEqual(1);
  });
});

describe("otsuThreshold", () => {
  it("separates ink from paper", () => {
    const pixels = image(10, 10, { x: 0, y: 0, w: 4, h: 10, value: 30 });
    const threshold = otsuThreshold(pixels);
    // The cut lands between the ink and the paper, not on either of them,
    // so a shade of noise does not change which side a pixel falls.
    expect(threshold).toBeGreaterThan(30);
    expect(threshold).toBeLessThan(255);
  });

  it("answers with mid grey when there is nothing to measure", () => {
    const empty = new Uint8ClampedArray(40).fill(0);
    expect(otsuThreshold(empty)).toBe(128);
  });
});

describe("toMonochrome", () => {
  it("makes every pixel black or white, and keeps transparency", () => {
    const pixels = image(4, 1, { x: 0, y: 0, w: 2, h: 1, value: 40 });
    pixels[3 * 4 + 3] = 0;
    const out = toMonochrome(pixels, 128);

    expect([out[0], out[1], out[2]]).toEqual([0, 0, 0]);
    expect([out[8], out[9], out[10]]).toEqual([255, 255, 255]);
    expect(out[15]).toBe(0);
  });
});

describe("luminance", () => {
  it("puts green above red and red above blue", () => {
    expect(luminance(0, 255, 0)).toBeGreaterThan(luminance(255, 0, 0));
    expect(luminance(255, 0, 0)).toBeGreaterThan(luminance(0, 0, 255));
  });
});
