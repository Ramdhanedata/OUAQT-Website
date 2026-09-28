-- Paying for six months, beside the year.
--
-- Decided 2026-09-25: the payment page offers a year or six months. Six
-- months is half the year at each price, launch and standard (15 000 a year
-- is 7 500 for six months), and each can be changed on its own from the
-- admin area like every other price.

insert into settings (key, value, description)
select key, coalesce(to_jsonb(half), 'null'::jsonb), description
  from (
    select 'price_semiannual_launch_mru' as key,
           (select (value #>> '{}')::bigint / 2 from settings where key = 'price_annual_launch_mru' and jsonb_typeof(value) = 'number') as half,
           'Six months, at the launch price. Half the annual when it was added' as description
    union all
    select 'price_semiannual_standard_mru',
           (select (value #>> '{}')::bigint / 2 from settings where key = 'price_annual_standard_mru' and jsonb_typeof(value) = 'number'),
           'Six months, at the standard price. Half the annual when it was added'
  ) as prices
on conflict (key) do nothing;

-- Visitors read prices before signing in: the two new ones join the list.
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
      'installer_url_mac_general',
      'price_semiannual_launch_mru',
      'price_semiannual_standard_mru'
    )
  );
