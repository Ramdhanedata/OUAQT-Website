-- The free trial becomes a month.
--
-- Decided 2026-09-21. Fourteen days is barely two weekends, and a shop that
-- installs on a Thursday and gets busy has not really tried anything by the
-- time it is asked to pay.
--
-- This changes new trials only. A trial already running keeps the end date it
-- was given at activation, because moving an owner's date under him, in
-- either direction, is not something a settings change should do.
--
-- Nothing on the website repeats this number: every page that mentions the
-- trial reads it from here.

insert into settings (key, value, description) values
  ('trial_days', '30', 'Free days, counted from the first activation of a device')
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description,
      updated_at = now();
