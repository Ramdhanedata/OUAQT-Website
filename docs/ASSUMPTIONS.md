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

## 2026-09-20, B6

- **A configuration must carry its own pack's features and nobody else's.**
  The shape alone allowed a bakery configuration with a pharmacy block, which
  would send the desktop app looking for expiry dates in a shop that sells
  bread, and allowed one with no block at all, which says nothing about what
  the software should do. Both are refused now.
- **The restaurant floor groups into zones above 24 tables.** A flat grid of
  two hundred is not something anybody can scan, and staff already talk about
  a room that way: table 34 is in the third zone.
- **The warehouse place filter is hidden when there is one place.** A screen
  that makes somebody choose between a single option wastes his morning twice
  a day.
- **`rs_kitchen` still offers "Sur un écran"** although the desktop brief has
  fixed version one at printed tickets only. The bank is as you drafted it;
  the conflict is written up in docs/packs/restaurant-reference.md and needs
  your word before launch.
- **app-ui has a package.json now.** It declares the name, the exports and the
  peer dependencies, which is the first half of publishing it for the desktop
  app. It changes nothing for the website: the build and the tests are clean
  either way.

## 2026-09-25, paying from any app

- **Five apps, one number, set per app.** The owner chooses Bankily, Masrvi,
  BimBank, SEDAD or Click, and the page shows that app's number with the same
  three steps. Each number is its own setting (`<app>_number`); an empty one
  hides that app. Adel's answer: all five start with the Bankily number.
- **No transaction number to type.** It is read off the screenshot with the
  amount and the date. Adel's answer on who reads it: the AI, on the paid
  tier only. The free-tier rule from B2 stands, so with `AI_TIER=free` the
  screenshot is not sent anywhere and a person reads it in the admin area,
  which now says so on each payment.
- **What a reading can refuse on the spot:** an image that is not a transfer,
  less than the price, a transfer to another number, one older than
  `payment_max_age_days`, one dated more than a day ahead, and a screenshot or
  transaction number already used. Paying more than the price is not
  refused; the person confirming sees it. A field the reading could not make
  out is never a refusal.
- **A refusal on the spot reserves nothing.** The screenshot and the
  transaction number were unique columns, so a duplicate was refused by the
  check and then by the insert, and the owner read "it did not go through"
  instead of why. They are unique now among payments that were not refused on
  the spot (0021), which also lets a misread screenshot be sent again.
- **The privacy page says the screenshot may go to the AI service**, on a
  paid plan whose terms rule out training on it. It said receipts were never
  sent, which stops being true the day `AI_TIER=paid` is set.
- **A payment that checks out is confirmed at once (0022).** Adel's word:
  after a payment the software should open straight away. So when the
  screenshot was read and every field matched (a transfer, at least the price,
  a date inside the window, a transaction number not used before, our number
  as the recipient), the licence opens without waiting, and the app, which
  asks every 30 seconds while it shows the end of its trial, opens with it.
  A field that could not be read sends the payment to a person instead. Every
  automatic confirmation still reaches the admin area, to be kept or undone;
  undoing puts the licence back as it was. `payment_auto_confirm` turns it
  off. On the free AI tier nothing is read, so a person confirms every
  payment and the app opens as soon as they do.
- **The trial counts down out of sight.** No notice in the last days any
  more; Réglages still says how many days are left, for an owner who looks.
  When it ends the app stops selling and says so kindly each time it opens,
  with the serial number, how to pay from the phone, and a WhatsApp button to
  OUAQT, whose number now comes with every licence check.
- **A paid licence does remind.** In its last five days and through the grace
  days after it, the app shows the end date once a day with a way to pay,
  which the site's FAQ already promised.
- **A year or six months (0023).** Adel's word: the payment page offers
  both, six months at half the year (15 000 launch is 7 500; 18 000
  standard is 9 000). Each is its own setting, seeded at half and changed in
  Réglages like any price. The pricing page shows the six-month licence in
  place of the three-month one, which the payment page never offered.
- **Two steps on the payment page:** pay from the chosen app, then send the
  screenshot here. The result is said at once in a box: "Paiement réussi"
  when it was read and matched, "Paiement reçu" when a person will look,
  or what is wrong with the screenshot.
- **Screenshots are read on every tier (Adel's decision, 2026-09-25).** He
  wants the owner told at once: "Paiement réussi. Merci." or "Vérifiez
  votre paiement". That needs the screenshot read, and he chose the free
  Gemini tier over waiting for a paid key, knowing the provider may keep
  what it is sent and use it to improve its products. `mayReadImages()` now
  says yes everywhere, and the privacy page says what is sent and why.
  Tested end to end with invented Bankily confirmations: the right amount
  was confirmed on the spot, 15 000 against 18 000 was refused.
- **`destructive` is a colour now.** The builder and the admin used it for
  every error from the start and it was never defined, so errors read in
  plain black. A red that reads on ivory.

