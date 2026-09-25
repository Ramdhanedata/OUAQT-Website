# The licence API

What the desktop app does, and what it may rely on. Written for whoever builds
that app, including a version of us in six months.

The shape of the thing: **the app is correct on its own.** It holds a signed
licence file that says not only when the licence ends but what all the rules
are, so a shop behind a closed shutter with no signal behaves exactly as it
would online. The endpoints below exist to start that file and to refresh it,
never to be asked permission.

## The one rule about what these endpoints accept

No sale, no stock movement, no customer credit, no cash close and no backup
may ever be sent here. Both request schemas are **strict**: a body carrying a
field that is not listed is refused with `400 invalid_request` before anything
reads it. There is no branch in either route that could store trade data,
because there is no field to store it in.

`scripts/licence-client.mjs` proves it on every run, by trying.

## Activation

```
POST /api/licence/activate
{
  // One of these two, never both. See "Two ways in" below.
  "serial":     "RXVE-7DV3",        // what the owner types
  "token":      "<one-time, from the website>",
  "deviceId":   "a-stable-id",      // the app's own id for this computer
  "deviceName": "Caisse",           // optional, shown to the owner
  "platform":   "windows",          // or "mac"

  // The machine, in three salted hashes. Never a serial number.
  "fingerprint": {
    "board":   "<sha256 of salt + motherboard/BIOS serial>",
    "disk":    "<sha256 of salt + system disk serial>",
    "machine": "<sha256 of salt + OS machine id>"
  }
}
```

```jsonc
200 {
  "licence":              "<signed>",   // see below
  "serial":               "XXXX-XXXX",   // the shop's own numéro de série, to show when the trial ends
  "deviceToken":          "<keep this>", // shown once, needed to refresh
  "configurationVersion": 3,             // name it back on every refresh

  // Everything the app needs to rearrange itself, in one response, so a
  // shop on a borrowed hotspot is online for one call and no more.
  "configuration": { /* the builder's configuration, same schema as app-ui */ },
  "products":      [ { "name": "...", "price": 12050, "quantity": 24, /* ... */ } ],
  "staff":         [ { "name": "...", "role": "manager | cashier" } ],
  "logo":          { "colour": "<signed url>", "mono": "<signed url>" } | null
}
404 { "error": "unknown_serial" }
403 { "error": "bad_token" }           // wrong, already used, or expired
409 { "error": "device_limit", "maxDevices": 2 }
409 { "error": "different_business" }  // this PC's database belongs to another shop
403 { "error": "trial_not_available",  // only when a trial would start
      "because": "same_machine | same_phone | same_business | no_fingerprint",
      "supportWhatsapp": "2222..." }
503 { "error": "no_signing_key" }      // never on a working deployment
```

**Prices are integers in minor units.** 1 MRU is 100, so `12050` is 120,50 MRU.
Never a float, never a formatted string, anywhere in this API.

The logo arrives as two short-lived signed URLs rather than as bytes, because
the response is already the largest thing a shop downloads on a hotspot and
the images are the part that can be fetched again. Fetch them during
activation and store them locally; the URLs expire.

`configuration`, `products` and `staff` are what the owner had when he
activated. Anything he changes afterwards from his phone arrives at the next
refresh.

Keep the `deviceToken`. It is shown once and is how the app proves it is
itself when refreshing. Store it beside the licence file.

Activating the **same `deviceId` again is not a second computer.** A
reinstall, a crash, a licence file removed by a cleanup tool: all look like
this, and none should cost the owner one of his two machines. The token is
replaced each time.

The **trial starts here**, not at account creation: an owner who builds his
software on Friday and installs it on Monday should not lose the weekend.

### Two ways in, and nobody types on the PC they built on

**A PC owner must never type his serial.** He built his software on the
machine he is about to install it on; asking him to copy a code from one
window into another is a step we invented.

| He built on | What he does |
| --- | --- |
| His phone | Step 4 shows the serial and the short address to open on the shop PC. He types the serial there, once. |
| The shop PC | Step 4's main button installs. Afterwards, "Ouvrir mon logiciel" opens the app through a link and it activates with nothing typed. |

The serial is still the licence for everybody. A second device, a reinstall,
a support call and an offline renewal all use it, which is why step 4 keeps
showing it on the PC path, smaller, as the thing to keep.

#### The one-time token

The website creates it when an owner reaches step 4 on a PC. It is not the
serial and cannot be used as one.

- opaque random bytes, stored hashed, never stored in the clear
- **one device, once.** Consumed the moment an activation succeeds
- expires 24 hours after it is made
- belongs to one business and can activate nothing else
- **never written to a log, an error message, an audit row or a screen.**
  It travels from the page to the app and is spent

The app sends it in place of `serial`. Everything else about activation is
the same, including the trial rules and the response, so there is one
activation path and not two.

#### A computer that already holds a shop

If this machine's database already belongs to a shop, the app sends that
shop's id as `expectBusinessId`. A serial or token for any other shop is
refused with `different_business` **before** anything happens on our side: no
trial starts, no device is registered, no claim is written.

The app then stops, and offers two ways out: pay for the licence the data
belongs to, or talk to us. It never deletes, overwrites, renames or migrates
the database it found. A shop's year of sales is the most valuable object on
that machine, and this is the one moment the software is ever tempted to
remove it.

#### How the link opens the app

A registered URL scheme: `ouaqt://activate?token=...`

**Windows.** The installer registers the scheme, so the button works as soon
as the install finishes. Electron takes the single-instance lock and reads
the URL from `argv` on a cold start, or from `second-instance` when the app
is already open.

**macOS.** The scheme is declared in the bundle, but LaunchServices only
takes notice once the app has been opened. Step 4 on a Mac therefore says to
open the app once after installing, and then to press the button. This is not
a flaw we can code around, and an instruction that matches what actually
happens is better than a button that silently does nothing.

**When it does not work.** A browser that refuses the scheme, a token that
has expired, a token already spent, a machine where the scheme never
registered: all of them end the same way. The app shows the serial screen
with one plain sentence about what happened and where his serial is. Nobody
is ever stuck on a screen with no way forward.

### One trial per shop

A trial is claimed once, against three marks: the machine, the owner's login
phone, and the business. A second trial matching any of them is refused with
`trial_not_available`.

The fingerprint travels as three salted hashes and never as serial numbers.
Two of the three agreeing is enough to call it the same machine, so a
replaced disk or a reinstalled system does not cost an owner his trial, and
three different parts is a different computer. How many must agree is a
setting.

`403 trial_not_available` is **not an accusation and must never be shown as
one.** A second-hand PC and a machine repaired with new parts both land here,
and both of those owners are honest. Show the reason in his own words, show
the WhatsApp number that came with the error, and stop. Someone grants the
trial by hand from the admin area and his next activation works.

`no_fingerprint` means this build sent none. Tell him to update the app
rather than telling him he was refused.

None of the softer signals (the same logo, the same product list, a shop name
that looks like an earlier one) ever refuse anything. They are written down
for a person to look at.

## Refresh

```
POST /api/licence/refresh
{
  "businessId":           "uuid, from the licence file",
  "deviceId":             "the same id",
  "deviceToken":          "the one from activation",
  "configurationVersion": 3        // optional: what the app already holds
}
```

```jsonc
200 {
  "licence":              "<signed>",
  "serial":               "XXXX-XXXX",   // the same, for a computer activated by a link
  "configurationVersion": 4,
  // Null when the version the app named is still the current one.
  "configuration": { /* ... */ } | null,
  "products":      [ /* ... */ ]  | null,
  "staff":         [ /* ... */ ]  | null,
  "logo":          { "colour": "...", "mono": "..." } | null
}
403 { "error": "wrong_token" }
404 { "error": "unknown_device" }     // released, or never activated
```

Call it when there is a network and the file is older than `refreshAfter`.
**Never block the shop on it.** A failure means carry on with the file you
have; that is what the grace days in it are for.

`unknown_device` means the owner freed this computer from his account. Tell
him it was released and offer to activate again.

The four travel together, keyed to `configurationVersion`. Anything that
changes a product, a member of staff or a setting writes a new configuration,
so one number answers for all of them. An app that names the current version
gets four nulls and a small response; one that names nothing, or an older
number, gets the lot.

Before answering, the route brings the shop up to date with what its owner
last did on the website: his answers, his shop's name, his logo and his staff
list. A difference in any of them is a new configuration version, so the app
picks it up on this call. A new logo is a new file whose name carries its
fingerprint, which is how the change is seen. The app keeps the logo it has
when a new one fails to download, and adds staff names it does not have yet;
it never removes one.

Omitting `configurationVersion` is always safe. It costs a larger response
and never a wrong one, which is the right way round for a first install or a
licence file restored from a backup.

## The licence file

`<base64url payload>.<base64url Ed25519 signature>`

Verify it with the public key built into the app, using `verifyLicence` from
`app-ui/licence-file.ts`, which is the same function the website uses. It
needs WebCrypto Ed25519: Chromium 137 or later, so a recent Electron.

```jsonc
{
  "version": 1,
  "businessId": "uuid",
  "businessName": "Pharmacie Essai",
  "plan": "trial | annual | perpetual | extra_device",
  "status": "trial | active | expired_trial | renewal_due | expired | suspended",
  "startsAt": "ISO or null",
  "endsAt": "ISO or null",
  "updatesUntil": "ISO or null",

  // The rules, delivered rather than assumed. All from settings.
  "maxDevices": 2,
  "renewalGraceDays": 30,
  "clockGraceDays": 2,
  "deviceReleasesPerYear": 2,
  "trialSummaryDays": 5,

  "devices": [{ "deviceId": "...", "role": "main | secondary" }],
  "renewalSecret": "what renewal codes are checked against, offline",
  "issuedAt": "ISO",
  "refreshAfter": "ISO"
}
```

If verification fails, behave as though there is no licence. Do not retry
without one and do not fall back to trusting the payload.

Check `coversDevice(payload, deviceId)` on every start. A licence file copied
onto a third machine is the ordinary way a two device limit gets tested.

## What the statuses mean to the app

| status | The shop can | The app should |
| --- | --- | --- |
| `trial` | everything | show days remaining |
| `active` | everything | nothing |
| `renewal_due` | everything | remind once a day, and offer the payment page |
| `expired_trial` | read only | explain, and offer the payment page |
| `expired` | read only | the same |
| `suspended` | read only | say to contact us |

**Read only never means hidden.** Every sale, debt and stock count already
recorded stays on screen whatever the status says. Nothing is ever deleted,
and a payment puts the rest back the same minute.

`clockGraceDays` is how much backwards clock movement to forgive before
treating the machine as tampered with. A shop computer whose battery has died
is not a fraud.

`trialSummaryDays` is how many days before a trial ends the app shows the
owner what his own shop did with it: sales rung up, credit carried, evenings
the till did not match. **Those figures are computed on his machine from his
own data and never leave it.** There is no field in this API that could carry
them and no endpoint that would take them, and there must never be one. Only
the timing travels, and only in this direction.

## Renewal codes, for a shop with no network

The app shows a **device code**: `deviceCodeFor(deviceId)` from
`app-ui/codes.ts`, ten characters in two groups. The owner reads it to us. We
read back a **renewal code** of the same shape, and he types it in.

```ts
import { verifyRenewalCode } from "app-ui/codes";

const checked = await verifyRenewalCode({
  code,                    // what he typed
  deviceCode,              // what this computer shows
  secret: licence.renewalSecret,
});
// { ok: true, endsAt: Date } | { ok: false, reason: "malformed" | "wrong_code" }
```

Both functions are pure and offline. The code is tied to one device code and
to that licence's own secret, so a code read out to the wrong shop does
nothing at all, and a code for one computer fails on another. Tested both
ways in `app-ui/codes.test.ts` and again in the CLI client.

The alphabet has no `0`, `O`, `1`, `I` or `L`. Somebody is reading these out
loud over a bad line.

### Why the secret is in the file

Checking a code with no network means holding the material to check it with,
and there is no way round that: the shutter is down, there is no signal, and
the owner is reading ten characters off a WhatsApp message.

What it costs: an owner who digs the secret out of his own licence file could
mint himself a renewal code. What it does not cost: anything lasting. The
server's dates win at the next refresh, so a forged extension survives exactly
as long as the shop stays offline, and the attempt is visible here because no
matching code was ever generated.

The alternative is an Ed25519 signature the app verifies with the public key
it already has, which is sound and is sixty four bytes. Nobody reads that down
a phone. If this trade is not acceptable, the answer is not a longer code: it
is that offline renewal stops being offered.

## Trying it

```bash
npm run licence:client                      # against localhost
npm run licence:client https://your-preview # against a deployment
```

It creates a throwaway shop, activates two computers, is refused a third,
frees one, refreshes, renews from a code, tries a code on the wrong computer,
and tries to post sales and stock. Then it deletes everything it made.

## Keys

```bash
npm run licence:keys
```

`LICENCE_SIGNING_KEY` on the server, `LICENCE_PUBLIC_KEY` built into the app.
Replacing the pair makes every licence already issued unverifiable, and every
shop holding one stops working. It belongs in the launch checklist, not in a
hurry.

## A shop built in test mode

Staff test the software on their own computers, which have had trials
already, so the one-trial-per-machine rule would refuse every test shop after
the first. A shop created while the test-mode cookie is set (Réglages, "Tester
le créateur", in the admin area) is given a trial override at creation, the
same override "Donner un essai" writes by hand, with the reason "Créé en mode
test depuis l'administration" and a `trial_granted_test_mode` audit event.
The cookie is signed by the server and only set from the admin area, so an
owner cannot obtain one.

