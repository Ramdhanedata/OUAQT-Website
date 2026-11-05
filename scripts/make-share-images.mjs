/*
 * Builds the link preview images (Open Graph) for each language:
 * public/og/en.png, fr.png and ar.png, 1200x630.
 *
 * Text comes from the dictionaries, so the image always says what the site
 * says. Fonts are the site's own (Geist, Cairo), taken from the last
 * `npm run build`, and the page is rendered by headless Chrome so Arabic is
 * shaped and laid out right to left correctly.
 *
 *   npm run build && node scripts/make-share-images.mjs
 *   (or, with `npm run dev` running and the home page opened once, just the second half)
 *
 * Re-run it whenever the hero's words or its screenshots change
 * (scripts/product-shots.mjs). WhatsApp and Facebook cache previews, so after deploying, refresh
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

/*
 * Find the built woff2 files for a font family, keyed by unicode subset.
 * Works from a production build (minified, "u+06??") and from a running dev
 * server (spaced out, "U+0600-06FF"), so the images can be made from either.
 */
function builtFonts() {
  const cssDir = path.join(root, ".next/static/css");
  if (!fs.existsSync(cssDir)) throw new Error("Run `npm run build`, or open a page on `npm run dev`, first: the fonts are taken from .next.");
  const css = fs
    .readdirSync(cssDir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".css"))
    .map((f) => fs.readFileSync(path.join(cssDir, f), "utf8"))
    .join("\n");
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1].replace(/\s+/g, ""));
  const pick = (family, block) => {
    const named = new RegExp(`font-family:['"]?${family}['"]?[;,]`);
    const range = new RegExp(`unicode-range:u\\+${block}(\\?\\?|00-${block}ff)`, "i");
    const face = faces.find((f) => named.test(f) && range.test(f));
    if (!face) throw new Error(`No built font for ${family} U+${block}00`);
    const url = face.match(/src:url\(([^)]+)\)/)[1].replace(/['"]/g, "");
    // Embedded as data URLs: Chrome will not load fonts from file:// pages.
    const bytes = fs.readFileSync(path.join(root, ".next", url.replace(/^\/_next\//, "")));
    return `data:font/woff2;base64,${bytes.toString("base64")}`;
  };
  return {
    sansLatin: pick("Geist", "00"),
    cairoArabic: pick("Cairo", "06"),
    cairoLatin: pick("Cairo", "00"),
  };
}

function page(dict, lang, fonts) {
  const rtl = lang === "ar";
  const home = dict.builderHome;
  const logo = "file://" + path.join(root, "public/logo-ouaqt-dark-ink.png");
  const shot = "file://" + path.join(root, `public/images/product/hero-computer-${lang}.webp`);
  const phone = "file://" + path.join(root, `public/images/product/hero-phone-${lang}.webp`);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8">
<style>
@font-face{font-family:"OuaqtSans";src:url(${fonts.sansLatin}) format("woff2");font-weight:100 900}
@font-face{font-family:"OuaqtCairo";src:url(${fonts.cairoArabic}) format("woff2");font-weight:200 1000;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}
@font-face{font-family:"OuaqtCairo";src:url(${fonts.cairoLatin}) format("woff2");font-weight:200 1000;unicode-range:U+0000-00FF}
html,body{margin:0;width:1200px;height:630px;background:#f0eee6;overflow:hidden}
/* Custom names on purpose: an unquoted generic name is a keyword, and the browser drops the rule. */
body{font-family:${rtl ? '"OuaqtCairo"' : '"OuaqtSans"'},system-ui,sans-serif;color:#0a0a0a;-webkit-font-smoothing:antialiased}
.frame{box-sizing:border-box;height:630px;padding:56px 64px;display:grid;grid-template-columns:540px 1fr;gap:44px;align-items:center}
.text{display:flex;flex-direction:column;height:100%}
.logo{height:46px;width:auto;align-self:flex-start}
.eyebrow{margin:40px 0 0;font-size:21px;color:#735c24}
h1{margin:14px 0 0;font-weight:${rtl ? 700 : 600};font-size:50px;line-height:${rtl ? 1.4 : 1.06};letter-spacing:${rtl ? "0" : "-0.035em"};text-wrap:balance}
.line{margin:auto 0 0;font-size:20px;line-height:1.45;color:#6b6b68}
.shot{position:relative;padding:0 0 18px 34px}
[dir=rtl] .shot{padding:0 34px 18px 0}
.laptop{background:#141413;border-radius:14px 14px 4px 4px;padding:12px 9px 9px;box-shadow:0 30px 60px -30px rgba(10,10,10,.45)}
.laptop img{display:block;width:100%;border-radius:3px}
.base{height:12px;margin:0 -26px;border-radius:0 0 12px 12px;background:linear-gradient(#e4e1d8,#a9a59a)}
.phone{position:absolute;bottom:0;inset-inline-start:0;width:132px;background:#141413;border-radius:20px;padding:5px;box-shadow:0 20px 40px -18px rgba(10,10,10,.6)}
.phone .top{height:14px;background:#f0eee6;border-radius:15px 15px 0 0}
.phone img{display:block;width:100%}
.phone .bottom{height:8px;background:#faf9f5;border-radius:0 0 15px 15px}
.chip{position:absolute;top:-18px;inset-inline-end:22px;display:flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;background:#C9A961;color:#0a0a0a;font-size:17px;font-weight:600;box-shadow:0 0 0 4px #f0eee6,0 10px 22px -12px rgba(10,10,10,.45)}
</style></head><body><div class="frame">
<div class="text"><img class="logo" src="${logo}"><p class="eyebrow">${esc(home.heroEyebrow)}</p><h1 id="h">${esc(home.heroHeading)}</h1><p class="line">${esc(home.heroReassuranceNoTrial)}</p></div>
<div class="shot"><div class="laptop"><img src="${shot}"></div><div class="base"></div><div class="phone"><div class="top"></div><img src="${phone}"><div class="bottom"></div></div><div class="chip">${esc(home.heroChipReady)}</div></div>
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
