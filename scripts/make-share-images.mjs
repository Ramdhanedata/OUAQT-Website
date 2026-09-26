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
 * Re-run it whenever the hero's words or its screenshot change. WhatsApp and Facebook cache previews, so after deploying, refresh
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
    /* Next.js 14 wrote "Source_Serif_4", 15 writes "Source Serif 4". */
    const named = new RegExp(family.replace(/_/g, "[ _]"));
    const face = faces.find((f) => named.test(f) && new RegExp(`unicode-range:${rangeStart}`).test(f));
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
  const home = dict.builderHome;
  const logo = "file://" + path.join(root, "public/logo-ouaqt-dark-ink.png");
  const shot = "file://" + path.join(root, `public/images/product/till-${lang}.webp`);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8">
<style>
@font-face{font-family:"OuaqtSerif";src:url(${fonts.serifLatin}) format("woff2");font-weight:200 900}
@font-face{font-family:"OuaqtCairo";src:url(${fonts.cairoArabic}) format("woff2");font-weight:200 1000;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}
@font-face{font-family:"OuaqtCairo";src:url(${fonts.cairoLatin}) format("woff2");font-weight:200 1000;unicode-range:U+0000-00FF}
html,body{margin:0;width:1200px;height:630px;background:#f0eee6;overflow:hidden}
/* Custom names on purpose: an unquoted "Serif" is the generic keyword, and the browser drops the rule. */
body{font-family:${rtl ? '"OuaqtCairo"' : '"OuaqtSerif"'},Georgia,serif;color:#0a0a0a;-webkit-font-smoothing:antialiased}
.frame{box-sizing:border-box;height:630px;padding:56px 64px;display:grid;grid-template-columns:540px 1fr;gap:44px;align-items:center}
.text{display:flex;flex-direction:column;height:100%}
.logo{height:46px;width:auto;align-self:flex-start}
.eyebrow{margin:40px 0 0;font-size:21px;color:#735c24}
h1{margin:14px 0 0;font-weight:${rtl ? 700 : 650};font-size:50px;line-height:${rtl ? 1.4 : 1.1};letter-spacing:${rtl ? "0" : "-0.012em"};text-wrap:balance}
.line{margin:auto 0 0;font-size:20px;line-height:1.45;color:#6b6b68}
.shot{position:relative}
.shot img{display:block;width:100%;border-radius:14px;border:1px solid #e0ddd3;box-shadow:0 30px 60px -36px rgba(10,10,10,.4)}
.sticker{position:absolute;top:-34px;inset-inline-end:-22px;width:124px;height:124px;border-radius:50%;background:#C9A961;color:#0a0a0a;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(${rtl ? -8 : 8}deg);box-shadow:0 0 0 5px #f0eee6,0 14px 28px -14px rgba(10,10,10,.45)}
.sticker span{font-size:16px;line-height:1}
.sticker strong{margin-top:5px;font-size:31px;line-height:1;font-weight:700}
</style></head><body><div class="frame">
<div class="text"><img class="logo" src="${logo}"><p class="eyebrow">${esc(home.heroEyebrow)}</p><h1 id="h">${esc(home.heroHeading)}</h1><p class="line">${esc(home.heroReassuranceNoTrial)}</p></div>
<div class="shot"><img src="${shot}"><div class="sticker"><span>${esc(home.heroStickerTop)}</span><strong>${esc(home.heroStickerValue)}</strong></div></div>
</div>
<script>
/* Shrink the heading until the text column fits. */
Promise.all([...document.fonts].map((f) => f.load().catch(() => null))).then(() => document.fonts.ready).then(() => {
  const h = document.getElementById("h"), line = document.querySelector(".line");
  let size = 50;
  const fits = () => h.getBoundingClientRect().bottom < line.getBoundingClientRect().top - 20;
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
