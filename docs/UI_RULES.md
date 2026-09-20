# Screen rules for the software the builder produces

These apply to every screen in `app-ui`, for every pack, and to the builder
itself. They are not style preferences. The people using these screens are shop
owners and cashiers who rarely touch a computer, often on an old laptop, in a
shop with customers waiting.

**Every screen must be usable on day one with nobody there to explain it.**

## The rules

1. **The app opens on the daily task.** Pharmacy, bakery and restaurant open on
   the sale screen. Warehouse opens on stock in and out. Not a dashboard.
2. **A cashier sees only a cashier's work:** selling, receipts, cash close.
   Reports, settings, prices and staff sit behind one **Gérant** button.
3. **At most five items in any menu.** More than five means grouping, not a
   sixth line.
4. **Large enough to hit and read.** Body text 16px or more, amounts and totals
   larger, buttons at least 48px high. Everything works with a mouse, a
   touchscreen or a barcode scanner.
5. **Every icon has a text label beside it.** No icon-only buttons anywhere.
6. **One main action per screen**, visually obvious. Everything else stays
   quiet.
7. **The same action keeps the same name and the same place** on every screen.
   "Encaisser" is always "Encaisser", never "Valider" on another screen.
8. **No technical words.** Not module, paramètre, base de données,
   synchronisation, ID, configuration. Shop words only: vente, caisse, stock,
   crédit, fournisseur, reçu.
9. **Anything that deletes or cancels asks first, in plain words:**
   "Annuler la vente de 3 500 MRU ?" Offer undo instead where it is possible.
10. **Errors say what happened and what to do:** "Stock insuffisant : il reste
    2 boîtes." Never a code, never "Une erreur s'est produite".
11. **Empty screens say what to do next**, never just "Aucun résultat".
12. **The sale screen fits 1366x768 with no scrolling.** Many shop computers
    are old laptops.
13. **Arabic is fully right to left**, same rules, mirrored layout, Western
    Arabic numerals.

## Using OUAQT's earlier client apps as reference

Screens from software OUAQT built for individual clients are a reference for
**what owners need**, never for how it should look.

- **Take:** which fields they fill, which buttons they press daily, what a
  receipt carries, what a report has to show.
- **Leave:** the visual style and layout. Those apps were each built for one
  client with behaviour hardcoded; here there is one app driven by a
  configuration.
- **Never reuse real data.** No client business names, people's names, phone
  numbers, vehicle plates or prices from those screenshots, in sample data,
  fixtures, tests or documentation. Sample data is invented.

## The day-one check

Before closing any milestone that touches `app-ui`, walk the main screens as if
you were a cashier on your first morning, and write down anything that breaks a
rule above. Fix it, or say plainly why it stays.

The walk, in order: open the app, sell two items, take part cash and part
mobile payment, print the receipt, correct a mistake on a line, put a sale on
the customer's account, close the till for the day. Then the same in Arabic.

Record the result in the milestone hand-off, listing each rule that failed and
what changed.
