/*
 * The arithmetic behind logo processing, kept away from the browser so it can
 * be tested directly.
 *
 * Owners photograph a sign or send a screenshot, so what arrives is rarely a
 * tidy logo: it has white margins, it is too big, and it is in colour when the
 * receipt printer only knows black and white.
 *
 * Every number below is a colour channel or a pixel count, never a rule
 * anybody administers, so the file is marked not-a-rule-file for the
 * constants guard.
 */

export type Bounds = { x: number; y: number; width: number; height: number };

/** Perceived brightness, 0 for black and 255 for white. */
export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/*
 * The smallest rectangle holding the picture itself.
 *
 * A pixel counts as background when it is transparent, or when it is nearly
 * white. Photographs of a sign on paper are never pure white, which is why
 * the tolerance is generous rather than exact.
 */
export function contentBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  whiteTolerance = 12
): Bounds {
  const white = 255 - whiteTolerance;
  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const alpha = pixels[i + 3];
      if (alpha < 16) continue;
      if (luminance(pixels[i], pixels[i + 1], pixels[i + 2]) >= white) continue;

      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }

  // An empty or entirely white image keeps its own size rather than becoming
  // a rectangle of negative width.
  if (right < 0 || bottom < 0) {
    return { x: 0, y: 0, width, height };
  }
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

/** The size that fits inside a square of `max`, keeping the proportions. */
export function fitWithin(
  width: number,
  height: number,
  max: number
): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height };
  const ratio = Math.min(max / width, max / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/*
 * Otsu's method: the brightness that splits the picture into ink and paper
 * with the least overlap. Picking a fixed threshold turns a photograph of a
 * sign into a black rectangle, or into nothing at all.
 */
export function otsuThreshold(pixels: Uint8ClampedArray): number {
  const histogram = new Array(256).fill(0);
  let counted = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 16) continue;
    histogram[Math.round(luminance(pixels[i], pixels[i + 1], pixels[i + 2]))] += 1;
    counted += 1;
  }
  if (counted === 0) return 128; // not-a-rule: mid grey, nothing to measure

  let sum = 0;
  for (let level = 0; level < 256; level += 1) sum += level * histogram[level];

  let sumBackground = 0;
  let weightBackground = 0;
  let bestVariance = -1;
  /*
   * A picture of two tones leaves a whole range of thresholds equally good.
   * Taking the first of them lands the cut right on the ink, where a shade of
   * noise flips a pixel to paper, so the middle of the range is taken instead.
   */
  let firstBest = 0;
  let lastBest = 0;

  for (let level = 0; level < 256; level += 1) {
    weightBackground += histogram[level];
    if (weightBackground === 0) continue;
    const weightForeground = counted - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += level * histogram[level];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) ** 2;

    if (variance > bestVariance) {
      bestVariance = variance;
      firstBest = level;
      lastBest = level;
    } else if (variance === bestVariance) {
      lastBest = level;
    }
  }
  return Math.round((firstBest + lastBest) / 2);
}

/*
 * Black where there is ink, white everywhere else, with transparency kept so
 * the receipt's own white shows through.
 */
export function toMonochrome(
  pixels: Uint8ClampedArray,
  threshold: number
): Uint8ClampedArray<ArrayBuffer> {
  // Typed as ArrayBuffer-backed, not SharedArrayBuffer-backed, because
  // ImageData only accepts the former.
  const out = new Uint8ClampedArray(new ArrayBuffer(pixels.length));
  for (let i = 0; i < pixels.length; i += 4) {
    const transparent = pixels[i + 3] < 16;
    const ink =
      !transparent &&
      luminance(pixels[i], pixels[i + 1], pixels[i + 2]) <= threshold;
    const value = ink ? 0 : 255;
    out[i] = value;
    out[i + 1] = value;
    out[i + 2] = value;
    out[i + 3] = transparent ? 0 : 255;
  }
  return out;
}

/*
 * The paper a logo was photographed or scanned on, taken away.
 *
 * Owners send a logo on a white page far more often than a clean file, and
 * on the till's ivory screen that page shows as a white box around it. The
 * background is read from the picture's edge: when most of the edge is one
 * light, neutral colour, every pixel close to it becomes transparent, the
 * inside of a letter O as well as the margin, and the pixels at the edge of
 * the ink fade out smoothly instead of leaving a white fringe.
 *
 * Only a light background is taken. A logo on a dark or coloured square is
 * that square, and removing it could leave white letters on nothing; the app
 * always shows a logo on a light surface, so a knocked-out light part still
 * reads.
 */
export function removeBackground(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  { inner = 26, outer = 80 } = {}
): { pixels: Uint8ClampedArray<ArrayBuffer>; removed: boolean } {
  const out = new Uint8ClampedArray(new ArrayBuffer(pixels.length));
  out.set(pixels);
  if (width < 3 || height < 3) return { pixels: out, removed: false };

  /* The edge of the picture, every pixel of it. */
  const edge: number[] = [];
  for (let x = 0; x < width; x += 1) edge.push(x, (height - 1) * width + x);
  for (let y = 1; y < height - 1; y += 1) edge.push(y * width, y * width + width - 1);

  const opaque = edge.filter((index) => pixels[index * 4 + 3] >= 16);
  /* Already cut out: the file came with its own transparency. */
  if (opaque.length < edge.length / 2) return { pixels: out, removed: false };

  const median = (channel: number) => {
    const values = opaque.map((index) => pixels[index * 4 + channel]).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  };
  const background = [median(0), median(1), median(2)];
  const light = luminance(background[0], background[1], background[2]) >= 190;
  const neutral = Math.max(...background) - Math.min(...background) <= 40;
  if (!light || !neutral) return { pixels: out, removed: false };

  const distance = (i: number) =>
    Math.hypot(pixels[i] - background[0], pixels[i + 1] - background[1], pixels[i + 2] - background[2]);
  /* Most of the edge must agree, or this is a picture that runs off its own edge. */
  const agreeing = opaque.filter((index) => distance(index * 4) <= outer).length;
  if (agreeing < opaque.length * 0.6) return { pixels: out, removed: false };

  for (let i = 0; i < pixels.length; i += 4) {
    const d = distance(i);
    if (d >= outer) continue;
    if (d <= inner) {
      out[i + 3] = 0;
      continue;
    }
    /*
     * Part ink, part paper: kept in proportion, with the paper's share taken
     * out of its colour, so a dark edge stays dark rather than turning grey.
     */
    const keep = (d - inner) / (outer - inner);
    for (let c = 0; c < 3; c += 1) {
      out[i + c] = Math.round((pixels[i + c] - background[c] * (1 - keep)) / keep);
    }
    out[i + 3] = Math.round(Math.min(pixels[i + 3], 255 * keep));
  }
  return { pixels: out, removed: true };
}
