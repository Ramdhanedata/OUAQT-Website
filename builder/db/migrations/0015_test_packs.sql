-- Trades open in test mode only.
--
-- Decided 2026-09-23: a trade goes into enabled_packs once its screens are
-- finished and Adel has approved it, not as soon as an installer exists. Until
-- then it sits here, and the builder opens it only to a browser that came
-- through the admin area's test link.
--
-- Not public. Visitors have no reason to know which trades are being tested.

insert into settings (key, value, description) values
  ('test_packs', '["pharmacy"]', 'Trades the builder opens only in test mode, from the admin area')
on conflict (key) do nothing;
