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

## 2026-09-20, B1

- **The logo stays on the device until there is an account.** The draft saved
  to the server carries every answer except the two logo images. They are the
  only answer measured in hundreds of kilobytes, and re-uploading them after
  every keystroke on a 2G connection would cost the owner his patience and his
  credit. They upload once, at the account step in B3. The cost: an owner who
  switches phones mid-build keeps his answers and loses his logo.
- **French groups thousands with U+202F**, a narrow no-break space, which is
  what `Intl` produces and what the tests pin. A thermal printer with a narrow
  codepage may not have that character, so the printing side in the desktop app
  has to normalise it before it goes to the roll.
- **The pharmacy sample products carry no medicine names, dosages or brands.**
  They are counter items: soap, plasters, gloves. Nothing on a preview screen
  should be able to read as advice about a medicine. If you want real product
  names in the sample list, say so and I will ask what is safe to show.
- **`BUILDER_DEV_SETTINGS` exists so the builder can be walked with no
  database.** It is read only when Supabase is unconfigured, so it cannot
  override a real setting in production, where the variable is not set.
- **Removing a line from a sale in progress does not ask for confirmation.**
  Rule 9 asks before deleting, but a line tapped by mistake is a correction,
  not a deletion, and a confirmation on every mistap costs more than it saves.
  Cancelling a whole sale will ask, in B2.

## 2026-09-20, B2

- **`AI_TIER=free` means the model reads words and nothing else.** Payment
  screenshots are not sent to a free endpoint, so B4 will require the typed
  transaction reference and send the payment straight to manual confirmation.
  `mayReadImages()` is the single switch.
- **The model is `gemini-3.6-flash`, not `gemini-2.5-flash`.** Google refuses
  2.5 for new keys: "no longer available to new users". The name is an
  environment variable, so moving to a paid provider stays a settings change.
- **The patch comes back as JSON text, not as a JSON object.** Gemini's
  structured output returns an empty object for a property with no declared
  properties, and the paths differ per question so they cannot be declared.
  The first version of this silently told owners their answer had been applied
  while nothing had changed. An empty patch is now refused outright.
- **`c_devices` builds its options from `max_devices` in settings** rather than
  the "1, 2" written in the brief, so raising the device limit cannot leave the
  question contradicting the licence.

## 2026-09-20, B3

- **Plurals are handled by `Intl.PluralRules`, not a library.** This was the
  open question about an ICU formatter. The copy supplies whichever forms its
  language uses and `other` is the fallback every language must have. French
  needs one and other; Arabic also uses zero, two, few and many, and a test
  checks all of them. No dependency, nothing to keep up to date.
- **Configurations and serials are written by the server, never by the owner's
  browser.** Their tables are select-only for owners, which was right and
  which my first version of the finish route ignored. The configuration is
  what the desktop app runs on and the serial is what unlocks it: neither may
  be written by a browser holding a public key.
- **Finishing twice does not make two businesses.** A retry returns the serial
  the first attempt issued, and a failure part way through deletes the
  half-built business rather than leaving a shell that blocks the next try.
- **The product list lives in memory until the account exists.** Ten thousand
  rows do not belong in browser storage. The staff list does live in the
  draft, because it is a few names. An owner who reloads between the import
  and the account loses the import and has to choose the file again.
- **SheetJS comes from the SheetJS CDN, not npm.** The npm copy has been stale
  since 2022. A csv is decoded as UTF-8 here before SheetJS sees it, because
  left alone it reads Latin-1 and a header saying "Péremption" arrives as
  "PÃ©remption", no column matches it, and every expiry date goes unchecked.

## Agreed, to build after B6

- **Staff imported from a file**, with the same tolerance the product import
  has: loose header matching in three languages, names trimmed, and an
  unrecognised role defaulting to Caissier and shown for the owner to check.
  Typing stays the default; the file is the option. Agreed 2026-09-20.
