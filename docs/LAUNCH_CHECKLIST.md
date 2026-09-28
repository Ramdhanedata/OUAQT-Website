# Before the first real owner

Things that are fine in the test project and are not fine in front of a
paying shop. Each one is a switch or a value, not a piece of work.

## Blocking, from the launch audit (2026-09-26)

- [ ] **Production installers.** Every installer released so far is a test
      build: it activates against the builder branch's site and the test
      project, trusts the test licence key, and obeys the test switches. For
      launch:
      1. A production licence key pair. The private half as
         `LICENCE_SIGNING_KEY` in Vercel's production environment; the public
         half in the desktop app's `electron/licence/keys.ts` (the file says
         where).
      2. The release workflow builds with `OUAQT_RELEASE=production`, so the
         app talks to the live site, shows no test banner, and forgets every
         `OUAQT_` switch on start (`electron/lockdown.ts`).
      3. The `installer_url_*` settings in production point at those
         releases.
- [ ] **Production database migrations.** `npm run db:push` against the
      production project, which I never touch. 0024 to 0027 are new this
      week: the download that opens the software by itself, owners reading
      but not writing their rows (a real hole until it runs: an owner could
      give himself the launch price), the AI's daily budget, and the machine
      named in each licence.
- [ ] **The builder branch's preview.** On the test project its admin area
      opens without signing in, by design, for testing. No real shop may ever
      activate against it. After launch, turn Vercel Authentication back on
      for previews.

## Decisions the audit leaves to you

- [ ] **`payment_auto_confirm` is on.** A screenshot read by the AI whose
      amount, receiving number, date and reference all check out opens the
      licence at once, and a person looks afterwards. A well forged
      screenshot would pass until then. Check the confirmed payments in the
      admin area every day, or turn it off until the volume needs it.
- [ ] **`ai_calls_per_day`** (500): the builder's explain-in-my-words and
      the payment screenshots together. Raise it if owners start to meet it.
- [ ] **Case-study figures.** Only the GMM result is marked as confirmed by
      the client. The pharmacy, hotel, transport, school and restaurant pages
      give figures ("over 90% fewer errors", "60 hours a month"): confirm
      them with the clients or take them off, as `lib/data/projects.ts` asks.
- [ ] **The Facebook link** in `lib/data/contact.ts` is marked as doubtful.
- [ ] **`RESEND_API_KEY`** in Vercel, so leads and enquiries are mailed by
      the server rather than through FormSubmit from the visitor's browser.
- [ ] **`NEXT_PUBLIC_SITE_URL` = `https://www.ouaqt.com`** in Vercel
      (Production), then a redeploy, so share previews, canonical addresses
      and the sitemap carry the domain. The domain was bought on Spaceship on
      2026-09-28 and pointed at the Vercel project: `www.ouaqt.com` serves the
      site and `ouaqt.com` redirects to it (308). `ouaqtcom.vercel.app` keeps
      serving the same site and must stay that way, without a redirect,
      because every desktop app built before the domain activates through it.

## Supabase dashboard

- [ ] **Anonymous sign-ins: on.** Authentication, Sign In / Providers.
      Without it a draft has no owner and nothing saves to the server.
- [ ] **Confirm email: off.** Authentication, Sign In / Providers, Email.
      Owners sign in with a phone number turned into an address. There is no
      mailbox behind it, so a confirmation email is one nobody can ever open,
      and on the free tier it also hits the sending limit within minutes.
- [ ] A production project of its own, separate from `ouaqt-builder-test`.

## Environment

- [ ] `SERIAL_SECRET` set in production, and **different** from the test one.
      Changing it later makes every existing serial unreadable to its owner.
- [ ] `NEXT_PUBLIC_ACCOUNT_EMAIL_DOMAIN` decided **before** the first owner.
      Changing it afterwards locks every one of them out of their account.
      It still points at the Vercel address. ouaqt.com has DNS since
      2026-09-28, so it could move there, but only while no owner exists.
- [ ] The `installer_url_windows_<trade>` and `installer_url_mac_<trade>`
      settings pointing at the real installers, for every trade that is open.
      A trade whose addresses are empty says the software is coming, which is
      honest but is not a launch. They point at the public
      `Ramdhanedata/ouaqt-releases` repository's latest release.
- [ ] Decide on `AI_TIER=paid` and a paid key. Payment screenshots are read
      on either tier since 2026-09-25 (see ASSUMPTIONS), so owners are told
      at once whether a payment went through. On `free` the provider may keep
      the receipts it reads and use them; a paid key keeps them out of its
      training, and the privacy page would then say so again.
- [ ] The five payment numbers in Réglages (`bankily_number`,
      `masrvi_number`, `bimbank_number`, `sedad_number`, `click_number`).
      0021 starts the four new ones with the Bankily number.

## The installers

- [ ] **macOS notarisation, before the first real owner.** Unsigned, macOS
  refuses the first open, and the way through is a right-click and "Open"
  that most people do not know exists. Decided 2026-09-22: buy it.
  1. Join the Apple Developer Program (99 USD a year) with the OUAQT Apple ID.
  2. In Xcode or at developer.apple.com, create a **Developer ID
     Application** certificate and export it as a `.p12` with a password.
  3. At appleid.apple.com, make an **app-specific password**. Not the
     account password.
  4. In `Ramdhanedata/ouaqt-desktop`, Settings, Secrets and variables,
     Actions, add all five: `MAC_CSC_LINK` (the `.p12`, base64),
     `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`,
     `APPLE_TEAM_ID`. All five or none: the build refuses half of them.
  5. Push anything. The macOS workflow signs and notarises, and the log says
     "notarization successful". Open the `.dmg` on a Mac that has never seen
     it: it should open with no warning at all.
- [ ] **Windows stays unsigned for now,** with the install video showing the
  "More info, Run anyway" box. Decided 2026-09-22: buy a certificate only if
  owners get stuck. When that day comes, add `WINDOWS_CSC_LINK` and
  `WINDOWS_CSC_KEY_PASSWORD` to the same secrets and the next push signs.
  Nothing else changes.

## Settings, in the admin area

- [ ] `tutorial_video_windows_url` and `tutorial_video_mac_url`, or the
      installation help stays hidden.
- [ ] Prices confirmed once more against what the terms say.
- [ ] `enabled_packs` matching the packs that are actually finished.

## Content

- [ ] Arabic and English copy reviewed. Everything added by the builder is
      marked for it: `TODO(adel)` in `builder/copy/`, `"review": true` in the
      question banks.
- [ ] The terms of use, in their final form, linked from the account step.
