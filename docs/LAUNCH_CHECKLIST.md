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
- [ ] `INSTALLER_URL_WINDOWS` and `INSTALLER_URL_MAC` pointing at the real
      installers. Until then the builder says the software is coming and hides
      the buttons, which is honest but is not a launch.
- [ ] `AI_TIER=paid` and a paid key. On `free` the AI reads the owner's words
      only, so payment screenshots are never sent to it and every payment
      waits for a person. That is the right behaviour, but it does not scale.

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
