# Warehouse and stock: what the earlier client apps show

Read from screenshots of two apps OUAQT built for individual clients: a
shipment sheet used at a mining operation, and a transport operation's admin
screens. Reference for what the work needs, not for how it looked. No client
names, people's names, vehicle plates, prices or reference numbers from those
screenshots appear here or in the code. See `docs/UI_RULES.md`.

## The shipment sheet

The heart of that app is one screen: enter an item, it joins a sheet, print the
sheet. Not a dashboard, not a report.

| What the screen carries | Why it matters here |
| --- | --- |
| One row of fields above the sheet: reference, category, how many, then **length, width, height** | Goods measured by dimension, not counted in boxes |
| A running **volume** shown before the item is added | The owner checks the figure before committing it |
| **Bulk import** beside the single-item form | The same list often arrives as a file |
| The sheet below: line number, reference, category, the three dimensions, volume, price, edit and delete per row | The sheet is the document, visible while being filled |
| A **count of items** in the sheet, always visible | It is a delivery being assembled |
| **Print everything**, **print only the new lines**, **print by date** | A sheet is printed more than once as goods keep arriving |
| A date on the sheet, and a filter | Sheets are organised by day |
| Language switch in the header, both languages on the printed head | The document is read by people in both languages |

## The transport operation's screens

A second client's app, further from our pack, but two things are worth noting:
its side menu groups work into operations, reference lists (vehicles, drivers,
routes), finance and administration; and administration holds an **audit log**
and a **backup** button the owner can press himself.

Our menu rule allows five items, and this shows why grouping matters: eleven
destinations behind four words. The backup button is a reminder that the owner
expects to hold his own copy, which fits the rule that his data never leaves
his computers.

## Measured against what we planned

| Planned in `app-ui` / the pack schema | What the reference says |
| --- | --- |
| Warehouse opens on stock in and out | Matches, though "out" here means **assembling a shipment**, item by item, with a printed sheet at the end |
| Units: piece, carton, kilo, litre (`wh_units`) | **Missing dimensions and volume.** A stone, a beam or a container is measured, not counted |
| Storage locations (`wh_locations`) | Not visible; nothing contradicts it |
| Entries by supplier (`wh_in`), destinations (`wh_out`) | Matches |
| Product list screen | The sheet is closer to what they use: a working document with a running count, printed |
| Receipt at 80mm | **Not the right paper.** A shipment sheet is printed on A4 with both language headings, and printed repeatedly as it grows |

## Suggested question bank changes

Proposals only. Nothing changed in the banks or the schema.

| Suggested id | Question (fr) | Type | Options | Default | Why |
| --- | --- | --- | --- | --- | --- |
| `wh_measure` | Comment mesurez-vous ce que vous stockez ? | multi_choice | Par pièce, Par carton, Au poids, Au volume (longueur, largeur, hauteur) | Par pièce | Adds the dimensions case the reference app is built around |
| `wh_sheet_print` | Imprimez-vous un bordereau quand la marchandise part ? | yes_no | | Oui | Decides whether the pack has a printed sheet at all |
| `wh_sheet_reprint` | Imprimez-vous le bordereau plusieurs fois pendant qu'il se remplit ? | yes_no, if `wh_sheet_print` = Oui | | Oui | This is the "print only the new lines" button, and it is unusual enough to ask |
| `wh_sheet_language` | Le bordereau doit-il être imprimé en deux langues ? | yes_no, if `wh_sheet_print` = Oui | | Non | Both languages headed the reference document |
| `wh_price_on_sheet` | Le bordereau doit-il indiquer un prix ? | yes_no, if `wh_sheet_print` = Oui | | Non | The reference sheet priced each line; many delivery notes must not show prices |
| `wh_import_file` | Recevez-vous parfois la liste des marchandises dans un fichier ? | yes_no | | Oui | Import sat beside single entry, not hidden in settings |
| `wh_own_backup` | Voulez-vous un bouton pour enregistrer vous-même une copie de vos données ? | yes_no | | Oui | Common bank candidate. The transport client's app has one, and it suits our rule that the data stays with the owner |

**One question for you.** The shipment sheet is an A4 document, not an 80mm
receipt. If the warehouse pack is going to print it, `app-ui` needs a second
printable layout, and the builder preview needs to show it. That is real work
in B6. Tell me whether the warehouse pack prints a sheet, or whether those
clients stay bespoke.

## Proposed question-bank changes, from the reference apps

Written after the bank was drafted. **Nothing here is in the bank**; each is a
question for you before it would be.

1. **The A4 delivery sheet.** The reference app printed a bilingual A4
   shipment sheet, reprinted incrementally as a lorry was loaded. The bank
   asks nothing about it and `app-ui` has no A4 document, only the 80mm roll.
2. **Measuring on receipt.** That app recorded dimensions and volume as goods
   arrived. Whether this warehouse does the same is a question, not an
   assumption.
3. **Transfers between his own places.** `wh_out` offers "Mes magasins" as a
   destination, which covers it loosely. A transfer is really two movements,
   out of one place and into another, and the bank does not ask whether he
   thinks of it that way.
