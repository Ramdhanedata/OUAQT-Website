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
  "serial":     "RXVE-7DV3",        // what the owner types
  "deviceId":   "a-stable-id",      // the app's own id for this computer
  "deviceName": "Caisse",           // optional, shown to the owner
  "platform":   "windows"           // or "mac"
}
```

```jsonc
200 {
  "licence":              "<signed>",   // see below
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
409 { "error": "device_limit", "maxDevices": 2 }
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
software on Friday and installs it on Monday should not lose the weekend. A
`deviceId` that has already been through a trial under another shop gets no
new one; the phone number is the login, so a second account with the same
number cannot exist.

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
| `renewal_due` | everything | remind once a day, with the amount and the Bankily number |
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
