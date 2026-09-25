# Before the first real owner

Things that are fine in the test project and are not fine in front of a
paying shop. Each one is a switch or a value, not a piece of work.

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
      It currently points at the Vercel address because ouaqt.com has no DNS.
- [ ] The `installer_url_windows_<trade>` and `installer_url_mac_<trade>`
      settings pointing at the real installers, for every trade that is open.
      A trade whose addresses are empty says the software is coming, which is
      honest but is not a launch. They point at the public
      `Ramdhanedata/ouaqt-releases` repository's latest release.
- [ ] `AI_TIER=paid` and a paid key. On `free` the AI reads the owner's words
      only, so payment screenshots are never sent to it and every payment
      waits for a person. That is the right behaviour, but it does not scale.
      On `paid` the screenshot is read for the amount, the date and the
      transaction number, and a wrong one is refused while the owner is still
      on the page (see ASSUMPTIONS, 2026-09-25).
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
