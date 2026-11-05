-- The wash: cars, upholstery and carpets, or both.
--
-- Decided 2026-11-05. One app serves every trade, so its download addresses
-- are the same release as the others', and they are the only thing a new
-- trade needs from the database. The Mac address is the Intel build, which
-- also runs on Apple-chip Macs; the site offers the Apple one from it.

insert into settings (key, value, description) values
  ('installer_url_windows_wash', '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-windows-setup.exe"', 'Download address for a wash, on Windows'),
  ('installer_url_mac_wash', '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-mac-x64.dmg"', 'Download address for a wash, on a Mac')
on conflict (key) do nothing;

-- Visitors read the download addresses before signing in, like the others.
drop policy if exists settings_public_read on settings;
create policy settings_public_read on settings
  for select
  to anon, authenticated
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
      'installer_url_mac_warehouse',
      'installer_url_windows_shop',
      'installer_url_mac_shop',
      'installer_url_windows_hotel',
      'installer_url_mac_hotel',
      'installer_url_windows_transport',
      'installer_url_mac_transport',
      'installer_url_windows_general',
      'installer_url_mac_general',
      'price_semiannual_launch_mru',
      'price_semiannual_standard_mru',
      'installer_url_windows_wash',
      'installer_url_mac_wash'
    )
  );
