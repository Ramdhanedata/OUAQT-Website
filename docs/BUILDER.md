# OUAQT App Builder

A business owner answers questions about his shop and leaves with management
software ready to install on the shop computer, plus a serial number. This
document is for whoever picks the work up next.

Status: **B1**. Step 1 is complete, the preview shows the owner's own receipt
and sale screen, and answers save themselves. The interview, the import, the
account and everything after are still to come.

## The one rule

The platform never writes code for a client. There is one desktop app with one
pack per business type. The builder turns answers into a **configuration** for
that app, validated against a versioned schema before it is stored. When the AI
is used it only proposes changes to that configuration, and a rejected proposal
falls back to the question's default.

The second rule follows from the first: **the server never holds the shop's
trade**. No sales, stock movements, customer credit, cash closes or backups.
Those live only on the owner's computers. `builder/db/no-business-data.test.ts`
reads every migration and fails the build if a place to put them appears.

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
| `builder/ui/step-business.tsx` | Step 1: business type, languages, name, receipt details, logo |
| `builder/draft/store.ts` | Answers, on the device and on the server |
| `builder/logo/` | Cropping, resizing and thresholding the owner's logo, in his browser |
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

Still to come, with the milestone that adds them: AI provider and key (B2),
installer addresses (B3), the Ed25519 signing key (B5).

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

`app-ui` holds the screens the desktop app will import unchanged: the sale
screen and the 80mm receipt so far. They take a configuration and sample data
as props and render; they know nothing about the builder, the website or the
database.

The receipt is laid out at 576 pixels, which is 80mm at 203 dpi, and scaled to
fit. That is why `Scaled` measures instead of using a percentage: what the
owner sees has to be what the printer cuts.

The preview is loaded separately from the questions. It carries the app
screens and the schema with it, and on a slow phone that weight between the
owner and the first question is the difference between answering and leaving.

## What is not built yet

The interview and the AI (B2), spreadsheet import and staff (B3), account area
and serial (B3), payments and admin (B4), the licence API, signing and renewal
codes (B5), the other three packs (B6).
