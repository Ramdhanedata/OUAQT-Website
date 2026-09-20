-- A lapsed annual licence gets a month before the till stops.
--
-- The rule, decided 2026-09-20: for renewal_grace_days after the end date the
-- software works exactly as before and reminds the owner once a day, with the
-- Bankily number and the amount. After that it goes read-only, like an unpaid
-- trial: everything already recorded stays visible, no new sales can be rung
-- up, and paying unlocks it again at once.
--
-- Nothing is ever deleted. Not at the end of the grace, not later.
--
-- The desktop app is told the number of grace days in its licence file, so it
-- behaves the same way with no network.

insert into settings (key, value, description) values
  ('renewal_grace_days', '30', 'Days after an annual licence ends before the app goes read-only')
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description,
      updated_at = now();

-- An owner is entitled to know how long he has. It joins the public list.
drop policy if exists settings_public_read on settings;
create policy settings_public_read on settings
  for select
  to anon
  using (
    key in (
      'trial_days',
      'renewal_grace_days',
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
