-- Paying for a month, two months, three, six, or a year.
--
-- Decided 2026-11-06 (Adel): an owner chooses how long he pays for, among
-- one, two, three, six and twelve months. A year and six months already have
-- their prices (0004, 0023), and three months has its standard price from
-- 0004. What is missing is added here, empty: nobody has decided these
-- amounts yet, and an empty price is how "coming soon" is said. A length
-- with no price is not offered on the payment page, and the pricing page
-- says its price is coming. Each is set from the admin area like any price,
-- in the smallest unit (1 MRU is 100).
--
-- An empty launch price means a launch client pays the standard one.

insert into settings (key, value, description) values
  ('price_monthly_launch_mru',     'null', 'One month, at the launch price. Empty: a launch client pays the standard price'),
  ('price_monthly_standard_mru',   'null', 'One month, at the standard price. Empty: one month is not offered yet'),
  ('price_bimonthly_launch_mru',   'null', 'Two months, at the launch price. Empty: a launch client pays the standard price'),
  ('price_bimonthly_standard_mru', 'null', 'Two months, at the standard price. Empty: two months are not offered yet'),
  ('price_quarterly_launch_mru',   'null', 'Three months, at the launch price. Empty: a launch client pays the standard price')
on conflict (key) do nothing;

-- Visitors read prices before signing in: the new ones join the list.
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
      'installer_url_mac_wash',
      'price_quarterly_launch_mru',
      'price_bimonthly_launch_mru',
      'price_bimonthly_standard_mru',
      'price_monthly_launch_mru',
      'price_monthly_standard_mru'
    )
  );
