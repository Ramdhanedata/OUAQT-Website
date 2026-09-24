# Pharmacy: what the earlier client app shows

Read from screenshots of a pharmacy app OUAQT built for one client. Reference
for **what the work needs**, never for how it looked. No names, prices or other
real data from those screenshots appear here or anywhere in the code. See
`docs/UI_RULES.md`.

## Screens the staff use every day

**The till is the home screen.** It is the first menu item and the one that
opens. Everything else (dashboard, stock, reports, settings) sits below it.

**Selling** is: type a few letters, tap the product, it lands in the basket on
the right, choose how the customer pays, confirm.

| What the screen carries | Why it matters here |
| --- | --- |
| A wide search box above the products | Staff search by name rather than browse |
| Product tiles: name, a second name in brackets, price, **stock left** | Stock on the tile is how they answer "do we still have it" without leaving the till |
| Some products priced at zero | Price is not always known in advance, or is set at the counter |
| Basket panel with its own empty message | The basket is always on screen, never hidden behind a button |
| Sub-total, then a separate **net to pay** | Something sits between the two: a discount, or a share paid by someone else |
| Payment choice: cash, **mobile app**, **insurance / third-party** | Three ways, not two |
| A second window to pick which mobile app | Several apps are in daily use, plus "other" |
| One large confirm button at the bottom right of the basket | One main action, always in the same place |
| The signed-in person and their role in the corner | Staff know whose till it is |

## Measured against what we planned

| Planned in `app-ui` / the pack schema | What the reference says |
| --- | --- |
| Sale screen with search and product tiles | Matches. **Add stock left to the tile**, it is used constantly |
| Receipt, product list, cash close | Matches; no pharmacy receipt was in the screenshots, so the receipt is checked against the café one in `restaurant-reference.md` |
| Payment: cash or not | **Too thin.** Real tills take cash, one of several mobile apps, and a third-party payer |
| Expiry dates, batch numbers, alerts | Not visible on the till screen. Probably on the stock screen. Worth confirming **where the owner expects the expiry warning to appear**: at the till when selling, or only in stock |
| Roles: Gérant and Caissier | The reference app shows a role by name in the header. Ours keeps two roles; nothing to change |
| Sub-total then total | Our sale screen has one total. **A second line is needed** when a discount or a third party covers part |

## Suggested question bank changes

Proposals only. Nothing has been changed in the banks or the schema.

**For the common bank, all packs**

| Suggested id | Question (fr) | Type | Options | Default | Why |
| --- | --- | --- | --- | --- | --- |
| `c_payment_apps` | Acceptez-vous le paiement par application ? | multi_choice | the apps in daily use in Mauritania, plus "Autre" | Aucune | The till needs to know which buttons to show; three different reference apps all had this |
| `c_cashier_sees_total` | Voulez-vous que vos employés voient le total de la journée ? | yes_no | | Non | Some owners do not want staff seeing takings; the reference app shows it to everyone |

**For the pharmacy bank**

| Suggested id | Question (fr) | Type | Options | Default | Why |
| --- | --- | --- | --- | --- | --- |
| `ph_stock_on_tile` | Voulez-vous voir la quantité restante à côté de chaque médicament pendant la vente ? | yes_no | | Oui | On the tile in the reference app, used to answer customers |
| `ph_price_at_counter` | Certains médicaments n'ont-ils pas de prix fixe ? | yes_no | | Non | Zero-priced items existed; the till must accept a price typed at the moment of sale |
| `ph_expiry_where` | Où voulez-vous être prévenu d'une date de péremption proche ? | single_choice | Au moment de la vente, Dans la page stock seulement, Les deux | Les deux | Follows `ph_expiry`; decides whether the warning interrupts a sale |
| `ph_discount_line` | Faites-vous parfois une remise sur le montant total ? | yes_no | | Non | Explains the gap between sub-total and net to pay, if it is not insurance |

**Needs your decision before I write it as a question**

The reference app has a payment mode for an insurance or third-party payer,
with the rest left for the customer. That is health cover, and section 24 of
the brief says to stop and ask on anything regulatory or about medicines.

It changes more than one answer: the sale screen needs a second amount line,
the receipt needs to show who pays what, and the pack needs somewhere to keep
the payer's name. Tell me whether the pharmacy pack should handle third-party
payers at all, and I will write the questions and the schema around your answer.
