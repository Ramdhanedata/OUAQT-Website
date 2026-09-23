-- Where each trade's software downloads from, per system.
--
-- Decided 2026-09-23. The addresses live here rather than in environment
-- variables, so a trade's download button appears when its installer exists
-- and not before, and moving to a new host is a settings change rather than a
-- deploy. Empty means there is nothing to download yet, and step 4 says the
-- software is coming.
--
-- One app serves every trade, so the addresses can be the same for all four.
-- They are still kept per trade, so each one can be switched on separately.
--
-- Public: step 4 and the account page read them before anyone signs in.

insert into settings (key, value, description) values
  ('installer_url_windows_pharmacy',   '""', 'Download for the pharmacy software on Windows. Empty means not available yet.'),
  ('installer_url_mac_pharmacy',       '""', 'Download for the pharmacy software on Mac. Empty means not available yet.'),
  ('installer_url_windows_bakery',     '""', 'Download for the bakery software on Windows. Empty means not available yet.'),
  ('installer_url_mac_bakery',         '""', 'Download for the bakery software on Mac. Empty means not available yet.'),
  ('installer_url_windows_restaurant', '""', 'Download for the restaurant software on Windows. Empty means not available yet.'),
  ('installer_url_mac_restaurant',     '""', 'Download for the restaurant software on Mac. Empty means not available yet.'),
  ('installer_url_windows_warehouse',  '""', 'Download for the warehouse software on Windows. Empty means not available yet.'),
  ('installer_url_mac_warehouse',      '""', 'Download for the warehouse software on Mac. Empty means not available yet.')
on conflict (key) do nothing;

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
      'tutorial_video_mac_url',
      'installer_url_windows_pharmacy',
      'installer_url_mac_pharmacy',
      'installer_url_windows_bakery',
      'installer_url_mac_bakery',
      'installer_url_windows_restaurant',
      'installer_url_mac_restaurant',
      'installer_url_windows_warehouse',
      'installer_url_mac_warehouse'
    )
  );
