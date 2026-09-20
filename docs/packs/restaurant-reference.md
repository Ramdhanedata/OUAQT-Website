# Restaurant and café: what the earlier client app shows

Read from screenshots of a café and restaurant app OUAQT built for one client,
including its printed receipt. Reference for what the work needs, not for how
it looked. No real names, prices or data are carried over. See
`docs/UI_RULES.md`.

## Screens the staff use every day

**The till is the home screen**, with the menu split into a couple of
categories across the top and the order building on the right.

| What the screen carries | Why it matters here |
| --- | --- |
| Category tabs, then product tiles with the price under the name | Fast tapping, no searching during a rush |
| An **"add"** tile in the grid | Staff add a product mid-service without leaving the till |
| Order panel: each line with quantity minus and plus, a line total, and a **note** | Notes are used constantly in food service ("no sugar") |
| Customer choice at the top of the order: **passing customer** or **an account** | Credit is chosen while taking the order, not at payment |
| **Part payment**: a "add the rest in cash" action, an amount box, then cash or app | One bill is often settled with two methods |
| A window listing the mobile apps, plus "other" | Same as the pharmacy reference |
| **Orders on hold**, numbered, with their items, total and how long they have waited | Tables are served before they pay; the minutes waiting are watched |
| Day total and the number of orders in the header | The owner watches the day build |
| Buttons for customer debts, statistics, history, **end of day** | End of day is a named daily action, matching our cash close |

## The printed receipt

The receipt in the reference app carries, in order: the shop logo, the order
number, the date, the time, **the service type** (eaten in, taken away), then a
table of item, quantity, unit price, line amount, then a payments block listing
each method and its amount, then the total paid, then a thank-you line. The
screen offers **PDF**, print, and close.

Measured against our planned 80mm receipt:

| Our receipt has | Change suggested |
| --- | --- |
| Shop name, logo, phone, address | Keep |
| Items, quantity, unit price, line total | Keep |
| One total | **Add a payments block**: one line per method, then total paid. A split bill is unreadable otherwise |
| Date | **Add the time, the order number, and the service type.** All three are on the reference receipt, and staff use the number to find an order again |
| Print | **PDF is worth having.** It is how a receipt reaches a customer on WhatsApp |

## Measured against what we planned

| Planned | What the reference says |
| --- | --- |
| Sale screen, receipt, product list, cash close | Matches, plus **orders on hold**, which our sale screen has no place for |
| `rs_kitchen`: screen, printed ticket, or spoken | The reference client used none of these; orders waited on the till itself. The question is still right, but "aucune" may be a missing option |
| `rs_tables`: number of tables | The reference app worked without a table plan, by order number. Worth asking whether the owner wants tables at all before asking how many |
| Credit customers | Matches, but chosen **at the start of the order**, not at payment |

## Suggested question bank changes

Proposals only. Nothing changed in the banks or the schema.

| Suggested id | Question (fr) | Type | Options | Default | Why |
| --- | --- | --- | --- | --- | --- |
| `c_split_payment` | Un client peut-il payer une partie en espèces et le reste par application ? | yes_no | | Oui | Common bank. The reference till is built around it |
| `c_receipt_copy` | Voulez-vous pouvoir envoyer le reçu par WhatsApp ? | yes_no | | Oui | Common bank. Decides whether the receipt can be saved as a file |
| `rs_hold_orders` | Gardez-vous des commandes en attente pendant que d'autres clients paient ? | yes_no | | Oui | The busiest part of the reference screen |
| `rs_line_note` | Avez-vous besoin d'écrire une remarque sur un article ? | yes_no | | Oui | Used on nearly every order in food service |
| `rs_add_product_fast` | Ajoutez-vous parfois un produit pendant le service ? | yes_no | | Oui | The "add" tile in the grid |
| `rs_service_on_receipt` | Le reçu doit-il indiquer sur place ou à emporter ? | yes_no | | Oui | On the reference receipt |
| `rs_tables` (change) | Ask first whether tables are tracked, then how many | yes_no then number | | Non | The reference client ran on order numbers alone |
| `rs_kitchen` (change) | Add an option: **La cuisine voit les commandes sur la caisse** | single_choice | existing three, plus this | unchanged | That is what the reference client did |

## Proposed question-bank changes, from the reference apps

Written after the bank was drafted. **Nothing here is in the bank**; each is a
question for you before it would be.

1. **Orders held open while a table eats.** The reference app kept a running
   order per table, and the sale screen we share has no place for one. This is
   the largest gap between the bank and what a restaurant actually does.
2. **Split payment on one table.** Four people, two paying. The payment
   question in the common bank offers one method per sale.
3. **Service charge or a tip line.** Present on the reference receipts; the
   bank does not ask about it and the receipt has no line for it.

### A conflict to resolve

`rs_kitchen` offers **"Sur un écran"**, and the desktop brief has since fixed
version one at **printed tickets only**, with no second screen and no extra
window. Offering the screen option in the builder would promise something the
software does not do.

Two ways out, and it needs your word: drop the option until the app has it, or
keep it and have the builder say "bientôt" when it is chosen. Until then the
bank stays as drafted, which is what you asked for.
