-- One rule for money, everywhere: integers of the smallest unit.
--
-- 1 MRU is 100, so an annual licence of 15 000 MRU is 1500000. Nothing is a
-- float and nothing is a formatted string, in the database, in the builder,
-- in the licence API or in the desktop app.
--
-- Why it matters here and not only in the app: a price that starts life as
-- 15000.0 in a settings row and ends up added to a total in a till is the
-- same number arriving by two roads, and one of those roads rounds.
--
-- This migration multiplies what already exists. It runs once, like all of
-- them, so the values cannot be multiplied twice.

-- ─── Settings ──────────────────────────────────────────────────────────────
-- Only the amounts. trial_days, launch_clients_limit, the maintenance percent
-- and the rest are counts and stay as they are.
update settings
   set value = to_jsonb((value::numeric * 100)::bigint),
       updated_at = now()
 where key like 'price\_%\_mru'
   and value is not null
   and jsonb_typeof(value) = 'number';

-- ─── Payments ──────────────────────────────────────────────────────────────
-- numeric(12,2) was two decimal places pretending to be exact. It becomes a
-- whole number of the smallest unit, which is what it always meant.
alter table payments
  alter column expected_amount type bigint
  using round(expected_amount * 100);

-- ─── The product lists owners imported ─────────────────────────────────────
-- Stored as jsonb, one row per product, with the price inside.
update products_initial
   set data = jsonb_set(
         data,
         '{price}',
         to_jsonb(round((data->>'price')::numeric * 100)::bigint)
       )
 where data ? 'price'
   and jsonb_typeof(data->'price') = 'number';

-- Nothing else in this database holds money. Sales, stock and customer
-- credit live on the owner's own computers and never arrive here.
