-- Two builder-track prices, as Adel set them on 2026-11-06, one price each.
--
-- An extra device: 3 000 MRU a year. It was 6 000 MRU at the launch price
-- and 8 000 MRU standard (0004). One price means no launch price: the launch
-- row is emptied, so a launch client pays the same 3 000 MRU rather than the
-- old 6 000.
--
-- The installation visit, for an owner who wants one: 5 000 MRU, paid once.
-- It was 10 000 MRU (0004), and never had a launch price.
--
-- In the smallest unit, 1 MRU is 100. Both are changed from the admin area
-- afterwards like any price. The accompanied track's extra workstation is
-- priced in lib/data/pricing.ts and is not touched here.

update settings
   set value = '300000'::jsonb,
       description = 'Per year, per device beyond max_devices. One price since 2026-11-06',
       updated_at = now()
 where key = 'price_extra_device_standard_mru';

update settings
   set value = 'null'::jsonb,
       description = 'Per year, per device beyond max_devices, launch price. Empty: a launch client pays the standard price',
       updated_at = now()
 where key = 'price_extra_device_launch_mru';

update settings
   set value = '500000'::jsonb,
       description = 'Optional visit to set the software up on site. 5 000 MRU since 2026-11-06',
       updated_at = now()
 where key = 'price_setup_visit_mru';
