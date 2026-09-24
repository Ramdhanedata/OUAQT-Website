# Bakery: what the earlier client apps show

**No bakery screenshots were provided.** What follows is drawn from the café
and till apps OUAQT built for other clients, which share the counter work, plus
the gaps that leaves. Treat every line here as weaker evidence than the
pharmacy, restaurant and warehouse files, and worth one conversation with a
real bakery owner before B6. See `docs/UI_RULES.md`.

## What carries over from the counter apps

- **The till is the home screen**, with category tabs and product tiles showing
  the price. A bakery counter is the same rhythm as a café counter: few
  products, tapped fast, no searching.
- **An "add" tile** in the product grid, for the item made today that is not in
  the list.
- **Part payment** and the mobile payment apps, exactly as in the other two.
- **Orders on hold**, which in a bakery is a customer waiting for bread coming
  out of the oven.
- **A receipt** carrying number, date, time, items, payments and total paid.

## What no screenshot answers

These are the parts of the bakery pack with no evidence behind them:

1. **Selling by weight.** Our `bk_sell_by` asks piece or weight. Nothing shows
   how a weight sale is entered: typed grams, typed price, or a scale attached
   to the computer. A scale is hardware and changes the install.
2. **Daily production.** `bk_production` asks whether to record it. Nothing
   shows what the owner does with it: a sheet printed for the baker in the
   morning, or a number typed at the end of the day.
3. **Pre-orders.** `bk_preorders` and `bk_deposit` exist. Nothing shows the
   slip a customer takes away: pickup date, deposit paid, amount still owed.
4. **Unsold at closing.** `bk_unsold` exists. Nothing shows whether the loss is
   recorded per product or as one number.

## Suggested question bank changes

Proposals only. Nothing changed in the banks or the schema.

| Suggested id | Question (fr) | Type | Options | Default | Why |
| --- | --- | --- | --- | --- | --- |
| `bk_weight_entry` | Comment entrez-vous une vente au poids ? | single_choice, if `bk_sell_by` includes Au poids | Je tape le poids, Je tape le prix, J'utilise une balance branchée | Je tape le prix | Decides the sale screen, and whether hardware is involved |
| `bk_preorder_slip` | Voulez-vous imprimer un papier pour le client qui commande à l'avance ? | yes_no, if `bk_preorders` = Oui | | Oui | The slip carries pickup date, deposit and what is still owed |
| `bk_production_when` | Quand notez-vous la production du jour ? | single_choice, if `bk_production` = Oui | Le matin avant l'ouverture, Le soir à la fermeture | Le matin avant l'ouverture | A morning sheet and an evening count are different screens |
| `bk_unsold_detail` | Notez-vous les invendus produit par produit ? | yes_no, if `bk_unsold` = Je les note comme perte | | Oui | Decides whether closing asks for a list or one number |
| `bk_hold_orders` | Gardez-vous des commandes en attente pendant que d'autres clients paient ? | yes_no | | Oui | Same as the café pack |

**Before B6 I would like one bakery owner to read these questions aloud.** The
bakery pack is the only one of the four with no reference app behind it.

## Proposed question-bank changes, from the reference apps

Written after the bank was drafted. **Nothing here is in the bank**; each is a
question for you before it would be.

1. **Does he bake to order for other shops?** Several bakeries here supply
   small grocers as well as their own counter, and that is a different
   customer with a different price. The current bank has no way to say it.
2. **When does the day start?** A bakery's day begins before midnight for the
   first batch. The cash close and the production day may need to be an
   offset, not a calendar date.
3. **Unsold, resold at what price?** The bank asks what happens to what is
   left. If the answer is "I sell it the next day", the software needs to know
   whether that is at full price or a reduced one.

There was no bakery among the reference apps, so these come from the sector
rather than from a screenshot. Treat them as weaker evidence than the
pharmacy and warehouse notes.
