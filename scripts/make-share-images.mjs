/*
 * Builds the link preview images (Open Graph) for each language:
 * public/og/en.png, fr.png and ar.png, 1200x630.
 *
 * Text comes from the dictionaries, so the image always says what the site
 * says. Fonts are the site's own (Source Serif 4, Cairo), taken from the last
 * `npm run build`, and the page is rendered by headless Chrome so Arabic is
 * shaped and laid out right to left correctly.
 *
 *   npm run build && node scripts/make-share-images.mjs
 *
 * Re-run it whenever the hero heading, the share line or the system count
 * changes. WhatsApp and Facebook cache previews, so after deploying, refresh
 * the link in Facebook's Sharing Debugger.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const require = createRequire(import.meta.url);
const ts = require(path.join(root, "node_modules/typescript"));
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function loadDictionary(lang) {
  const src = fs.readFileSync(path.join(root, `lib/i18n/dictionaries/${lang}.ts`), "utf8").replace(/^import[^;]+;/gm, "");
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mod = { exports: {} };
  new Function("module", "exports", js)(mod, mod.exports);
  return mod.exports[lang];
}

/* Find the built woff2 files for a font family, keyed by unicode subset. */
function builtFonts() {
  const cssDir = path.join(root, ".next/static/css");
  if (!fs.existsSync(cssDir)) throw new Error("Run `npm run build` first: the fonts are taken from the build.");
  const css = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css")).map((f) => fs.readFileSync(path.join(cssDir, f), "utf8")).join("\n");
  const faces = [...css.matchAll(/@font-face\{([^}]*)\}/g)].map((m) => m[1]);
  const pick = (family, rangeStart) => {
    const face = faces.find((f) => f.includes(family) && new RegExp(`unicode-range:${rangeStart}`).test(f));
    if (!face) throw new Error(`No built font for ${family} ${rangeStart}`);
    const url = face.match(/src:url\(([^)]+)\)/)[1];
    // Embedded as data URLs: Chrome will not load fonts from file:// pages.
    const bytes = fs.readFileSync(path.join(root, ".next", url.replace(/^\/_next\//, "")));
    return `data:font/woff2;base64,${bytes.toString("base64")}`;
  };
  return {
    serifLatin: pick("Source_Serif_4", "u\\+00\\?\\?"),
    cairoArabic: pick("Cairo", "u\\+06\\?\\?"),
    cairoLatin: pick("Cairo", "u\\+00\\?\\?"),
  };
}

function page(dict, lang, fonts) {
  const rtl = lang === "ar";
  const logo = "file://" + path.join(root, "public/logo-ouaqt-dark-ink.png");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8">
<style>
@font-face{font-family:"OuaqtSerif";src:url(${fonts.serifLatin}) format("woff2");font-weight:200 900}
@font-face{font-family:"OuaqtCairo";src:url(${fonts.cairoArabic}) format("woff2");font-weight:200 1000;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}
@font-face{font-family:"OuaqtCairo";src:url(${fonts.cairoLatin}) format("woff2");font-weight:200 1000;unicode-range:U+0000-00FF}
html,body{margin:0;width:1200px;height:630px;background:#fafafa;overflow:hidden}
/* Custom names on purpose: an unquoted "Serif" is the generic keyword, and the browser drops the rule. */
body{font-family:${rtl ? '"OuaqtCairo"' : '"OuaqtSerif"'},Georgia,serif;color:#0a0a0a;-webkit-font-smoothing:antialiased}
.frame{box-sizing:border-box;height:630px;padding:64px 76px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between}
.logo{height:58px;width:auto}
.pill{font-size:21px;padding:9px 20px;border:1.5px solid #C9A961;border-radius:999px;color:#7a6330;background:#fffdf7}
h1{margin:44px 0 0;font-weight:${rtl ? 700 : 650};font-size:62px;line-height:${rtl ? 1.4 : 1.1};letter-spacing:${rtl ? "0" : "-0.012em"};max-width:1000px;text-wrap:balance}
.bottom{margin-top:auto}
.rule{width:150px;height:3px;background:#C9A961;margin-bottom:22px}
.line{margin:0;font-size:25px;line-height:1.45;color:#6b6b68;max-width:900px;text-wrap:pretty}
.place{margin:10px 0 0;font-size:22px;color:#b08f45}
</style></head><body><div class="frame">
<div class="top"><img class="logo" src="${logo}"><span class="pill">${esc(dict.hero.freeVisit)}</span></div>
<h1 id="h">${esc(dict.hero.heading)}</h1>
<div class="bottom"><div class="rule"></div><p class="line">${esc(dict.meta.shareLine)}</p><p class="place">${esc(dict.meta.shareReach)}</p></div>
</div>
<script>
/* Shrink the heading until everything fits in 630px. */
Promise.all([...document.fonts].map((f) => f.load().catch(() => null))).then(() => document.fonts.ready).then(() => {
  const h = document.getElementById("h"), frame = document.querySelector(".frame");
  let size = 62;
  const fits = () => frame.scrollHeight <= 630 && h.getBoundingClientRect().bottom < document.querySelector(".bottom").getBoundingClientRect().top - 24;
  while (!fits() && size > 30) { size -= 2; h.style.fontSize = size + "px"; }
});
</script></body></html>`;
}

const fonts = builtFonts();
const work = fs.mkdtempSync(path.join(os.tmpdir(), "ouaqt-og-"));
for (const lang of ["en", "fr", "ar"]) {
  const html = path.join(work, `${lang}.html`);
  const out = path.join(root, "public/og", `${lang}.png`);
  fs.writeFileSync(html, page(loadDictionary(lang), lang, fonts));
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
    "--force-device-scale-factor=1", "--window-size=1200,630", "--virtual-time-budget=4000",
    `--screenshot=${out}`, `file://${html}`,
  ], { stdio: "ignore" });
  console.log("wrote", path.relative(root, out));
}
fs.rmSync(work, { recursive: true, force: true });
