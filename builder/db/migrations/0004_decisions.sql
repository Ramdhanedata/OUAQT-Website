-- The values you decided on 2026-09-20, and the shape the price list needs to
-- hold them.
--
-- Two tracks are on sale, so almost every price comes in a pair: what the
-- first clients pay while the launch offer is open, and what it costs after.
-- 0002 had a single `price_annual_mru`, which cannot say that, so the three
-- old rows go and the pairs take their place.
--
-- Nothing here is read from code by name except through builder/db/settings.ts.

-- The number owners pay to.
update settings
   set value = '"38087272"', updated_at = now()
 where key = 'bankily_number';

-- Replaced by the launch and standard pairs below.
delete from settings
 where key in ('price_annual_mru', 'price_perpetual_mru', 'price_extra_device_mru');

insert into settings (key, value, description) values
  -- Builder track: nothing to pay to start, a free trial, then a licence.
  ('price_installation_builder_mru', '0',      'The builder track has no installation fee'),
  ('price_annual_launch_mru',        '15000',  'Annual licence, launch offer'),
  ('price_annual_standard_mru',      '18000',  'Annual licence, standard'),
  ('price_quarterly_standard_mru',   '4500',   'Per quarter. Standard price only, no launch price'),
  ('price_setup_visit_mru',          '10000',  'Optional visit to set the software up on site'),
  ('price_extra_device_launch_mru',  '6000',   'Per year, per computer beyond max_devices, launch offer'),
  ('price_extra_device_standard_mru','8000',   'Per year, per computer beyond max_devices, standard'),

  -- Accompanied track: we install it, and it is paid for once.
  ('price_installation_launch_mru',  '25000',  'Installation, accompanied track, launch offer'),
  ('price_installation_standard_mru','30000',  'Installation, accompanied track, standard'),
  ('price_perpetual_launch_mru',     '95000',  'Perpetual licence, launch offer'),
  ('price_perpetual_standard_mru',   '110000', 'Perpetual licence, standard'),

  -- Bespoke work, and what keeps it running after the first year.
  ('bespoke_maintenance_percent',    '18',     'Percent of the project price, per year'),
  ('bespoke_maintenance_from_month', '13',     'Maintenance starts this month, the first year being included'),

  -- The launch offer itself.
  ('launch_clients_limit',           '100',    'How many clients the launch prices are open to'),
  ('launch_price_freeze_years',      '3',      'Years a launch client keeps his price'),

  -- Bringing someone else in.
  ('referral_free_months',           '1',      'Free months for the referrer, once the referred owner has paid')
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description,
      updated_at = now();

-- The public list changes with the keys, so it is rebuilt rather than patched.
drop policy if exists settings_public_read on settings;
create policy settings_public_read on settings
  for select
  to anon
  using (
    key in (
      'trial_days',
      'max_devices',
      'enabled_packs',
      'support_whatsapp',
      'price_installation_builder_mru',
      'price_annual_launch_mru',
      'price_annual_standard_mru',
      'price_quarterly_standard_mru',
      'price_setup_visit_mru',
      'price_extra_device_launch_mru',
      'price_extra_device_standard_mru',
      'price_installation_launch_mru',
      'price_installation_standard_mru',
      'price_perpetual_launch_mru',
      'price_perpetual_standard_mru',
      'bespoke_maintenance_percent',
      'bespoke_maintenance_from_month',
      'launch_clients_limit',
      'launch_price_freeze_years',
      'referral_free_months',
      'tutorial_video_windows_url',
      'tutorial_video_mac_url'
    )
  );

-- Still not public: bankily_number, payment_max_age_days,
-- device_releases_per_year, clock_grace_days.
