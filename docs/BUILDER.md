# OUAQT App Builder

A business owner answers questions about his shop and leaves with management
software ready to install on the shop computer, plus a serial number. This
document is for whoever picks the work up next.

Status: **B5**. An owner can build his software, import the spreadsheet he
already has, create an account, get a serial, pay from Bankily, Masrvi,
BimBank, SEDAD or Click, and have a
desktop computer activate against a signed licence. Staff confirm payments,
free computers and issue renewal codes. The other three packs are B6.

## The one rule

The platform never writes code for a client. There is one desktop app with one
pack per business type. The builder turns answers into a **configuration** for
that app, validated against a versioned schema before it is stored. When the AI
is used it only proposes changes to that configuration, and a rejected proposal
falls back to the question's default.

The second rule follows from the first: **the server never keeps the shop's
trade**. No sales, stock movements, customer credit, cash closes or backups as
records. Those live on the owner's devices. `builder/db/no-business-data.test.ts`
reads every migration and fails the build if a place to put them appears.

The one thing that passes through (decided by Adel, 2026-11-05) is what a shop's
devices send each other: sealed on the device with a key from the shop's serial,
held in `sync_messages` only until the others have it, 45 days at most. See
`builder/sync/relay.ts`. It works over the internet only for now: with none, each
device keeps working and catches up later. Direct Wi-Fi between a computer and a
phone would need a real Android app, because a browser may not reach a computer
on the local network.

## Where things live

| Path | What |
| --- | --- |
| `app/[lang]/builder/` | The route. One folder, three public addresses |
| `builder/copy/` | Builder text, French first, then English and Arabic |
| `builder/ui/` | Builder screens (Next-aware, browser side) |
| `builder/db/migrations/` | Schema, settings seed and policies, plain SQL |
| `builder/db/client.ts` | The browser's connection, and the anonymous session |
| `builder/db/server.ts` | The visitor's connection and the staff one. Server only |
| `builder/db/settings.ts` | Prices, trial length and open packs, read and cached |
| `app-ui/` | Screens shared with the desktop app. No Next, Supabase or browser storage imports |
| `builder/ui/step-business.tsx` | Step 1: business type and name, with the Arabic name, receipt details and logo behind one line |
| `builder/draft/store.ts` | Answers, on the device and on the server |
| `builder/logo/` | Cropping, resizing and thresholding the owner's logo, in his browser |
| `builder/packs/*.json` | The question banks. Data, not code |
| `builder/ai/` | The provider adapter, and the wall around what it may change |
| `builder/import/` | Reading the spreadsheet an owner actually has |
| `builder/licence/` | Status from dates, issuing and signing licence files |
| `builder/payment/` | What is owed, and what a payment check may decide |
| `builder/admin/` | Staff screens, behind a second factor |
| `app-ui/codes.ts`, `app-ui/licence-file.ts` | Shared with the desktop app. Pure, offline |
| `docs/LICENCE_API.md` | The contract the desktop app follows |
| `lib/i18n/routes.ts` | Which slug belongs to which page, per language |
| `scripts/check-magic-constants.mjs` | Fails the build on hardcoded prices, days or limits |

## Addresses

The builder has a slug per language, mapped onto the one folder:

- French `/fr/creer-mon-logiciel`
- English `/en/build-my-software`
- Arabic `/ar/build-my-software`

`middleware.ts` rewrites the public slug onto `/[lang]/builder`, and sends
anyone who types `/fr/builder` to the French address. The language switcher
translates slugs, so switching language inside the builder stays on the
builder. To add another localised page, add it to `localisedRoutes` and create
the folder named after the route id; nothing else needs changing.

## Settings, not constants

Prices, the trial length, the device limit, the payment window and the support
number live in the `settings` table and are edited from the admin area. Writing
any of them into code fails `npm run check:constants`. If a number genuinely is
fixed forever, put `// not-a-rule` on the line and say why.

## Running it

```bash
npm install
npm run dev            # the site, builder included
npm run test           # Vitest
npm run check:constants
npm run build          # must stay clean before any hand-off
```

## Environment variables

Every external service is off unless its variable is set, and the interface
says so rather than guessing.

| Variable | Used for | Unset means |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical addresses, share images | Falls back to the Vercel address |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | The marketing contact form | The form sends through FormSubmit from the browser |
| `GOOGLE_SITE_VERIFICATION` | Search Console ownership | No verification tag |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The builder's database, from the browser | The builder says it is not ready; the marketing site is unaffected |
| `SUPABASE_SERVICE_ROLE_KEY` | Staff work, server side only | Admin work is unavailable |
| `SUPABASE_DB_URL` | `npm run db:push` on your own machine | Migrations cannot be applied from here |
| `GEMINI_API_KEY` | "Expliquer avec mes mots" in the interview | The sentence is kept as a feature request, nothing is interpreted |
| `AI_PROVIDER`, `AI_MODEL` | Which model answers. Defaults to Gemini Flash | The defaults |
| `AI_TIER` | `free` or `paid`. Free means the AI reads text only | Treated as free |

Still to come, with the milestone that adds them: installer addresses (B3),
the Ed25519 signing key (B5).

## The database

```bash
npm run db:push        # applies builder/db/migrations, once each, in order
npm run db:check       # proves row level security against the live database
```

`db:check` signs in anonymously the way an owner's browser does, saves a draft,
then checks a second visitor can neither read nor change it. It removes
everything it created. Run it after any migration that touches a policy.

Two clients, and the difference matters. `sessionClient()` acts as the visitor
and every policy applies. `adminClient()` skips them all, so it lives in
`builder/db/server.ts` behind `import "server-only"` and is used only where
staff work is being done.

## The preview

The preview beside the questions is the desktop app itself, not a drawing of
it. The desktop repository builds its own screens, database modules,
migrations and handlers for a web page (`npm run build:web` there, see its
`web/main.ts`): SQLite runs in WebAssembly and in memory, Electron is
swapped for a small stand-in, and a printed receipt shows on screen. The
build lands in `public/app-preview`, which this site serves as it is.

`builder/ui/preview/index.tsx` frames it: an iframe at a laptop's size,
scaled as a whole to the space the page has, never reflowed. It sends the
configuration the answers make each time they change it
(`{ type: "ouaqt:configuration", configuration, section }`), and the app
answers `ouaqt:ready` when it can take one and `ouaqt:started` once drawn.
A new trade starts a new demo shop, with a week of invented sales behind
it; any other answer reshapes the open one, and `focusFor` in `model.ts`
names the screen that answer changed so the window opens it.

**After any change to the desktop app's screens, run `npm run build:web` in
the desktop repository and commit `public/app-preview` here,** or the
website shows the previous app.

The 80mm receipt in `app-ui` is laid out at 576 pixels, which is 80mm at
203 dpi, and scaled to fit. That is why `Scaled` measures instead of using a
percentage: what the owner sees has to be what the printer cuts.

The preview is loaded separately from the questions. It carries the app
screens and the schema with it, and on a slow phone that weight between the
owner and the first question is the difference between answering and leaving.

## The phone app

`public/app` is the same desktop app built for a phone's browser
(`npm run build:phone` in the desktop repository, see its `docs/PHONE.md`).
The owner opens it once, adds it to his home screen, and it works with no
internet from its own icon. His account page shows a code to scan, or on a
phone a button, that opens it on his shop with the serial after the `#`.

`/app` and `/app/` redirect to `/app/index.html` (`next.config.mjs`): the
service worker keeps that page for when there is no network, and cannot
follow a redirect then. **After any change to the desktop app's screens, run
`npm run build:phone` there too, and commit `public/app` here.**

## Questions and the AI

A pack's questions live in `builder/packs/<pack>/questions.v*.json`, validated
by `bank.ts` at import and again by `bank.test.ts`. Adding a question is
editing a file. Only what changes how the software works for that owner is
asked, three questions at most for a trade, and a test holds that line: a
setting that can have a good default gets one in `app-ui/config.ts` instead.
Every question opens on its own default, already chosen, and a test walks every
bank to prove an owner who only presses Continue still ends up with software
that works.

`maps_to` says where an answer lands in the configuration. A test resolves
every one of those paths against the real schema, because a path with a typo
writes a field nobody reads and the answer disappears without an error.

The interview no longer offers "Expliquer avec mes mots" (2026-11-05): it sat
under every question and drew the eye from the answer. An owner whose case does
not fit has "Aide sur WhatsApp" on every step. `/api/builder/interpret` is still
there, and what follows describes it for the day it comes back.

The AI is optional and narrow. It reads one question, the owner's sentence and
the switches set so far, and proposes a patch. `patch.ts` then decides: every
path it touches has to be one that question could have set by itself, and the
result has to validate. Anything else and the question keeps its default while
the sentence is kept as a feature request.

What the model never sees: the shop's name, phone, address, logo or products.
The browser sends answers rather than a configuration, and `shareable()` is
the only thing that reaches the provider. `provider.test.ts` checks it.

With no `GEMINI_API_KEY` there is no provider, and "Expliquer avec mes mots"
still works: it keeps what he wrote and tells him so.

## What is not built yet

The bakery, restaurant and warehouse packs (B6), and staff imported from a
file, which was agreed for after B6.
