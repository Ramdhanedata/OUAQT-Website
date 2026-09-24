-- Five days before a trial ends, the app shows the owner what his own shop
-- did with it: how many sales he rang up, what his customers owe him, and how
-- many evenings the till did not match.
--
-- The rule, decided 2026-09-21: the figures are computed on his computer from
-- his own data and never leave it. Nothing about them is ever sent to us, and
-- there is no endpoint that could receive them.
--
-- Only the timing lives here, because it is a commercial decision and belongs
-- where prices and grace days already are. It reaches the app in the licence
-- file, like the other timings, since the shop it is shown in has no internet
-- to ask.
--
-- Not public: a visitor to the website has no use for it. It joins the rules
-- the desktop app enforces, beside clock_grace_days.

insert into settings (key, value, description) values
  ('trial_summary_days', '5', 'Days before a trial ends when the app shows the owner his own figures')
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description,
      updated_at = now();
