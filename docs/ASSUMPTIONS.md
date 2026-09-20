# Assumptions

Every decision taken without an answer from Adel, with the date and the reason.
Each says how to undo it. Newest first.

## 2026-09-20, B0

**The builder sits in the header's action button, not as a sixth menu link.**
In French, six links (Accueil, Projets, Tarifs, À propos, Contact, Créer mon
logiciel) do not fit the header at 1024px; the earlier fifth link already
forced the full menu down to that width. Contact remains a menu link, so
nothing became unreachable. Undo: move it back into `links` in
`components/navbar.tsx` and drop a link or shorten the labels.

**Arabic keeps the Latin builder slug (`/ar/build-my-software`).** An Arabic
slug arrives percent-encoded when shared on WhatsApp, which is where these
links will travel. Undo: one line in `lib/i18n/routes.ts`; the switcher,
middleware, sitemap and canonical tags follow automatically.

**The builder landing and the steps share one address.** The brief asks for the
landing to be indexed and the steps not. The landing is what the server
renders, so that is what search engines read; the steps replace it in the
browser without changing the address. This also means resuming a draft needs
no deep link. Undo: give the steps their own route and mark it `noindex`.

**No ICU message formatter yet.** The site formats with a small `fill()`
helper and has no ICU dependency. Builder copy follows the same pattern for
now. Plurals in B1 (days remaining, rows to fix) are the point where this has
to be decided; `Intl.PluralRules` covers them without a dependency if you
would rather not add one. Waiting on your answer.

**English and Arabic builder copy is marked for review** with a note at the top
of `builder/copy/en.ts` and `builder/copy/ar.ts` rather than per string. With
15 strings a file header is enough; when the question banks land in B2 this
becomes a review file listing keys, checked by a test.

**Node types moved from ^20 to ^24** so Vitest 5 could install. Types only,
and the machine already runs Node 24. Nothing in the site's build changed.

**The database schema is written but not applied.** There is no Supabase
project yet, and creating one needs your account. `builder/db/migrations`
holds the SQL; the row-level security tests that need a live database come
with B0b once the project exists.
