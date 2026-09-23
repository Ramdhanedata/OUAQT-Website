-- The four trades added on 2026-09-23: shop, hotel, transport, and any other
-- business. Their download addresses, and every trade not yet approved opened
-- in test mode.
--
-- One app serves every trade, so every address is the same release. The Mac
-- address is the Intel build, which also runs on Apple-chip Macs.
--
-- Nothing here opens a trade to owners: enabled_packs is untouched. A trade
-- joins it once its screens are finished and Adel has approved it.

insert into settings (key, value, description) values
  ('installer_url_windows_shop', '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-windows-setup.exe"', 'Download for the shop software on Windows. Empty means not available yet.'),
  ('installer_url_mac_shop', '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-mac-x64.dmg"', 'Download for the shop software on Mac. Empty means not available yet.'),
  ('installer_url_windows_hotel', '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-windows-setup.exe"', 'Download for the hotel software on Windows. Empty means not available yet.'),
  ('installer_url_mac_hotel', '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-mac-x64.dmg"', 'Download for the hotel software on Mac. Empty means not available yet.'),
  ('installer_url_windows_transport', '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-windows-setup.exe"', 'Download for the transport software on Windows. Empty means not available yet.'),
  ('installer_url_mac_transport', '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-mac-x64.dmg"', 'Download for the transport software on Mac. Empty means not available yet.'),
  ('installer_url_windows_general', '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-windows-setup.exe"', 'Download for the general business software on Windows. Empty means not available yet.'),
  ('installer_url_mac_general', '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-mac-x64.dmg"', 'Download for the general business software on Mac. Empty means not available yet.')
on conflict (key) do nothing;

/* The trades already listed get the same release, where nothing was set. */
update settings set value = '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-windows-setup.exe"', updated_at = now()
 where key in ('installer_url_windows_bakery', 'installer_url_windows_restaurant', 'installer_url_windows_warehouse')
   and value = '""';
update settings set value = '"https://github.com/Ramdhanedata/ouaqt-releases/releases/latest/download/OUAQT-mac-x64.dmg"', updated_at = now()
 where key in ('installer_url_mac_bakery', 'installer_url_mac_restaurant', 'installer_url_mac_warehouse')
   and value = '""';

update settings
   set value = '["pharmacy", "shop", "restaurant", "bakery", "warehouse", "hotel", "transport", "general"]', updated_at = now()
 where key = 'test_packs';

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
      'installer_url_mac_warehouse',
      'installer_url_windows_shop',
      'installer_url_mac_shop',
      'installer_url_windows_hotel',
      'installer_url_mac_hotel',
      'installer_url_windows_transport',
      'installer_url_mac_transport',
      'installer_url_windows_general',
      'installer_url_mac_general'
    )
  );
