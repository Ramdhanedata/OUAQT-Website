/*
 * Takes the pictures of the software the home page shows: real screens of
 * the app in public/app-preview, on a computer's window and at a phone's
 * width, in French, English and Arabic.
 *
 *   npm run dev            (in another terminal)
 *   node scripts/product-shots.mjs [http://localhost:3000]
 *   SHOTS=reports node scripts/product-shots.mjs     (only those shots)
 *
 * Each picture is the app itself with its trade's sample data, driven the
 * way an owner would use it: a ticket with three products, the end of day
 * window, the reports. Nothing is drawn by hand, so re-run it whenever the
 * app's screens change (after `build:web` in the desktop repository) and
 * the site shows the software as it is.
 *
 * Writes public/images/product/<shot>-<computer|phone>-<lang>.webp.
 */
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const base = process.argv[2] ?? "http://localhost:3000";
const out = path.join(root, "public/images/product");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9341;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* The sizes the site draws them at, taken at twice the phone's pixels so they stay sharp. */
const VIEWS = {
  computer: { width: 1280, height: 800, scale: 1.25 },
  phone: { width: 390, height: 844, scale: 2 },
};

/* The app's own labels for the buttons the walk presses, in each language. */
const LABELS = {
  fr: { endOfDay: "Fin de journée", ticketShow: "Voir le ticket", earlier: "Période précédente", history: "Évolution des ventes" },
  en: { endOfDay: "End of day", ticketShow: "See the ticket", earlier: "Previous period", history: "Sales over time" },
  ar: { endOfDay: "نهاية اليوم", ticketShow: "عرض التذكرة", earlier: "الفترة السابقة", history: "تطور المبيعات" },
};

const require = createRequire(import.meta.url);
const ts = require(path.join(root, "node_modules/typescript"));

/* The shop names the live demo uses, from the dictionaries, so the pictures and the demo agree. */
function shopNames(lang) {
  const src = fs.readFileSync(path.join(root, `lib/i18n/dictionaries/${lang}.ts`), "utf8").replace(/^import[^;]+;/gm, "");
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mod = { exports: {} };
  new Function("module", "exports", js)(mod, mod.exports);
  return mod.exports[lang].builderHome.demoShops;
}

/* Each trade's default setup, as the demo builds it, bundled once from app-ui/config.ts. */
async function configurations() {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ouaqt-shots-")), "config.mjs");
  execFileSync(path.join(root, "node_modules/.bin/rolldown"), ["app-ui/config.ts", "--format", "esm", "--file", file], { stdio: "ignore" });
  return import(file);
}

async function launch() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "ouaqt-chrome-"));
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
  for (let i = 0; i < 80; i++) {
    try {
      await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      return chrome;
    } catch {
      await sleep(250);
    }
  }
  chrome.kill();
  throw new Error("Chrome did not start. Set CHROME_PATH if it is installed elsewhere.");
}

/* One tab at one size, with the app running in a frame the way the home page runs it. */
async function openApp(view, configuration) {
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => ((ws.onopen = resolve), (ws.onerror = reject)));
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && waiting.has(message.id)) {
      const { resolve, reject } = waiting.get(message.id);
      waiting.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      waiting.set(++id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const run = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };

  const { width, height, scale } = VIEWS[view];
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false });
  await send("Page.enable");
  await send("Page.navigate", { url: `${base}/robots.txt` });
  await sleep(800);
  await run(`new Promise((resolve, reject) => {
    document.documentElement.style.cssText = "margin:0;height:100%";
    document.body.style.cssText = "margin:0;height:100%";
    document.body.innerHTML = "";
    const frame = document.createElement("iframe");
    frame.src = "/app-preview/index.html";
    frame.style.cssText = "border:0;display:block;width:100vw;height:100vh";
    window.__frame = frame;
    window.__buttons = () => [...frame.contentDocument.querySelectorAll("button")].filter((b) => b.offsetParent !== null);
    window.addEventListener("message", (event) => {
      const type = event.data && event.data.type;
      if (type === "ouaqt:ready") frame.contentWindow.postMessage({ type: "ouaqt:configuration", configuration: ${JSON.stringify(configuration)} }, location.origin);
      if (type === "ouaqt:started") resolve(true);
    });
    setTimeout(() => reject(new Error("the app did not start")), 45000);
    document.body.appendChild(frame);
  })`);
  await sleep(2500);

  return {
    section: async (name) => {
      await run(`window.__frame.contentWindow.dispatchEvent(new CustomEvent("ouaqt:section", { detail: ${JSON.stringify(name)} })); 1`);
      await sleep(1200);
    },
    /* The nth product on the sale screen: its button carries a price. */
    addProduct: async (n) => {
      await run(`window.__buttons().filter((b) => /MRU/.test(b.innerText) && b.closest("nav") === null)[${n}].click(); 1`);
      await sleep(400);
    },
    press: async (label) => {
      await run(`(() => { const b = window.__buttons().find((one) => one.innerText.includes(${JSON.stringify(label)})); if (!b) throw new Error("no button " + ${JSON.stringify(label)}); b.click(); return 1; })()`);
      await sleep(1200);
    },
    /* A button known by its name alone, such as an arrow with no words on it. */
    pressNamed: async (label) => {
      await run(`(() => { const b = window.__buttons().find((one) => one.getAttribute("aria-label") === ${JSON.stringify(label)}); if (!b) throw new Error("no button named " + ${JSON.stringify(label)}); b.click(); return 1; })()`);
      await sleep(1200);
    },
    /* Scrolls the screen's main column until a heading with these words is at the top. */
    scrollToHeading: async (text) => {
      await run(`(() => { const d = window.__frame.contentDocument; const h = [...d.querySelectorAll("h2")].find((e) => e.innerText.trim() === ${JSON.stringify(text)}); if (!h) throw new Error("no heading " + ${JSON.stringify(text)}); const boxes = [...d.querySelectorAll("*")].filter((e) => e.scrollHeight > e.clientHeight + 40 && /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.contains(h)); const box = boxes.sort((a, b) => b.clientHeight - a.clientHeight)[0]; if (box) box.scrollTop += h.getBoundingClientRect().top - box.getBoundingClientRect().top - 16; return 1; })()`);
      await sleep(600);
    },
    /* Scrolls the screen's main column, for a phone that shows less of it at once. */
    scroll: async (y) => {
      await run(`(() => { const d = window.__frame.contentDocument; const boxes = [...d.querySelectorAll("*")].filter((e) => e.scrollHeight > e.clientHeight + 40 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)); const box = boxes.sort((a, b) => b.clientHeight - a.clientHeight)[0]; if (box) box.scrollTop = ${y}; return 1; })()`);
      await sleep(600);
    },
    shoot: async (file) => {
      const result = await send("Page.captureScreenshot", { format: "webp", quality: 86 });
      fs.writeFileSync(file, Buffer.from(result.data, "base64"));
      console.log("  ", path.relative(root, file), Math.round(fs.statSync(file).size / 1024), "KB");
    },
    close: async () => {
      await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
      ws.close();
    },
  };
}

/*
 * The shots, in the order the home page tells them. The hero is a cafe with
 * an order going; the walk is a grocery, the trade with every step: selling,
 * stock, closing the day and reading the figures.
 */
const SHOTS = [
  {
    name: "hero",
    pack: "restaurant",
    computer: async (app) => {
      for (const n of [2, 5, 5, 1]) await app.addProduct(n);
    },
    phone: async () => {},
  },
  {
    name: "sell",
    pack: "shop",
    computer: async (app) => {
      for (const n of [0, 3, 4]) await app.addProduct(n);
    },
    phone: async (app, labels) => {
      for (const n of [0, 3, 4]) await app.addProduct(n);
      await app.press(labels.ticketShow);
    },
  },
  {
    name: "stock",
    pack: "shop",
    computer: async (app) => app.section("stock"),
    phone: async (app) => app.section("stock"),
  },
  {
    name: "day",
    pack: "shop",
    computer: async (app, labels) => app.press(labels.endOfDay),
    phone: async (app, labels) => app.press(labels.endOfDay),
  },
  /* Yesterday read against the day before on the computer; on the phone, the days side by side. */
  {
    name: "reports",
    pack: "shop",
    computer: async (app, labels) => {
      await app.section("reports");
      await app.pressNamed(labels.earlier);
    },
    phone: async (app, labels) => {
      await app.section("reports");
      await app.scrollToHeading(labels.history);
    },
  },
];
const only = (process.env.SHOTS ?? "").split(",").map((name) => name.trim()).filter(Boolean);

const { defaultConfiguration } = await configurations();
const chrome = await launch();
fs.mkdirSync(out, { recursive: true });
try {
  for (const lang of ["fr", "en", "ar"]) {
    const names = shopNames(lang);
    for (const shot of SHOTS.filter((one) => only.length === 0 || only.includes(one.name))) {
      const configuration = defaultConfiguration(shot.pack, lang);
      configuration.business = { ...configuration.business, nameLatin: names[shot.pack], nameArabic: lang === "ar" ? names[shot.pack] : undefined };
      for (const view of Object.keys(VIEWS)) {
        /* A dev server that is recompiling can drop the frame; a second try is a fresh tab. */
        for (let attempt = 1; ; attempt++) {
          const app = await openApp(view, configuration);
          try {
            await shot[view](app, LABELS[lang]);
            await app.shoot(path.join(out, `${shot.name}-${view}-${lang}.webp`));
            break;
          } catch (error) {
            if (attempt >= 3) throw error;
            console.log("   retrying", shot.name, view, lang, "after:", error.message.split("\n")[0]);
          } finally {
            await app.close();
          }
        }
      }
    }
  }
} finally {
  chrome.kill();
}
