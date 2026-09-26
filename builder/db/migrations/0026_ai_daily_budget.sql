-- A ceiling on the AI's calls in a day.
--
-- Decided 2026-09-26, from the launch audit. The builder's "explain in my own
-- words" is open to anyone who reaches the page, and each call costs money.
-- Past this many calls in the last 24 hours, the builder keeps the sentence
-- for a person and a payment screenshot waits for a person, as both do
-- without an AI key. Changed from the admin area like any other setting.

insert into settings (key, value, description) values
  ('ai_calls_per_day', '500', 'The most AI calls in 24 hours, builder and payment screenshots together. Past it, a person reads them')
on conflict (key) do update
  set description = excluded.description,
      updated_at = now();
